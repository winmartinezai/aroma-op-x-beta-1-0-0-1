import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState
} from '@tanstack/react-table';
import {
  Search, Plus, Trash2,
  MoreHorizontal, CheckSquare, Square, ArrowUpDown,
  ChevronLeft, ChevronRight,
  FileText, Briefcase,
  X, Eye, EyeOff, FolderInput,
  Crown, Edit2, ListFilter, Layers, Hourglass, PlusCircle,
  AlertTriangle, CheckCircle, AlertCircle, RotateCcw, HelpCircle,
  CloudUpload, CloudDownload, Pen // Added Pen
} from 'lucide-react';

const SERVICES_LIST = ['Clean', 'Paint', 'Repair', 'Touch Up Paint', 'Touch Up Clean', 'Other'];
const SIZES_LIST = ['1x1', '2x2', '3x2', 'Studio', '3x3', 'PH', 'Townhouse'];

import { useApp } from '../context/AppContext';
import type { Job } from '../types/types';
// import type { JobsViewMode } from '../types/types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import { ROW_COLOR_MAP, EMPLOYEE_COLORS } from '../utils/colorUtils'; // Import Static Map
import { parseFile } from '../services/importService';
// import { isValidFileName } from '../services/importService';
import DuplicateResolutionModal from './DuplicateResolutionModal';
import JobEditModal from './JobEditModal';
// import InvoiceStagingModal from './InvoiceStagingModal';
// DateHeader and ContactsPortals moved to JobsMaster page

import JobsHistoryWidget, { type JobHistoryAction } from './JobsHistoryWidget';
// import DraggablePanel from './DraggablePanel';
import ExtrasModal from './ExtrasModal';
import { useClickOutside } from '../hooks/useClickOutside';
import { generateInvoiceNote } from '../utils/pricing';
// import { calculatePrice } from '../utils/pricing';

import EmployeeBadge from './EmployeeBadge';
import PortalDropdown from './PortalDropdown';
import JobCard from './JobCard';
import ViewSwitcher, { type ViewMode } from './ViewSwitcher';
import JobActionMenu from './JobActionMenu';
import CalendarView from './CalendarView';

