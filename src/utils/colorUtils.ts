export const EMPLOYEE_COLORS = [
    'blue',
    'emerald',
    'violet',
    'amber',
    'rose',
    'cyan',
    'fuchsia',
    'lime',
    'orange',
    'teal',
    'indigo',
    'pink'
] as const;

export type EmployeeColor = typeof EMPLOYEE_COLORS[number];

export const getRandomEmployeeColor = (): EmployeeColor => {
    return EMPLOYEE_COLORS[Math.floor(Math.random() * EMPLOYEE_COLORS.length)];
};

const EMPLOYEE_BADGE_MAP: Record<string, { bg: string; text: string; border: string; ring: string; isHex: boolean }> = {
    blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', ring: 'focus:ring-blue-600', isHex: false },
    emerald: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', ring: 'focus:ring-emerald-600', isHex: false },
    violet: { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600', ring: 'focus:ring-violet-600', isHex: false },
    amber: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', ring: 'focus:ring-amber-600', isHex: false },
    rose: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', ring: 'focus:ring-rose-600', isHex: false },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-950', border: 'border-cyan-600', ring: 'focus:ring-cyan-600', isHex: false },
    fuchsia: { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600', ring: 'focus:ring-fuchsia-600', isHex: false },
    lime: { bg: 'bg-lime-500', text: 'text-lime-950', border: 'border-lime-600', ring: 'focus:ring-lime-600', isHex: false },
    orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', ring: 'focus:ring-orange-600', isHex: false },
    teal: { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600', ring: 'focus:ring-teal-600', isHex: false },
    indigo: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', ring: 'focus:ring-indigo-600', isHex: false },
    pink: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600', ring: 'focus:ring-pink-600', isHex: false },
};

export const getEmployeeColorClasses = (color: string) => {
    // Handle legacy Hex
    if (color.startsWith('#')) {
        return {
            bg: 'bg-slate-100',
            text: 'text-slate-800',
            border: 'border-slate-200',
            ring: 'focus:ring-slate-400',
            isHex: true
        };
    }

    return EMPLOYEE_BADGE_MAP[color] || EMPLOYEE_BADGE_MAP['blue'];
};

// STATIC MAP FOR ROW COLORS (To prevent Tailwind Purge)
export const ROW_COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-100/70 border-blue-200 hover:bg-blue-200/80',
    emerald: 'bg-emerald-100/70 border-emerald-200 hover:bg-emerald-200/80',
    violet: 'bg-violet-100/70 border-violet-200 hover:bg-violet-200/80',
    amber: 'bg-amber-100/70 border-amber-200 hover:bg-amber-200/80',
    rose: 'bg-rose-100/70 border-rose-200 hover:bg-rose-200/80',
    cyan: 'bg-cyan-100/70 border-cyan-200 hover:bg-cyan-200/80',
    fuchsia: 'bg-fuchsia-100/70 border-fuchsia-200 hover:bg-fuchsia-200/80',
    lime: 'bg-lime-100/70 border-lime-200 hover:bg-lime-200/80',
    orange: 'bg-orange-100/70 border-orange-200 hover:bg-orange-200/80',
    teal: 'bg-teal-100/70 border-teal-200 hover:bg-teal-200/80',
    indigo: 'bg-indigo-100/70 border-indigo-200 hover:bg-indigo-200/80',
    pink: 'bg-pink-100/70 border-pink-200 hover:bg-pink-200/80',
};
