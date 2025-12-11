import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { EMPLOYEE_COLORS, type EmployeeColor, getEmployeeColorClasses } from '../utils/colorUtils';
import { useApp } from '../context/AppContext';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee?: { id: string, name: string, color: string, initials?: string, type?: '1099' | 'W2' } | null;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
    const { addEmployee, updateEmployee } = useApp();
    const [name, setName] = useState('');
    const [empId, setEmpId] = useState('');
    const [customInitials, setCustomInitials] = useState('');
    const [selectedColor, setSelectedColor] = useState<EmployeeColor>('blue');
    const [type, setType] = useState<'1099' | 'W2'>('1099');

    // Load data when modal opens or employee changes
    React.useEffect(() => {
        if (isOpen && employee) {
            setName(employee.name);
            setEmpId(employee.id);
            setCustomInitials(employee.initials || employee.name.charAt(0).toUpperCase());
            setSelectedColor(employee.color as EmployeeColor || 'blue');
            setType(employee.type || '1099');
        } else if (isOpen && !employee) {
            // Reset
            setName('');
            setEmpId('');
            setCustomInitials('');
            setSelectedColor('blue');
            setType('1099');
        }
    }, [isOpen, employee]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        if (employee) {
            // EDIT MODE
            updateEmployee(employee.id, {
                name,
                color: selectedColor,
                initials: customInitials || name.charAt(0).toUpperCase(),
                // type 
            });
        } else {
            // ADD MODE
            addEmployee({
                name,
                id: empId || `EMP-${Math.floor(Math.random() * 10000)}`,
                color: selectedColor,
                initials: customInitials || name.charAt(0).toUpperCase()
                // type 
            });
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus size={18} className="text-blue-500" />
                        {employee ? 'Edit Employee' : 'Add New Employee'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-[1fr_80px] gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input
                                autoFocus
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                placeholder="e.g. John Doe"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (!customInitials && e.target.value) {
                                        setCustomInitials(e.target.value.charAt(0).toUpperCase());
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Badge</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-center font-bold tracking-widest uppercase"
                                placeholder="JD"
                                maxLength={2}
                                value={customInitials}
                                onChange={e => setCustomInitials(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID (Optional)</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                placeholder="Auto-generated"
                                value={empId}
                                onChange={e => setEmpId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employment Type</label>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setType('1099')}
                                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === '1099' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    1099
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('W2')}
                                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === 'W2' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    W2
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Badge Color</label>
                        <div className="flex flex-wrap gap-2">
                            {EMPLOYEE_COLORS.map(color => {
                                const { bg, text, ring } = getEmployeeColorClasses(color);
                                const isSelected = selectedColor === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${bg} ${text} ${isSelected ? `ring-2 ring-offset-2 ${ring}` : 'hover:scale-110'}`}
                                    >
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!name}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {employee ? 'Save Changes' : 'Create Employee Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
