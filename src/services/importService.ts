import * as XLSX from 'xlsx';
import type { Job } from '../types/types';
import { generateId } from '../utils/helpers';
import type { LogEntry } from '../types/types';
import { identifyColumnsWithAI } from './aiService';
import { calculatePrice, generateInvoiceNote } from '../utils/pricing';

interface ImportResult {
  jobs: Job[];
  logs: LogEntry[];
  summary: {
    total: number;
    duplicates: number;
    new: number;
  };
  dateRange: { start: Date; end: Date } | null;
}

// Helper to create log entry
const createLog = (type: LogEntry['type'], message: string, detail?: string): LogEntry => ({
  id: generateId(),
  timestamp: new Date().toISOString(),
  type,
  message,
  detail
});

// VALIDATION LOGIC FOR FILENAMES
export const isValidFileName = (filename: string): boolean => {
  const lower = filename.toLowerCase();

  // 1. Must be an Excel or CSV file
  if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls') && !lower.endsWith('.csv')) {
    return false;
  }

  // 2. Must match known report patterns
  const validPrefixes = ['list-view', 'list view', 'aroma', 'report', 'jobs', 'daily'];
  const hasValidPrefix = validPrefixes.some(prefix => lower.startsWith(prefix));
  const startsWithDate = /^\d{4}-\d{2}/.test(lower);

  return hasValidPrefix || startsWithDate;
};

import type { AppConfig } from '../types/types';

