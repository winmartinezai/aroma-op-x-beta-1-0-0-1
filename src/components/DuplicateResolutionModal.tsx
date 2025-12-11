import React, { useState } from 'react';
import { AlertTriangle, X, ArrowRight, Copy, SkipForward, AlertCircle } from 'lucide-react';
// import { CheckCircle } from 'lucide-react';
import type { Job } from '../types/types';
import { formatDate } from '../utils/helpers';

interface DuplicateResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    duplicates: { existing: Job; new: Job }[];
    onResolve: (resolutions: { [key: string]: 'skip' | 'overwrite' | 'keep_both' }) => void;
}

const DuplicateResolutionModal: React.FC<DuplicateResolutionModalProps> = ({ isOpen, onClose, duplicates, onResolve }) => {
    const [resolutions, setResolutions] = useState<{ [key: string]: 'skip' | 'overwrite' | 'keep_both' }>({});

    if (!isOpen) return null;

    const handleSetResolution = (id: string, action: 'skip' | 'overwrite' | 'keep_both') => {
        setResolutions(prev => ({ ...prev, [id]: action }));
    };

    const handleSetAll = (action: 'skip' | 'overwrite' | 'keep_both') => {
        const newResolutions: { [key: string]: 'skip' | 'overwrite' | 'keep_both' } = {};
        duplicates.forEach(d => {
            newResolutions[d.new.id] = action;
        });
        setResolutions(newResolutions);
    };

    const handleConfirm = () => {
        // Ensure all are resolved (default to skip if not set?)
        // Or just pass what we have, and assume skip for others?
        // Let's enforce selection or default to skip.
        const finalResolutions = { ...resolutions };
        duplicates.forEach(d => {
            if (!finalResolutions[d.new.id]) finalResolutions[d.new.id] = 'skip';
        });
        onResolve(finalResolutions);
        onClose();
    };

    const resolvedCount = Object.keys(resolutions).length;
    const totalCount = duplicates.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">

                {/* HEADER */}
                <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-orange-900">Duplicate Jobs Detected</h2>
                            <p className="text-sm text-orange-700">Found {duplicates.length} jobs that match existing records.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                {/* BULK ACTIONS */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bulk Actions:</span>
                    <div className="flex gap-2">
                        <button onClick={() => handleSetAll('skip')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">Skip All</button>
                        <button onClick={() => handleSetAll('overwrite')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">Overwrite All</button>
                        <button onClick={() => handleSetAll('keep_both')} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">Import All (Keep Both)</button>
                    </div>
                </div>

                {/* LIST */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
                    {duplicates.map((dup) => {
                        const res = resolutions[dup.new.id];
                        return (
                            <div key={dup.new.id} className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all ${res ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                                <div className="flex flex-col md:flex-row">
                                    {/* INFO */}
                                    <div className="flex-1 p-3 flex items-center gap-4">
                                        <div className="text-center min-w-[60px]">
                                            <div className="text-xs font-bold text-slate-500 uppercase">Date</div>
                                            <div className="font-mono text-sm font-bold text-slate-700">{formatDate(dup.existing.date)}</div>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Existing Job</div>
                                                <div className="text-sm font-medium text-slate-800">{dup.existing.property} - {dup.existing.apt}</div>
                                                <div className="text-xs text-slate-500">{dup.existing.type} • {dup.existing.status}</div>
                                                {dup.existing.assignedTo && <div className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded inline-block mt-1">{dup.existing.assignedTo}</div>}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">New Import</div>
                                                <div className="text-sm font-medium text-slate-800">{dup.new.property} - {dup.new.apt}</div>
                                                <div className="text-xs text-slate-500">{dup.new.type} • {dup.new.status}</div>
                                                {dup.new.assignedTo && <div className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded inline-block mt-1">{dup.new.assignedTo}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="bg-slate-50 p-3 flex items-center gap-2 border-l border-slate-100">
                                        <button
                                            onClick={() => handleSetResolution(dup.new.id, 'skip')}
                                            className={`flex flex-col items-center justify-center w-20 h-16 rounded border transition-all ${res === 'skip' ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            <SkipForward size={16} className="mb-1" />
                                            <span className="text-[10px] font-bold">Skip</span>
                                        </button>
                                        <button
                                            onClick={() => handleSetResolution(dup.new.id, 'overwrite')}
                                            className={`flex flex-col items-center justify-center w-20 h-16 rounded border transition-all ${res === 'overwrite' ? 'bg-orange-100 border-orange-400 text-orange-800 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50'}`}
                                        >
                                            <AlertCircle size={16} className="mb-1" />
                                            <span className="text-[10px] font-bold">Overwrite</span>
                                        </button>
                                        <button
                                            onClick={() => handleSetResolution(dup.new.id, 'keep_both')}
                                            className={`flex flex-col items-center justify-center w-20 h-16 rounded border transition-all ${res === 'keep_both' ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
                                        >
                                            <Copy size={16} className="mb-1" />
                                            <span className="text-[10px] font-bold">Keep Both</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FOOTER */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div className="text-sm text-slate-500">
                        Resolved <span className="font-bold text-slate-800">{resolvedCount}</span> of <span className="font-bold text-slate-800">{totalCount}</span> conflicts
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel Import</button>
                        <button
                            onClick={handleConfirm}
                            disabled={resolvedCount < totalCount}
                            className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 ${resolvedCount < totalCount ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
                        >
                            Confirm & Import <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DuplicateResolutionModal;
