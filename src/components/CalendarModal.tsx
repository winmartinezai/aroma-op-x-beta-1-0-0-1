import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { getStartOfMonth, getEndOfMonth, getStartOfWeek, getEndOfWeek, isSameDay } from '../utils/dateUtils';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onSelectDate: (date: Date) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, currentDate, onSelectDate }) => {
    if (!isOpen) return null;

    const [viewDate, setViewDate] = useState(new Date(currentDate));

    // Reset view when opening
    useEffect(() => {
        if (isOpen) {
            setViewDate(new Date(currentDate));
        }
    }, [isOpen, currentDate]);

    const handlePrevMonth = () => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setViewDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setViewDate(newDate);
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        onSelectDate(today);
        onClose();
    };

    // Generate Calendar Grid
    const startOfMonth = getStartOfMonth(viewDate);
    const endOfMonth = getEndOfMonth(viewDate);
    const startGrid = getStartOfWeek(startOfMonth);
    const endGrid = getEndOfWeek(endOfMonth);

    const days = [];
    let day = new Date(startGrid);
    while (day <= endGrid) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }

    const isToday = (date: Date) => isSameDay(date, new Date());
    const isSelected = (date: Date) => isSameDay(date, currentDate);
    const isCurrentMonth = (date: Date) => date.getMonth() === viewDate.getMonth();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[340px] animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon size={18} className="text-blue-600" />
                        Select Date
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Month Nav */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="font-bold text-slate-700">
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-xs font-bold text-slate-400 py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {days.map((date, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                onSelectDate(date);
                                onClose();
                            }}
                            className={`
                                h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                ${!isCurrentMonth(date) ? 'text-slate-300' : 'text-slate-700'}
                                ${isSelected(date) ? 'bg-blue-600 text-white shadow-md scale-110' : 'hover:bg-slate-100'}
                                ${isToday(date) && !isSelected(date) ? 'text-blue-600 font-bold bg-blue-50' : ''}
                            `}
                        >
                            {date.getDate()}
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex justify-center pt-2 border-t border-slate-100">
                    <button onClick={handleToday} className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors">
                        Jump to Today
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CalendarModal;
