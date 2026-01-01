import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

interface ToastSystemProps {
    notifications: Notification[];
    onRemove: (id: string) => void;
}

const ToastSystem: React.FC<ToastSystemProps> = ({ notifications, onRemove }) => {
    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
            {notifications.map((notif) => (
                <ToastItem key={notif.id} notification={notif} onRemove={onRemove} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    notification: Notification;
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 4000); // Auto close after 4s
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(notification.id);
        }, 300); // Match animation duration
    };

    const getIcon = () => {
        switch(notification.type) {
            case 'success': return <CheckCircle2 size={18} className="text-neon-green" />;
            case 'error': return <AlertCircle size={18} className="text-neon-pink" />;
            case 'warning': return <AlertTriangle size={18} className="text-neon-yellow" />;
            default: return <Info size={18} className="text-neon-blue" />;
        }
    };

    const getBorderColor = () => {
        switch(notification.type) {
            case 'success': return 'border-neon-green/30 bg-neon-green/5';
            case 'error': return 'border-neon-pink/30 bg-neon-pink/5';
            case 'warning': return 'border-neon-yellow/30 bg-neon-yellow/5';
            default: return 'border-neon-blue/30 bg-neon-blue/5';
        }
    };

    return (
        <div 
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${getBorderColor()} ${isExiting ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0 animate-scale-in'}`}
        >
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-white leading-tight mb-1">{notification.title}</h4>
                <p className="text-xs text-gray-400 leading-snug">{notification.message}</p>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={14} />
            </button>
        </div>
    );
};

export default ToastSystem;