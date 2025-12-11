import React, { useState } from 'react';
import { History, Undo2, Plus, CheckCircle2, DollarSign, Trash2, Lock, Unlock } from 'lucide-react';

export interface JobHistoryAction {
    id: string;
    timestamp: number;
    type: 'CREATE' | 'UPDATE_STATUS' | 'UPDATE_PRICE' | 'DELETE' | 'IMPORT' | 'UPDATE_EXTRAS' | 'DELETE_ALL';
    description: string;
    jobId?: string; // ID of the job affected
    previousData?: any; // Snapshot of data before change
    user?: string;
}

interface JobsHistoryWidgetProps {
    history: JobHistoryAction[];
    onUndo: (action: JobHistoryAction) => void;
}

const JobsHistoryWidget: React.FC<JobsHistoryWidgetProps> = ({ history, onUndo }) => {
    const [limit, setLimit] = useState(25);

    const visibleHistory = history.slice(0, limit);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden w-full max-w-sm h-fit">
            {/* Header - Specific to Jobs Master */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                    <span className="text-blue-500"><History size={16} /></span>
                    Jobs Master History
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                        {visibleHistory.length} / {limit}
                    </span>
                </div>
            </div>

            {/* Scrollable List - Compact View (~5 items) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 max-h-[320px] min-h-[100px]">
                {visibleHistory.length === 0 ? (
                    <div className="text-center text-slate-400 p-8 italic text-sm">
                        No job changes recorded.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {visibleHistory.map(action => (
                            <div key={action.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 group transition-colors">
                                {/* Icon based on action type */}
                                <div className={`p-2 rounded-lg border border-transparent transition-all shrink-0 ${action.type === 'CREATE' ? 'bg-blue-50 text-blue-600' :
                                    action.type === 'UPDATE_STATUS' ? 'bg-emerald-50 text-emerald-600' :
                                        action.type === 'UPDATE_PRICE' ? 'bg-amber-50 text-amber-600' :
                                            'bg-red-50 text-red-600'
                                    }`}>
                                    {action.type === 'CREATE' && <Plus size={16} />}
                                    {action.type === 'UPDATE_STATUS' && <CheckCircle2 size={16} />}
                                    {action.type === 'UPDATE_PRICE' && <DollarSign size={16} />}
                                    {action.type === 'DELETE' && <Trash2 size={16} />}
                                    {action.type === 'IMPORT' && <Plus size={16} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{action.description}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">
                                            {formatTime(action.timestamp)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium lowercase">
                                            {action.user || 'System'}
                                        </span>
                                    </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={() => onUndo(action)}
                                        className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 transition-colors shadow-sm"
                                        title="Revert this job change"
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

            {/* Footer / Controls */}
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                {limit < 50 ? (
                    <button
                        onClick={() => setLimit(50)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-slate-300 hover:border-blue-200"
                    >
                        <Lock size={12} />
                        Unlock older history (50)
                    </button>
                ) : (
                    <div className="text-center py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Unlock size={12} />
                        Max history unlocked
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobsHistoryWidget;
