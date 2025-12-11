
export interface Job {
  id: string;
  date: string;
  property: string;
  apt: string;
  size: string;
  type: string;
  assignedTo: string; // Employee name
  status: 'Pending' | 'In Progress' | 'Complete' | 'Paid' | 'Cancel';
  invoiceStatus: 'None' | 'Draft' | 'Sent';
  po?: string;
  jobNumber?: number;
  invoiceNumber?: string;
  extras: string;
  notes: string;
  invoiceNote?: string; // Auto-generated for invoices
  clientPrice: number;
  employeePrice: number;
  extrasPrice: number;
  highlightColor?: string;
  createdAt?: number;
  relatedJobId?: string; // ID of the "Twin" job (e.g. Paint linked to Clean)
  isPrivate?: boolean; // Private Apartment (Direct Charge)
}

export interface Employee {
  id: string;
  name: string;
  color: string; // Hex code for avatar background
  initials?: string; // Custom 1-2 char string for badges
  rate?: number;
  phone?: string;
  email?: string;
  portalPin?: string; // 6-digit PIN for employee portal access
  extrasPresets?: {
    name: string;        // "Deep cleaning"
    price: number;       // 25
    category?: string;   // "Cleaning", "Painting", "Repair"
  }[];
  pricingConfig?: {
    templateId?: string; // e.g. "2025_STANDARD"
    customRates?: {
      [category: string]: { // e.g. "CLEAN"
        [size: string]: number; // e.g. "2x2": 55
      }
    };
    commissionPct?: number; // Optional flat % override
  }
}

export interface Property {
  id: string;
  name: string;
  contact: string;
  phone: string;

  // Professional Configuration
  managementGroup: 'Altman' | 'ZRS' | 'Greystar' | 'Independent' | 'Other';
  billingLogic: 'independent' | 'combined';
  poLogic: 'mandatory' | 'optional' | 'none'; // Traffic light system

  // Routing
  primaryEmail?: string;
  billingEmail?: string; // CC
  portal: string;
  assignedEmployeeId?: string; // Default Assigned Tech / Manager
}

export interface PriceConfig {
  client: number;
  employee: number;
}

// Old PriceTable (Deprecating slowly or keeping for backward comp)
export interface PriceTable {
  [category: string]: {
    [size: string]: PriceConfig;
  };
}

// NEW PRICING SYSTEM
export interface PricingOverride {
  propertyId: string; // e.g. "Colina Ranch Hill"
  category: string;   // e.g. "TOUCH_UP_CLEAN"
  size: string;       // e.g. "2x2" or "All"
  price: PriceConfig;
}

export interface YearlyPricing {
  year: number;
  global: PriceTable;
  overrides: PricingOverride[];
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  category: 'Estimates' | 'Portals' | 'Other';
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// --- NEW ACTION HISTORY TYPES ---
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';

export interface ActionLog {
  id: string;
  timestamp: number;
  type: ActionType;
  description: string;
  // Data needed to revert the action
  previousData?: Job | Job[]; // For Updates (old state) or Deletes (deleted jobs)
  currentDataId?: string | string[]; // For Creates (to know what to delete on undo)
}

export type Language = 'en' | 'es';

// --- JOBS VIEW MODES ---
export type JobsViewMode =
  | 'DATE_FILTERED'   // Default: Uses Date Dial
  | 'VIEW_ALL'        // Ignores Date Dial, shows all
  | 'READY_TO_BILL'   // Status=Complete, Invoice=None/Draft
  | 'OPEN_JOBS'       // Status!=Complete
  | 'DUPLICATES_ONLY' // Potential duplicates
  | 'PRIVATE_ONLY'    // Direct Charge / Private Jobs
  | 'MISSING_PO';     // Complete but no PO

export interface ApiConfig {
  id: string;
  name: string;
  url: string;
  key?: string;
  type: 'GOOGLE_SHEET' | 'REST_API' | 'OTHER';
  active: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'magic';
  message: string;
  detail?: string;
}

// --- NEW APP CONFIG TYPES ---
export interface PricingTemplate {
  PAINT: Record<string, { client: number; emp: number }>;
  CLEAN: Record<string, { client: number; emp: number }>;
  TOUCH_UP_PAINT: Record<string, { client: number; emp: number }>;
  TOUCH_UP_CLEAN: Record<string, { client: number; emp: number }>;
  EXTRAS: Record<string, { client: number; emp: number }>;
}

export interface PropertyConfig {
  template?: string;
  overrides?: Record<string, Record<string, { client: number; emp: number }>>;
}

export interface AppConfig {
  DEFAULTS: {
    template: string;
  };
  PRICING_TEMPLATES: Record<string, PricingTemplate>;
  PROPERTY_CONFIGS: Record<string, PropertyConfig>;
  STATUS_COLORS: Record<string, { color: string; letter: string }>;
}

export interface AppState {
  version: string; // Store version info
  activeYear: number;
  jobs: Job[];
  employees: Employee[];
  properties: Property[];

