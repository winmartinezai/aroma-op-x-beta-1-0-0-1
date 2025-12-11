
import type { PriceTable, Employee, Property, YearlyPricing, QuickLink } from '../types/types';

export const APP_VERSION = "V 1.0.0.4";
export const BUILD_DATE = "Updated: Dec 11, 2025 - 5:30 AM";

// TRANSLATIONS
export const TRANSLATIONS = {
  en: {
    'dashboard': 'Dashboard',
    'jobs': 'Jobs Master',
    'employees': 'Employees',
    'properties': 'Properties',
    'settings': 'Settings',
    'daily-report': 'Daily Report',
    'new_job': 'New Job',
    'open_jobs': 'Open Jobs',
    'ready_to_bill': 'Ready to Bill',
    'prepaid_mgr': 'Prepaid Mgr',
    'stage_invoice': 'Stage Invoice',
    'edit_mode': 'Edit Mode',
    'exit_edit': 'Exit Edit',
    'filters': 'Filters',
    'search': 'Search...',
    'delete': 'Delete',
    'columns': 'Columns',

    // Column Headers
    'date': 'Date',
    'property': 'Property',
    'apt': 'Unit',
    'type': 'Service',
    'size': 'Size',
    'assignedTo': 'Tech',
    'status': 'Status',
    'po': 'PO #',
    'invoiceStatus': 'Inv Status',
    'invoiceNumber': 'Inv #',
    'extras': 'Extras',
    'notes': 'Notes',
    'clientPrice': 'Price',
    'employeePrice': 'Pay',
    'total': 'Total',
    'actions': 'Actions',

    'revenue': 'Revenue',
    'payroll': 'Payroll',
    'net_margin': 'Net Margin',
    'unbilled': 'Unbilled',
    'recent_activity': 'Recent Activity',
    'quick_tasks': 'Quick Tasks',
    'language': 'Language',
    'english': 'English',
    'spanish': 'Español',
    'general': 'General',
    'pricing': 'Pricing',
    'links': 'Links',
    'save': 'Save',
    'cancel': 'Cancel',
    'tooltip_new_job': 'Create a new blank job record',
    'tooltip_open': 'Filter: Show only Pending or In Progress jobs',
    'tooltip_bill': 'Filter: Show Completed jobs that need invoicing',
    'tooltip_prepaid': 'Manage monthly prepaid unit lists per property',
    'tooltip_stage': 'Generate invoice text for selected jobs',
    'tooltip_edit': 'Toggle quick-edit mode for table cells',
    'tooltip_color': 'Highlight selected rows with a color',
    'tooltip_filters': 'Advanced status and employee filters',
    'tooltip_search': 'Search by Property, Unit, PO or Name'
  },
  es: {
    'dashboard': 'Panel Principal',
    'jobs': 'Maestro de Trabajos',
    'employees': 'Empleados',
    'properties': 'Propiedades',
    'settings': 'Configuración',
    'daily-report': 'Reporte Diario',
    'new_job': 'Nuevo Trabajo',
    'open_jobs': 'Trabajos Abiertos',
    'ready_to_bill': 'Por Facturar',
    'prepaid_mgr': 'Contratos Prepagos',
    'stage_invoice': 'Crear Factura',
    'edit_mode': 'Modo Edición',
    'exit_edit': 'Salir Edición',
    'filters': 'Filtros',
    'search': 'Buscar...',
    'delete': 'Borrar',
    'columns': 'Columnas',

    // Column Headers
    'date': 'Fecha',
    'property': 'Propiedad',
    'apt': 'Unidad',
    'type': 'Servicio',
    'size': 'Tamaño',
    'assignedTo': 'Técnico',
    'status': 'Estado',
    'po': 'PO #',
    'invoiceStatus': 'Est. Fac',
    'invoiceNumber': '# Fac',
    'extras': 'Extras',
    'notes': 'Notas',
    'clientPrice': 'Precio',
    'employeePrice': 'Pago',
    'total': 'Total',
    'actions': 'Acciones',

    'revenue': 'Ingresos',
    'payroll': 'Nómina',
    'net_margin': 'Margen Neto',
    'unbilled': 'Sin Facturar',
    'recent_activity': 'Actividad Reciente',
    'quick_tasks': 'Tareas Rápidas',
    'language': 'Idioma',
    'english': 'Inglés',
    'spanish': 'Español',
    'general': 'General',
    'pricing': 'Precios',
    'links': 'Enlaces',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'tooltip_new_job': 'Crear un nuevo registro de trabajo vacío',
    'tooltip_open': 'Filtro: Mostrar solo trabajos Pendientes o En Progreso',
    'tooltip_bill': 'Filtro: Mostrar trabajos Completados que necesitan factura',
    'tooltip_prepaid': 'Gestionar listas de unidades prepagadas mensuales',
    'tooltip_stage': 'Generar texto de factura para trabajos seleccionados',
    'tooltip_edit': 'Activar modo de edición rápida en la tabla',
    'tooltip_color': 'Resaltar filas seleccionadas con un color',
    'tooltip_filters': 'Filtros avanzados de estado y empleado',
    'tooltip_search': 'Buscar por Propiedad, Unidad, PO o Nombre'
  }
};

