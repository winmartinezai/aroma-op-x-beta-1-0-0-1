
import React, { useState, useEffect } from 'react';
import { X, Check, ShieldAlert, Layers, List } from 'lucide-react';
import type { Job } from '../types/types';
import { useApp } from '../context/AppContext'; // Import context
import { formatCurrency } from '../utils/helpers';

interface InvoiceStagingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedJobs: Job[];
}

type StagingItem = {
    id: string; // Unique ID for keying
    description: string;
    price: number;
    copied: boolean;
    type: 'base' | 'extra';
};

const InvoiceStagingModal: React.FC<InvoiceStagingModalProps> = ({ isOpen, onClose, selectedJobs }) => {
    const { prepaidUnits, properties } = useApp(); // Access global prepaid lists and property config
    const [mode, setMode] = useState<'standard' | 'altis'>('standard');
    const [activeAltisTab, setActiveAltisTab] = useState<'extras_paint' | 'extras_clean' | 'paint' | 'clean'>('extras_paint');
    const [stagedItems, setStagedItems] = useState<StagingItem[]>([]);

    // Detect Mode on Open
    useEffect(() => {
        if (isOpen && selectedJobs.length > 0) {
            // Logic: If majority of selected jobs belong to an "Altman" group property, switch to Altis mode
            const altmanCount = selectedJobs.filter(j => {
                const prop = properties.find(p => p.name === j.property);
                return prop?.managementGroup === 'Altman';
            }).length;

            if (altmanCount > selectedJobs.length / 2) {
                setMode('altis');
            } else {
                setMode('standard');
            }
        }
    }, [isOpen, selectedJobs, properties]);

    // RE-CALCULATE ITEMS
    useEffect(() => {
        if (!isOpen) return;

        if (mode === 'standard') {
            generateStandardItems();
        } else {
            generateAltisItems();
        }
    }, [mode, activeAltisTab, selectedJobs, isOpen, prepaidUnits]);

    const generateStandardItems = () => {
        const items: StagingItem[] = selectedJobs.map(job => {
            const serviceName = job.type.includes('Paint') ? 'Repaint' : job.type.includes('Clean') ? 'Full Clean' : job.type;
            let desc = `${job.size} ${serviceName}`;

            const parts = [];
            parts.push(desc);

            if (job.extras) {
                parts.push(`, + ${job.extras}`);
            }

            const totalPrice = job.clientPrice + (job.extrasPrice || 0);

            return {
                id: job.id,
                description: parts.join(''),
                price: totalPrice,
                copied: false,
                type: 'base'
            };
        });
        setStagedItems(items);
    };

    const generateAltisItems = () => {
        const items: StagingItem[] = [];

        // Pre-fetch prepaid sets for relevant properties in the selection
        const prepaidCache: Record<string, Set<string>> = {};

        selectedJobs.forEach(job => {
            // Find if this unit is prepaid in its specific property list
            const d = new Date(job.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}_${job.property}`;

            if (!prepaidCache[key]) {
                const storedUnits = prepaidUnits[key] || [];
                prepaidCache[key] = new Set(storedUnits);
            }

            const isPrepaid = prepaidCache[key].has(job.apt.toUpperCase());
            const isPaint = job.type.toLowerCase().includes('paint');
            const isClean = job.type.toLowerCase().includes('clean');

            // TAB 1: PAINT EXTRAS
            if (activeAltisTab === 'extras_paint' && isPaint) {
                if (job.extras && job.extrasPrice > 0) {
                    let extraDesc = `Apt ${job.apt} - ${job.extras}`;
                    // If base is prepaid, maybe mention it? "Extras for Prepaid Unit"
                    // User just said "RECEIVE THE EXTRAS... IN A SEPARATE INVOICE". 
                    items.push({
                        id: `${job.id}-extra-paint`,
                        description: extraDesc,
                        price: job.extrasPrice,
                        copied: false,
                        type: 'extra'
                    });
                }
            }

            // TAB 2: CLEAN EXTRAS
            if (activeAltisTab === 'extras_clean' && isClean) {
                if (job.extras && job.extrasPrice > 0) {
                    let extraDesc = `Apt ${job.apt} - ${job.extras}`;
                    items.push({
                        id: `${job.id}-extra-clean`,
                        description: extraDesc,
                        price: job.extrasPrice,
                        copied: false,
                        type: 'extra'
                    });
                }
            }

            // TAB 3: ADDITIONAL PAINT (Base Only)
            // Only if NOT prepaid
            if (activeAltisTab === 'paint' && isPaint && !isPrepaid) {
                items.push({
                    id: `${job.id}-base-paint`,
                    description: `Apt ${job.apt} - ${job.size} Repaint`,
                    price: job.clientPrice,
                    copied: false,
                    type: 'base'
                });
            }

            // TAB 4: ADDITIONAL CLEAN (Base Only)
            // Only if NOT prepaid
            if (activeAltisTab === 'clean' && isClean && !isPrepaid) {
                items.push({
                    id: `${job.id}-base-clean`,
                    description: `Apt ${job.apt} - ${job.size} Full Clean`,
                    price: job.clientPrice,
                    copied: false,
                    type: 'base'
                });
            }
        });

        setStagedItems(items);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setStagedItems(prev => prev.map(item => item.id === id ? { ...item, copied: true } : item));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Layers className="text-blue-400" />
                            Invoice Staging
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Preparing {selectedJobs.length} selected jobs for Wave Accounting.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Configuration Bar */}
                <div className="bg-slate-100 p-4 border-b border-slate-200 shrink-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                    {/* Mode Selector */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-300">
                        <button
                            onClick={() => setMode('standard')}
                            className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${mode === 'standard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setMode('altis')}
                            className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-1 ${mode === 'altis' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ShieldAlert size={14} />
                            Altman Contract
                        </button>
                    </div>

                    {/* Mode Specific Info */}
                    {mode === 'altis' && (
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-500 uppercase">Payee Code</span>
                                <span className="font-mono bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 select-all">ALVAROMCLE00A</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-500 uppercase">CC Email</span>
                                <span className="font-mono bg-blue-100 text-blue-800 px-1 rounded border border-blue-200 select-all">payrrf7520-regular@rcash.com</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ALTIS SPECIFIC INPUTS */}
                {mode === 'altis' && (
                    <div className="p-4 bg-purple-50 border-b border-purple-100 flex flex-col md:flex-row gap-4 shrink-0 justify-between items-center">
                        <div className="text-sm text-purple-800">
                            <span className="font-bold">Using Property Specific Prepaid Lists.</span>
                            <span className="block text-xs opacity-75">Update lists via "Prepaid Mgr" for each property.</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveAltisTab('extras_paint')}
                                className={`px-4 py-2 rounded-lg border text-[10px] sm:text-xs font-bold transition-all uppercase ${activeAltisTab === 'extras_paint' ? 'bg-white border-purple-500 text-purple-700 shadow-sm ring-2 ring-purple-200' : 'bg-purple-100 border-transparent text-purple-400 hover:bg-white'}`}
                            >
                                1. Paint Extras
                            </button>
                            <button
                                onClick={() => setActiveAltisTab('extras_clean')}
                                className={`px-4 py-2 rounded-lg border text-[10px] sm:text-xs font-bold transition-all uppercase ${activeAltisTab === 'extras_clean' ? 'bg-white border-purple-500 text-purple-700 shadow-sm ring-2 ring-purple-200' : 'bg-purple-100 border-transparent text-purple-400 hover:bg-white'}`}
                            >
                                2. Clean Extras
                            </button>
                            <button
                                onClick={() => setActiveAltisTab('paint')}
                                className={`px-4 py-2 rounded-lg border text-[10px] sm:text-xs font-bold transition-all uppercase ${activeAltisTab === 'paint' ? 'bg-white border-purple-500 text-purple-700 shadow-sm ring-2 ring-purple-200' : 'bg-purple-100 border-transparent text-purple-400 hover:bg-white'}`}
                            >
                                3. Addl Paint
                            </button>
                            <button
                                onClick={() => setActiveAltisTab('clean')}
                                className={`px-4 py-2 rounded-lg border text-[10px] sm:text-xs font-bold transition-all uppercase ${activeAltisTab === 'clean' ? 'bg-white border-purple-500 text-purple-700 shadow-sm ring-2 ring-purple-200' : 'bg-purple-100 border-transparent text-purple-400 hover:bg-white'}`}
                            >
                                4. Addl Clean
                            </button>
                        </div>
                    </div>
                )}

                {/* CLICK TO COPY TABLE */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 custom-scrollbar">
                    {stagedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                            <List size={48} className="mb-2 opacity-20" />
                            <p>No items to display for this selection/filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {stagedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-stretch bg-white border rounded-lg overflow-hidden transition-all group ${item.copied ? 'opacity-50 grayscale border-slate-100' : 'border-slate-200 hover:border-blue-300 shadow-sm'}`}
                                >
                                    {/* Description Part */}
                                    <button
                                        onClick={() => copyToClipboard(item.description, item.id)}
                                        className="flex-1 text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group-first"
                                    >
                                        <span className={`font-mono text-sm ${item.copied ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {item.description}
                                        </span>
                                        <span className="text-xs text-blue-400 opacity-0 group-first-hover:opacity-100 font-bold uppercase tracking-wider">
                                            {item.copied ? 'Copied' : 'Click to Copy'}
                                        </span>
                                    </button>

                                    {/* Separator */}
                                    <div className="w-px bg-slate-100"></div>

                                    {/* Price Part */}
                                    <button
                                        onClick={() => copyToClipboard(item.price.toFixed(2), item.id)}
                                        className="w-32 text-right px-4 py-3 bg-slate-50 hover:bg-green-50 transition-colors font-bold text-slate-700 group-second border-l border-slate-100"
                                    >
                                        {formatCurrency(item.price)}
                                    </button>

                                    {/* Status Indicator */}
                                    <div className={`w-8 flex items-center justify-center ${item.copied ? 'bg-slate-100 text-slate-400' : 'bg-white text-transparent'}`}>
                                        <Check size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Summary */}
                <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <span className="text-xs text-slate-400 font-bold uppercase">
                        {stagedItems.length} Line Items generated
                    </span>
                    <div className="text-lg font-bold text-slate-800">
                        Total: {formatCurrency(stagedItems.reduce((acc, i) => acc + i.price, 0))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoiceStagingModal;
