
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, User, Building, Tag, DollarSign, FileText, PlusCircle, Calculator } from 'lucide-react';
import type { Job } from '../types/types';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
// import { generateId } from '../utils/helpers';
import { calculatePrice, generateInvoiceNote } from '../utils/pricing';
import { calculatePriceFromCatalog } from '../utils/catalogPricing';
import { useAvailableSizesForJobType } from '../hooks/useAvailableSizes';

interface JobEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string | null;
    onOpenExtras: (jobId: string) => void;
}

const JobEditModal: React.FC<JobEditModalProps> = ({ isOpen, onClose, jobId, onOpenExtras }) => {
    const { jobs, updateJob, deleteJobs, employees, properties, lists, appConfig } = useApp();
    const [formData, setFormData] = useState<Job | null>(null);

    // Get available sizes from Service Catalog based on job type
    const { sizes: catalogSizes, isLoading: sizesLoading } = useAvailableSizesForJobType(
        formData?.type || 'Paint',
        appConfig?.DEFAULTS?.template
    );

    // Combine catalog sizes with legacy sizes for backward compatibility
    const availableSizes = catalogSizes.length > 0 ? catalogSizes : lists.sizes;

    useEffect(() => {
        if (isOpen && jobId) {
            const found = jobs.find(j => j.id === jobId);
            if (found) {
                setFormData(JSON.parse(JSON.stringify(found))); // Deep copy
            }
        }
    }, [isOpen, jobId, jobs]);

    if (!isOpen || !formData) return null;

    const handleChange = async (field: keyof Job, value: any) => {
        setFormData((prev: any) => {
            if (!prev) return null;
            const updated = { ...prev, [field]: value };
            return updated;
        });

        // Auto-calculate prices if structural fields change
        if (field === 'type' || field === 'size' || field === 'property' || field === 'assignedTo') {
            // Get updated values
            const updatedData = { ...formData, [field]: value };
            const assignedEmp = employees.find(e => e.name === updatedData.assignedTo);

            // Try catalog pricing first (async)
            const catalogPrices = await calculatePriceFromCatalog(
                updatedData.property,
                updatedData.size,
                updatedData.type,
                appConfig,
                assignedEmp
            );

            // If catalog returns valid prices, use them; otherwise fallback to legacy
            let newPrices = catalogPrices;
            if (catalogPrices.client === 0 && catalogPrices.employee === 0) {
                newPrices = calculatePrice(
                    updatedData.property,
                    updatedData.size,
                    updatedData.type,
                    appConfig,
                    assignedEmp
                );
            }

            setFormData((prev: any) => {
                if (!prev) return null;
                return {
                    ...prev,
                    clientPrice: newPrices.client,
                    employeePrice: newPrices.employee,
                    invoiceNote: generateInvoiceNote(
                        { type: updatedData.type, size: updatedData.size },
                        updatedData.extras
                    )
                };
            });
        }
    };

    const handleSave = () => {
        if (formData && jobId) {
            updateJob(jobId, formData);
            onClose();
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this job permanently?')) {
            if (jobId) deleteJobs([jobId]);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Tag className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Job Editor Terminal</h2>
                            <p className="text-slate-400 text-xs font-mono">{formData.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">

                    {/* Row 1: Core Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date}
                                onChange={e => handleChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Building size={12} /> Property
                            </label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.property}
                                onChange={e => handleChange('property', e.target.value)}
                            >
                                <option value="">Select Property...</option>
                                {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Unit Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Unit #</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.apt}
                                onChange={e => handleChange('apt', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Size</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.size}
                                onChange={e => handleChange('size', e.target.value)}
                                disabled={sizesLoading}
                            >
                                {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Service Type</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.type}
                                onChange={e => handleChange('type', e.target.value)}
                            >
                                {lists.jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Assignment & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <User size={12} /> Assigned To
                            </label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.assignedTo}
                                onChange={e => handleChange('assignedTo', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.status}
                                onChange={e => handleChange('status', e.target.value)}
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Complete">Complete</option>
                                <option value="Paid">Paid</option>
                                <option value="Cancel">Cancel</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">PO Number</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.po || ''}
                                onChange={e => handleChange('po', e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-200"></div>

                    {/* Row 4: Pricing & Extras Manager */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Financials */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-600" /> Financials
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Client Price</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-5 pr-2 py-1.5 border border-slate-300 rounded font-bold text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.clientPrice}
                                            onChange={e => handleChange('clientPrice', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Employee Pay</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-5 pr-2 py-1.5 border border-slate-300 rounded font-bold text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.employeePrice}
                                            onChange={e => handleChange('employeePrice', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
                                <span className="text-lg font-bold text-emerald-600">{formatCurrency(formData.clientPrice + (formData.extrasPrice || 0))}</span>
                            </div>
                        </div>

                        {/* Extras & Notes */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                    <PlusCircle size={16} className="text-purple-600" /> Extras & Notes
                                </h4>
                                <button
                                    onClick={() => onOpenExtras(formData.id)}
                                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold hover:bg-purple-200 flex items-center gap-1 transition-colors"
                                >
                                    <Calculator size={12} />
                                    Open Manager
                                </button>
                            </div>

                            <div className="bg-purple-50 p-2 rounded border border-purple-100 min-h-[40px] text-xs text-purple-800">
                                {formData.extras || <span className="text-purple-300 italic">No extras added. Click manager to add.</span>}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Internal Notes</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    rows={2}
                                    placeholder="Add notes about access, pets, etc."
                                    value={formData.notes}
                                    onChange={e => handleChange('notes', e.target.value)}
                                />
                            </div>

                            {/* Invoice Note Preview */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                                    <span>Invoice Note Preview</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(formData.invoiceNote || '');
                                            // Could add toast here
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-[10px] flex items-center gap-1"
                                        title="Copy to Clipboard"
                                    >
                                        <FileText size={10} /> Copy
                                    </button>
                                </label>
                                <div className="bg-slate-100 p-2 rounded border border-slate-200 text-xs text-slate-600 font-mono break-words">
                                    {formData.invoiceNote || <span className="text-slate-400 italic">No invoice note generated yet.</span>}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} /> Delete Job
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default JobEditModal;
