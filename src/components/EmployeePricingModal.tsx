import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, FileText } from 'lucide-react';
import type { Employee, AppConfig } from '../types/types';
import { useApp } from '../context/AppContext';

interface EmployeePricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string | null;
}

const EmployeePricingModal: React.FC<EmployeePricingModalProps> = ({ isOpen, onClose, employeeId }) => {
    const { employees, updateEmployee, appConfig } = useApp();
    const config = appConfig as AppConfig;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [templateId, setTemplateId] = useState<string>('');
    const [customRates, setCustomRates] = useState<{ [category: string]: { [size: string]: number } }>({});

    // Load Employee Data
    useEffect(() => {
        if (isOpen && employeeId) {
            const emp = employees.find(e => e.id === employeeId);
            if (emp) {
                setEmployee(emp);
                setTemplateId(emp.pricingConfig?.templateId || '');
                setCustomRates(JSON.parse(JSON.stringify(emp.pricingConfig?.customRates || {})));
            }
        }
    }, [isOpen, employeeId, employees]);

    const activeTemplate = useMemo(() => {
        if (!config || !config.PRICING_TEMPLATES) return null;
        return config.PRICING_TEMPLATES[templateId] || null;
    }, [templateId, config]);

    if (!isOpen || !employee) return null;

    const categories = ['CLEAN', 'PAINT', 'TOUCH_UP_CLEAN', 'TOUCH_UP_PAINT'];
    const sizes = ['1x1', '2x1', '2x2', '3x2', '3x3', '4x4']; // Hardcoded for matrix view, or derive from lists

    const handleRateChange = (category: string, size: string, value: string) => {
        const numVal = parseFloat(value);
        setCustomRates(prev => {
            const next = { ...prev };
            if (!next[category]) next[category] = {};

            if (isNaN(numVal) || value === '') {
                delete next[category][size];
            } else {
                next[category][size] = numVal;
            }
            return next;
        });
    };

    const handleSave = () => {
        const finalConfig = {
            templateId: templateId || undefined,
            customRates: Object.keys(customRates).length > 0 ? customRates : undefined
        };
        updateEmployee(employee.id, { pricingConfig: finalConfig });
        onClose();
    };

    // Helper to get base rate for comparison/placeholder
    const getBaseRate = (category: string, size: string) => {
        if (activeTemplate && (activeTemplate as any)[category] && (activeTemplate as any)[category][size]) {
            return (activeTemplate as any)[category][size].emp;
        }
        // Fallback to default template if no specific assigned
        const defTemplate = config.PRICING_TEMPLATES[config.DEFAULTS.template];
        // @ts-ignore
        if (defTemplate && defTemplate[category] && defTemplate[category][size]) {
            // @ts-ignore
            return defTemplate[category][size].emp;
        }
        return 0;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pricing Configuration: {employee.name}</h2>
                        <p className="text-sm text-slate-500">Manage payroll templates and custom overrides.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* 1. Template Selection */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <label className="text-xs font-bold text-blue-800 uppercase mb-2 block flex items-center gap-2">
                            <FileText size={14} /> Assigned Base Template
                        </label>
                        <div className="flex gap-4 items-center">
                            <select
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                className="border border-blue-200 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-64 bg-white"
                            >
                                <option value="">Default (Global Standard)</option>
                                {Object.keys(config.PRICING_TEMPLATES || {}).map(t => (
                                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                ))}
                            </select>
                            <span className="text-xs text-blue-600">
                                This sets the baseline rates for the employee before any overrides.
                            </span>
                        </div>
                    </div>

                    {/* 2. Matrix Editor */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-700">Rate Matrix Overrides</h3>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-100 border border-orange-300"></span> Custom Rate
                                <span className="w-2 h-2 rounded-full bg-slate-100 border border-slate-300"></span> Standard Rate
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 border-b border-r border-slate-200 w-32 sticky left-0 bg-slate-50 z-10">Service Type</th>
                                        {sizes.map(size => (
                                            <th key={size} className="p-3 border-b border-slate-200 text-center w-24">{size}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {categories.map(cat => (
                                        <tr key={cat} className="hover:bg-slate-50/50">
                                            <td className="p-3 border-r border-slate-200 font-bold text-slate-600 sticky left-0 bg-white z-10">
                                                {cat.replace(/_/g, ' ')}
                                            </td>
                                            {sizes.map(size => {
                                                const baseRate = getBaseRate(cat, size);
                                                const customRate = customRates[cat]?.[size];
                                                const isOverridden = customRate !== undefined;

                                                return (
                                                    <td key={size} className={`p-2 border-slate-50 text-center relative group ${isOverridden ? 'bg-orange-50' : ''}`}>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">$</span>
                                                            <input
                                                                type="number"
                                                                placeholder={baseRate.toFixed(2)}
                                                                value={isOverridden ? customRate : ''}
                                                                onChange={(e) => handleRateChange(cat, size, e.target.value)}
                                                                className={`w-full pl-4 pr-1 py-1.5 rounded border text-right font-mono text-xs focus:ring-2 outline-none transition-all ${isOverridden
                                                                    ? 'border-orange-300 text-orange-700 font-bold focus:ring-orange-500 bg-white'
                                                                    : 'border-slate-100 text-slate-500 focus:bg-white focus:border-blue-300 focus:ring-blue-500 bg-transparent placeholder-slate-300'
                                                                    }`}
                                                            />
                                                        </div>
                                                        {isOverridden && (
                                                            <button
                                                                onClick={() => handleRateChange(cat, size, '')}
                                                                className="absolute -top-1 -right-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Reset to Standard"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <Save size={16} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeePricingModal;
