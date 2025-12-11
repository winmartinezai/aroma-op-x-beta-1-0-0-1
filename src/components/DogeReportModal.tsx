import React, { useEffect, useState } from 'react';
import { X, Trophy, AlertTriangle, CheckCircle, TrendingUp, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Job, Task } from '../types/types';

interface DogeReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DogeReportModal: React.FC<DogeReportModalProps> = ({ isOpen, onClose }) => {
    const { jobs, tasks, settings } = useApp();
    const [stats, setStats] = useState({
        completedJobs: 0,
        totalJobs: 0,
        sentInvoices: 0,
        completedTasks: 0,
        totalTasks: 0,
        efficiency: 0,
        rating: '',
        color: '',
        quote: ''
    });

    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        // ... existing effect code ...
    }, [isOpen, jobs, tasks, isDemo]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #6366f1 0%, transparent 50%)' }} />

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 relative z-10">
                    <div>
                        {settings.logoUrl && (
                            <div className="mb-2">
                                <img src={settings.logoUrl} alt="Company Logo" className="h-8 w-auto object-contain" />
                            </div>
                        )}
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <TrendingUp className="text-indigo-400" />
                            D.O.G.E. Report
                        </h2>
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">
                            Daily Operational Efficiency
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center relative z-10">

                    {/* Score Gauge */}
                    <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                        {/* Circular Progress Background */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-slate-800"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * stats.efficiency) / 100}
                                className={`${stats.color} transition-all duration-1000 ease-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className={`text-4xl font-black ${stats.color}`}>
                                {stats.efficiency}%
                            </span>
                        </div>
                    </div>

                    {/* Rating Badge */}
                    <div className={`px-4 py-2 rounded-full border bg-slate-800/50 ${stats.color} border-current/20 font-bold mb-8 animate-bounce`}>
                        {stats.rating}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                                <Trophy size={14} /> Jobs Done
                            </div>
                            <div className="text-2xl font-mono text-white">
                                {stats.completedJobs} <span className="text-slate-500 text-lg">/ {stats.totalJobs}</span>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                                <CheckCircle size={14} /> Tasks
                            </div>
                            <div className="text-2xl font-mono text-white">
                                {stats.completedTasks} <span className="text-slate-500 text-lg">/ {stats.totalTasks}</span>
                            </div>
                        </div>
                        <div className="col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                                <Send size={14} /> Invoices Sent
                            </div>
                            <div className={`text-xl font-mono ${stats.sentInvoices === stats.completedJobs && stats.completedJobs > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                {stats.sentInvoices} / {stats.completedJobs}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-center relative z-10 flex flex-col gap-2">
                    <p className="text-sm font-bold text-white italic animate-in slide-in-from-bottom-2 fade-in">
                        "{stats.quote}"
                    </p>

                    <div className="flex justify-between items-center mt-2">
                        <p className="text-[10px] text-slate-500 mt-1">
                            "Make Aroma Great Again"
                        </p>
                        <button
                            onClick={() => setIsDemo(!isDemo)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${isDemo ? 'bg-indigo-500  text-white border-indigo-500' : 'bg-transparent text-slate-600 border-slate-700 hover:border-slate-500'}`}
                        >
                            {isDemo ? 'Stop Simulation' : 'Test Perf. (Demo)'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DogeReportModal;