export const parseFile = async (file: File, _existingJobs: Job[] = [], appConfig?: AppConfig): Promise<ImportResult> => {
  return new Promise(async (resolve, _reject) => {
    const reader = new FileReader();
    const logs: LogEntry[] = [];

    logs.push(createLog('info', 'Reading file...', `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`));

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          logs.push(createLog('error', 'Invalid Excel file: No sheets found.'));
          resolve({ jobs: [], logs, summary: { total: 0, duplicates: 0, new: 0 }, dateRange: null });
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        logs.push(createLog('info', `Parsing sheet: "${firstSheetName}"`));
        const worksheet = workbook.Sheets[firstSheetName];

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          logs.push(createLog('warning', 'Sheet is empty or missing headers.'));
          resolve({ jobs: [], logs, summary: { total: 0, duplicates: 0, new: 0 }, dateRange: null });
          return;
        }

        // Detect columns
        const headers = rows[0].map(h => String(h).toLowerCase().trim());

        const findCol = (patterns: string[]) => headers.findIndex(h => patterns.some(p => h.includes(p)));

        let idxProperty = findCol(['job']);
        let idxUnitSize = findCol(['unidad', 'tamaño', 'unit']);
        let idxService = findCol(['servicio', 'service']);
        let idxUser = findCol(['users', 'user']);
        let idxDate = findCol(['date', 'fecha']);
        let idxExtras = findCol(['extras']);
        let idxNotes = findCol(['note', 'notes']);
        let idxComplete = findCol(['complete']);

        // AI FALLBACK
        if (idxProperty === -1 || idxUnitSize === -1) {
          logs.push(createLog('warning', 'Standard columns not found. Asking Gemini AI to analyze structure...'));

          // Get a sample row (first data row)
          const sampleRow = rows.length > 1 ? rows[1] : [];
          const aiMapping = await identifyColumnsWithAI(rows[0].map(String), sampleRow);

          if (aiMapping) {
            logs.push(createLog('success', 'Gemini AI identified column structure!'));
            idxProperty = aiMapping.property;
            idxUnitSize = aiMapping.unitSize;
            idxService = aiMapping.service;
            idxUser = aiMapping.user;
            idxDate = aiMapping.date;
            idxExtras = aiMapping.extras;
            idxNotes = aiMapping.notes;
            idxComplete = aiMapping.complete;
          } else {
            logs.push(createLog('error', 'AI could not identify columns. Please check file format.'));
          }
        }

        if (idxProperty === -1 || idxUnitSize === -1) {
          const missing = [];
          if (idxProperty === -1) missing.push('Job/Property');
          if (idxUnitSize === -1) missing.push('Unit/Size');
          logs.push(createLog('error', `Missing required columns: ${missing.join(', ')}.`));
          resolve({ jobs: [], logs, summary: { total: 0, duplicates: 0, new: 0 }, dateRange: null });
          return;
        }

        const newJobs: Job[] = [];
        let processedCount = 0;
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          processedCount++;
          const rawProperty = row[idxProperty] ? String(row[idxProperty]).trim() : '';
          const rawUnitSize = row[idxUnitSize] ? String(row[idxUnitSize]).trim() : '';

          if (!rawProperty && !rawUnitSize) continue;

          let apt = '';
          let size = '';
          if (rawUnitSize.includes('/')) {
            const parts = rawUnitSize.split('/');
            apt = parts[0].trim();
            size = parts[1] ? parts[1].trim().toUpperCase().replace(/X/gi, 'x') : '';
          } else {
            apt = rawUnitSize;
          }

          let date = new Date().toISOString().split('T')[0];
          const rawDate = row[idxDate];
          if (rawDate) {
            let d: Date | null = null;
            if (typeof rawDate === 'number') {
              d = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
            } else {
              const dateStr = String(rawDate).trim();
              d = new Date(dateStr);
            }

            if (d && !isNaN(d.getTime())) {
              date = d.toISOString().split('T')[0];
              if (!minDate || d < minDate) minDate = d;
              if (!maxDate || d > maxDate) maxDate = d;
            }
          }

          let type = 'Other';
          const rawService = row[idxService] ? String(row[idxService]).toUpperCase() : '';
          if (rawService.includes('TOUCH')) {
            if (rawService.includes('PAINT')) type = 'Touch Up Paint';
            else if (rawService.includes('CLEAN')) type = 'Touch Up Clean';
            else type = 'Touch Up';
          } else if (rawService.includes('CLEAN')) {
            type = 'Clean';
          } else if (rawService.includes('PAINT')) {
            type = 'Paint';
          } else if (rawService) {
            type = String(row[idxService]);
          }

          let status: Job['status'] = 'In Progress';
          const rawComplete = row[idxComplete];
          if (rawComplete) {
            if (String(rawComplete).match(/\d/) || String(rawComplete).toLowerCase() === 'yes' || String(rawComplete).toLowerCase() === 'done') {
              status = 'Complete';
            }
          }

          const rawUser = row[idxUser] ? String(row[idxUser]).trim() : '';
          const assignedTo = rawUser.split(' ')[0];

          const prices = calculatePrice(rawProperty, size, type, appConfig);
          const extrasStr = row[idxExtras] ? String(row[idxExtras]) : '';
          const invoiceNote = generateInvoiceNote({ type, size }, extrasStr);

          const job: Job = {
            id: generateId(),
            date,
            property: rawProperty,
            apt,
            size,
            type,
            assignedTo,
            status,
            invoiceStatus: 'None',
            extras: extrasStr,
            notes: row[idxNotes] ? String(row[idxNotes]) : '',
            invoiceNote,
            clientPrice: prices.client,
            employeePrice: prices.employee,
            extrasPrice: 0, // We don't auto-calculate extras price from string yet, maybe later
            createdAt: Date.now()
          };

          // CRITICAL CHANGE: We allow ALL duplicates to pass through.
          // The visual "Duplicate Detection" in JobsTable will alert the user instead.
          // This ensures the user sees "132 rows" if there are 132 rows in the file.
          newJobs.push(job);
        }

        if (newJobs.length > 0) {
          logs.push(createLog('success', `Import loaded ${newJobs.length} records.`, `Duplicates allowed for visual verification.`));
        } else {
          logs.push(createLog('info', `Import finished: No valid rows found.`));
        }

        resolve({
          jobs: newJobs,
          logs,
          summary: {
            total: processedCount,
            duplicates: 0, // Ignored logic
            new: newJobs.length
          },
          dateRange: (minDate && maxDate) ? { start: minDate, end: maxDate } : null
        });

      } catch (err: any) {
        logs.push(createLog('error', 'Critical Error during parsing', err.message || String(err)));
        resolve({ jobs: [], logs, summary: { total: 0, duplicates: 0, new: 0 }, dateRange: null });
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
