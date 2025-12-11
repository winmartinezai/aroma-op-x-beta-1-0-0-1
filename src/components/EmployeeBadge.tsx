import React from 'react';
import { getEmployeeColorClasses } from '../utils/colorUtils';

interface EmployeeBadgeProps {
    name: string;
    color?: string; // Can be a color name ('blue') or hex ('#123456')
    customInitials?: string; // NEW: Allow override
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

const EmployeeBadge: React.FC<EmployeeBadgeProps> = ({
    name,
    color = 'slate',
    customInitials,
    size = 'md',
    showName = true,
    className = '',
    onClick
}) => {
    const { bg, text, border, isHex } = getEmployeeColorClasses(color);

    const sizeClasses = {
        sm: 'w-5 h-5 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm'
    };

    const initial = customInitials || name.charAt(0).toUpperCase();

    const style = isHex ? { backgroundColor: color, color: '#fff' } : undefined;

    return (
        <div
            className={`flex items-center gap-2 ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={onClick}
        >
            <div
                className={`
                    ${sizeClasses[size]} 
                    rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 uppercase
                    ${!isHex ? `${bg} ${text} ${border} border` : ''}
                `}
                style={style}
                title={name}
            >
                {initial}
            </div>
            {showName && (
                <span className={`font-medium truncate ${isHex ? 'text-slate-700' : text}`}>
                    {name}
                </span>
            )}
        </div>
    );
};

export default EmployeeBadge;
