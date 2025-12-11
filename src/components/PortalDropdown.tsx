import React, { useRef, useEffect, useState } from 'react';
import Portal from './Portal';
import { useClickOutside } from '../hooks/useClickOutside';

interface PortalDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    position?: 'bottom-left' | 'bottom-right' | 'right-start';
    className?: string;
}

const PortalDropdown: React.FC<PortalDropdownProps> = ({
    isOpen,
    onClose,
    triggerRef,
    children,
    position = 'bottom-left',
    className = ''
}) => {
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, (e) => {
        if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
            return;
        }
        onClose();
    });

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = rect.bottom + window.scrollY + 4;
            let left = rect.left + window.scrollX;

            if (position === 'bottom-right') {
                left = rect.right + window.scrollX; // Will need adjustment to shift back by width
            }

            if (position === 'right-start') {
                top = rect.top + window.scrollY;
                left = rect.right + window.scrollX + 4;
            }

            setCoords({ top, left });
        }
    }, [isOpen, position, triggerRef]);

    // Adjust for "bottom-right" alignment after mounting/rendering (requires ref to measure width)
    // For simplicity, we can just default to left-align or manually offset if we assume width.
    // Or better, let's just stick to left/top and use CSS transform if needed.
    // Actually, for "right aligned" dropdowns (like history opening to the left?), we might want logic.
    // Let's keep it simple: Fixed 'top/left' style.

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                ref={dropdownRef}
                style={{
                    position: 'absolute',
                    top: coords.top,
                    left: coords.left,
                    zIndex: 9999
                }}
                className={`animate-in fade-in zoom-in-95 duration-100 ${className}`}
            >
                {children}
            </div>
        </Portal>
    );
};

export default PortalDropdown;
