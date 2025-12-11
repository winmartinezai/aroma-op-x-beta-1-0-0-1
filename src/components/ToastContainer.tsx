import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number; // milliseconds, default 5000
}

interface ToastContainerProps {
    notifications: ToastNotification[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onDismiss }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
            {notifications.map(notification => (
                <Toast
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => onDismiss(notification.id)}
                />
            ))}
        </div>
    );
};

interface ToastProps {
    notification: ToastNotification;
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDismiss, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [notification.duration, onDismiss]);

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle size={20} className="text-emerald-500" />;
            case 'error':
                return <XCircle size={20} className="text-red-500" />;
            case 'warning':
                return <AlertTriangle size={20} className="text-amber-500" />;
            case 'info':
                return <Info size={20} className="text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (notification.type) {
            case 'success':
                return 'bg-emerald-500/10 border-emerald-500/30';
            case 'error':
                return 'bg-red-500/10 border-red-500/30';
            case 'warning':
                return 'bg-amber-500/10 border-amber-500/30';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/30';
        }
    };

    return (
        <div
            className={`
        ${getBgColor()}
        backdrop-blur-md border rounded-lg p-4 shadow-2xl
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white mb-1">{notification.title}</h4>
                    {notification.message && (
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">{notification.message}</p>
                    )}
                </div>
                <button
                    onClick={() => {
                        setIsExiting(true);
                        setTimeout(onDismiss, 300);
                    }}
                    className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default ToastContainer;