  // New Pricing Structure
  pricingData: YearlyPricing[]; // Array of years
  appConfig: AppConfig; // NEW CENTRALIZED CONFIG
  quickLinks: QuickLink[]; // Added to fix lint error

  // Legacy support (temporarily keep until migration confirmed)
  prices: PriceTable;

  settings: {
    employeeInvoiceEmail: string;
    companyName: string;
    language: 'en' | 'es';
    logoUrl?: string;
    dateDialVisibility: 'dashboard_only' | 'everywhere';
    enableDebugConsole: boolean;
    showAdvancedCheck?: boolean; // Controls "Dump/Pay" button visibility
    uiScale?: number; // Zoom scale (0.5 to 1.5)
  };
  portals: Record<string, string>;
  lists: {
    jobTypes: string[];
    sizes: string[];
  };
  tasks: Task[];
  prepaidUnits: Record<string, string[]>; // Property ID -> List of Unit Numbers
  prepaidQuotas: Record<string, { paint: number; clean: number }>; // New Quota State
  history: ActionLog[];
  systemLogs: LogEntry[];
  isImporting: boolean;
  viewMode: JobsViewMode;
  lastNonDuplicateMode: JobsViewMode;
  viewLayout: 'list' | 'card' | 'calendar'; // Layout Toggle (List, Card Grid, Calendar)
  searchTerm: string; // Lifted Search State
  focusDateRange?: { start: Date; end: Date };
  dateViewUnit: 'day' | 'week' | 'month' | 'biweek'; // Added for global sync
  apiConfigs?: ApiConfig[];
  propertySchedules: PropertySchedule[]; // Phase 3
  inventory: InventoryItem[]; // Phase 4
  inventoryLogs: InventoryLog[]; // Phase 4
}

export type View = 'dashboard' | 'jobs' | 'employees' | 'properties' | 'settings' | 'daily-report' | 'inventory' | 'documents';

export interface AppContextType extends AppState {
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJobs: (ids: string[]) => void;
  updateJobs: (updates: Job[]) => void;
  resolveImportConflicts: (newJobs: Job[], updatedJobs: Job[]) => void;
  importJobs: (newJobs: Job[], dateRange?: { start: Date; end: Date } | null) => void;
  clearAllData: () => void;
  undoAction: (actionId: string) => void;

  // Pricing
  updatePrices: (prices: PriceTable) => void;
  setActiveYear: (year: number) => void;
  updateGlobalPrice: (year: number, category: string, size: string, price: PriceConfig) => void;
  deleteGlobalPrice: (year: number, category: string, size: string) => void;
  addPriceOverride: (year: number, override: PricingOverride) => void;
  removePriceOverride: (year: number, propertyId: string, category: string, size: string) => void;

  // App Config (New)
  updateAppConfig: (updates: Partial<AppConfig>) => void;

  // Properties
  updateProperty: (id: string, updates: Partial<Property>) => void;
  addProperty: (property: Property) => void;
  updatePropertySchedule: (schedule: PropertySchedule) => void; // Phase 3

  // Inventory (Phase 4)
  updateInventoryItem: (item: InventoryItem) => void;
  addInventoryLog: (log: InventoryLog) => void;
  deleteInventoryItem: (id: string) => void;

  // Employees
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Links
  addQuickLink: (link: QuickLink) => void;
  deleteQuickLink: (id: string) => void;

  // Task Actions
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, text: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  setTasks: (tasks: Task[]) => void;

  // API Configs
  addApiConfig: (config: ApiConfig) => void;
  updateApiConfig: (id: string, updates: Partial<ApiConfig>) => void;
  deleteApiConfig: (id: string) => void;

  // Prepaid
  updatePrepaidList: (key: string, units: string[]) => void;

  // View
  setJobsViewMode: (mode: JobsViewMode) => void;
  setViewLayout: (layout: 'list' | 'card') => void; // New
  setSearchTerm: (term: string) => void; // New
  setFocusDateRange: (range: { start: Date; end: Date } | undefined) => void;
  setDateViewUnit: (unit: 'day' | 'week' | 'month' | 'biweek') => void; // Added
  addLog: (log: LogEntry) => void;
  setIsImporting: (val: boolean) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;

  // Utils
  t: (key: string) => string;
  refreshFromStorage: () => void;
  syncPush: () => Promise<void>;
  syncPull: () => Promise<void>;
  clearCloudData: () => Promise<void>;
}

// --- PHASE 3: ADVANCED FACILITY MANAGEMENT ---

export interface PropertySchedule {
  id: string;
  propertyId: string;
  dayOfWeek: number; // 0-6
  requiredStaffCount: number;
  assignedEmployeeIds: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // 'cleaning', 'paper', 'tools'
  unit: string; // 'bottle', 'box'
  costPerUnit: number;
  currentStock: number;
  reorderThreshold: number;
}

export interface InventoryLog {
  id: string;
  date: string; // ISO Date
  itemId: string;
  propertyId?: string; // Null if general restock
  requestedBy?: string; // Employee ID
  quantity: number; // + for Restock, - for Use
  type: 'consumption' | 'restock' | 'adjustment';
  notes?: string;
}