// Default list of known property names for autocomplete/dropdowns
export const DEFAULT_PROPERTIES_LIST = [
  'Altis Grand Central',
  'Altis Grand Suncoast',
  'Colina Ranch Hill',
  'Anchor Riverwalk',
  'Park and Main',
  'Tapestry East Bay',
  'Tapestry University',
  'Navara',
  'Seazen Rocky Point',
  'Waverly Terrace',
  'Mosby At Avalon Park',
  'Marquee Square',
  'Aurora',
  'The Galvin',
  'Arabelle'
];

export const DEFAULT_PRICES: PriceTable = {
  PAINT: {
    '1x1': { client: 265, employee: 115 },
    '2x2': { client: 290, employee: 135 },
    '3x2': { client: 315, employee: 160 },
    'Studio': { client: 265, employee: 115 }
  },
  CLEAN: {
    '1x1': { client: 135, employee: 60 },
    '2x2': { client: 145, employee: 70 },
    '3x2': { client: 155, employee: 80 },
    'Studio': { client: 135, employee: 60 }
  },
  TOUCH_UP_PAINT: {
    '1x1': { client: 165, employee: 85 },
    '2x2': { client: 190, employee: 95 },
    '3x2': { client: 215, employee: 110 }
  },
  TOUCH_UP_CLEAN: {
    '1x1': { client: 65, employee: 50 },
    '2x2': { client: 75, employee: 50 },
    '3x2': { client: 85, employee: 50 },
    'Studio': { client: 65, employee: 50 }
  },
  EXTRAS: {
    'Garage Paint': { client: 100, employee: 60 },
    'Door & Trim': { client: 120, employee: 40 },
    'Front Door Only': { client: 80, employee: 40 },
    'Front Door Trim': { client: 50, employee: 25 },
    'Kilz': { client: 50, employee: 25 },
    'Large Unit': { client: 20, employee: 10 },
    'Stairs': { client: 25, employee: 15 },
    'Townhouse': { client: 20, employee: 15 }, // Updated to $20 per request
    'Extra Bathroom': { client: 20, employee: 10 },
    '1 Wall Color Change': { client: 50, employee: 25 }
  }
};

// INITIAL PRICING DATA (The Brain)
export const DEFAULT_PRICING_DATA: YearlyPricing[] = [
  {
    year: 2025,
    global: JSON.parse(JSON.stringify(DEFAULT_PRICES)), // Clone default
    overrides: [
      // EXAMPLE REQUESTED: Colina pays $50 for Touch Up Clean
      {
        propertyId: 'Colina Ranch Hill',
        category: 'TOUCH_UP_CLEAN',
        size: 'All', // Special keyword for Logic
        price: { client: 65, employee: 50 } // Override only employee or both
      }
    ]
  },
  {
    year: 2024,
    global: JSON.parse(JSON.stringify(DEFAULT_PRICES)),
    overrides: []
  }
];

