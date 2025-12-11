import React, { useState, useEffect, useRef } from 'react';
import { Lock, X } from 'lucide-react';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
}

const CORRECT_PIN = '1234'; // Hardcoded for now per plan

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, title = 'Enter Security PIN' }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setError(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError(false);

        // Auto-advance
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check completion
        if (index === 3 && value) {
            const code = newPin.join('');
            if (code === CORRECT_PIN) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 200);
            } else {
                setError(true);
                // Clear after error
                setTimeout(() => {
                    setPin(['', '', '', '']);
                    inputRefs.current[0]?.focus();
                }, 500);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors ${error ? 'bg-red-100 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                        <Lock size={32} />
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                        <p className={`text-sm mt-1 transition-colors ${error ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                            {error ? 'Incorrect PIN. Try again.' : 'Authorized personnel only'}
                        </p>
                    </div>

                    <div className="flex gap-3 mt-2">
                        {[0, 1, 2, 3].map((i) => (
                            <input
                                key={i}
                                ref={el => { if (el) inputRefs.current[i] = el; }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={pin[i]}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${error
                                    ? 'border-red-300 text-red-600 focus:ring-red-100 bg-red-50'
                                    : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-100'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="text-xs text-slate-400 mt-4 font-mono">
                        Default PIN: 1234
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinModal;
