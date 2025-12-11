import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import EmployeeCard from './EmployeeCard';
import PinModal from './PinModal';
import AddEmployeeModal from './AddEmployeeModal';
import EmployeePricingModal from './EmployeePricingModal';
import SignatureModal from './SignatureModal';
import ExtrasModal from './ExtrasModal';
import { Clock, Users, Settings, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

const EmployeesView: React.FC = () => {
    const { jobs, employees, dateViewUnit, setDateViewUnit, focusDateRange, setFocusDateRange, updateJob, settings, updateSettings } = useApp();

    // UI State
    const [isPinOpen, setIsPinOpen] = useState(false);
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Simple inline settings toggle
    const [selectedEmployeeForSignature, setSelectedEmployeeForSignature] = useState<any>(null);
    const [isSignatureOpen, setIsSignatureOpen] = useState(false);
    const [extrasModalJob, setExtrasModalJob] = useState<any>(null);
    const [editingEmployee, setEditingEmployee] = useState<any>(null); // NEW: For Editing Profile

    // Auth State
    const [idsToProcess, setIdsToProcess] = useState<string[]>([]);
    const [pendingActionTitle, setPendingActionTitle] = useState('');

    // View State
    const [viewMode, setViewMode] = useState<'week' | 'payPeriod'>('week');

    // Force "Week" view when entering this module
    useEffect(() => {
        // Only set default if not already set to something valid for this view
        if (dateViewUnit !== 'week' && dateViewUnit !== 'biweek') {
            setDateViewUnit('week');
        }

        if (!focusDateRange) {
            const now = new Date();
            setFocusDateRange({ start: getStartOfWeek(now), end: getEndOfWeek(now) });
        }
    }, []); // Run once on mount

    // SYNC: Listen to global dateViewUnit changes (e.g. from Dial)
    useEffect(() => {
        if (dateViewUnit === 'biweek') {
            setViewMode('payPeriod');
        } else if (dateViewUnit === 'week') {
            setViewMode('week');
        }
    }, [dateViewUnit]);

    // Handle View Mode Toggle
    const toggleViewMode = (mode: 'week' | 'payPeriod') => {
        setViewMode(mode);
        const refDate = focusDateRange ? focusDateRange.start : new Date();

        if (mode === 'week') {
            setDateViewUnit('week');
            setFocusDateRange({ start: getStartOfWeek(refDate), end: getEndOfWeek(refDate) });
        } else {
            // Switch to Pay Period (2 Weeks)
            // We'll treat the current "week" as the END of the pay period for visualization, 
            // or just show the 2 weeks surrounding the date.
            // Let's use the utility to get a standard 2-week block.
            // For flexibility, let's just show [Start of Week] to [End of Next Week] (14 days)
            // OR use the getPayrollPeriod logic if it aligns with user expectation.
            // User said "pay term the two weeks".

            // Simple 2-week logic starting from current week start
            const start = getStartOfWeek(refDate);
            const end = new Date(start);
            end.setDate(end.getDate() + 13); // 14 days total
            end.setHours(23, 59, 59, 999);

            // We need to tell DateHeader to support custom range or 'month' view? 
            // DateHeader supports 'week' (7 days). For 14 days, we might need a custom handling 
            // or just set the range and let DateHeader display it (it handles custom ranges).
            // However, DateHeader navigation jumps by 'viewUnit'. 
            // If we want 2-week jumps, we might need a new unit in DateHeader or just accept 1-week jumps.

            setDateViewUnit('biweek'); // Keep navigation as weeks for granular control
            setFocusDateRange({ start, end });
        }
    };

    const timestamp = useMemo(() => new Date().toLocaleString(), []);

    // Reference Date
    const referenceDate = focusDateRange ? focusDateRange.start : new Date();

    const handleUpdateJob = (jobId: string, updates: any) => {
        updateJob(jobId, updates);
    };

    const handleRequestPayroll = (jobIds: string[], employeeName: string) => {
        if (jobIds.length === 0) return;
        setIdsToProcess(jobIds);
        setPendingActionTitle(`Authorize Payroll: ${employeeName}`);
        setIsPinOpen(true);
    };

    const handlePinSuccess = () => {
        // Mark all pending jobs as Paid
        idsToProcess.forEach(id => {
            updateJob(id, { status: 'Paid' }); // Removed payrollStatus as it's not in Job interface
        });
        setIdsToProcess([]);
        setIsPinOpen(false);
    };

    /* const handleOpenSignature = (employee: any) => {
        setSelectedEmployeeForSignature(employee);
        setIsSignatureOpen(true);
    }; */

    const handleInvoiceSubmit = (name: string, email: string) => {
        if (!selectedEmployeeForSignature) return;

        const empName = selectedEmployeeForSignature.name;
        const recipient = settings.employeeInvoiceEmail || 'aromacleaning22@gmail.com';

        // Filter jobs for this employee in the current view range
        const startDate = focusDateRange ? focusDateRange.start : getStartOfWeek(new Date());
        const endDate = focusDateRange ? focusDateRange.end : getEndOfWeek(new Date());

        const invoiceJobs = jobs.filter(j => {
            if (j.assignedTo !== empName) return false;
            const d = new Date(j.date);
            return d >= startDate && d <= endDate;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const totalAmount = invoiceJobs.reduce((sum, j) => sum + (j.employeePrice || 0), 0);
        const totalExtras = invoiceJobs.reduce((sum, j) => sum + (j.extrasPrice || 0), 0);
        const grandTotal = totalAmount + totalExtras;

        const subject = `INVOICE: ${empName} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;

        let body = `INVOICE SUBMISSION\n`;
        body += `--------------------------------------------------\n`;
        body += `Contractor: ${empName}\n`;
        body += `Submitted By: ${name} (${email})\n`;
        body += `Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`;
        body += `Generated: ${new Date().toLocaleString()}\n`;
        body += `--------------------------------------------------\n\n`;

        body += `JOB DETAILS:\n`;
        if (invoiceJobs.length === 0) {
            body += `No jobs found for this period.\n`;
        } else {
            invoiceJobs.forEach(j => {
                const dateStr = new Date(j.date).toLocaleDateString();
                const jobAddress = `${j.property} ${j.apt}`;
                const jobNum = j.jobNumber ? `#${j.jobNumber}` : '(Pending #)';

                // Optimized 3-line layout per job for readability on mobile/desktop
                body += `--------------------------------------------------\n`;
                body += `JOB ${jobNum}  |  ${dateStr}\n`;
                body += `${jobAddress.toUpperCase()}  (${j.type} - ${j.size})\n`;

                let lineTotal = j.employeePrice || 0;

                if (j.extras) {
                    body += `Extras: ${j.extras} ($${j.extrasPrice})\n`;
                    lineTotal += (j.extrasPrice || 0);
                }

                body += `PAY: $${lineTotal.toFixed(2)}\n`;
            });
        }

        body += `--------------------------------------------------\n`;
        body += `\nSUMMARY REPORT:\n`;
        body += `Total Jobs: ${invoiceJobs.length}\n`;
        body += `Base Pay:   $${totalAmount.toFixed(2)}\n`;
        body += `Extras:     $${totalExtras.toFixed(2)}\n`;
        body += `======================\n`;
        body += `TOTAL DUE:  $${grandTotal.toFixed(2)}\n`;
        body += `======================\n`;
        body += `\nFor services rendered. Please process payment.\n`;

        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        alert(`Invoice for $${grandTotal.toFixed(2)} generated!\nOpening email client...`);
    };

    const handleSaveExtras = (jobId: string, summary: string, total: number) => {
        updateJob(jobId, { extras: summary, extrasPrice: total });
        setExtrasModalJob(null);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <PinModal
                isOpen={isPinOpen}
                onClose={() => setIsPinOpen(false)}
                onSuccess={handlePinSuccess}
                title={pendingActionTitle || "Authorize Action"}
            />

            <AddEmployeeModal
                isOpen={isAddEmployeeOpen}
                onClose={() => { setIsAddEmployeeOpen(false); setEditingEmployee(null); }}
                employee={editingEmployee}
            />

            <EmployeePricingModal
                isOpen={!!editingPricingId}
                onClose={() => setEditingPricingId(null)}
                employeeId={editingPricingId}
            />

            <SignatureModal
                isOpen={isSignatureOpen}
                onClose={() => setIsSignatureOpen(false)}
                onSign={handleInvoiceSubmit}
            />

            <ExtrasModal
                isOpen={!!extrasModalJob}
                onClose={() => setExtrasModalJob(null)}
                job={extrasModalJob}
                onSave={handleSaveExtras}
            />

            {/* Header */}
            <div className="p-6 pb-2 shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-slate-400" />
                        Team Directory
                    </h2>
                    <p className="text-slate-500">Manage schedules & payroll estimates</p>
                </div>

                {/* View Toggles */}
                <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
                    <button
                        onClick={() => toggleViewMode('week')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => toggleViewMode('payPeriod')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'payPeriod' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pay Period (2w)
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {isSettingsOpen && (
                        <div className="flex items-center gap-2 mr-2 animate-in slide-in-from-right duration-200">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer" onClick={() => updateSettings({ showAdvancedCheck: !settings.showAdvancedCheck })}>
                                <span className={`text-xs font-bold ${settings.showAdvancedCheck ? 'text-blue-600' : 'text-slate-400'}`}>Advanced Check</span>
                                {settings.showAdvancedCheck ? <ToggleRight size={18} className="text-blue-600" /> : <ToggleLeft size={18} className="text-slate-300" />}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shadow-sm text-xs font-mono">
                        <Clock size={14} />
                        <span>Updated: {timestamp}</span>
                    </div>

                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        {isSettingsOpen ? <X size={20} /> : <Settings size={20} />}
                    </button>
                </div>
            </div>

            {/* Top Toolbar */}
            <div className="px-6 pb-4 shrink-0">
                {/* Dial Moved Global */}
            </div>

            {/* Employee Cards Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {employees.map(emp => (
                        <EmployeeCard
                            key={emp.id}
                            employee={emp}
                            jobs={jobs}
                            onOpenSignature={() => {
                                setSelectedEmployeeForSignature(emp);
                                setIsSignatureOpen(true);
                            }}
                            onOpenExtras={(job) => {
                                setExtrasModalJob(job);
                            }} currentDate={referenceDate}
                            currentRange={focusDateRange}
                            viewMode={viewMode}
                            onUpdateJob={handleUpdateJob}
                            onProcessPayroll={(ids) => handleRequestPayroll(ids, emp.name)}
                            onOpenPricing={() => setEditingPricingId(emp.id)}
                            onOpenEdit={() => {
                                setEditingEmployee(emp);
                                setIsAddEmployeeOpen(true);
                            }}
                        />
                    ))}

                    {/* Ghost Card for "Add New" */}
                    <button
                        onClick={() => setIsAddEmployeeOpen(true)}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all group h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center border border-slate-200 transition-colors">
                            <span className="text-2xl font-light">+</span>
                        </div>
                        <span className="font-medium">Add New Employee</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeesView;
