
import React, { useState, useEffect } from 'react';
import { Save, ShieldAlert, Calendar, Columns, List, ArrowRight, AlertTriangle, CheckCircle2, RefreshCw, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PrepaidModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_PROP = 'Altis Grand Central';

const PrepaidModal: React.FC<PrepaidModalProps> = ({ isOpen, onClose }) => {
    const { jobs, prepaidUnits, updatePrepaidList, properties, prepaidQuotas, updatePrepaidQuota } = useApp();

    // Tab State: 'simple' (Classic text box) or 'pair' (New tool)
    const [activeTab, setActiveTab] = useState<'simple' | 'pair'>('simple');

    // State for Month Selection
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11
    const [selectedProperty, setSelectedProperty] = useState(DEFAULT_PROP);

    // State for Simple Input
    const [textInput, setTextInput] = useState('');

    // State for Smart Pair Tool
    const [bulkUnits, setBulkUnits] = useState('');
    const [bulkSizes, setBulkSizes] = useState('');
    const [pairError, setPairError] = useState<string | null>(null);
    const [_previewPairs, setPreviewPairs] = useState<string[]>([]);

    const [statusMsg, setStatusMsg] = useState('');

    // Generate Key for Storage: "YYYY-MM_PropertyName"
    const storageKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}_${selectedProperty}`;

    // Load data when modal opens or date/property changes
    useEffect(() => {
        if (isOpen) {
            const stored = prepaidUnits[storageKey] || [];
            setTextInput(stored.join(', '));
            // Reset pair tool
            setBulkUnits('');
            setBulkSizes('');
            setPairError(null);
            setPreviewPairs([]);
            setActiveTab('simple');
        }
    }, [isOpen, storageKey, prepaidUnits]);

    // HELPER: Translate Codes
    const translateSize = (code: string) => {
        const c = code.trim().toUpperCase();
        if (c === 'A') return '1x1';
        if (c === 'B') return '2x2';
        if (c === 'C') return '3x2';
        if (c === 'D') return 'Studio';
        return c;
    };

    const handleProcessPairs = () => {
        setPairError(null);

        const units = bulkUnits.split(/[\n,]+/).map(s => s.trim()).filter(s => !!s);
        const sizes = bulkSizes.split(/[\n,]+/).map(s => s.trim()).filter(s => !!s);

        if (units.length !== sizes.length) {
            setPairError(`Mismatch Detected! You pasted ${units.length} Units but ${sizes.length} Sizes/Codes.`);
            return;
        }

        if (units.length === 0) {
            setPairError('Lists are empty.');
            return;
        }

        const pairs = units.map((u, i) => {
            const rawSize = sizes[i];
            const translated = translateSize(rawSize);
            return `${u} (${translated}${rawSize !== translated ? ` - Code ${rawSize}` : ''})`;
        });

        setPreviewPairs(pairs);

        const uniqueUnits = Array.from(new Set(units)).sort();
        setTextInput(uniqueUnits.join(', '));

        setStatusMsg('Lists matched & processed! Verify below, then Click Save.');
    };

    const handleSave = () => {
        const units = textInput
            .split(/[\n,]+/)
            .map(s => s.trim().toUpperCase())
            .filter(s => !!s);

        const uniqueUnits = Array.from(new Set(units)).sort();

        updatePrepaidList(storageKey, uniqueUnits);

        setStatusMsg(`Saved ${uniqueUnits.length} units for ${selectedProperty}.`);
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Filter properties
    const altmanProperties = properties.filter(p => p.managementGroup === 'Altman').sort((a, b) => a.name.localeCompare(b.name));
    const otherProperties = properties.filter(p => p.managementGroup !== 'Altman').sort((a, b) => a.name.localeCompare(b.name));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex h-[80vh] overflow-hidden border border-slate-200">

                {/* SIDEBAR: SELECTION */}
                <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={20} className="text-purple-600" />
                            Contract Mgr
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Select context to edit</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* Date Selector */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Period</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <option key={i} value={i}>{new Date(2000, i).toLocaleString('default', { month: 'short' })}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Property Selector */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Context</label>
                            <div className="space-y-1">
                                <div className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">Altman Management</div>
                                {altmanProperties.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProperty(p.name)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${selectedProperty === p.name
                                            ? 'bg-white border-l-4 border-purple-600 shadow-sm font-bold text-slate-800'
                                            : 'text-slate-500 hover:bg-slate-100 border-l-4 border-transparent'
                                            }`}
                                    >
                                        {p.name}
                                        {selectedProperty === p.name && <ChevronRight size={14} className="text-purple-600" />}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-1 mt-4">
                                <div className="text-xs font-bold text-slate-500 px-2 py-1">Other Properties</div>
                                {otherProperties.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProperty(p.name)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${selectedProperty === p.name
                                            ? 'bg-white border-l-4 border-purple-600 shadow-sm font-bold text-slate-800'
                                            : 'text-slate-500 hover:bg-slate-100 border-l-4 border-transparent'
                                            }`}
                                    >
                                        {p.name}
                                        {selectedProperty === p.name && <ChevronRight size={14} className="text-purple-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col bg-white">

                    {/* Top Toolbar */}
                    <div className="h-24 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 gap-4">
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-800">{selectedProperty}</h2>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                <Calendar size={12} />
                                {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>

                            {/* QUOTA TRACKER */}
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1 w-32">
                                    <label className="text-[10px] font-bold text-purple-600 uppercase">Paint Quota</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="w-12 text-xs border rounded px-1 py-0.5"
                                            value={prepaidQuotas[storageKey]?.paint || 0}
                                            onChange={(e) => updatePrepaidQuota(storageKey, { ...prepaidQuotas[storageKey], paint: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="text-[10px] text-slate-400">
                                            {jobs.filter(j =>
                                                j.property === selectedProperty &&
                                                new Date(j.date).getMonth() === selectedMonth &&
                                                new Date(j.date).getFullYear() === selectedYear &&
                                                j.type.toLowerCase().includes('paint')
                                            ).length} Used
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 w-32">
                                    <label className="text-[10px] font-bold text-cyan-600 uppercase">Clean Quota</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="w-12 text-xs border rounded px-1 py-0.5"
                                            value={prepaidQuotas[storageKey]?.clean || 0}
                                            onChange={(e) => updatePrepaidQuota(storageKey, { ...prepaidQuotas[storageKey], clean: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="text-[10px] text-slate-400">
                                            {jobs.filter(j =>
                                                j.property === selectedProperty &&
                                                new Date(j.date).getMonth() === selectedMonth &&
                                                new Date(j.date).getFullYear() === selectedYear &&
                                                j.type.toLowerCase().includes('clean')
                                            ).length} Used
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 h-fit">
                            <button
                                onClick={() => setActiveTab('simple')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'simple' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List size={14} /> Simple List
                            </button>
                            <button
                                onClick={() => setActiveTab('pair')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'pair' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Columns size={14} /> Batch Processor
                            </button>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 overflow-hidden relative bg-slate-50/50">
                        {activeTab === 'simple' && (
                            <div className="absolute inset-0 p-6 flex flex-col">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Prepaid Units (Comma or Newline Separated)
                                    </label>
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-mono">
                                        {textInput ? textInput.split(/[\n,]+/).filter(Boolean).length : 0} units
                                    </span>
                                </div>
                                <textarea
                                    className="flex-1 w-full border border-slate-300 rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none shadow-sm bg-white"
                                    placeholder="101, 102, 103..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                />
                            </div>
                        )}

                        {activeTab === 'pair' && (
                            <div className="absolute inset-0 p-6 flex flex-col overflow-hidden">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full h-fit">
                                        <RefreshCw size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-900">Excel/Email Batch Processor</h4>
                                        <p className="text-xs text-blue-700 mt-1">Paste columns directly from Excel. Mapping: A=1x1, B=2x2, C=3x2.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 flex-1 min-h-0">
                                    <div className="flex-1 flex flex-col">
                                        <label className="text-xs font-bold text-slate-500 mb-1">Column 1: Units</label>
                                        <textarea
                                            className="flex-1 border border-slate-300 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-white"
                                            placeholder="101&#10;102&#10;103"
                                            value={bulkUnits}
                                            onChange={(e) => setBulkUnits(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center text-slate-300">
                                        <ArrowRight />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <label className="text-xs font-bold text-slate-500 mb-1">Column 2: Sizes/Codes</label>
                                        <textarea
                                            className="flex-1 border border-slate-300 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-white"
                                            placeholder="A&#10;B&#10;2x2"
                                            value={bulkSizes}
                                            onChange={(e) => setBulkSizes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {pairError && (
                                    <div className="mt-3 text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2">
                                        <AlertTriangle size={14} /> {pairError}
                                    </div>
                                )}

                                <div className="mt-4">
                                    <button
                                        onClick={handleProcessPairs}
                                        className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-sm"
                                    >
                                        Process & Sync to Main List
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            {statusMsg && <span className="text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16} /> {statusMsg}</span>}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm transition-colors">
                                Close
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 text-sm"
                            >
                                <Save size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrepaidModal;
