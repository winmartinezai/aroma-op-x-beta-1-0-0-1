import React, { useState, useEffect } from 'react';
import { FileSignature, X, Send } from 'lucide-react';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSign: (name: string, email: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSign }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setEmail('');
            setIsVerified(false);
        }
    }, [isOpen]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        if (val.length > 2) {
            setEmail(val.toLowerCase().replace(/\s+/g, '.') + '@aroma-op-x.com');
            setIsVerified(true);
        } else {
            setEmail('');
            setIsVerified(false);
        }
    };

    const handleSubmit = () => {
        if (isVerified) {
            onSign(name, email);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileSignature size={18} className="text-blue-600" />
                        Digital Signature
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type to sign..."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Generated Email ID</label>
                        <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            {email || 'Waiting for signature...'}
                        </div>
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!isVerified}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isVerified ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                            <Send size={16} />
                            Submit Invoice
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400">
                        By clicking submit, you certify that the work has been completed.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
