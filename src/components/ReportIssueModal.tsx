import React, { useState } from 'react';
import { X, Send, Bug, Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose }) => {
    const { addLog } = useApp();
    const [description, setDescription] = useState('');
    const [includeLogs, setIncludeLogs] = useState(true);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!description.trim()) return alert('Please describe the issue.');

        setIsSending(true);

        // Simulate network delay
        setTimeout(() => {
            console.log("--- ISSUE REPORT ---");
            console.log("Description:", description);
            console.log("Include Logs:", includeLogs);

            addLog({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                type: 'success',
                message: 'Issue Report Sent',
                detail: `User reported: ${description.substring(0, 50)}...`
            });

            alert("Bug Report Sent! \n\nThank you for helping us make Aroma Op-x better.");
            setIsSending(false);
            setDescription('');
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Bug className="text-red-500" size={18} />
                        Report an Issue
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">What's happening?</label>
                        <textarea
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all resize-none h-32"
                            placeholder="Describe the bug or issue..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className={`p-2 rounded-lg ${includeLogs ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>
                            <Terminal size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-300">Include System Logs</div>
                            <div className="text-xs text-slate-500">Helps us debug faster</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={includeLogs}
                            onChange={e => setIncludeLogs(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isSending}
                        className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 ${isSending ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isSending ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send size={16} /> Send Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportIssueModal;
