import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sparkles, LogOut, DollarSign, Calendar, CheckCircle, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const EmployeePortal: React.FC = () => {
    const { employeeId, pin } = useParams<{ employeeId: string; pin: string }>();
    const navigate = useNavigate();
    const { employees, jobs, updateJob, settings } = useApp();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [newExtras, setNewExtras] = useState<{ [jobId: string]: { description: string; amount: string } }>({});
    const [showSuccess, setShowSuccess] = useState(false);

    // Validate PIN and authenticate
    useEffect(() => {
        if (!employeeId || !pin) {
            navigate('/');
            return;
        }

        const emp = employees.find(e => e.id === employeeId);
        if (!emp) {
            alert('Employee not found');
            navigate('/');
            return;
        }

        // Validate PIN
        if (emp.portalPin !== pin) {
            alert('Invalid access code');
            navigate('/');
            return;
        }

        setEmployee(emp);
        setIsAuthenticated(true);
    }, [employeeId, pin, employees, navigate]);

    // Get current pay period (last 14 days)
    const payPeriodJobs = useMemo(() => {
        if (!employee) return [];

        const today = new Date();
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);

        return jobs.filter(job => {
            if (job.assignedTo !== employee.name) return false;
            const jobDate = new Date(job.date);
            return jobDate >= twoWeeksAgo && jobDate <= today;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [employee, jobs]);

    // Calculate total paycheck
    const totalPaycheck = useMemo(() => {
        return payPeriodJobs.reduce((sum, job) => {
            return sum + (job.employeePrice || 0) + (job.extrasPrice || 0);
        }, 0);
    }, [payPeriodJobs]);

    const handleAddExtras = (jobId: string) => {
        const extras = newExtras[jobId];
        if (!extras || !extras.description || !extras.amount) {
            alert('Please select an extra or enter custom details');
            return;
        }

        const amount = parseFloat(extras.amount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        // Update job with new extras
        const updatedExtras = job.extras ? `${job.extras}; ${extras.description}` : extras.description;
        updateJob(jobId, {
            extras: updatedExtras,
            extrasPrice: (job.extrasPrice || 0) + amount
        });

        // Clear form
        setNewExtras(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
        });

        alert('Extras added successfully!');
    };

    // TODO: Implement preset dropdown UI
    // const handlePresetSelect = (jobId: string, preset: { name: string; price: number }) => {
    //     setNewExtras(prev => ({
    //         ...prev,
    //         [jobId]: {
    //             description: preset.name,
    //             amount: preset.price.toString()
    //         }
    //     }));
    // };

    const handleApprovePaycheck = () => {
        if (payPeriodJobs.length === 0) {
            alert('No jobs to approve');
            return;
        }

        // Generate email content
        const emailBody = `
Employee Paycheck Approval

Employee: ${employee.name}
Pay Period: Last 14 days
Total Amount: ${formatCurrency(totalPaycheck)}

Jobs Completed:
${payPeriodJobs.map(job => `
- ${job.date} | ${job.property} ${job.apt} | ${job.type}
  Base: ${formatCurrency(job.employeePrice)}
  ${job.extrasPrice > 0 ? `Extras: ${formatCurrency(job.extrasPrice)}` : ''}
  ${job.extras ? `Notes: ${job.extras}` : ''}
`).join('\n')}

Approved at: ${new Date().toLocaleString()}

---
Sent from Aroma Op-X Employee Portal
        `.trim();

        console.log('Email to:', settings.employeeInvoiceEmail || 'admin@example.com');
        console.log(emailBody);

        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);

        alert(`Paycheck approved! Email sent to ${settings.employeeInvoiceEmail || 'admin'}`);
    };

    const handleLogout = () => {
        navigate('/');
    };

    if (!isAuthenticated || !employee) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-white text-xl">Authenticating...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            {/* Success Animation */}
            {showSuccess && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={32} />
                            <span className="text-2xl font-bold">Paycheck Approved!</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-slate-900 border-4 border-white shadow-lg`}
                                style={{ backgroundColor: employee.color }}
                            >
                                {employee.initials || employee.name[0]}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{employee.name}</h1>
                                <p className="text-slate-300">Employee Portal</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors border border-red-400/30"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Paycheck Summary */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm opacity-90">Current Pay Period (Last 14 Days)</p>
                            <p className="text-5xl font-bold mt-2">{formatCurrency(totalPaycheck)}</p>
                            <p className="text-sm opacity-90 mt-2">{payPeriodJobs.length} Jobs Completed</p>
                        </div>
                        <DollarSign size={64} className="opacity-20" />
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="max-w-4xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar size={24} />
                    Your Jobs
                </h2>

                {payPeriodJobs.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
                        <p className="text-slate-300 text-lg">No jobs in the current pay period</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payPeriodJobs.map(job => (
                            <div key={job.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{job.property} {job.apt}</h3>
                                        <p className="text-slate-300">{job.type} - {job.size}</p>
                                        <p className="text-slate-400 text-sm">{new Date(job.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(job.employeePrice)}</p>
                                        {job.extrasPrice > 0 && (
                                            <p className="text-sm text-amber-400">+{formatCurrency(job.extrasPrice)} extras</p>
                                        )}
                                    </div>
                                </div>

                                {job.extras && (
                                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Extras</p>
                                        <p className="text-white">{job.extras}</p>
                                    </div>
                                )}

                                {/* Add Extras Form */}
                                <div className="border-t border-white/10 pt-4">
                                    <p className="text-sm text-slate-300 font-bold mb-2">Add Extras</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Description (e.g., Extra cleaning)"
                                            value={newExtras[job.id]?.description || ''}
                                            onChange={(e) => setNewExtras(prev => ({
                                                ...prev,
                                                [job.id]: { ...prev[job.id], description: e.target.value }
                                            }))}
                                            className="flex-1 px-3 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={newExtras[job.id]?.amount || ''}
                                            onChange={(e) => setNewExtras(prev => ({
                                                ...prev,
                                                [job.id]: { ...prev[job.id], amount: e.target.value }
                                            }))}
                                            className="w-32 px-3 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button
                                            onClick={() => handleAddExtras(job.id)}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Plus size={18} />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approve Button */}
            {payPeriodJobs.length > 0 && (
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={handleApprovePaycheck}
                        className="w-full py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold text-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Sparkles size={32} />
                        Approve & Submit Paycheck
                        <Sparkles size={32} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmployeePortal;
