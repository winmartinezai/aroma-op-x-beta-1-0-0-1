import React, { useState, useEffect } from 'react';
import { X, Save, Building, Phone, Globe, Mail, Calendar, Users, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Property, Employee } from '../types/types';

interface PropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string | null; // null = New Property
}

const PropertyModal: React.FC<PropertyModalProps> = ({ isOpen, onClose, propertyId }) => {
    const { properties, employees, addProperty, updateProperty, addLog, updatePropertySchedule, propertySchedules } = useApp();
    const [activeTab, setActiveTab] = useState<'details' | 'schedule'>('details');

    // Form State
    const [formData, setFormData] = useState<Partial<Property>>({
        name: '',
        contact: '',
        phone: '',
        managementGroup: 'Independent',
        billingLogic: 'independent',
        poLogic: 'optional',
        portal: '',
        primaryEmail: '',
        billingEmail: ''
    });

    // Schedule State
    const [schedule, setSchedule] = useState<{ day: number; count: number; staff: string[] }[]>(
        Array.from({ length: 7 }, (_, i) => ({ day: i, count: 1, staff: [] }))
    );

    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Load Data on Open
    useEffect(() => {
        if (isOpen && propertyId) {
            const existing = properties.find(p => p.id === propertyId);
            if (existing) {
                setFormData({ ...existing });

                // Load Schedules from Global State
                const existingSchedules = propertySchedules.filter(s => s.propertyId === propertyId);
                const loadedSchedule = Array.from({ length: 7 }, (_, i) => {
                    const found = existingSchedules.find(s => s.dayOfWeek === i);
                    return {
                        day: i,
                        count: found ? found.requiredStaffCount : 1,
                        staff: found ? found.assignedEmployeeIds : []
                    };
                });
                setSchedule(loadedSchedule);
            }
        } else if (isOpen && !propertyId) {
            // Reset for new
            setFormData({
                name: '',
                contact: '',
                phone: '',
                managementGroup: 'Independent',
                billingLogic: 'independent',
                poLogic: 'optional',
                portal: '',
                primaryEmail: '',
                billingEmail: ''
            });
            setSchedule(Array.from({ length: 7 }, (_, i) => ({ day: i, count: 1, staff: [] })));
        }
        setActiveTab('details');
    }, [isOpen, propertyId, properties, propertySchedules]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.name) {
            alert('Property Name is required');
            return;
        }

        try {
            let finalId = propertyId;
            if (propertyId) {
                // Update
                updateProperty(propertyId, formData);
                addLog({
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    type: 'success',
                    message: `Updated property: ${formData.name}`
                });
            } else {
                // Create
                finalId = crypto.randomUUID();
                const newProperty: Property = {
                    id: finalId,
                    name: formData.name!,
                    contact: formData.contact || '',
                    phone: formData.phone || '',
                    managementGroup: formData.managementGroup as any || 'Independent',
                    billingLogic: formData.billingLogic as any || 'independent',
                    poLogic: formData.poLogic as any || 'optional',
                    portal: formData.portal || '',
                    primaryEmail: formData.primaryEmail,
                    billingEmail: formData.billingEmail
                };
                addProperty(newProperty);
            }

            // SAVE SCHEDULES
            if (finalId) {
                schedule.forEach(s => {
                    updatePropertySchedule({
                        id: crypto.randomUUID(), // New ID for state, backend might ignore if conflict
                        propertyId: finalId!,
                        dayOfWeek: s.day,
                        requiredStaffCount: s.count,
                        assignedEmployeeIds: s.staff
                    });
                });
            }

            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save property');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Building size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                {propertyId ? 'Edit Property' : 'New Property'}
                            </h2>
                            <p className="text-xs text-slate-500">Manage property details and configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        General Info
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Staff Schedule (New)
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            {/* Section 1: Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Property Name *</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="e.g. Colina Ranch Hill"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Management Group</label>
                                        <select
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                            value={formData.managementGroup}
                                            onChange={e => setFormData({ ...formData, managementGroup: e.target.value as any })}
                                        >
                                            <option value="Independent">Independent</option>
                                            <option value="Altman">Altman</option>
                                            <option value="ZRS">ZRS</option>
                                            <option value="Greystar">Greystar</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Portal URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="https://..."
                                                value={formData.portal}
                                                onChange={e => setFormData({ ...formData, portal: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Contact Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="Manager Name"
                                            value={formData.contact}
                                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="(555) 123-4567"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="email"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="manager@property.com"
                                                value={formData.primaryEmail}
                                                onChange={e => setFormData({ ...formData, primaryEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Billing Email (CC)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="email"
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="billing@property.com"
                                                value={formData.billingEmail}
                                                onChange={e => setFormData({ ...formData, billingEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SCHEDULE TAB */
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
                                <Clock className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-800">Staffing Schedule</h4>
                                    <p className="text-xs text-yellow-700">Define how many staff members are needed for each day of the week. This will automate job creation assignments.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {DAYS.map((dayName, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors">
                                        <div className="w-24 font-bold text-slate-700 text-sm flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {dayName}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-500">Count:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                className="w-12 p-1 text-center font-bold border rounded"
                                                value={schedule[idx].count}
                                                onChange={e => {
                                                    const newSchedule = [...schedule];
                                                    newSchedule[idx].count = parseInt(e.target.value);
                                                    setSchedule(newSchedule);
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            {/* Mock Multi-Select - In real implementation, this would be a proper tag input */}
                                            <div className="flex gap-1 flex-wrap">
                                                <div className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded border border-slate-200">
                                                    Any Available
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Save size={16} />
                        Save Property
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PropertyModal;
