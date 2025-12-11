
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, History, Calendar } from 'lucide-react';
// import { MousePointer2 } from 'lucide-react';
import { getStartOfWeek, getEndOfWeek, formatDateRange, isWithinRange } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';
import CalendarModal from './CalendarModal';

interface DateHeaderProps {
    currentRange: { start: Date; end: Date } | null;
    onRangeChange: (range: { start: Date; end: Date } | null) => void;
    onClear: () => void;
    hasActiveFilter: boolean;
}

// CONFIG
const ITEM_WIDTH = 50; // Reduced from 60 for compactness
const VISIBLE_BUFFER = 15;

// type ViewUnit = 'day' | 'week' | 'month' | 'biweek';

const DateChooserDial: React.FC<DateHeaderProps> = ({ currentRange, onRangeChange }) => {
    const { jobs, employees, dateViewUnit, setDateViewUnit } = useApp(); // Access jobs and global view unit
    const viewUnit = dateViewUnit; // Alias for easier refactoring
    const setViewUnit = setDateViewUnit;
    const containerRef = useRef<HTMLDivElement>(null);

    // Base date for the visual center
    const effectiveDate = currentRange ? currentRange.start : new Date();
    const [virtualDate, setVirtualDate] = useState<Date>(new Date(effectiveDate));
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [animX, setAnimX] = useState(0); // Sub-pixel offset for smooth animation

    // Wheel Physics State
    const wheelAccumulator = useRef(0);
    // const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Sync virtual date when external range changes (e.g. from Sidebar or Import)
    useEffect(() => {
        if (currentRange) {
            // Only sync if NOT currently animating (to avoid fighting)
            if (!animationFrameRef.current) {
                // Check distance. If < 90 days, animate. Else jump.
                const diffTime = Math.abs(currentRange.start.getTime() - virtualDate.getTime());
                const diffDays = diffTime / (1000 * 3600 * 24);

                if (diffDays > 0 && diffDays < 90) {
                    animateDateTransition(currentRange.start);
                } else {
                    setVirtualDate(currentRange.start);
                }
            }
        }
    }, [currentRange]);

    // --- NAVIGATION HELPERS ---

    const animateDateTransition = (targetDate: Date) => {
        const startDate = new Date(virtualDate);
        const startTime = performance.now();
        const duration = 600; // Slightly faster for snappy feel (was 800)

        // Calculate total days difference for interpolation
        const diffTime = targetDate.getTime() - startDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Quint: 1 - pow(1 - x, 5)
            const ease = 1 - Math.pow(1 - progress, 5);

            const currentDayOffset = diffDays * ease;
            const integerDayOffset = Math.round(currentDayOffset);
            const fractionalShift = currentDayOffset - integerDayOffset;

            // 1. Update Integer Date (The "Center")
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + integerDayOffset);
            setVirtualDate(nextDate);

            // 2. Update Sub-pixel Offset (The "Slide")
            // We shift the container opposite to the fractional movement to create continuity
            setAnimX(-(fractionalShift * ITEM_WIDTH));

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                setVirtualDate(targetDate); // Snap to exact end
                setAnimX(0); // Reset offset
                animationFrameRef.current = null;
            }
        };

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Jump forward/back based on View Unit
    const navigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(virtualDate);
        const multiplier = direction === 'next' ? 1 : -1;

        // 1. Calculate Target Date
        if (viewUnit === 'day') {
            newDate.setDate(newDate.getDate() + multiplier);
        } else if (viewUnit === 'week') {
            newDate.setDate(newDate.getDate() + (multiplier * 7));
        } else if (viewUnit === 'biweek') {
            newDate.setDate(newDate.getDate() + (multiplier * 14));
        } else if (viewUnit === 'month') {
            newDate.setMonth(newDate.getMonth() + multiplier);
        }

        // 1. Handle Visual Update (Start Animation FIRST to set the ref)
        animateDateTransition(newDate);

        // 2. Update Parent (Data update)
        // We do this after starting animation so useEffect sees the active animation flag
        updateParentRange(newDate);
    };

    const updateParentRange = (date: Date) => {
        let start: Date;
        let end: Date;

        if (viewUnit === 'day') {
            start = date;
            // TIMELINE MODE: Start date is selected, end date is far future (e.g. 6 months)
            // This allows the user to see "Start Date -> Future"
            end = new Date(date);
            end.setDate(end.getDate() + 180);
        } else if (viewUnit === 'week') {
            start = getStartOfWeek(date);
            end = getEndOfWeek(date);
        } else if (viewUnit === 'biweek') {
            // Bi-week logic: Start of week -> +13 days
            start = getStartOfWeek(date);
            end = new Date(start);
            end.setDate(end.getDate() + 13);
            end.setHours(23, 59, 59, 999);
        } else { // month
            start = new Date(date.getFullYear(), date.getMonth(), 1);
            end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }

        // Prevent redundant updates (Fixes "fighting" / scroll jumping)
        if (currentRange &&
            start.getTime() === currentRange.start.getTime() &&
            end.getTime() === currentRange.end.getTime()) {
            return;
        }

        onRangeChange({ start, end });
    };

    // Select specific day (Clicking on the strip)
    const handleSelectDay = (date: Date) => {
        setVirtualDate(date);
        setAnimX(0);
        // If clicking a specific day, it usually makes sense to switch to that day or week context
        // But let's respect the current viewUnit for consistency
        updateParentRange(date);
    };

    const handleToggleViewAll = () => {
        if (currentRange) {
            onRangeChange(null); // Clear filter
        } else {
            // Restore to current date
            const today = new Date();
            setVirtualDate(today);
            setAnimX(0);
            updateParentRange(today);
        }
    };

    // --- PHYSICS-BASED WHEEL LOGIC ---
    const velocity = useRef(0);
    const isSpinning = useRef(false);
    const lastTime = useRef(0);

    // Ref to track virtual date for physics loop access
    const virtualDateRef = useRef(virtualDate);
    useEffect(() => { virtualDateRef.current = virtualDate; }, [virtualDate]);

    // Better Physics Loop with Ref-based Date
    const physicsLoopRef = useRef<(time: number) => void>(() => { });
    physicsLoopRef.current = (time: number) => {
        if (!isSpinning.current) return;

        const deltaTime = Math.min(time - lastTime.current, 50); // Cap dt
        lastTime.current = time;

        // Apply Friction
        velocity.current *= 0.92; // Friction

        // Update Accumulator
        wheelAccumulator.current += velocity.current * deltaTime;

        const TICK_THRESHOLD = 5; // Pixels/Units to trigger a date change

        if (Math.abs(wheelAccumulator.current) >= TICK_THRESHOLD) {
            const ticks = Math.trunc(wheelAccumulator.current / TICK_THRESHOLD);
            wheelAccumulator.current -= ticks * TICK_THRESHOLD;

            const next = new Date(virtualDateRef.current);
            if (viewUnit === 'day') next.setDate(next.getDate() + ticks);
            else if (viewUnit === 'week') next.setDate(next.getDate() + (ticks * 7));
            else if (viewUnit === 'biweek') next.setDate(next.getDate() + (ticks * 14));
            else if (viewUnit === 'month') next.setMonth(next.getMonth() + ticks);

            setVirtualDate(next); // This updates ref via effect
        }

        // Stop Condition
        if (Math.abs(velocity.current) < 0.005) {
            isSpinning.current = false;
            velocity.current = 0;
            // SNAP & SYNC
            updateParentRange(virtualDateRef.current);
        } else {
            requestAnimationFrame((t) => physicsLoopRef.current && physicsLoopRef.current(t));
        }
    };

    // Re-bind handleWheel to start loop
    const startSpin = (e: React.WheelEvent) => {
        if (!currentRange) return;
        // e.preventDefault(); // React synthetic event might not support this, handled on div?

        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        velocity.current += delta * 0.002; // Impulse

        // Clamp
        if (velocity.current > 0.5) velocity.current = 0.5;
        if (velocity.current < -0.5) velocity.current = -0.5;

        if (!isSpinning.current) {
            isSpinning.current = true;
            lastTime.current = performance.now();
            requestAnimationFrame((t) => physicsLoopRef.current && physicsLoopRef.current(t));
        }
    };

    // --- RENDER ITEMS ---
    const visibleItems = useMemo(() => {
        const items = [];
        for (let i = -VISIBLE_BUFFER; i <= VISIBLE_BUFFER; i++) {
            const d = new Date(virtualDate);
            d.setDate(d.getDate() + i);
            items.push({ date: d, index: i });
        }
        return items;
    }, [virtualDate]);

    // --- STATUS READER LOGIC ---
    const dayStats = useMemo(() => {
        if (!currentRange) return null;

        // Filter jobs for the VIRTUAL DATE (what the user is looking at)
        const targetDateStr = virtualDate.toISOString().split('T')[0];
        const dayJobs = jobs.filter(j => j.date === targetDateStr);

        // Calculate Active Employees
        const activeEmpNames = Array.from(new Set(dayJobs.map(j => j.assignedTo))).filter(Boolean);
        const activeEmployees = activeEmpNames.map(name => employees.find(e => e.name === name)).filter(Boolean) as any[];

        return {
            cancels: dayJobs.filter(j => j.status === 'Cancel').length,
            completed: dayJobs.filter(j => j.status === 'Complete').length,
            paint: dayJobs.filter(j => j.type.toLowerCase().includes('paint')).length,
            clean: dayJobs.filter(j => j.type.toLowerCase().includes('clean')).length,
            repair: dayJobs.filter(j => j.type.toLowerCase().includes('repair')).length,
            activeEmployees // EXPORTED
        };
    }, [jobs, employees, virtualDate, currentRange]);

    const displayDate = useMemo(() => {
        if (!currentRange) return "Viewing All History";

        if (viewUnit === 'day') return formatDateRange(virtualDate, virtualDate);
        if (viewUnit === 'week') return formatDateRange(getStartOfWeek(virtualDate), getEndOfWeek(virtualDate));
        if (viewUnit === 'biweek') {
            const s = getStartOfWeek(virtualDate);
            const e = new Date(s); e.setDate(e.getDate() + 13);
            return formatDateRange(s, e);
        }
        if (viewUnit === 'month') return virtualDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return formatDateRange(currentRange.start, currentRange.end);
    }, [currentRange, virtualDate, viewUnit]);

    const unbilledAmount = useMemo(() => {
        if (!currentRange) return 0;

        // Calculate the ACTUAL visible range based on virtualDate and viewUnit
        let start = currentRange.start;
        let end = currentRange.end;

        if (viewUnit === 'week') {
            start = getStartOfWeek(virtualDate);
            end = getEndOfWeek(virtualDate);
        } else if (viewUnit === 'biweek') {
            start = getStartOfWeek(virtualDate);
            end = new Date(start);
            end.setDate(end.getDate() + 13);
            end.setHours(23, 59, 59, 999);
        } else if (viewUnit === 'month') {
            start = new Date(virtualDate.getFullYear(), virtualDate.getMonth(), 1);
            end = new Date(virtualDate.getFullYear(), virtualDate.getMonth() + 1, 0);
        } else if (viewUnit === 'day') {
            start = new Date(virtualDate); start.setHours(0, 0, 0, 0);
            end = new Date(virtualDate); end.setHours(23, 59, 59, 999);
        }

        const rangeJobs = jobs.filter(j => isWithinRange(j.date, start, end));
        const unbilled = rangeJobs.filter(j => j.status === 'Complete' && j.invoiceStatus !== 'Sent');
        return unbilled.reduce((sum, j) => sum + (j.clientPrice || 0) + (j.extrasPrice || 0), 0);
    }, [jobs, currentRange, virtualDate, viewUnit]);

    return (
        <div
            className="bg-slate-900 border border-slate-800 flex flex-col relative shadow-md z-30 h-28 w-full rounded-xl overflow-hidden select-none transition-all"
            onWheel={startSpin}
        >

            {/* TOP BAR: CONTROLS & DISPLAY */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-slate-950/50 border-b border-white/5 min-h-9 shrink-0">

                {/* LEFT: Toggle Mode */}
                <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/10">
                    <button
                        onClick={() => {
                            setViewUnit('day');
                            onRangeChange({ start: virtualDate, end: virtualDate });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${viewUnit === 'day' && currentRange ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => {
                            setViewUnit('week');
                            onRangeChange({ start: getStartOfWeek(virtualDate), end: getEndOfWeek(virtualDate) });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${viewUnit === 'week' && currentRange ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => {
                            setViewUnit('biweek');
                            const start = getStartOfWeek(virtualDate);
                            const end = new Date(start); end.setDate(end.getDate() + 13);
                            onRangeChange({ start, end });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${viewUnit === 'biweek' && currentRange ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        2 Weeks
                    </button>
                    <button
                        onClick={() => {
                            setViewUnit('month');
                            const start = new Date(virtualDate.getFullYear(), virtualDate.getMonth(), 1);
                            const end = new Date(virtualDate.getFullYear(), virtualDate.getMonth() + 1, 0);
                            onRangeChange({ start, end });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${viewUnit === 'month' && currentRange ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Month
                    </button>
                </div>

                {/* CENTER: Date Display Badge */}
                <div className="flex items-center gap-2 order-2 lg:order-none lg:absolute lg:left-1/2 lg:-translate-x-1/2 pointer-events-none">
                    <span className={`text-[10px] font-mono font-medium tracking-wide px-3 py-0.5 rounded-full border shadow-sm transition-colors ${currentRange
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-emerald-900/50 text-emerald-400 border-emerald-800'
                        }`}>
                        {displayDate}
                    </span>
                </div>

                {/* RIGHT: View All Button & Blinking Light */}
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={handleToggleViewAll}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${!currentRange
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {!currentRange ? <CheckCircle2 size={10} /> : <History size={10} />}
                        {currentRange ? 'View All' : 'Filtering Off'}
                    </button>

                    {/* BLINKING LIGHT INDICATOR */}
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-colors duration-500 ${unbilledAmount > 0 ? 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`}></div>
                </div>

                {/* BOTTOM ROW: WHO'S WORKING & STATUS (wraps on medium screens) */}
                {dayStats && (
                    <div className="flex items-center gap-3 w-full lg:w-auto lg:ml-2 shrink-0 bg-slate-800/50 px-2 py-1 rounded-lg border border-white/10 order-3">
                        {/* 1. Who's Working (Avatars) - Now Clickable */}
                        {dayStats.activeEmployees.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden py-0.5 px-1">
                                {dayStats.activeEmployees.slice(0, 5).map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => {
                                            // Navigate to Employees view
                                            window.location.hash = '#/employees';
                                        }}
                                        className="ring-2 ring-slate-900 rounded-full z-0 hover:z-10 transition-all hover:scale-125 cursor-pointer active:scale-110"
                                        title={`View ${emp.name}'s paycheck`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-900 border border-white/20 shadow-lg uppercase
                                            ${emp.color === 'blue' ? 'bg-blue-400' :
                                                    emp.color === 'red' ? 'bg-red-400' :
                                                        emp.color === 'green' ? 'bg-emerald-400' :
                                                            emp.color === 'purple' ? 'bg-purple-400' :
                                                                emp.color === 'amber' ? 'bg-amber-400' : 'bg-slate-400'}`
                                            }
                                        >
                                            {emp.initials || emp.name[0]}
                                        </div>
                                    </button>
                                ))}
                                {dayStats.activeEmployees.length > 5 && (
                                    <div className="w-6 h-6 rounded-full bg-slate-700 ring-2 ring-slate-900 flex items-center justify-center text-[9px] text-slate-300 font-bold shadow-lg">
                                        +{dayStats.activeEmployees.length - 5}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="w-px h-4 bg-white/10"></div>

                        {/* 2. Calendar Trigger */}
                        <button
                            onClick={() => setIsCalendarOpen(true)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                            title="Select Date"
                        >
                            <Calendar size={16} />
                        </button>

                        {/* 3. Job Stats (Larger, More Visible) */}
                        <div className="flex items-center gap-3 text-[11px] font-mono border-l border-white/10 pl-3">
                            <span className="text-red-400 flex items-center font-bold" title="Canceled">
                                <span className="w-3 h-3 rounded-full bg-red-500 mr-1.5 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>
                                {dayStats.cancels}
                            </span>
                            <span className="text-emerald-400 flex items-center font-bold" title="Completed">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
                                {dayStats.completed}
                            </span>
                            <span className="text-blue-300 flex items-center font-bold" title="Paint">
                                <span className="w-3 h-3 rounded-full bg-blue-400 mr-1.5 shadow-[0_0_6px_rgba(96,165,250,0.6)]"></span>
                                {dayStats.paint}
                            </span>
                            <span className="text-purple-300 flex items-center font-bold" title="Clean">
                                <span className="w-3 h-3 rounded-full bg-purple-400 mr-1.5 shadow-[0_0_6px_rgba(192,132,252,0.6)]"></span>
                                {dayStats.clean}
                            </span>
                        </div>
                    </div>
                )}

            </div>

            {/* VISUAL DIAL AREA */}
            <div className="relative flex-1 w-full overflow-hidden bg-slate-900 group cursor-grab active:cursor-grabbing">

                {/* Navigation Arrows (Large clickable areas) */}
                <button
                    onClick={() => navigate('prev')}
                    className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-30 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-slate-800/30 cursor-pointer active:scale-95"
                    title={`Go Back 1 ${viewUnit}`}
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={() => navigate('next')}
                    className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-30 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-slate-800/30 cursor-pointer active:scale-95"
                    title={`Go Forward 1 ${viewUnit}`}
                >
                    <ChevronRight size={24} />
                </button>

                {/* Center Marker (Retro Red + Plastic Lens Effect) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[50px] -translate-x-1/2 z-10 pointer-events-none border-x border-slate-700/50 bg-gradient-to-b from-white/5 to-transparent shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] rounded-sm">
                    {/* The Red Indicator Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.8)]"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.8)]"></div>

                    {/* Subtle "Glass" Reflection */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20"></div>
                </div>

                {/* Date Strip */}
                <div
                    className="absolute top-0 bottom-0 left-1/2 h-full flex items-center"
                    ref={containerRef}
                    style={{ transform: `translateX(${animX}px)` }}
                >
                    {visibleItems.map((item) => {
                        const offset = item.index * ITEM_WIDTH;
                        const isCenter = item.index === 0;
                        const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;

                        return (
                            <div
                                key={item.date.toISOString()}
                                // Optimized transition duration (200ms) for snappy wheel feel
                                className="absolute flex flex-col items-center justify-center transition-transform duration-200 ease-out hover:bg-white/5 rounded-lg py-1"
                                style={{
                                    transform: `translateX(${offset}px) translateX(-50%)`,
                                    width: `${ITEM_WIDTH}px`,
                                    zIndex: isCenter ? 10 : 1,
                                    opacity: currentRange ? (Math.abs(item.index) > 4 ? 0.3 : 1) : 0.3
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectDay(item.date);
                                }}
                            >
                                <span className={`text-[8px] font-bold uppercase mb-0.5 ${isCenter ? 'text-red-400' : isWeekend ? 'text-slate-500' : 'text-slate-600'
                                    } `}>
                                    {item.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className={`font-sans text-lg font-bold transition-transform ${isCenter ? 'text-white scale-125 drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]' : isWeekend ? 'text-slate-600' : 'text-slate-500'
                                    } `}>
                                    {item.date.getDate()}
                                </span>
                                {/* Month Marker on the 1st */}
                                {item.date.getDate() === 1 && (
                                    <div className="absolute -top-3 bg-slate-700 text-slate-200 text-[7px] px-1 py-0 rounded border border-slate-600 pointer-events-none">
                                        {item.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>


            </div>

            {/* DISABLED OVERLAY (When View All is active) */}
            {
                !currentRange && (
                    <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 shadow-2xl flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Timeline Unlocked</span>
                            <span className="text-[10px] text-slate-500">Showing all records from database</span>
                        </div>
                    </div>
                )
            }

            {/* Calendar Modal */}
            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                currentDate={virtualDate}
                onSelectDate={(date) => {
                    setVirtualDate(date);
                    // Force immediate update of parent range based on new center date
                    // This ensures the table updates instantly
                    // The view unit remains whatever was selected (Day/Week/etc)
                    // Logic mimics updateParentRange but for the specific selected date
                    let start = new Date(date);
                    let end = new Date(date);

                    if (viewUnit === 'day') {
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                    } else if (viewUnit === 'week') {
                        start = getStartOfWeek(date);
                        end = getEndOfWeek(date);
                    } else if (viewUnit === 'biweek') {
                        start = getStartOfWeek(date);
                        end = new Date(start); end.setDate(end.getDate() + 13); end.setHours(23, 59, 59, 999);
                    } else if (viewUnit === 'month') {
                        start = new Date(date.getFullYear(), date.getMonth(), 1);
                        end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
                    }
                    onRangeChange({ start, end });
                    setIsCalendarOpen(false); // Close modal after selection
                }}
            />
        </div >
    );
};

export default DateChooserDial;
