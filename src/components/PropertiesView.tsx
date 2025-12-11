import React, { useState } from 'react';
import {
    Building, Phone, Globe, Settings, Plus,
    Edit2, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
// import type { Property } from '../types/types';
import PropertyModal from './PropertyModal';

const PropertiesView: React.FC = () => {
    const { properties, propertySchedules } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'list' | 'schedules'>('list');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

    const handleNewProperty = () => {
        setEditingPropertyId(null);
        setIsModalOpen(true);
    };

    const handleEditProperty = (id: string) => {
        setEditingPropertyId(id);
        setIsModalOpen(true);
    };

    // Filter properties
    const filteredProperties = properties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.managementGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex flex-col h-full bg-slate-50">

            {/* Header / Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Property Management</h2>
                    <p className="text-xs text-slate-500">Configure contacts, billing rules, and automation.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Toggles */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Properties
                        </button>
                        <button
                            onClick={() => setActiveTab('schedules')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'schedules' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Common Areas / Schedules
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Search properties..."
                        className="flex-1 md:w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={handleNewProperty}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={16} />
                        New Property
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

                {activeTab === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProperties.map(property => (
                            <div key={property.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                                {/* ... (Existing Card Content - Truncated for brevity if replace logic allows, but better to include full block to be safe or use multi-replace to target map) ... */}
                                {/* Wait, I am replacing the WHOLE component body basically. I need to include the card content. */}
                                {/* Card Header */}
                                <div className="p-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Building size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">{property.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider font-semibold">
                                                    {property.managementGroup}
                                                </span>
                                                {property.contact && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        {property.contact}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEditProperty(property.id)}
                                        className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>

                                {/* Card Body: Info Grid */}
                                <div className="px-4 pb-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PORTAL</p>
                                        <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                            <Globe size={12} className="text-slate-400" />
                                            {property.portal || 'Not Configured'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PHONE</p>
                                        <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                            <Phone size={12} className="text-slate-400" />
                                            {property.phone || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Card Footer: Action */}
                                <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-2">
                                    <button
                                        onClick={() => handleEditProperty(property.id)}
                                        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors uppercase tracking-wide"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Settings size={12} />
                                            Configuration & Routing
                                        </span>
                                        <ChevronRight size={12} />
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                ) : (
                    /* COMMON AREAS SCHEDULE MATRIX */
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800">Common Area Staffing Matrix</h3>
                                <p className="text-xs text-slate-500">Weekly breakdown of required staff across properties.</p>
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                                Total Active Properties: {filteredProperties.length}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 sticky left-0 bg-slate-100 border-r border-slate-200 z-10 w-64">Property</th>
                                        {DAYS.map(d => <th key={d} className="px-4 py-3 text-center w-20">{d}</th>)}
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProperties.map(p => {
                                        // Get schedules for this property
                                        const pScheds = propertySchedules.filter(s => s.propertyId === p.id);
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-100 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                                    {p.name}
                                                </td>
                                                {Array.from({ length: 7 }).map((_, dayIdx) => {
                                                    const daySched = pScheds.find(s => s.dayOfWeek === dayIdx);
                                                    const count = daySched?.requiredStaffCount || 0;
                                                    return (
                                                        <td key={dayIdx} className="px-2 py-3 text-center">
                                                            {count > 0 ? (
                                                                <span className="inline-flex items-center justify-center w-8 h-6 bg-blue-100 text-blue-700 rounded font-bold text-xs">
                                                                    {count}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleEditProperty(p.id)}
                                                        className="text-blue-600 hover:text-blue-800 font-bold text-xs underline decoration-dotted"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <PropertyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                propertyId={editingPropertyId}
            />
        </div>
    );
};

export default PropertiesView;