export const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: 'lnk-wave', label: 'Wave Apps (Invoicing)', url: 'https://www.waveapps.com/', category: 'Estimates' },
  { id: 'lnk-drive', label: 'Google Drive', url: 'https://drive.google.com', category: 'Other' }
];

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-mike', name: 'Mike', color: '#3b82f6' }, // Blue
  { id: 'emp-edward', name: 'Edward', color: '#f97316' }, // Orange
  { id: 'emp-miriam', name: 'Miriam', color: '#ec4899' }, // Pink
  { id: 'emp-niko', name: 'Niko', color: '#8b5cf6' }, // Purple
  { id: 'emp-yesenia', name: 'Yesenia', color: '#6366f1' }, // Indigo (Fixed from Emerald to avoid confusion)
  { id: 'emp-dannet', name: 'Dannet', color: '#ef4444' }, // Red
  { id: 'emp-ismael', name: 'Ismael', color: '#eab308' } // Yellow
];

// Data Updated with Groups and PO Logic
export const DEFAULT_PROPERTY_CONTACTS: Property[] = [
  { id: 'prop-altis-suncoast', name: 'Altis Grand Suncoast', contact: 'Keith', phone: '845‑392‑5937', managementGroup: 'Altman', portal: 'Wave', billingLogic: 'independent', poLogic: 'mandatory' },
  { id: 'prop-altis-central', name: 'Altis Grand Central', contact: 'Jonathan', phone: '813‑417‑0430', managementGroup: 'Altman', portal: 'Wave', billingLogic: 'independent', poLogic: 'none' },
  { id: 'prop-arabelle', name: 'Arabelle', contact: '', phone: '', managementGroup: 'Greystar', portal: 'VendorCafe', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-navara', name: 'Navara', contact: 'José', phone: '813‑732‑1223', managementGroup: 'ZRS', portal: 'Ops', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-the-galvin', name: 'The Galvin', contact: 'Ryan', phone: '813‑215‑1837', managementGroup: 'ZRS', portal: 'Ops', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-colina', name: 'Colina Ranch Hill', contact: 'Anthony', phone: '352‑200‑0860', managementGroup: 'ZRS', portal: 'Wave', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-waverly', name: 'Waverly Terrace', contact: 'Niko', phone: '787‑543‑4248', managementGroup: 'ZRS', portal: 'VendorCafe', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-aurora', name: 'Aurora', contact: 'William', phone: '813‑455‑5493', managementGroup: 'ZRS', portal: 'VendorCafe', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-tapestry-east', name: 'Tapestry East Bay', contact: 'Roberto', phone: '813‑310‑2713', managementGroup: 'ZRS', portal: 'Wave', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-anchor', name: 'Anchor Riverwalk', contact: 'Leo', phone: '813‑445‑0480', managementGroup: 'ZRS', portal: 'Wave', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-seazen', name: 'Seazen Rocky Point', contact: 'Mike', phone: '954‑770‑1823', managementGroup: 'ZRS', portal: 'Ops', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-bainbridge', name: 'Bainbridge Sunlake', contact: '', phone: '', managementGroup: 'ZRS', portal: 'Wave', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-sur-club', name: 'Sur Club', contact: 'Kenny', phone: '727‑221‑2634', managementGroup: 'Independent', portal: 'VendorCafe', billingLogic: 'combined', poLogic: 'mandatory' },
  { id: 'prop-park-main', name: 'Park and Main', contact: 'Ron', phone: '407‑252‑1941', managementGroup: 'ZRS', portal: 'Wave', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-mosby', name: 'Mosby At Avalon Park', contact: '', phone: '', managementGroup: 'Independent', portal: 'Wave', billingLogic: 'independent', poLogic: 'optional' },
  { id: 'prop-marquee', name: 'Marquee Square', contact: '', phone: '', managementGroup: 'Independent', portal: 'VendorCafe', billingLogic: 'independent', poLogic: 'optional' }
];

export const DEFAULT_PORTAL_URLS: Record<string, string> = {
  'Wave': 'https://wave.com',
  'Ops': 'https://ops.com',
  'VendorCafe': 'https://vendorcafe.com'
};

// --- NEW PRICING ARCHITECTURE (2025/2026) ---
export const APP_CONFIG = {
  DEFAULTS: {
    template: 'YEAR_2025'
  },
  PRICING_TEMPLATES: {
    'YEAR_2025': {
      PAINT: {
        '1x1': { client: 265, emp: 115 },
        '2x2': { client: 290, emp: 135 },
        '3x2': { client: 315, emp: 160 },
        'Studio': { client: 265, emp: 115 }
      },
      CLEAN: {
        '1x1': { client: 135, emp: 60 },
        '2x2': { client: 145, emp: 70 },
        '3x2': { client: 155, emp: 80 },
        'Studio': { client: 135, emp: 60 }
      },
      TOUCH_UP_PAINT: {
        '1x1': { client: 165, emp: 85 },
        '2x2': { client: 190, emp: 95 },
        '3x2': { client: 215, emp: 110 }
      },
      TOUCH_UP_CLEAN: {
        'Colina_Flat': { client: 65, emp: 50 }, // Rule for Colina Ranch Hill
        '1x1': { client: 65, emp: 50 },
        '2x2': { client: 75, emp: 50 },
        '3x2': { client: 85, emp: 50 }
      },
      EXTRAS: {
        'Garage Paint': { client: 100, emp: 60 },
        'Door & Trim': { client: 120, emp: 40 },
        'Front Door Only': { client: 80, emp: 40 },
        'Kilz': { client: 50, emp: 25 },
        'Large Unit': { client: 20, emp: 10 },
        'Stairs': { client: 25, emp: 15 },
        'Townhouse': { client: 25, emp: 15 },
        'Mop & Glo': { client: 10, emp: 5 },
        'Drywall Repair': { client: 0, emp: 0 } // Variable
      }
    },
    'YEAR_2026': {
      PAINT: { '1x1': { client: 275, emp: 125 }, '2x2': { client: 300, emp: 145 }, '3x2': { client: 325, emp: 170 }, 'Studio': { client: 275, emp: 125 } },
      CLEAN: { '1x1': { client: 155, emp: 70 }, '2x2': { client: 165, emp: 80 }, '3x2': { client: 175, emp: 90 }, 'Studio': { client: 155, emp: 70 } },
      TOUCH_UP_PAINT: { '1x1': { client: 130, emp: 65 }, '2x2': { client: 150, emp: 75 }, '3x2': { client: 170, emp: 85 } },
      TOUCH_UP_CLEAN: { 'Colina_Flat': { client: 75, emp: 50 }, '1x1': { client: 75, emp: 40 }, '2x2': { client: 85, emp: 45 }, '3x2': { client: 95, emp: 50 } },
      EXTRAS: {
        'Garage Paint': { client: 135, emp: 70 }, 'Front Door': { client: 95, emp: 45 }, 'Front Door Trim': { client: 60, emp: 30 },
        'Ceilings': { client: 130, emp: 65 }, 'Vaulted Ceiling': { client: 95, emp: 45 }, 'Large Unit': { client: 45, emp: 20 },
        'Townhouse': { client: 45, emp: 20 }, 'Kilz': { client: 55, emp: 30 }, 'Accent Wall': { client: 125, emp: 60 },
        'Tub Resurface': { client: 450, emp: 0 }, 'Mop & Glo': { client: 20, emp: 10 }, 'Drywall Repair': { client: 0, emp: 0 }
      }
    }
  },
  PROPERTY_CONFIGS: {
    'Sunset Apts': {
      template: 'YEAR_2025', // Uses old pricing
      overrides: {
        'CLEAN': { '1x1': { client: 999, emp: 500 } } // Exception Rule
      }
    },
    'Ocean View': {
      template: 'YEAR_2026' // Uses new pricing
    },
    // Default others to global default (YEAR_2026)
    // Default others to global default (YEAR_2026)
  } as Record<string, { template?: string; overrides?: any }>,
  STATUS_COLORS: {
    'Pending': { color: '#64748b', letter: 'P' },     // Slate-500
    'In Progress': { color: '#3b82f6', letter: 'S' }, // Blue-500 ("Started")
    'Complete': { color: '#10b981', letter: 'C' },    // Emerald-500
    'Paid': { color: '#8b5cf6', letter: '$' },        // Violet-500
    'Cancel': { color: '#ef4444', letter: 'X' }       // Red-500
  }
};