const JobsTable: React.FC = () => {
  const {
    jobs, deleteJobs, updateJob, addJob, // t,
    focusDateRange, setFocusDateRange,
    viewMode, setJobsViewMode,
    viewLayout, setViewLayout, // Layout
    searchTerm, setSearchTerm, // Global Search
    addLog, setIsImporting, isImporting,
    employees, updateEmployee, // Added updateEmployee
    settings,
    appConfig,
    refreshFromStorage,
    syncPush, // Added
    syncPull,  // Added
    clearCloudData // Added
  } = useApp();

  /* const [rowSelection, setRowSelection] = useState<RowSelectionState>({}); */
  // Use local state if TanStack doesn't persist, or sync with TanStack.
  // Actually, utilize TanStack's state directly via table.getState().rowSelection for reads if needed, 
  // but we control it here.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // QUICK EDIT STATE
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);

  // QUICK EDIT HANDLER
  const handleQuickCycle = (jobId: string, field: 'type' | 'size', currentValue: string) => {
    if (isQuickEditMode) return; // In Quick Edit Mode, do nothing (let click handler open edit inputs if implemented, or just do nothing)

    const list = field === 'type' ? SERVICES_LIST : SIZES_LIST;
    // Normalize current value to match list case-insensitively or just find index
    const currentIndex = list.findIndex(item => item.toLowerCase() === currentValue?.toLowerCase());
    const nextIndex = (currentIndex + 1) % list.length;
    const nextValue = list[nextIndex];

    updateJob(jobId, { [field]: nextValue });
  };

  // Local History State
  const [localHistory, setLocalHistory] = useState<JobHistoryAction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  /* const [historyPosition, setHistoryPosition] = useState({ x: 100, y: 100 }); */
  const [extrasModalJob, setExtrasModalJob] = useState<Job | null>(null);

  // Menus
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLButtonElement>(null);
  useClickOutside(columnMenuRef, () => setShowColumnMenu(false));
  const [showHidden, setShowHidden] = useState(false);

  // Advanced Filters
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLButtonElement>(null);
  useClickOutside(filterMenuRef, () => setShowFilterMenu(false));
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [employeeFilters, setEmployeeFilters] = useState<Set<string>>(new Set());

  // Import State
  const { importJobs, /* updateJobs, */ resolveImportConflicts } = useApp();
  // Modal State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

  interface ModalState {
    type: 'ALERT' | 'CONFIRM';
    title: string;
    message: string;
    onConfirm?: () => void;
  }
  const [activeModal, setActiveModal] = useState<ModalState | null>(null);

  const [pendingDuplicates, setPendingDuplicates] = useState<{ existing: Job; new: Job }[]>([]);
  const [pendingNonDuplicates, setPendingNonDuplicates] = useState<Job[]>([]);
  const [pendingDateRange, setPendingDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // --- DUPLICATE DETECTION (Persistent) ---
  const duplicateCount = useMemo(() => {
    const signatures = jobs.map(j => `${j.property}|${j.apt}|${j.type}|${j.date}`);
    const counts: { [key: string]: number } = {};
    signatures.forEach(s => counts[s] = (counts[s] || 0) + 1);
    return Object.values(counts).filter(c => c > 1).reduce((sum, c) => sum + c, 0);
  }, [jobs]);

  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const handleShowDuplicates = () => setShowDuplicatesOnly(true);

  const readyToBillCount = useMemo(() => {
    return jobs.filter(j => j.status === 'Complete' && j.invoiceStatus !== 'Sent').length;
  }, [jobs]);

  const openJobsCount = useMemo(() => {
    // "Open" usually means not Complete, Paid, or Canceled
    return jobs.filter(j => j.status !== 'Complete' && j.status !== 'Paid' && j.status !== 'Cancel').length;
  }, [jobs]);



  // --- FILTER LOGIC (Preserved from original) ---
  // We compute filtered data FIRST, then pass to TanStack.
  // This ensures our custom "View Mode" logic is respected.
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 0. Duplicates Filter (Highest Priority)
      if (showDuplicatesOnly) {
        const sig = `${job.property}|${job.apt}|${job.type}|${job.date}`;
        const count = jobs.filter(j => `${j.property}|${j.apt}|${j.type}|${j.date}` === sig).length;
        return count > 1;
      }

      // 1. Search Filter (Global Priority)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return Object.entries(job).some(([key, value]) => {
          if (String(value).toLowerCase().includes(term)) return true;
          if (key === 'date' && typeof value === 'string') {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
              const formats = [
                d.toLocaleDateString('en-US', { month: 'short' }),
                d.toLocaleDateString('en-US', { month: 'long' }),
                d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              ];
              return formats.some(f => f.toLowerCase().includes(term));
            }
          }
          return false;
        });
      }

      // 2. View Mode Filter
      let matchesMode = true;
      switch (viewMode) {
        case 'DATE_FILTERED':
          if (focusDateRange) {
            const jobDate = new Date(job.date);
            const start = new Date(focusDateRange.start);
            start.setHours(0, 0, 0, 0); // Use setHours 0 for accurate day comparison
            const end = new Date(focusDateRange.end);
            end.setHours(23, 59, 59, 999);
            matchesMode = jobDate >= start && jobDate <= end;
          }
          break;
        case 'VIEW_ALL': matchesMode = true; break;
        case 'READY_TO_BILL':
          // User Definition: Job Complete AND Extras defined (either content or "No Extra")
          matchesMode = job.status === 'Complete' && (!!job.extras && job.extras.trim() !== '');
          break;
        case 'OPEN_JOBS': matchesMode = job.status !== 'Paid' && job.status !== 'Cancel'; break;
        case 'PRIVATE_ONLY': matchesMode = job.isPrivate === true; break;
      }
      if (!matchesMode) return false;

      // 3. Global Date Filter Override
      // BUG FIX: Ensure 'VIEW_ALL' explicitly BYPASSES this check.
      // We only want the Global Dial to enforce date range on other specialized views (like 'OPEN_JOBS' maybe?)
      // Actually, if ViewMode is DATE_FILTERED, it's already handled.
      // If ViewMode is VIEW_ALL, we want NO date filter.
      // Unsure about READY_TO_BILL etc. Usually Global Dial should constrain those too? 
      // User said "show me the jobs on memory".
      // Safest fix: If viewMode is VIEW_ALL, SKIP this override.
      if (settings.dateDialVisibility === 'everywhere' && focusDateRange && viewMode !== 'DATE_FILTERED' && viewMode !== 'VIEW_ALL') {
        const jobDate = new Date(job.date);
        const start = new Date(focusDateRange.start); start.setHours(0, 0, 0, 0);
        const end = new Date(focusDateRange.end); end.setHours(23, 59, 59, 999);
        if (!(jobDate >= start && jobDate <= end)) return false;
      }

      // 4. Hide Hidden (Only apply if explicitly toggled off AND not in VIEW_ALL)
      // IMPORTANT: Don't auto-hide jobs just because they're Complete+Sent
      // Only hide if user explicitly turned off the eye icon
      if (!showHidden && viewMode !== 'VIEW_ALL' && viewMode !== 'DATE_FILTERED') {
        // Only hide Complete+Sent jobs in specific view modes (OPEN_JOBS, READY_TO_BILL)
        if (job.status === 'Complete' && job.invoiceStatus === 'Sent') return false;
      }

      // 5. Advanced Filters
      if (statusFilters.size > 0 && !statusFilters.has(job.status)) return false;
      if (employeeFilters.size > 0 && !employeeFilters.has(job.assignedTo)) return false;

      // 6. Special View Mode Filters (Lowest Priority Logic, overrides others if matched)
      if (viewMode === 'READY_TO_BILL') {
        return job.status === 'Complete' && job.invoiceStatus !== 'Sent';
      }
      if (viewMode === 'OPEN_JOBS') {
        return job.status !== 'Complete' && job.status !== 'Cancel' && job.status !== 'Paid';
      }
      if (viewMode === 'PRIVATE_ONLY') {
        return job.isPrivate === true;
      }
      if (viewMode === 'MISSING_PO') {
        // Show jobs that are Complete/Verified but likely need PO.
        // Typically Complete jobs.
        // And missing PO field.
        return job.status === 'Complete' && (!job.po || job.po.trim() === '');
      }

      return true;
    });
  }, [jobs, searchTerm, viewMode, focusDateRange, settings.dateDialVisibility, showHidden, statusFilters, employeeFilters, showDuplicatesOnly]);

  // SYNC: Message Board should reflect the FILTERED view (what the user sees)
  const pendingInvoicesCount = useMemo(() => {
    return filteredJobs.filter(j => j.status === 'Complete' && j.invoiceStatus !== 'Sent').length;
  }, [filteredJobs]);

  // COLOR CYCLING LISTENER
  useEffect(() => {
    const handleValueChange = (e: any) => {
      const { id, currentColor } = e.detail;
      const currentIndex = EMPLOYEE_COLORS.indexOf(currentColor as any);
      const nextIndex = (currentIndex + 1) % EMPLOYEE_COLORS.length;
      const nextColor = EMPLOYEE_COLORS[nextIndex];
      updateEmployee(id, { color: nextColor });
    };

    window.addEventListener('CYCLE_EMP_COLOR', handleValueChange);
    return () => window.removeEventListener('CYCLE_EMP_COLOR', handleValueChange);
  }, [updateEmployee]);

  // AUTO-SWITCH: If user moves the dial (focusDateRange changes), automatically switch to DATE_FILTERED
  // DISABLED: This was causing jobs to disappear after updates
  // useEffect(() => {
  //   if (focusDateRange) {
  //     setJobsViewMode('DATE_FILTERED');
  //   }
  // }, [focusDateRange]);

  // --- TABLE COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<Job>[]>(() => [
    // 1. Row Index (Count) - MOVED TO FIRST
    {
      id: 'index',
      header: '#',
      cell: info => <div className="text-slate-400 text-[10px] font-mono">{info.row.index + 1}</div>,
      size: 30,
    },
    {
      id: 'select',
      header: ({ table }) => (
        <button
          onClick={table.getToggleAllRowsSelectedHandler()}
          className="flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          {table.getIsAllRowsSelected() ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
        </button>
      ),
      cell: ({ row }) => (
        <button
          onClick={row.getToggleSelectedHandler()}
          className="flex items-center justify-center text-slate-300 hover:text-blue-500"
        >
          {row.getIsSelected() ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
        </button>
      ),
      size: 40,
    },
    // 2. Job Number (6 Digits)
    {
      accessorKey: 'jobNumber',
      header: 'Job #',
      cell: info => {
        const val = info.getValue() as number;
        return (
          <div className="font-mono font-bold text-slate-600 text-xs">
            {val ? val.toString().padStart(6, '0') : '-'}
          </div>
        );
      },
      size: 70,
    },
    {
      accessorKey: 'property',
      header: 'Property',
      cell: info => <div className="font-bold text-slate-700 truncate" title={info.getValue() as string}>{info.getValue() as string}</div>,
      size: 160,
    },
    {
      accessorKey: 'apt',
      header: 'Unit',
      cell: info => <div className="font-bold text-slate-800 truncate">{info.getValue() as string}</div>,
      size: 60,
    },
    {
      accessorKey: 'type',
      header: 'Service',
      cell: ({ row }) => {
        const val = row.original.type;
        return (
          <div
            onClick={(e) => {
              // If not in edit mode, cycle. If in edit mode, maybe do nothing (or allow edit modal)
              if (!isQuickEditMode) {
                e.stopPropagation(); // Prevent row click
                handleQuickCycle(row.original.id, 'type', val);
              } else {
                setEditingJobId(row.original.id); // Or some other edit trigger
              }
            }}
            className={`font-bold text-slate-600 uppercase text-[10px] truncate select-none ${!isQuickEditMode ? 'cursor-pointer hover:bg-slate-100 hover:text-blue-600 rounded px-1 -mx-1 transition-colors' : ''} ${isQuickEditMode ? 'border border-dashed border-slate-300 bg-slate-50' : ''}`}
          >
            {val}
          </div>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => {
        const val = row.original.size;
        return (
          <div
            onClick={(e) => {
              if (!isQuickEditMode) {
                e.stopPropagation();
                handleQuickCycle(row.original.id, 'size', val);
              } else {
                setEditingJobId(row.original.id);
              }
            }}
            className={`text-slate-500 truncate select-none ${!isQuickEditMode ? 'cursor-pointer hover:bg-slate-100 hover:text-blue-600 rounded px-1 -mx-1 transition-colors' : ''} ${isQuickEditMode ? 'border border-dashed border-slate-300 bg-slate-50' : ''}`}
          >
            {val}
          </div>
        );
      },
      size: 60,
    },
    {
      accessorKey: 'assignedTo',
      header: 'Tech',
      cell: info => {
        const name = info.getValue() as string;
        const emp = employees.find(e => e.name === name);

        return name ? (
          <EmployeeBadge
            name={name}
            color={emp?.color}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (!emp) return;
              window.dispatchEvent(new CustomEvent('CYCLE_EMP_COLOR', { detail: { id: emp.id, currentColor: emp.color } }));
            }}
          />
        ) : null;
      },
      size: 120,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        let dotColor = 'bg-slate-400';

        if (status === 'Pending') { badgeStyle = 'bg-yellow-50 text-yellow-700 border-yellow-200'; dotColor = 'bg-yellow-500'; }
        else if (status === 'In Progress') { badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200'; dotColor = 'bg-orange-500'; }
        else if (status === 'Complete') { badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200'; dotColor = 'bg-blue-500'; }
        else if (status === 'Paid') { badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200'; dotColor = 'bg-emerald-500'; }
        else if (status === 'Cancel') { badgeStyle = 'bg-slate-50 text-slate-400 border-slate-200'; dotColor = 'bg-slate-400'; }

        return (
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${badgeStyle} w-fit transition-all shadow-sm`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
            <select
              value={status}
              onChange={(e) => handleStatusChange(row.original.id, e.target.value as any)}
              className="bg-transparent border-none text-current text-[11px] font-bold focus:ring-0 cursor-pointer p-0 w-full appearance-none outline-none leading-tight"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="Paid">Paid</option>
              <option value="Cancel">Cancel</option>
            </select>
          </div>
        );
      },
      size: 130,
    },
    {
      accessorKey: 'invoiceStatus',
      header: 'Inv Status',
      cell: ({ row }) => (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit text-[10px] font-bold shadow-sm ${row.original.invoiceStatus === 'Sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          row.original.invoiceStatus === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-slate-50 text-slate-400 border-slate-200'
          }`}>
          <select
            value={row.original.invoiceStatus}
            onChange={(e) => handleInvoiceStatusChange(row.original.id, e.target.value as any)}
            className="bg-transparent border-none text-current p-0 w-14 focus:ring-0 cursor-pointer appearance-none outline-none leading-none"
          >
            <option value="None">-</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
          </select>
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Inv #',
      cell: ({ row }) => (
        <input
          type="text"
          defaultValue={row.original.invoiceNumber || ''}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val !== (row.original.invoiceNumber || '')) {
              updateJob(row.original.id, { invoiceNumber: val });
            }
          }}
          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-slate-600 font-mono text-xs py-0.5 w-full placeholder-slate-300"
          placeholder="-"
        />
      ),
      size: 80,
    },
    {
      accessorKey: 'extras',
      header: 'Extras',
      cell: ({ row }) => (
        <div className="flex items-center justify-between group/extras">
          <span className="text-slate-600 truncate" title={row.original.extras} > {row.original.extras || '-'}</span >
          <button onClick={() => setExtrasModalJob(row.original)} className="opacity-0 group-hover/extras:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all shrink-0">
            <PlusCircle size={14} />
          </button>
        </div >
      ),
      size: 150,
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: info => <div className="text-slate-500 italic truncate" title={info.getValue() as string}>{info.getValue() as string}</div>,
      size: 120,
    },
    {
      accessorKey: 'invoiceNote',
      header: 'Inv. Note',
      cell: ({ row }) => (
        <div className="flex justify-between items-center group/note">
          <span className="truncate text-slate-500 text-[10px]" title={row.original.invoiceNote}>{row.original.invoiceNote}</span>
          {row.original.invoiceNote && (
            <button onClick={() => navigator.clipboard.writeText(row.original.invoiceNote || '')} className="opacity-0 group-hover/note:opacity-100 p-1 text-blue-500 hover:bg-blue-50 rounded">
              <FileText size={10} />
            </button>
          )}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'clientPrice',
      header: 'Price',
      cell: info => <div className="text-right font-mono text-slate-700 font-medium">{formatCurrency(info.getValue() as number)}</div>,
      size: 80,
    },
    {
      accessorKey: 'employeePrice',
      header: 'Pay',
      cell: ({ row }) => (
        <div className="relative group/pay">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none pl-1">$</div>
          <input
            type="number"
            step="0.01"
            defaultValue={row.original.employeePrice || 0}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val !== row.original.employeePrice) {
                updateJob(row.original.id, { employeePrice: val });
              }
            }}
            className="text-right font-mono text-slate-500 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-xs py-0.5 pl-3"
          />
        </div>
      ),
      size: 80,
    },
    {
      id: 'total',
      header: 'Total',
      cell: ({ row }) => <div className="text-right font-mono text-slate-800 font-bold">{formatCurrency((row.original.clientPrice || 0) + (row.original.extrasPrice || 0))}</div>,
      size: 80,
    },
    {
      id: 'isPrivate',
      header: () => <Crown size={14} className="mx-auto text-slate-400" />,
      cell: ({ row }) => (
        <button
          onClick={() => updateJob(row.original.id, { isPrivate: !row.original.isPrivate })}
          className={`p - 1 rounded - full w - full flex justify - center ${row.original.isPrivate ? 'bg-purple-100 text-purple-600' : 'text-slate-300 hover:text-slate-400'} `}
        >
          <Crown size={14} fill={row.original.isPrivate ? "currentColor" : "none"} />
        </button>
      ),
      size: 40,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <JobActionMenu
          onEdit={() => setEditingJobId(row.original.id)}
          onDuplicate={() => {
            // Duplicate job logic
            const newJob = {
              ...row.original,
              id: generateId(),
              jobNumber: undefined, // Will be auto-assigned
              status: 'Pending' as const,
              invoiceStatus: 'None' as const
            };
            addJob(newJob);
            addToHistory({
              id: generateId(),
              timestamp: Date.now(),
              type: 'CREATE',
              description: `Duplicated Job #${row.original.jobNumber} `,
              jobId: newJob.id,
              user: 'You'
            });
          }}
          onDelete={() => {
            setActiveModal({
              type: 'CONFIRM',
              title: 'Delete Job?',
              message: `Are you sure you want to delete job #${row.original.jobNumber}?\n\nThis cannot be undone.`,
              onConfirm: () => deleteJobs([row.original.id])
            });
          }}
        />
      ),
      size: 50,
    }
  ], [employees]);

  // --- TANSTACK TABLE INSTANCE ---
  const table = useReactTable({
    data: filteredJobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (row: Job) => row.id, // Use our ID
    enableRowSelection: true,
  });

  // --- ACTIONS ---
  const addToHistory = (action: JobHistoryAction) => setLocalHistory(prev => [action, ...prev]);

  const handleAddJob = () => {
    // AUTO ASSIGN JOB NUMBER
    const maxJobNum = jobs.reduce((max, j) => (j.jobNumber && j.jobNumber > max ? j.jobNumber : max), 100100);
    let nextJobNum = maxJobNum + 1;
    // RULE: 4th digit cannot be 0.
    if (nextJobNum.toString()[3] === '0') {
      nextJobNum += 100;
    }

    const newJob: Job = {
      id: generateId(),
      date: new Date().toISOString(),
      jobNumber: nextJobNum, // Auto-assigned
      property: 'New Property',
      apt: 'Unit',
      type: 'Clean',
      size: '1x1',
      assignedTo: '',
      status: 'Pending',
      invoiceStatus: 'None',
      clientPrice: 0,
      employeePrice: 0,
      extrasPrice: 0,
      notes: '',
      extras: '',
      invoiceNote: ''
    };
    addJob(newJob);
    addToHistory({
      id: generateId(), timestamp: Date.now(), type: 'CREATE', description: `Created Job #${nextJobNum} `, jobId: newJob.id, user: 'You'
    });
    setEditingJobId(newJob.id);
  };

  // Handlers (Copy-Pasted logic from original but updated to use simple updateJob)
  // const addToHistory = (action: JobHistoryAction) => setLocalHistory(prev => [action, ...prev]);
  // ... (Other handlers like handleUndo, handleStatusChange, etc - keeping implementation compact for this file write)
  const handleStatusChange = (id: string, newStatus: Job['status']) => {
    const job = jobs.find(j => j.id === id); if (!job) return;
    updateJob(id, { status: newStatus });
  };
  const handleInvoiceStatusChange = (id: string, newStatus: Job['invoiceStatus']) => {
    updateJob(id, { invoiceStatus: newStatus });
  };
  const handleSaveExtras = (jobId: string, summary: string, total: number) => {
    const job = jobs.find(j => j.id === jobId); if (!job) return;
    const newInvoiceNote = generateInvoiceNote(job, summary);
    updateJob(jobId, { extras: summary, extrasPrice: total, invoiceNote: newInvoiceNote });
  };
  const handleUndo = (action: JobHistoryAction) => {
    if (action.type === 'CREATE' && action.jobId) deleteJobs([action.jobId]);
    // Simplistic Logic just for demo
    setLocalHistory(prev => prev.filter(a => a.id !== action.id));
  };




  // Import Handlers
  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    let allParsedJobs: Job[] = [];
    let allLogs: any[] = [];
    let combinedDateRange: { start: Date; end: Date } | null = null;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) continue;

        const parsedResult = await parseFile(file, jobs, appConfig);
        const { jobs: parsedJobs, logs: fileLogs, dateRange } = parsedResult;

        allParsedJobs = [...allParsedJobs, ...parsedJobs];
        allLogs = [...allLogs, ...fileLogs];

        if (dateRange) {
          if (!combinedDateRange) combinedDateRange = dateRange;
          else {
            if (dateRange.start < combinedDateRange.start) combinedDateRange.start = dateRange.start;
            if (dateRange.end > combinedDateRange.end) combinedDateRange.end = dateRange.end;
          }
        }
      }

      allLogs.forEach(log => addLog(log));

      if (allParsedJobs.length === 0) {
        alert('No valid jobs found in selected files.');
        setIsImporting(false);
        e.target.value = '';
        return;
      }

      // CHECK FOR DUPLICATES
      const duplicates: { existing: Job; new: Job }[] = [];
      const nonDuplicates: Job[] = [];

      allParsedJobs.forEach(newJob => {
        const existing = jobs.find(j =>
          j.property === newJob.property &&
          j.apt === newJob.apt &&
          j.type === newJob.type &&
          j.date === newJob.date
        );

        if (existing) {
          duplicates.push({ existing, new: newJob });
        } else {
          nonDuplicates.push(newJob);
        }
      });

      if (duplicates.length > 0) {
        setPendingDuplicates(duplicates);
        setPendingNonDuplicates(nonDuplicates);
        setPendingDateRange(combinedDateRange);
        setDuplicateModalOpen(true);
      } else {
        importJobs(nonDuplicates, combinedDateRange);
        alert(`Successfully imported ${nonDuplicates.length} jobs!`);
        if (combinedDateRange) {
          setFocusDateRange(combinedDateRange);
          setJobsViewMode('DATE_FILTERED');
        }
      }

    } catch (error: any) {
      console.error(error);
      addLog({
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: 'error',
        message: 'Import failed',
        detail: error instanceof Error ? error.message : String(error)
      });
      alert('Import failed. Check logs.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleDuplicateResolution = (resolutions: { [key: string]: 'skip' | 'overwrite' | 'keep_both' }) => {
    const finalJobsToImport = [...pendingNonDuplicates];
    const jobsToUpdate: Job[] = [];

    pendingDuplicates.forEach(d => {
      const action = resolutions[d.new.id];
      if (action === 'keep_both') {
        finalJobsToImport.push(d.new);
      } else if (action === 'overwrite') {
        const updatedJob = { ...d.new, id: d.existing.id };
        jobsToUpdate.push(updatedJob);
      }
    });

    if (finalJobsToImport.length > 0 || jobsToUpdate.length > 0) {
      resolveImportConflicts(finalJobsToImport, jobsToUpdate);
    }

    if (pendingDateRange) {
      setFocusDateRange(pendingDateRange);
      setJobsViewMode('DATE_FILTERED');
    }

    alert(`Import complete! Added ${finalJobsToImport.length}, Updated ${jobsToUpdate.length}.`);

    setDuplicateModalOpen(false);
    setPendingDuplicates([]);
    setPendingNonDuplicates([]);
    setPendingDateRange(null);
  };

  // LOST & FOUND Refresh
  const handleLostFoundRefresh = () => {
    if (confirm("Reset view and find all lost jobs?")) {
      refreshFromStorage();
      setSearchTerm('');
      setFocusDateRange(undefined);
      setJobsViewMode('VIEW_ALL');
      setStatusFilters(new Set());
      setEmployeeFilters(new Set());
      setShowDuplicatesOnly(false); // <--- RESET THIS
      setShowHidden(true);
      table.resetSorting();
      table.resetPagination();
      table.resetColumnVisibility();
      setTimeout(() => alert(`View Reset! Found ${jobs.length} jobs. (TanStack Engine Active)`), 200);
    }
  };

  // --- DEBUG RENDER ---
  console.log("🎨 RENDER TABLE:", {
    totalJobs: jobs.length,
    filtered: filteredJobs.length,
    rows: table.getRowModel().rows.length
  });

  // --- RENDER ---
  return (
    <div className="flex flex-row h-full bg-slate-50 relative overflow-visible">
      <div className="flex-1 flex flex-col min-w-0">

        {/* DATE HEADER & CONTACTS PORTALS REMOVED - Managed by JobsMaster Page */}


        {/* TOOLBAR */}
        <div className="bg-transparent px-6 py-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center shrink-0 z-50 relative overflow-visible">

          {/* LEFT ZONE: New Job, Switcher, Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">

            {/* DUPLICATE WARNING */}
            {duplicateCount > 0 && (
              <button
                onClick={handleShowDuplicates}
                className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg text - xs font - bold transition - all border ${showDuplicatesOnly ? 'bg-orange-100 text-orange-700 border-orange-300 ring-2 ring-orange-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'} `}
              >
                <AlertTriangle size={14} />
                <span>{duplicateCount} Duplicates Found</span>
                {showDuplicatesOnly && <X size={12} onClick={(e) => { e.stopPropagation(); setShowDuplicatesOnly(false); }} className="ml-1 hover:bg-orange-200 rounded" />}
              </button>
            )}

            {/* NEW LAYOUT: Primary Controls Group */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleAddJob} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={16} /> New Job
              </button>

              <div className="h-8 w-px bg-slate-300 mx-1 hidden sm:block"></div>

              <ViewSwitcher
                currentView={viewLayout as ViewMode}
                onChange={(mode) => setViewLayout(mode as 'list' | 'card')}
                className=""
              />

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>

              {/* QUICK EDIT TOGGLE (Pen) */}
              <button
                onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                className={`p-2 rounded-md transition-all ${isQuickEditMode ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                title={isQuickEditMode ? "Advanced Edit Mode (Manual Entry)" : "Enable Advanced Edit Mode"}
              >
                <Pen size={18} />
              </button>
            </div>

            {/* NEW LAYOUT: Filters Group - Adjusted to match ViewSwitcher Height */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setJobsViewMode('VIEW_ALL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'VIEW_ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Layers size={16} />
                <span className="hidden sm:inline">All</span>
              </button>

              <button
                onClick={() => setJobsViewMode(viewMode === 'OPEN_JOBS' ? 'DATE_FILTERED' : 'OPEN_JOBS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'OPEN_JOBS' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Briefcase size={16} />
                <span className="hidden sm:inline">Open</span>
                {openJobsCount > 0 && <span className="ml-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">{openJobsCount}</span>}
              </button>

              <button
                onClick={() => setJobsViewMode(viewMode === 'READY_TO_BILL' ? 'DATE_FILTERED' : 'READY_TO_BILL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'READY_TO_BILL' ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <CheckCircle size={16} />
                <span className="hidden sm:inline">Ready</span>
                {readyToBillCount > 0 && <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[10px]">{readyToBillCount}</span>}
              </button>

              <button
                onClick={() => setJobsViewMode(viewMode === 'PRIVATE_ONLY' ? 'DATE_FILTERED' : 'PRIVATE_ONLY')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'PRIVATE_ONLY' ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Crown size={16} />
                <span className="hidden sm:inline">Private</span>
              </button>
            </div>
          </div>

          {/* RIGHT ZONE: Search, Import, Tools */}
          <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto xl:justify-end">
            {/* Search Bar - Flexible width */}
            <div className="relative grow md:grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-48 lg:w-64 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* MESSAGE BOARD (Compact) */}
            <div className={`px - 3 py - 1.5 rounded - full border shadow - sm flex items - center gap - 2 transition - all hidden 2xl:flex ${pendingInvoicesCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} `}>
              {pendingInvoicesCount > 0 ? (
                <>
                  <AlertCircle size={14} className="animate-pulse" />
                  <span className="text-xs font-bold">{pendingInvoicesCount} Pending</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span className="text-xs font-bold">Caught Up</span>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

            {/* ACTION ICONS */}
            <div className="flex items-center gap-1">
              {Object.keys(rowSelection).length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const selectedIds = Object.keys(rowSelection);
                      setActiveModal({
                        type: 'CONFIRM',
                        title: 'Delete Selected?',
                        message: `Are you sure you want to delete ${selectedIds.length} selected job(s) ?\n\nThis cannot be undone.`,
                        onConfirm: () => {
                          deleteJobs(selectedIds);
                          setRowSelection({});
                        }
                      });
                    }}
                    className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-1.5 rounded hover:bg-red-100 transition-colors mr-2 animate-in fade-in slide-in-from-left-2"
                    title="Delete Selected Jobs"
                  >
                    <Trash2 size={14} />
                    <span className="text-xs font-bold hidden sm:inline">Delete ({Object.keys(rowSelection).length})</span>
                  </button>

                  <button
                    onClick={() => {
                      const selectedIds = Object.keys(rowSelection);
                      const selectedJobs = jobs.filter(j => selectedIds.includes(j.id));

                      // Filter for Paint jobs only
                      const paintJobs = selectedJobs.filter(j => j.type.toLowerCase().includes('paint'));

                      if (paintJobs.length === 0) {
                        setActiveModal({
                          type: 'ALERT',
                          title: 'No Paint Jobs Selected',
                          message: "Please select at least one Paint job to duplicate as Clean."
                        });
                        return;
                      }

                      setActiveModal({
                        type: 'CONFIRM',
                        title: 'Duplicate as Clean?',
                        message: `Found ${paintJobs.length} Paint jobs in selection.\n\nCreate ${paintJobs.length} corresponding CLEAN jobs?`,
                        onConfirm: () => {
                          const newJobs: Job[] = paintJobs.map(job => ({
                            ...job,
                            id: generateId(),
                            jobNumber: undefined, // Let importJobs assign new numbers
                            type: 'Clean', // Force type to Clean
                            status: 'Scheduled', // Reset status
                            completedDate: undefined,
                            invoiceNumber: undefined,
                            invoiceDate: undefined,
                            sentDate: undefined,
                            paidDate: undefined,
                            qbId: undefined,
                            notes: `Duplicated from Paint Job #${job.jobNumber}`
                          }));

                          importJobs(newJobs);
                          setRowSelection({});
                          addLog({
                            id: generateId(),
                            timestamp: new Date().toISOString(),
                            type: 'magic',
                            message: `Duplicated ${newJobs.length} Paint jobs as Clean`
                          });
                        }
                      });
                    }}
                    className="flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1.5 rounded hover:bg-blue-100 transition-colors mr-2 animate-in fade-in slide-in-from-left-2"
                    title="Duplicate Paint jobs as Clean"
                  >
                    <div className="flex -space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400 ring-1 ring-white"></div>
                    </div>
                    <span className="text-xs font-bold hidden sm:inline">Paint → Clean ({Object.keys(rowSelection).length})</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  const selectedIds = Object.keys(rowSelection);
                  if (selectedIds.length === 1) {
                    setEditingJobId(selectedIds[0]);
                  } else if (selectedIds.length === 0) {
                    setActiveModal({
                      type: 'ALERT',
                      title: 'Selection Required',
                      message: "Please select a job first by clicking the checkbox."
                    });
                  } else {
                    setActiveModal({
                      type: 'ALERT',
                      title: 'Multiple Selection',
                      message: "Please select only ONE job to edit."
                    });
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                title="Edit Selected Job"
              >
                <Edit2 size={14} />
              </button>

              {/* Column Menu */}
              <div className="relative">
                <button
                  ref={columnMenuRef}
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="flex items-center gap-1 bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <ListFilter size={16} className="text-slate-400" />
                  <span className="text-xs font-bold">Columns</span>
                  <ChevronRight size={14} className={`text-slate-400 transition-transform ${showColumnMenu ? 'rotate-90' : ''}`} />
                </button>
                <PortalDropdown
                  isOpen={showColumnMenu}
                  onClose={() => setShowColumnMenu(false)}
                  triggerRef={columnMenuRef}
                  className="bg-white rounded-lg shadow-xl border border-slate-200 p-2 min-w-[200px]"
                >
                  <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase px-1">Visible Columns</div>
                  {table.getAllLeafColumns().map(column => {
                    if (column.id === 'select' || column.id === 'actions') return null;
                    return (
                      <label key={column.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs capitalize">{column.id}</span>
                      </label>
                    );
                  })}
                </PortalDropdown>
              </div>

              {/* Filter Menu */}
              <div className="relative">
                <button
                  ref={filterMenuRef}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`p - 1.5 rounded transition - colors ${showFilterMenu || statusFilters.size > 0 || employeeFilters.size > 0 ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} `}
                  title="Sort & Filter"
                >
                  <ListFilter size={14} />
                </button>
                <PortalDropdown
                  isOpen={showFilterMenu}
                  onClose={() => setShowFilterMenu(false)}
                  triggerRef={filterMenuRef}
                  className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-56 max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500">SORT & FILTER</span>
                    {(statusFilters.size > 0 || employeeFilters.size > 0) && (
                      <button
                        onClick={() => { setStatusFilters(new Set()); setEmployeeFilters(new Set()); }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  {/* Status Filters */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Status</div>
                    {['Pending', 'In Progress', 'Complete', 'Paid', 'Cancel'].map(status => (
                      <label key={status} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={statusFilters.has(status)}
                          onChange={() => {
                            const newSet = new Set(statusFilters);
                            if (newSet.has(status)) newSet.delete(status);
                            else newSet.add(status);
                            setStatusFilters(newSet);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs">{status}</span>
                      </label>
                    ))}
                  </div>
                  {/* Employee Filters */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Tech</div>
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeFilters.has(emp.name)}
                          onChange={() => {
                            const newSet = new Set(employeeFilters);
                            if (newSet.has(emp.name)) newSet.delete(emp.name);
                            else newSet.add(emp.name);
                            setEmployeeFilters(newSet);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs">{emp.name}</span>
                      </label>
                    ))}
                  </div>
                </PortalDropdown>
              </div>

              {/* History Toggle */}
              <div className="relative">
                <button
                  ref={historyButtonRef}
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p - 1.5 rounded transition - colors ${showHistory ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} `}
                  title="Toggle History"
                >
                  <Hourglass size={14} />
                </button>
                <PortalDropdown
                  isOpen={showHistory}
                  onClose={() => setShowHistory(false)}
                  triggerRef={historyButtonRef}
                  className="min-w-[320px]"
                >
                  <JobsHistoryWidget history={localHistory} onUndo={handleUndo} />
                </PortalDropdown>
              </div>

              {/* Show/Hide Hidden */}
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={`p - 1.5 rounded transition - colors ${showHidden ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} `}
                title={showHidden ? "Hide Completed & Sent Jobs" : "Show All (Including Completed & Sent)"}
              >
                {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

            {/* IMPORT & REFRESH */}
            <div className="flex items-center gap-1">

              {/* CLOUD SYNC CONTROLS (URGENT ADDITION) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                <button
                  onClick={async () => {
                    if (confirm("⚠️ UPLOAD LOCAL DATA TO CLOUD?\n\nThis will OVERWRITE any conflicting data in Supabase with your local version.\n\nContinue?")) {
                      await syncPush();
                    }
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  title="Push Local Data to Cloud"
                >
                  <CloudUpload size={14} />
                  <span className="hidden xl:inline">Push to Cloud</span>
                </button>

                <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

                <button
                  onClick={async () => {
                    if (confirm("⚠️ DOWNLOAD FROM CLOUD?\n\nThis will REPLACE your local data with the version from Supabase.\n\nMake sure the Cloud has the latest data before doing this.\n\nContinue?")) {
                      await syncPull();
                    }
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
                  title="Pull Data from Cloud"
                >
                  <CloudDownload size={14} />
                  <span className="hidden xl:inline">Pull</span>
                </button>

                <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

                <button
                  onClick={async () => {
                    if (confirm("🔥 DANGER: RESET CLOUD DATA?\n\nThis will PERMANENTLY DELETE all jobs and employees from Supabase.\n\nYour LOCAL data will be safe, but the Cloud will be empty.\n\nAre you sure?")) {
                      await clearCloudData();
                    }
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Reset Cloud Data (Empty Database)"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Import Button */}
              <label
                className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg cursor - pointer transition - all border ${isImporting
                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 shadow-sm'
                  } `}
                title="Import Jobs (Excel/CSV)"
              >
                <FolderInput size={16} />
                <span className="text-xs font-bold hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  multiple
                  className="hidden"
                  onChange={onFileUpload}
                  disabled={isImporting}
                />
              </label>

              {/* Refresh Button */}
              <button
                onClick={handleLostFoundRefresh}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Refresh & Reset Filters"
              >
                <RotateCcw size={16} />
              </button>

              {/* Clear Visible Button */}
              <button
                onClick={() => {
                  const visibleJobIds = table.getFilteredRowModel().rows.map(r => r.original.id);
                  if (visibleJobIds.length === 0) {
                    alert("No visible jobs to delete.");
                    return;
                  }
                  setActiveModal({
                    type: 'CONFIRM',
                    title: 'Bulk Delete',
                    message: `DANGER: You are about to DELETE ${visibleJobIds.length} VISIBLE JOBS.\n\nThis action cannot be undone.\n\nAre you sure you want to proceed ? `,
                    onConfirm: () => {
                      deleteJobs(visibleJobIds);
                      addLog({
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        type: 'warning',
                        message: `User bulk deleted ${visibleJobIds.length} jobs.`
                      });
                    }
                  });
                }}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Delete All Visible Jobs"
              >
                <Trash2 size={16} />
              </button>
            </div>


          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {viewLayout === 'calendar' ? (
            <CalendarView onJobClick={(jobId) => setEditingJobId(jobId)} />
          ) : viewLayout === 'card' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {table.getRowModel().rows.map(row => (
                  <JobCard
                    key={row.original.id}
                    job={row.original}
                    onEdit={(j) => setEditingJobId(j.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE CARD LIST (< md) */}
              <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {table.getRowModel().rows.map(row => (
                  <JobCard
                    key={`mobile-${row.id}`}
                    job={row.original}
                    onEdit={(j) => setEditingJobId(j.id)}
                  />
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">No jobs found</div>
                )}
              </div>

              {/* DESKTOP TABLE (>= md) */}
              <div className="hidden md:block flex-1 overflow-auto custom-scrollbar relative mx-4 mb-4 rounded-xl shadow-sm border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/95 backdrop-blur md:backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className={`p-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none group hover:bg-slate-100 transition-colors cursor-pointer ${['invoiceStatus', 'invoiceNumber', 'notes', 'invoiceNote'].includes(header.id) ? 'hidden lg:table-cell' : ''}`} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                            {header.isPlaceholder ? null : (
                              <div
                                {...{
                                  className: header.column.getCanSort() ? 'flex items-center gap-1 cursor-pointer' : '',
                                  onClick: header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{
                                  asc: <ArrowUpDown size={12} className="opacity-100" />,
                                  desc: <ArrowUpDown size={12} className="opacity-100 rotate-180" />,
                                }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" /> : null)}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="">
                    {table.getRowModel().rows.map(row => {
                      const job = row.original;
                      // Find assigned employee for color
                      const assignedEmp = employees.find(e => e.name === job.assignedTo);

                      // Row Color Logic
                      let rowBgStyle = {};
                      let rowClass = 'hover:bg-slate-50 transition-colors border-b border-transparent';

                      // 1. GREEN OVERRIDE (Highest Priority)
                      if (job.status === 'Complete' && job.invoiceStatus === 'Sent') {
                        rowClass = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-b border-emerald-100 transition-colors';
                      }
                      // 2. EMPLOYEE COLOR (If not overridden)
                      else if (assignedEmp?.color) {
                        const colorClass = ROW_COLOR_MAP[assignedEmp.color];
                        if (colorClass) {
                          rowClass = `${colorClass} transition-colors border-b`;
                        }
                      }

                      return (
                        <tr
                          key={row.id}
                          className={`group h-14 border-b border-slate-50 transition-colors ${rowClass}`}
                          style={rowBgStyle}
                          onClick={() => row.toggleSelected()}
                        >
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className={`p-3 text-sm py-2 relative ${['invoiceStatus', 'invoiceNumber', 'notes', 'invoiceNote'].includes(cell.column.id) ? 'hidden lg:table-cell' : ''}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

              </div>
            </>
          )}

          {/* FOOTER PAGINATION */}
          <div className="bg-white border-t border-slate-200 p-2 flex justify-between items-center shrink-0 text-[10px] text-slate-500 z-30">
            <span>Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} jobs</span>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-medium">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* MODALS */}
        {editingJobId && <JobEditModal isOpen={true} onClose={() => setEditingJobId(null)} jobId={editingJobId} onOpenExtras={(id) => setExtrasModalJob(jobs.find(j => j.id === id) || null)} />}
        <ExtrasModal isOpen={!!extrasModalJob} onClose={() => setExtrasModalJob(null)} job={extrasModalJob} onSave={handleSaveExtras} />

        <DuplicateResolutionModal
          isOpen={duplicateModalOpen}
          onClose={() => {
            setDuplicateModalOpen(false);
            setPendingDuplicates([]);
            setPendingNonDuplicates([]);
            setPendingDateRange(null);
          }}
          duplicates={pendingDuplicates}
          onResolve={handleDuplicateResolution}
        />

        {/* CUSTOM ALERT / CONFIRM MODAL */}
        {
          activeModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              {/* Backdrop click REMOVED to prevent accidental close */}
              <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full mx-4 border-l-4 border-amber-500 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  {activeModal.type === 'CONFIRM' ? <HelpCircle className="text-amber-500" /> : <AlertTriangle className="text-amber-500" />}
                  {activeModal.title}
                </h3>
                <p className="text-slate-600 mb-6 whitespace-pre-line">{activeModal.message}</p>
                <div className="flex justify-end gap-3">
                  {activeModal.type === 'CONFIRM' && (
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (activeModal.onConfirm) activeModal.onConfirm();
                      setActiveModal(null);
                    }}
                    className={`px - 4 py - 2 rounded font - bold text - white shadow - sm transition - colors ${activeModal.type === 'CONFIRM' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-700'} `}
                  >
                    {activeModal.type === 'CONFIRM' ? 'Yes, Proceed' : 'Understood'}
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default JobsTable;