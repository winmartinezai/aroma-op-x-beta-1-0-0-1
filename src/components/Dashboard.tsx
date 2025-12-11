
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { isWithinRange } from '../utils/dateUtils';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { read, utils } from 'xlsx';
import { TrendingUp, Users, CheckCircle, AlertCircle, DollarSign, Briefcase, Calendar, AlertTriangle, History, CheckSquare, Plus, Trash2, Undo2, Edit3, FilePlus, FileMinus, UploadCloud, Download, RefreshCw, GripVertical, Search } from 'lucide-react';

const Dashboard: React.FC = () => {
    const {
        jobs, employees, tasks, addTask, toggleTask, deleteTask, updateTask, reorderTasks, setTasks,
        apiConfigs, history, undoAction, addLog, focusDateRange,
        setSearchTerm, setJobsViewMode, addJob // Added addJob
    } = useApp();
    const [newTaskText, setNewTaskText] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [previewJobs, setPreviewJobs] = useState<any[]>([]); // Using any to avoid import dance, or inferred from useApp
    const [showPreview, setShowPreview] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const navigate = useNavigate();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (localSearch.trim()) {
            setSearchTerm(localSearch);
            setJobsViewMode('VIEW_ALL');
            navigate('/jobs');
        }
    };

    // Use global date range, or default to current month if undefined (though AppContext now defaults it)
    // If focusDateRange is null (user cleared it), we treat it as "View All"

    // We no longer need local state for dateRange
    // const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(...);
    // --- TASK HANDLERS ---
    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(tasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        reorderTasks(items);
    };

    const handleSync = async () => {
        const googleSheetApi = apiConfigs?.find(api => api.type === 'GOOGLE_SHEET' && api.active);
        if (!googleSheetApi) {
            alert('No active Google Sheet API configured. Please go to Settings > Integrations.');
            return;
        }

        setIsSyncing(true);
        try {
            const response = await fetch(googleSheetApi.url);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = utils.sheet_to_json(worksheet);

            // Assuming column 'Task' exists
            const newTasks = jsonData.map((row: any) => ({
                id: String(Date.now() + Math.random()),
                text: row['Task'] || row['task'] || 'Untitled Task',
                completed: row['Status'] === 'Done' || row['Completed'] === 'TRUE',
                createdAt: Date.now()
            }));

            if (newTasks.length > 0) {
                setTasks([...tasks, ...newTasks]);
                addLog({
                    id: String(Date.now()),
                    timestamp: new Date().toISOString(),
                    type: 'success',
                    message: `Synced ${newTasks.length} tasks from Google Sheet`
                });
            }
        } catch (error) {
            console.error("Sync failed", error);
            alert('Sync failed. Check console for details.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportTasks = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "tasks_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedTasks = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedTasks)) {
                    setTasks([...tasks, ...importedTasks]);
                }
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    // Filter Jobs based on Range (For Top Cards)
    const filteredJobs = useMemo(() => {
        // If focusDateRange is null, it means "View All", so no date filtering
        if (!focusDateRange) {
            return jobs;
        }
        return jobs.filter(job => isWithinRange(job.date, focusDateRange.start, focusDateRange.end));
    }, [jobs, employees, focusDateRange]);

    // Calculate KPIs for Selected Range
    const stats = useMemo(() => {
        const revenue = filteredJobs.reduce((sum, job) => sum + (job.clientPrice || 0) + (job.extrasPrice || 0), 0);
        const payroll = filteredJobs.reduce((sum, job) => sum + (job.employeePrice || 0), 0);
        const margin = revenue - payroll;
        const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

        // KPI: Unbilled Revenue (The most important metric for cashflow)
        const unbilledJobs = filteredJobs.filter(j =>
            j.status === 'Complete' && j.invoiceStatus !== 'Sent'
        );
        const unbilledAmount = unbilledJobs.reduce((sum, job) => sum + (job.clientPrice || 0) + (job.extrasPrice || 0), 0);

        return {
            revenue,
            payroll,
            margin,
            marginPercent,
            total: filteredJobs.length,
            unbilledAmount,
            unbilledCount: unbilledJobs.length
        };
    }, [filteredJobs]);

    // Intelligent Calculation of ALL Months (History)
    const monthlyHistory = useMemo(() => {
        const history: Record<string, {
            dateObj: Date,
            revenue: number,
            payroll: number,
            count: number,
            unbilled: number
        }> = {};

        jobs.forEach(job => {
            if (!job.date) return;
            // Create Key: YYYY-MM
            const d = new Date(job.date);
            if (isNaN(d.getTime())) return;

            // Check if within range (if range exists)
            // If focusDateRange is set, we might want to restrict history? 
            // Usually history charts show ALL time, but let's respect the filter if needed.
            // Actually, for the "Revenue Trend" chart, we usually want to show context.
            // But let's stick to the requested behavior: Sync everything.
            if (focusDateRange) {
                if (!isWithinRange(job.date, focusDateRange.start, focusDateRange.end)) return;
            }

            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            if (!history[key]) {
                history[key] = {
                    dateObj: new Date(d.getFullYear(), d.getMonth(), 1),
                    revenue: 0,
                    payroll: 0,
                    count: 0,
                    unbilled: 0
                };
            }

            history[key].revenue += (job.clientPrice || 0) + (job.extrasPrice || 0);
            history[key].payroll += (job.employeePrice || 0);
            history[key].count += 1;

            if (job.status === 'Complete' && job.invoiceStatus !== 'Sent') {
                history[key].unbilled += (job.clientPrice || 0) + (job.extrasPrice || 0);
            }
        });

        return Object.values(history).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }, [jobs, focusDateRange]);



    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        addTask(newTaskText);
        setNewTaskText('');
    };

    // Helper to format time relative
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'CREATE': return <FilePlus size={16} className="text-blue-500" />;
            case 'UPDATE': return <Edit3 size={16} className="text-amber-500" />;
            case 'DELETE': return <FileMinus size={16} className="text-red-500" />;
            case 'IMPORT': return <UploadCloud size={16} className="text-emerald-500" />;
            default: return <History size={16} className="text-slate-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 overflow-y-auto custom-scrollbar pb-10">

            {/* Top Toolbar */}
            <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4 gap-4 relative z-50">
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                        <div className="relative group">
                            <input
                                type="text"
                                value={localSearch}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalSearch(val);
                                    if (val.trim()) {
                                        const lower = val.toLowerCase();
                                        const matches = jobs.filter(j =>
                                            (j.jobNumber && String(j.jobNumber).includes(lower)) ||
                                            j.property.toLowerCase().includes(lower) ||
                                            j.apt.toLowerCase().includes(lower) ||
                                            j.id.toLowerCase().includes(lower)
                                        ).slice(0, 5); // Limit to top 5
                                        setPreviewJobs(matches);
                                        setShowPreview(true);
                                    } else {
                                        setShowPreview(false);
                                    }
                                }}
                                onBlur={() => setTimeout(() => setShowPreview(false), 200)} // Delay to allow click
                                onFocus={() => localSearch.trim() && setShowPreview(true)}
                                placeholder="🔍 Quick Search..."
                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-sm shadow-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-slate-400 group-focus-within:text-blue-500" size={14} />
                            </div>
                        </div>

                        {/* LIVE PREVIEW DROPDOWN */}
                        {showPreview && previewJobs.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Top Matches
                                </div>
                                {previewJobs.map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => {
                                            setSearchTerm(job.jobNumber ? String(job.jobNumber) : job.property);
                                            setJobsViewMode('VIEW_ALL');
                                            navigate('/jobs');
                                        }}
                                        className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-500">#{job.jobNumber || '???'}</span>
                                                <h4 className="font-bold text-sm text-slate-800">{job.property} <span className="font-normal text-slate-600">Unit {job.apt}</span></h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-400">{job.type}</span>
                                                <span className="text-[10px] text-slate-300">•</span>
                                                <span className="text-xs text-slate-400">{job.date}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {/* Status Pill */}
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block
                                                ${job.status === 'Complete' ? 'bg-emerald-100 text-emerald-700' :
                                                    job.status === 'Pending' ? 'bg-slate-100 text-slate-600' :
                                                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'}`}>
                                                {job.status}
                                            </div>
                                            {/* Invoice Status */}
                                            {job.status === 'Complete' && (
                                                <div className={`text-[10px] font-medium flex items-center justify-end gap-1
                                                    ${job.invoiceStatus === 'Sent' ? 'text-blue-600' :
                                                        job.invoiceStatus === 'Draft' ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {job.invoiceStatus === 'Sent' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                    {job.invoiceStatus === 'Sent' ? 'Invoiced' : job.invoiceStatus === 'Draft' ? 'Draft' : 'Unbilled'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex gap-4 items-stretch h-[140px]">
                    {/* Dial Removed - Using Global */}

                    {/* KPI Cards (Filtered by Date Header) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 w-full">

                        {/* Card 1: Revenue */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={48} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.revenue)}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                <TrendingUp size={12} />
                                <span>{stats.total} jobs selected</span>
                            </div>
                        </div>

                        {/* Card 2: Unbilled Revenue */}
                        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group transition-all ${stats.unbilledAmount > 0
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-white border-slate-200'
                            }`}>
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertTriangle size={48} className={stats.unbilledAmount > 0 ? "text-orange-600" : "text-emerald-600"} />
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${stats.unbilledAmount > 0 ? 'text-orange-700' : 'text-slate-400'}`}>
                                    {stats.unbilledAmount > 0 ? 'Action: Ready to Bill' : 'All Clear'}
                                </p>
                                <h3 className={`text-2xl font-bold mt-1 ${stats.unbilledAmount > 0 ? 'text-orange-700' : 'text-slate-800'}`}>
                                    {formatCurrency(stats.unbilledAmount)}
                                </h3>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium">
                                {stats.unbilledAmount > 0 ? (
                                    <span className="text-orange-800 bg-orange-100 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {stats.unbilledCount} invoices pending
                                    </span>
                                ) : (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        Up to date!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Card 3: Margin */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Briefcase size={48} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Margin</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.margin)}</h3>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-1 rounded-full ${stats.marginPercent > 40 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                                <span>{stats.marginPercent.toFixed(1)}% Margin</span>
                            </div>
                        </div>

                        {/* Card 4: Payroll Estimate */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users size={48} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Payroll</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.payroll)}</h3>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                                Labor Cost
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Charts, Tasks & Activity */}
            <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 min-h-[300px]">

                {/* Left Col: Recurring Contracts (NEW) */}
                <div className="bg-white p-0 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <RefreshCw size={18} className="text-purple-500" />
                            Recurring Contracts
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                            {new Date().toLocaleString('default', { month: 'long' })}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
                        <div className="divide-y divide-slate-50">
                            {[
                                { id: 'c1', name: 'Altis Common Areas', amount: 2000, property: 'Altis Grand Central' },
                                { id: 'c2', name: 'Sur Club Cleaning', amount: 1500, property: 'Sur Club' },
                                { id: 'c3', name: 'Main Office Janitorial', amount: 800, property: 'HQ Office' }
                            ].map(contract => {
                                // Check if generated this month
                                const isGenerated = jobs.some(j =>
                                    j.property === contract.property &&
                                    j.type === 'Recurring Contract' &&
                                    j.clientPrice === contract.amount &&
                                    new Date(j.date).getMonth() === new Date().getMonth() &&
                                    new Date(j.date).getFullYear() === new Date().getFullYear()
                                );

                                return (
                                    <div key={contract.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-sm">{contract.name}</h5>
                                            <p className="text-xs text-slate-500">{contract.property} • {formatCurrency(contract.amount)}</p>
                                        </div>

                                        {isGenerated ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                                <CheckCircle size={12} /> Generated
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    // Generate Job using existing addJob from props/context
                                                    const dateStr = new Date().toISOString().split('T')[0];

                                                    // @ts-ignore -- type definition mismatch in addJob usually expects Omit<Job, 'id' | 'jobNumber'>
                                                    // We defined addJob in AppContext to take partial or omit.
                                                    // Assuming addJob handles the ID creation.

                                                    // Create job without ID/JobNumber
                                                    const jobData = {
                                                        property: contract.property,
                                                        apt: 'Common',
                                                        size: 'N/A',
                                                        type: 'Recurring Contract',
                                                        date: dateStr,
                                                        status: 'Complete',
                                                        clientPrice: contract.amount,
                                                        employeePrice: 0,
                                                        invoiceStatus: 'Draft',
                                                        description: contract.name // If description field calls for it
                                                    };

                                                    // @ts-ignore
                                                    addJob(jobData);

                                                    addLog({
                                                        id: Date.now().toString(),
                                                        timestamp: new Date().toISOString(),
                                                        type: 'success',
                                                        message: `Generated Recurring Contract: ${contract.name}`
                                                    });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                                            >
                                                Generate
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="p-8 text-center">
                                <p className="text-xs text-slate-400 italic">Manage contracts in Settings</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Col: Tasks Widget (Moved from Left) */}
                <div className="bg-white p-0 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <CheckSquare size={18} className="text-blue-500" />
                            Task Manager
                        </h4>
                        <div className="flex items-center gap-1">
                            <button onClick={handleSync} disabled={isSyncing} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sync with Google Sheet">
                                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                            </button>
                            <button onClick={handleExportTasks} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Export JSON">
                                <Download size={14} />
                            </button>
                            <label className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer" title="Import JSON">
                                <UploadCloud size={14} />
                                <input type="file" className="hidden" accept=".json" onChange={handleImportTasks} />
                            </label>
                        </div>
                    </div>

                    {/* Task Input */}
                    <form onSubmit={handleAddTask} className="p-3 border-b border-slate-100 flex gap-2 bg-white z-10">
                        <input
                            className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Add a new task..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus size={18} />
                        </button>
                    </form>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-50/30">
                        {tasks.length === 0 ? (
                            <div className="text-center text-slate-400 p-8 italic text-sm">No pending tasks</div>
                        ) : (
                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="tasks">
                                    {(provided: any) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="divide-y divide-slate-100"
                                        >
                                            {tasks.map((task, index) => (
                                                <Draggable draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`flex items-center gap-3 p-3 group transition-colors ${snapshot.isDragging ? 'bg-white shadow-lg ring-1 ring-blue-100 z-50' : 'hover:bg-white'}`}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <div {...provided.dragHandleProps} className="text-slate-300 cursor-grab hover:text-slate-500">
                                                                <GripVertical size={14} />
                                                            </div>
                                                            <button
                                                                onClick={() => toggleTask(task.id)}
                                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-blue-400 bg-white'}`}
                                                            >
                                                                {task.completed && <CheckSquare size={12} />}
                                                            </button>
                                                            <input
                                                                className={`flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                                value={task.text}
                                                                onChange={(e) => updateTask(task.id, e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => deleteTask(task.id)}
                                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>
                </div>

                {/* Center/Right Col: ACTION HISTORY (Recent Activity) */}
                <div className="bg-white p-0 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden lg:col-span-2">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <History size={18} className="text-slate-400" />
                            Action History (Undo)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">Last 20 Steps</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 max-h-[300px]">
                        {history.length === 0 ? (
                            <div className="text-center text-slate-400 p-8 italic text-sm">
                                No recent actions recorded.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {history.map(action => (
                                    <div key={action.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 group transition-colors">
                                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                                            {getActionIcon(action.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="text-slate-400" size={16} />
                                                <span className="text-sm font-medium text-slate-600">
                                                    {focusDateRange
                                                        ? `${focusDateRange.start.toLocaleDateString()} - ${focusDateRange.end.toLocaleDateString()}`
                                                        : 'All Time'}
                                                </span>
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700 truncate">{action.description}</p>
                                            <p className="text-xs text-slate-400 font-mono">
                                                {formatTime(action.timestamp)} • {action.type}
                                            </p>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => undoAction(action.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm"
                                                title="Revert this change"
                                            >
                                                <Undo2 size={12} />
                                                Undo
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* NEW SECTION: Monthly Financial History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <History size={18} className="text-blue-500" />
                        Monthly Financial History
                    </h4>
                    <span className="text-xs text-slate-400 font-medium uppercase">All Time Records</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Month</th>
                                <th className="px-6 py-3 font-semibold text-center">Jobs</th>
                                <th className="px-6 py-3 font-semibold text-right">Revenue</th>
                                <th className="px-6 py-3 font-semibold text-right">Payroll</th>
                                <th className="px-6 py-3 font-semibold text-right">Net Margin</th>
                                <th className="px-6 py-3 font-semibold text-right">Margin %</th>
                                <th className="px-6 py-3 font-semibold text-right text-orange-600">Unbilled</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {monthlyHistory.map((m, idx) => {
                                const margin = m.revenue - m.payroll;
                                const marginPct = m.revenue > 0 ? (margin / m.revenue) * 100 : 0;

                                // Check if this row is the current selected month (rough check)
                                const isCurrent = focusDateRange
                                    ? isWithinRange(m.dateObj.toISOString().split('T')[0], focusDateRange.start, focusDateRange.end)
                                    : false;

                                return (
                                    <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-3 font-bold text-slate-700">
                                            {m.dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            {isCurrent && <span className="ml-2 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Viewing</span>}
                                        </td>
                                        <td className="px-6 py-3 text-center text-slate-600">{m.count}</td>
                                        <td className="px-6 py-3 text-right font-medium text-slate-800">{formatCurrency(m.revenue)}</td>
                                        <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(m.payroll)}</td>
                                        <td className="px-6 py-3 text-right font-medium text-emerald-600">{formatCurrency(margin)}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">{marginPct.toFixed(1)}%</td>
                                        <td className="px-6 py-3 text-right font-medium">
                                            {m.unbilled > 0 ? (
                                                <span className="text-orange-600">{formatCurrency(m.unbilled)}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {monthlyHistory.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                                        No historical data available. Import jobs to see analytics.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
