import React, { useState } from 'react';
import { Package, Plus, Search, Filter, History, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem, InventoryLog } from '../types/types';

const InventoryView: React.FC = () => {
    const { inventory, inventoryLogs, updateInventoryItem, deleteInventoryItem, addInventoryLog, properties, employees } = useApp();
    const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Filtered Data
    const filteredInventory = inventory.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedLogs = [...inventoryLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- SUB-COMPONENTS (INLINED FOR SPEED) ---

    // 1. ADD/EDIT ITEM MODAL
    const ItemModal = () => {
        const [formData, setFormData] = useState<Partial<InventoryItem>>(
            selectedItem || { name: '', category: 'General', unit: 'pcs', costPerUnit: 0, currentStock: 0, reorderThreshold: 5 }
        );

        const handleSave = () => {
            if (!formData.name) return alert('Name required');
            const item: InventoryItem = {
                id: selectedItem?.id || crypto.randomUUID(),
                name: formData.name!,
                category: formData.category || 'General',
                unit: formData.unit || 'pcs',
                costPerUnit: Number(formData.costPerUnit),
                currentStock: Number(formData.currentStock),
                reorderThreshold: Number(formData.reorderThreshold)
            };
            updateInventoryItem(item);
            setIsItemModalOpen(false);
            setSelectedItem(null);
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold">
                            {selectedItem ? 'Edit Item' : 'New Item'}
                        </h3>
                        <button onClick={() => setIsItemModalOpen(false)}><Plus className="rotate-45" /></button>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Name</label>
                            <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Category</label>
                                <select className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>General</option>
                                    <option>Cleaning</option>
                                    <option>Paper</option>
                                    <option>Chemicals</option>
                                    <option>Tools</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Unit</label>
                                <input className="w-full border p-2 rounded" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. Bottle" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Cost ($)</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.costPerUnit} onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Current Stock</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.currentStock} onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Threshold</label>
                                <input type="number" className="w-full border p-2 rounded" value={formData.reorderThreshold} onChange={e => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 flex justify-end">
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">Save Item</button>
                    </div>
                </div>
            </div>
        );
    };

    // 2. TRANSACTION MODAL
    const TransactionModal = () => {
        const [type, setType] = useState<'restock' | 'consumption'>('consumption');
        const [qty, setQty] = useState(1);
        const [propId, setPropId] = useState('');
        const [empId, setEmpId] = useState('');

        if (!selectedItem) return null;

        const handleSubmit = () => {
            // Find Employee Name if selected
            const empName = empId ? employees.find(e => e.id === empId)?.name || 'Unknown' : (type === 'restock' ? 'Admin' : 'System');

            const log: InventoryLog = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                itemId: selectedItem.id,
                type: type,
                quantity: qty,
                propertyId: propId || undefined,
                requestedBy: empName,
            };
            addInventoryLog(log);
            setIsTransactionModalOpen(false);
            setSelectedItem(null);
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold">Update Stock: {selectedItem.name}</h3>
                        <button onClick={() => setIsTransactionModalOpen(false)}><Plus className="rotate-45" /></button>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                            <button onClick={() => setType('consumption')} className={`flex-1 py-2 text-sm font-bold rounded-md ${type === 'consumption' ? 'bg-white text-red-600 shadow' : 'text-slate-500'}`}>Use / Out</button>
                            <button onClick={() => setType('restock')} className={`flex-1 py-2 text-sm font-bold rounded-md ${type === 'restock' ? 'bg-white text-green-600 shadow' : 'text-slate-500'}`}>Restock / In</button>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500">Quantity</label>
                            <input type="number" min="1" className="w-full border p-2 rounded text-lg font-bold text-center" value={qty} onChange={e => setQty(Number(e.target.value))} />
                        </div>

                        {type === 'consumption' && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Used At (Property)</label>
                                    <select className="w-full border p-2 rounded" value={propId} onChange={e => setPropId(e.target.value)}>
                                        <option value="">-- General / Unknown --</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Received By (Employee)</label>
                                    <select className="w-full border p-2 rounded" value={empId} onChange={e => setEmpId(e.target.value)}>
                                        <option value="">-- Select Employee --</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="p-4 bg-slate-50 flex justify-end">
                        <button onClick={handleSubmit} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800">Confirm</button>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="p-6 bg-white border-b flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Package className="text-indigo-600" />
                        Inventory
                    </h1>
                    <p className="text-slate-500 text-sm">Track consumables and stock levels</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsItemModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition">
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b bg-white flex shrink-0">
                <button onClick={() => setActiveTab('catalog')} className={`px-4 py-3 border-b-2 font-bold text-sm ${activeTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Catalog</button>
                <button onClick={() => setActiveTab('logs')} className={`px-4 py-3 border-b-2 font-bold text-sm ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>History Logs</button>
            </div>

            {/* Filters */}
            {activeTab === 'catalog' && (
                <div className="p-4 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'catalog' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredInventory.map(item => {
                            const isLow = item.currentStock <= item.reorderThreshold;
                            return (
                                <div key={item.id} className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow ${isLow ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Package size={20} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setSelectedItem(item); setIsTransactionModalOpen(true); }}
                                                className="p-2 hover:bg-slate-100 rounded text-indigo-600"
                                                title="Update Stock"
                                            >
                                                <History size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); }}
                                                className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Delete item?')) deleteInventoryItem(item.id); }}
                                                className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">{item.category}</p>

                                    <div className="mt-4 flex items-end justify-between">
                                        <div>
                                            <div className="text-xs text-slate-400 font-bold uppercase">Stock</div>
                                            <div className={`text-2xl font-black ${isLow ? 'text-red-500' : 'text-slate-700'}`}>
                                                {item.currentStock} <span className="text-sm font-medium text-slate-400">{item.unit}</span>
                                            </div>
                                            {isLow && <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1"><AlertTriangle size={10} /> Low Stock (Below {item.reorderThreshold})</div>}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400 font-bold uppercase">Value</div>
                                            <div className="text-sm font-bold text-slate-600">
                                                ${(item.currentStock * item.costPerUnit).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredInventory.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400">
                                <Package size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No inventory items found.</p>
                                <button onClick={() => setIsItemModalOpen(true)} className="text-indigo-500 font-bold mt-2">Create First Item</button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* LOGS TAB */
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-500">Date</th>
                                    <th className="px-4 py-3 font-bold text-slate-500">Action</th>
                                    <th className="px-4 py-3 font-bold text-slate-500">Item</th>
                                    <th className="px-4 py-3 font-bold text-slate-500">Qty</th>
                                    <th className="px-4 py-3 font-bold text-slate-500">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sortedLogs.map(log => {
                                    const item = inventory.find(i => i.id === log.itemId);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                                {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.type === 'restock' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-bold"><ArrowDownRight size={12} /> Restock</span>}
                                                {log.type === 'consumption' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold"><ArrowUpRight size={12} /> Used</span>}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                {item?.name || 'Unknown Item'}
                                            </td>
                                            <td className="px-4 py-3 font-bold">
                                                {log.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {log.notes || (log.propertyId ? properties.find(p => p.id === log.propertyId)?.name : '-')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {sortedLogs.length === 0 && <div className="p-8 text-center text-slate-400">No transactions recorded yet.</div>}
                    </div>
                )}
            </div>

            {/* Render Modals */}
            {isItemModalOpen && <ItemModal />}
            {isTransactionModalOpen && <TransactionModal />}
        </div>
    );
};

export default InventoryView;
