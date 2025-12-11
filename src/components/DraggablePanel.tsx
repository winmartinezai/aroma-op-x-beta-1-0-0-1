import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2, GripHorizontal } from 'lucide-react';

interface DraggablePanelProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    initialPosition?: { x: number; y: number };
    onPositionChange?: (pos: { x: number; y: number }) => void;
    className?: string;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
    title,
    children,
    onClose,
    initialPosition = { x: 100, y: 100 },
    onPositionChange,
    className = ''
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newPos = {
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                };
                setPosition(newPos);
                if (onPositionChange) {
                    onPositionChange(newPos);
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, onPositionChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    return (
        <div
            ref={panelRef}
            style={{
                left: position.x,
                top: position.y,
                zIndex: 50
            }}
            className={`fixed bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-75 ${className} ${isCollapsed ? 'w-auto h-auto' : 'w-80'}`}
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`px-3 py-2 bg-slate-100 border-b border-slate-200 rounded-t-xl flex justify-between items-center cursor-move select-none ${isDragging ? 'cursor-grabbing' : ''}`}
            >
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                    <GripHorizontal size={14} className="text-slate-400" />
                    {title}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                        {isCollapsed ? <Maximize2 size={12} /> : <Minus size={12} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-1 hover:bg-red-100 hover:text-red-500 rounded text-slate-500"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isCollapsed && (
                <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-b-xl">
                    {children}
                </div>
            )}
        </div>
    );
};

export default DraggablePanel;
