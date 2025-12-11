import { APP_CONFIG as DEFAULT_CONFIG } from './constants';
import type { AppConfig, Employee } from '../types/types';

export const calculatePrice = (property: string, size: string, type: string, appConfig?: AppConfig, employee?: Employee) => {
  const config = (appConfig || DEFAULT_CONFIG) as AppConfig;

  // 1. Get Property Config
  const propConfig = config.PROPERTY_CONFIGS[property] || {};

  // 2. Determine Template (Default to 2026 if not specified)
  const templateName = propConfig.template || config.DEFAULTS.template;
  const template = config.PRICING_TEMPLATES[templateName];

  // 3. Map Type to Category Key
  let categoryKey = null;
  if (type === 'Clean') categoryKey = 'CLEAN';
  else if (type === 'Paint') categoryKey = 'PAINT';
  else if (type === 'Touch Up Paint') categoryKey = 'TOUCH_UP_PAINT';
  else if (type === 'Touch Up Clean') categoryKey = 'TOUCH_UP_CLEAN';

  if (!categoryKey) return { client: 0, employee: 0 };

  // --- BASE CALCULATION (CLIENT & DEFAULT PAY) ---
  let result = { client: 0, employee: 0 };

  // A. Check for Property-Specific Overrides (Exception Rules)
  // @ts-ignore
  if (propConfig.overrides && propConfig.overrides[categoryKey] && propConfig.overrides[categoryKey][size]) {
    // @ts-ignore
    const override = propConfig.overrides[categoryKey][size];
    result = { client: override.client, employee: override.emp };
  }
  // B. Fallback to Template Price
  // @ts-ignore
  else if (template && template[categoryKey] && template[categoryKey][size]) {
    // @ts-ignore
    const price = template[categoryKey][size];
    result = { client: price.client, employee: price.emp };
  }

  // --- EMPLOYEE OVERRIDES (PAY ADJUSTMENT) ---
  if (employee && employee.pricingConfig) {
    const { customRates, templateId, commissionPct: _commissionPct } = employee.pricingConfig;

    // 1. Specific Custom Rate (Highest Priority)
    if (customRates && customRates[categoryKey] && customRates[categoryKey][size]) {
      result.employee = customRates[categoryKey][size];
    }
    // 2. Employee Specific Template (e.g. "Senior Rate")
    else if (templateId && config.PRICING_TEMPLATES[templateId]) {
      const empTemplate = config.PRICING_TEMPLATES[templateId];
      // @ts-ignore
      if (empTemplate[categoryKey] && empTemplate[categoryKey][size]) {
        // @ts-ignore
        result.employee = empTemplate[categoryKey][size].emp;
      }
    }

    // 3. Commission Override (if exists) -> Not fully implemented logic yet, but placeholder
    // if (commissionPct) { result.employee = result.client * (commissionPct / 100); }
  }

  return result;
};

export const getExtrasList = (property: string, appConfig?: AppConfig) => {
  const config = (appConfig || DEFAULT_CONFIG) as AppConfig;
  const propConfig = config.PROPERTY_CONFIGS[property] || {};
  const templateName = propConfig.template || config.DEFAULTS.template;
  return config.PRICING_TEMPLATES[templateName].EXTRAS;
};

export const generateInvoiceNote = (job: { type: string; size: string; notes?: string }, extrasStr: string) => {
  let serviceMapped = job.type;
  if (job.type === 'Paint') serviceMapped = 'Repaint';
  else if (job.type === 'Clean') serviceMapped = 'Full Clean';
  else if (job.type === 'Touch Up Paint') serviceMapped = 'Touch-Up Paint';
  else if (job.type === 'Touch Up Clean') serviceMapped = 'Touch-Up Clean';

  // Detect Occupied status from extras OR notes
  let isOccupied = false;
  let cleanedExtras: string[] = [];

  // Check Extras
  if (extrasStr) {
    const parts = extrasStr.split(',').map(s => s.trim()).filter(s => s);
    cleanedExtras = parts.filter(p => {
      const lower = p.toLowerCase();
      if (lower === 'occupied' || lower === 'ocupado') {
        isOccupied = true;
        return false; // Remove from extras list
      }
      return true;
    });
  }

  // Check Notes (New Requirement)
  if (job.notes) {
    const lowerNotes = job.notes.toLowerCase();
    if (lowerNotes.includes('occupied') || lowerNotes.includes('ocupado')) {
      isOccupied = true;
    }
  }

  const statusPrefix = isOccupied ? 'Occupied' : 'Vacant';
  let note = `${statusPrefix} ${job.size} ${serviceMapped}`;

  if (cleanedExtras.length > 0) {
    note += ', + ' + cleanedExtras.join(', + ');
  }
  return note;
};
