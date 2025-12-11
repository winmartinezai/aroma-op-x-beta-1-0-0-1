
import React from 'react';
import type { Job } from '../types/types';
import { formatCurrency, formatDate } from '../utils/helpers';
import EmployeeBadge from './EmployeeBadge';
import { Edit2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
// import { getEmployeeColorClasses } from '../utils/colorUtils'; // UNUSED

interface JobCardProps {
    job: Job;
    onEdit: (job: Job) => void;
    onClick?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onEdit, onClick }) => {

    // Status Logic for Color/Icon
    const getStatusConfig = (status: string, invoiced: boolean) => {
        if (status === 'Complete') {
            if (invoiced) return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
            return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        }
        if (status === 'In Progress') return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        return { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
    };

    const config = getStatusConfig(job.status, job.invoiceStatus === 'Sent');
    const StatusIcon = config.icon;

    // Determine row color based on Tech
    // Similar logic to Table Row: If Complete+Sent -> Green. Else Tech Color.
    let cardBgClass = 'bg-white';
    if (job.status === 'Complete' && job.invoiceStatus === 'Sent') {
        cardBgClass = 'bg-emerald-50/50';
    } else if (job.assignedTo) {
        // We could apply a subtle tint based on tech, or just keep it white to be clean.
        // User liked the "Green Row" logic.
        // Let's stick to white card with colored badges for now to be "Solid" and professional.
    }

    return (
        <div
            onClick={onClick}
            className={`rounded-xl border shadow-sm p-4 flex flex-col justify-between gap-3 hover:shadow-md transition-all cursor-pointer group relative ${cardBgClass} ${config.border}`}
        >
            {/* Header: Date & Job # */}
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {formatDate(job.date)}
                    </span>
                    <h4 className="font-bold text-slate-800 text-lg leading-tight mt-1">
                        {job.property} <span className="text-slate-400 font-normal text-sm">{job.apt}</span>
                    </h4>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-slate-400">
                        #{job.jobNumber || '---'}
                    </span>
                    <div className={`mt-1 p-1 rounded-full ${config.bg} ${config.color}`}>
                        <StatusIcon size={14} />
                    </div>
                </div>
            </div>

            {/* Middle: Type & Tech */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md uppercase">
                        {job.type}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                        {job.size}
                    </span>
                </div>
                <div>
                    <EmployeeBadge name={job.assignedTo} size="sm" showName={false} />
                </div>
            </div>

            {/* Footer: Price & Edit */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-1">
                <span className="font-bold text-slate-700">
                    {formatCurrency(job.clientPrice)}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(job);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Edit2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default JobCard;
