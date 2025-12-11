/**
 * Service Catalog Manager Component
 * 
 * Allows users to view, add, edit, and delete service catalog items
 * Replaces hardcoded pricing with dynamic database-driven catalog
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { useServiceCatalog, useServiceCatalogByCategory } from '../hooks/useServiceCatalog';
import type { ServiceCatalogItem } from '../utils/serviceCatalog';

interface ServiceCatalogManagerProps {
    templateName?: string;
}

const ServiceCatalogManager: React.FC<ServiceCatalogManagerProps> = ({ templateName = 'YEAR_2025' }) => {
    const { grouped, isLoading, addItem, updateItem, deleteItem, isAdding, isUpdating, isDeleting } = useServiceCatalogByCategory(templateName);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ServiceCatalogItem['category'] | 'ALL'>('ALL');
    const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Filter items based on search and category
    const filteredItems = Object.entries(grouped).reduce((acc, [category, items]) => {
        if (selectedCategory !== 'ALL' && category !== selectedCategory) return acc;

        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length > 0) {
            acc[category as ServiceCatalogItem['category']] = filtered;
        }

        return acc;
    }, {} as Record<ServiceCatalogItem['category'], ServiceCatalogItem[]>);

    const handleAddItem = async (item: Omit<ServiceCatalogItem, 'id'>) => {
        try {
            const result = await addItem(item);
            if (result.success) {
                setIsAddModalOpen(false);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Error adding item: ${error.message}`);
        }
    };

    const handleUpdateItem = async (id: string, updates: Partial<Omit<ServiceCatalogItem, 'id'>>) => {
        try {
            const result = await updateItem({ id, updates });
            if (result.success) {
                setEditingItem(null);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Error updating item: ${error.message}`);
        }
    };

    const handleDeleteItem = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to archive "${name}"? It will be hidden but preserved for historical jobs.`)) {
            return;
        }

        try {
            const result = await deleteItem(id);
            if (!result.success) {
                alert(`Error: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Error deleting item: ${error.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading service catalog...</div>
            </div>
        );
    }

    const categories: Array<ServiceCatalogItem['category'] | 'ALL'> = ['ALL', 'PAINT', 'CLEAN', 'TOUCH_UP_PAINT', 'TOUCH_UP_CLEAN', 'EXTRAS'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Service Catalog</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your service items and pricing. Changes here affect new jobs only (existing jobs are locked).
                    </p>
                </div>

            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-slate-400" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    disabled={isAdding}
                >
                    <Plus size={16} />
                    Add Item
                </button>
            </div>

            {/* Service Items by Category */}
            <div className="space-y-6">
                {Object.entries(filteredItems).length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        No service items found. Try adjusting your filters or add a new item.
                    </div>
                ) : (
                    Object.entries(filteredItems).map(([category, items]) => (
                        <div key={category} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                <h3 className="font-semibold text-slate-700">{category}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Client Price</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Employee Pay</th>
                                            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Template</th>
                                            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.name}</td>
                                                <td className="px-4 py-3 text-sm text-right font-mono text-slate-600">
                                                    ${item.client_price.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-mono text-slate-600">
                                                    ${item.employee_pay.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-slate-500">
                                                    {item.template_name || 'Custom'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditingItem(item)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id!, item.name)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Archive"
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || editingItem) && (
                <ServiceItemModal
                    item={editingItem}
                    templateName={templateName}
                    onSave={editingItem ?
                        (updates) => handleUpdateItem(editingItem.id!, updates) :
                        handleAddItem
                    }
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingItem(null);
                    }}
                    isSaving={isAdding || isUpdating}
                />
            )}
        </div>
    );
};

// Modal Component for Add/Edit
interface ServiceItemModalProps {
    item: ServiceCatalogItem | null;
    templateName: string;
    onSave: (item: Omit<ServiceCatalogItem, 'id'>) => void;
    onClose: () => void;
    isSaving: boolean;
}

const ServiceItemModal: React.FC<ServiceItemModalProps> = ({ item, templateName, onSave, onClose, isSaving }) => {
    const [formData, setFormData] = useState<Omit<ServiceCatalogItem, 'id'>>({
        category: item?.category || 'PAINT',
        name: item?.name || '',
        client_price: item?.client_price || 0,
        employee_pay: item?.employee_pay || 0,
        template_name: item?.template_name || templateName,
        is_active: item?.is_active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a service name');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {item ? 'Edit Service Item' : 'Add New Service Item'}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCatalogItem['category'] })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            required
                        >
                            <option value="PAINT">Paint</option>
                            <option value="CLEAN">Clean</option>
                            <option value="TOUCH_UP_PAINT">Touch Up Paint</option>
                            <option value="TOUCH_UP_CLEAN">Touch Up Clean</option>
                            <option value="EXTRAS">Extras</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., 4x4 Penthouse, Garage Paint"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.client_price}
                                    onChange={(e) => setFormData({ ...formData, client_price: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Employee Pay</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.employee_pay}
                                    onChange={(e) => setFormData({ ...formData, employee_pay: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : item ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceCatalogManager;
