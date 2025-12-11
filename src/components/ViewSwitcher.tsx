/**
 * ViewSwitcher Component
 * 
 * Segmented control for switching between different view modes
 * Inspired by FieldPulse/Jobber interface design
 */

import React from 'react';
import { List, Calendar, MapPin } from 'lucide-react';

export type ViewMode = 'list' | 'calendar' | 'map';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onChange: (view: ViewMode) => void;
    className?: string;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
    currentView,
    onChange,
    className = ''
}) => {
    const views: { id: ViewMode; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
        {
            id: 'list',
            label: 'List',
            icon: <List size={16} />
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <Calendar size={16} />
            // Calendar now enabled!
        },
        {
            id: 'map',
            label: 'Map',
            icon: <MapPin size={16} />,
            disabled: true // Future feature
        }
    ];

    return (
        <div className={`inline-flex bg-slate-100 rounded-lg p-1 ${className}`}>
            {views.map((view) => (
                <button
                    key={view.id}
                    onClick={() => !view.disabled && onChange(view.id)}
                    disabled={view.disabled}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-all duration-200 whitespace-nowrap
            ${currentView === view.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : view.disabled
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
          `}
                    title={view.disabled ? 'Coming soon' : `Switch to ${view.label} view`}
                >
                    {view.icon}
                    <span className="hidden sm:inline">{view.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ViewSwitcher;
