/**
 * CalendarView Component
 * 
 * Month-based calendar view for jobs with lazy loading
 * Inspired by FieldPulse calendar interface
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, type Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useJobsByMonth, getMonthName } from '../hooks/useJobsByMonth';
import { useApp } from '../context/AppContext';
import type { Job } from '../types/types';

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
    onJobClick?: (jobId: string) => void;
}

interface CalendarEvent extends Event {
    resource: Job;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onJobClick }) => {
    const { employees } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12

    // Fetch jobs for current month only
    const { jobs, totalJobs } = useJobsByMonth({ year, month });

    // Convert jobs to calendar events
    const events: CalendarEvent[] = useMemo(() => {
        return jobs.map(job => ({
            title: `${job.property} - ${job.apt} (${job.type})`,
            start: new Date(job.date),
            end: new Date(job.date),
            resource: job,
            allDay: true
        }));
    }, [jobs]);

    // Event style based on employee color
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const job = event.resource;
        const employee = employees.find(e => e.name === job.assignedTo);

        let backgroundColor = '#3b82f6'; // Default blue
        let borderColor = '#2563eb';

        if (employee?.color) {
            backgroundColor = employee.color;
            borderColor = employee.color;
        }

        // Status-based styling
        if (job.status === 'Complete') {
            backgroundColor = '#10b981'; // Green
            borderColor = '#059669';
        } else if (job.status === 'Cancel') {
            backgroundColor = '#ef4444'; // Red
            borderColor = '#dc2626';
        }

        return {
            style: {
                backgroundColor,
                borderColor,
                borderLeft: `4px solid ${borderColor}`,
                color: '#ffffff',
                fontSize: '12px',
                padding: '2px 4px',
                borderRadius: '4px'
            }
        };
    }, [employees]);

    // Navigate months
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Handle event click
    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        if (onJobClick) {
            onJobClick(event.resource.id);
        }
    }, [onJobClick]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Custom Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Previous Month"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                        <CalendarIcon size={20} className="text-slate-600" />
                        <h2 className="text-xl font-bold text-slate-800">
                            {getMonthName(month)} {year}
                        </h2>
                    </div>

                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Next Month"
                    >
                        <ChevronRight size={20} />
                    </button>

                    <button
                        onClick={handleToday}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>

                <div className="text-sm text-slate-600">
                    {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} this month
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-4">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleSelectEvent}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    views={['month']}
                    defaultView="month"
                    toolbar={false} // Using custom toolbar
                    popup
                    showMultiDayTimes
                />
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4 text-xs">
                    <span className="font-medium text-slate-600">Status:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span>Pending/In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>Cancelled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
