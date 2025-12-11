/**
 * JobActionMenu Component
 * 
 * Kebab menu (⋮) for job row actions
 * Inspired by Simpro/FieldPulse interface design
 */

import React, { useState, useRef } from 'react';
import { Edit2, Copy, FileText, Trash2, MoreVertical } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface JobActionMenuProps {
    onEdit: () => void;
    onDuplicate?: () => void;
    onInvoice?: () => void;
    onDelete: () => void;
}

const JobActionMenu: React.FC<JobActionMenuProps> = ({
    onEdit,
    onDuplicate,
    onInvoice,
    onDelete
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useClickOutside(menuRef, () => setIsOpen(false));

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                title="Actions"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={() => handleAction(onEdit)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Edit2 size={16} className="text-blue-500" />
                        <span>Edit Job</span>
                    </button>

                    {onDuplicate && (
                        <button
                            onClick={() => handleAction(onDuplicate)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Copy size={16} className="text-purple-500" />
                            <span>Duplicate</span>
                        </button>
                    )}

                    {onInvoice && (
                        <button
                            onClick={() => handleAction(onInvoice)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <FileText size={16} className="text-emerald-500" />
                            <span>Create Invoice</span>
                        </button>
                    )}

                    <div className="h-px bg-slate-200 my-1"></div>

                    <button
                        onClick={() => handleAction(onDelete)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={16} />
                        <span>Delete Job</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default JobActionMenu;
