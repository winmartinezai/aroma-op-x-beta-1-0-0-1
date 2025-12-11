import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { getPayrollPeriod, isWithinRange, getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';
import { ChevronDown, ChevronUp, DollarSign, Calendar, Clock, Plus, Lock, Send, Settings } from 'lucide-react';
import EmployeeBadge from './EmployeeBadge';

interface EmployeeCardProps {
    employee: { id: string, name: string, color?: string };
    jobs: any[];
    currentDate: Date;
    currentRange?: { start: Date, end: Date } | null;
    viewMode?: 'week' | 'payPeriod';
    onUpdateJob: (id: string, data: any) => void;
    onProcessPayroll: (jobIds: string[]) => void;
    onOpenPricing: () => void;
    onOpenSignature: () => void;
    onOpenExtras: (job: any) => void;
    onOpenEdit: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, jobs, currentDate, currentRange, viewMode = 'week', onUpdateJob, onProcessPayroll, onOpenPricing, onOpenSignature, onOpenExtras, onOpenEdit }) => {
    const { settings } = useApp();
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingJobId, setEditingJobId] = useState<string | null>(null);
    const [extrasInput, setExtrasInput] = useState('');
    const [extrasPriceInput, setExtrasPriceInput] = useState('');

    // 0. Filter by Employee First
    const employeeJobs = useMemo(() => {
        return jobs.filter(j => j.assignedTo === employee.name);
    }, [jobs, employee.name]);

    // 1. Current Week / Period Data (Active Schedule)
    const currentWeekStart = currentRange ? currentRange.start : getStartOfWeek(currentDate);
    const currentWeekEnd = currentRange ? currentRange.end : getEndOfWeek(currentDate);

    const currentWeekJobs = useMemo(() => {
        return employeeJobs.filter(job => isWithinRange(job.date, currentWeekStart, currentWeekEnd));
    }, [employeeJobs, currentWeekStart, currentWeekEnd]); // Show ALL jobs for current schedule, paid or not

    const currentWeekRevenue = currentWeekJobs.reduce((sum, j) => sum + (j.employeePrice || 0) + (j.extrasPrice || 0), 0);

    // 2. Payroll Data (Lagged & UNPAID Only)
    const payPeriod = useMemo(() => {
        if (viewMode === 'payPeriod' && currentRange) {
            return currentRange;
        }
        return getPayrollPeriod(currentDate);
    }, [currentDate, currentRange, viewMode]);

    // Filter by date AND pending status
    const payPeriodJobs = useMemo(() => {
        return employeeJobs.filter(job =>
            isWithinRange(job.date, payPeriod.start, payPeriod.end) &&
            job.payrollStatus !== 'Paid' // Only show unpaid jobs in the "Check"
        );
    }, [employeeJobs, payPeriod]);

    const payCheckAmount = payPeriodJobs.reduce((sum, j) => sum + (j.employeePrice || 0) + (j.extrasPrice || 0), 0);
    const payCheckJobIds = payPeriodJobs.map(j => j.id);

    // Handlers
    const startEdit = (job: any) => {
        setEditingJobId(job.id);
        setExtrasInput('');
        setExtrasPriceInput('');
    };

    const saveEdit = (job: any) => {
        if (!extrasInput) {
            setEditingJobId(null);
            return;
        }

        const price = parseFloat(extrasPriceInput) || 0;

        // SYNC LOGIC: Update Extras AND Invoice Note
        const newExtrasString = job.extras ? `${job.extras}, ${extrasInput} ($${price})` : `${extrasInput} ($${price})`;
        const newInvoiceNote = job.invoiceNote ? `${job.invoiceNote}, + ${extrasInput}` : `${job.type} - ${job.size}, + ${extrasInput}`;

        onUpdateJob(job.id, {
            extras: newExtrasString,
            extrasPrice: (job.extrasPrice || 0) + price,
            invoiceNote: newInvoiceNote
        });

        setEditingJobId(null);
    };

    const handleProcess = () => {
        if (payCheckJobIds.length > 0) {
            onProcessPayroll(payCheckJobIds);
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200 hover:border-blue-300'}`}>

            {/* CARD HEADER */}
            <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <EmployeeBadge name={employee.name} color={employee.color} size="md" />
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 truncate">{employee.name}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={onOpenPricing} className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5">
                                    <DollarSign size={10} /> Configure Pay
                                </button>
                                <span className="text-slate-300">|</span>
                                <button onClick={onOpenEdit} className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline flex items-center gap-0.5">
                                    <Settings size={10} /> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Current Week */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Calendar size={12} className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase text-slate-400">{viewMode === 'payPeriod' ? 'Selected Period' : 'Live Schedule'}</span>
                        </div>
                        <div className="text-lg font-bold text-slate-700">{formatCurrency(currentWeekRevenue)}</div>
                        <div className="text-xs text-slate-400">{currentWeekJobs.length} Jobs</div>
                    </div>

                    {/* Paycheck */}
                    <div className={`p-3 rounded-lg border transition-colors ${payCheckAmount > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <DollarSign size={12} className={payCheckAmount > 0 ? "text-emerald-600" : "text-slate-400"} />
                            <span className={`text-[10px] font-bold uppercase ${payCheckAmount > 0 ? "text-emerald-600/70" : "text-slate-400"}`}>{viewMode === 'payPeriod' ? 'Period Pay' : 'Current Paycheck'}</span>
                        </div>
                        <div className={`text-lg font-bold ${payCheckAmount > 0 ? "text-emerald-700" : "text-slate-600"}`}>{formatCurrency(payCheckAmount)}</div>

                        {payCheckAmount > 0 && settings.showAdvancedCheck && (
                            <button
                                onClick={handleProcess}
                                className="mt-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white w-full py-1 rounded flex items-center justify-center gap-1 shadow-sm transition-colors"
                            >
                                <Lock size={10} /> Dump / Pay
                            </button>
                        )}

                        {payCheckAmount > 0 && !settings.showAdvancedCheck && (
                            <button
                                onClick={onOpenSignature}
                                className="mt-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white w-full py-1 rounded flex items-center justify-center gap-1 shadow-sm transition-colors"
                            >
                                <Send size={10} /> Submit Invoice
                            </button>
                        )}
                    </div>
                </div>

                {/* W2 TIME RECORDS PLACEHOLDER */}
                {employee.name.includes("W2") && (
                    <div className="mt-2 p-2 bg-slate-100 rounded text-center text-xs text-slate-500">
                        <Clock size={12} className="inline mr-1" /> Time Records Active
                    </div>
                )}
            </div>

            {/* Expandable Details */}
            <div className="border-t border-slate-100 flex-1 flex flex-col">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full py-2 flex items-center justify-center gap-1 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shrink-0"
                >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Hide Details' : 'Show Breakdown'}
                </button>

                {isExpanded && (
                    <div className="bg-slate-50/50 p-0 text-sm border-t border-slate-100 flex-1 overflow-y-auto max-h-[300px]">

                        {/* PAYROLL JOBS LIST */}
                        <div className="p-4 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase">Unpaid Jobs (Review)</h4>

                            {payPeriodJobs.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-2">No pending jobs in this cycle.</p>
                            ) : (
                                <div className="space-y-2">
                                    {payPeriodJobs.map(job => (
                                        <div key={job.id} className="bg-white border boundary-slate-200 rounded-lg p-3 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-slate-700">{job.type} - {job.size}</span>
                                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Unit: {job.apt}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">{formatDate(job.date)} • {job.property}</div>
                                                </div>
                                                <div className="font-mono text-xs font-bold text-emerald-600">{formatCurrency(job.employeePrice)}</div>
                                            </div>

                                            {/* Extras / Edit Section */}
                                            {editingJobId === job.id ? (
                                                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100 animate-in fade-in zoom-in duration-200">
                                                    <p className="text-[10px] font-bold text-blue-600 mb-1">Add Extra & Update Invoice</p>
                                                    <button
                                                        onClick={() => onOpenExtras(job)}
                                                        className="w-full mb-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                                                    >
                                                        <Settings size={10} /> Open Extras Manager
                                                    </button>
                                                    <input
                                                        className="w-full text-xs p-1 border rounded mb-1"
                                                        placeholder="Desc (e.g. Garbage)"
                                                        value={extrasInput}
                                                        onChange={e => setExtrasInput(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1">
                                                        <input
                                                            className="w-20 text-xs p-1 border rounded"
                                                            placeholder="$ Price"
                                                            type="number"
                                                            value={extrasPriceInput}
                                                            onChange={e => setExtrasPriceInput(e.target.value)}
                                                        />
                                                        <button onClick={() => saveEdit(job)} className="bg-blue-600 text-white text-xs px-2 rounded hover:bg-blue-700">Save</button>
                                                        <button onClick={() => setEditingJobId(null)} className="text-slate-400 text-xs px-2 hover:text-slate-600">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-50">
                                                    <div className="text-[10px] text-slate-500 w-full space-y-1">
                                                        {job.extras && (
                                                            <div className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-1 rounded">
                                                                <span className="font-bold block text-[9px] uppercase opacity-70">Extras</span>
                                                                {job.extras}
                                                            </div>
                                                        )}
                                                        {job.notes && (
                                                            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                <span className="font-bold block text-[9px] uppercase opacity-70">Notes</span>
                                                                {job.notes}
                                                            </div>
                                                        )}
                                                        {!job.extras && !job.notes && <span className="text-slate-300 italic">No details</span>}
                                                    </div>
                                                    <button onClick={() => startEdit(job)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1">
                                                        <Plus size={10} /> Add Extra
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeCard;
