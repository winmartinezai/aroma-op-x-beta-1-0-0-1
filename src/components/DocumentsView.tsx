import React, { useState } from 'react';
import { FileText, Folder, Upload, Search, Download, Trash2, MoreVertical, File } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DocumentsView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Data for "Feature I haven't thought about"
    const docs = [
        { id: 1, name: 'Lease_Template_2025.pdf', type: 'PDF', size: '2.4 MB', date: 'Dec 10, 2025', tag: 'Legal' },
        { id: 2, name: 'Employee_Handbook.docx', type: 'DOCX', size: '1.1 MB', date: 'Nov 22, 2025', tag: 'HR' },
        { id: 3, name: 'Insurance_Liability.pdf', type: 'PDF', size: '4.5 MB', date: 'Oct 05, 2025', tag: 'Finance' },
        { id: 4, name: 'Cleaning_Checklist_Master.xlsx', type: 'XLSX', size: '150 KB', date: 'Dec 01, 2025', tag: 'Ops' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Folder className="text-blue-600" size={20} />
                        Documents Center
                    </h2>
                    <p className="text-xs text-slate-500">Central repository for contracts, templates, and compliance.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                        <Upload size={14} />
                        Upload
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mobile-card-container p-6 overflow-y-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">File Name</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Date Added</th>
                                <th className="px-6 py-3 text-right">Size</th>
                                <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {docs.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <FileText size={16} />
                                            </div>
                                            <span className="font-medium text-slate-700">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{doc.tag}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{doc.date}</td>
                                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">{doc.size}</td>
                                    <td className="px-6 py-4 flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"><Download size={14} /></button>
                                        <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Empty State visual if needed */}
                    <div className="p-8 text-center border-t border-slate-100 bg-slate-50/30">
                        <p className="text-xs text-slate-400">Pro Tip: Drag and drop files anywhere to upload.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsView;
