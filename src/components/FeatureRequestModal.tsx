import React, { useState } from 'react';
import { X, Send, Lightbulb, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabaseClient';

interface FeatureRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeatureRequestModal: React.FC<FeatureRequestModalProps> = ({ isOpen, onClose }) => {
    const [suggestion, setSuggestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!suggestion.trim()) return;

        setIsSubmitting(true);

        try {
            // Try push to Supabase if available
            if (supabase) {
                await supabase.from('feature_requests').insert({
                    content: suggestion,
                    created_at: new Date().toISOString(),
                    user_agent: navigator.userAgent
                });
            }

            // Also log locally or simulate success
            console.log("🚀 Feature Request Submitted:", suggestion);

            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setSuggestion('');
                onClose();
            }, 2000);

        } catch (error) {
            console.error("Failed to submit feature request", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-5 h-5 text-yellow-300" />
                            <h2 className="text-xl font-bold">Have an Idea?</h2>
                        </div>
                        <p className="text-violet-100 text-sm opacity-90">Help us improve existing features or suggest new ones.</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <Send size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Thanks for the input!</h3>
                            <p className="text-slate-500">We've received your suggestion.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    What's on your mind?
                                </label>
                                <textarea
                                    value={suggestion}
                                    onChange={(e) => setSuggestion(e.target.value)}
                                    placeholder="I wish the app could..."
                                    className="w-full h-32 px-4 py-3 bg-slate-50 text-slate-800 border-none rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all resize-none placeholder-slate-400"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!suggestion.trim() || isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-lg shadow-slate-200"
                                >
                                    {isSubmitting ? (
                                        <span className="animate-pulse">Sending...</span>
                                    ) : (
                                        <>
                                            <span>Send Idea</span>
                                            <Send size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureRequestModal;
