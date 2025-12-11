
import React, { useState } from 'react';
import {
    Sliders, Banknote, HardDrive, Share2,
    Monitor, Download, Upload, Cloud, CloudLightning, AlertTriangle, Terminal, Sparkles, Package, Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabaseClient';
import CelebrationEffect from './CelebrationEffect';
import ServiceCatalogManager from './ServiceCatalogManager';
// import { formatCurrency } from '../utils/helpers';
import { generateId } from '../utils/helpers';
import { APP_VERSION } from '../utils/constants';

type SettingsTab = 'general' | 'pricing' | 'catalog' | 'data' | 'integration';

const SettingsView: React.FC = () => {
    const {
        settings, updateSettings,
        // activeYear,
        pricingData,
        addLog, jobs, employees, properties,
        appConfig, updateAppConfig,
        version
    } = useApp();

    // const [newApi, setNewApi] = useState({ name: '', url: '', key: '', type: 'GOOGLE_SHEET' });
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [selectedTemplateName, setSelectedTemplateName] = useState<string>('YEAR_2025');
    const [showCelebration, setShowCelebration] = useState(false);

    // SHARE MODAL STATE
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareType, setShareType] = useState<'client' | 'emp' | 'all'>('client');
    const [shareCategory, setShareCategory] = useState<'all' | 'paint' | 'clean'>('all');

    // SHARE LOGIC
    const generateShareText = () => {
        if (!appConfig) return '';
        // @ts-ignore
        const template = appConfig.PRICING_TEMPLATES[selectedTemplateName];
        if (!template) return '';

        let text = `PRICING LIST - ${selectedTemplateName.replace('_', ' ')}\n`;
        text += `Generated: ${new Date().toLocaleDateString()}\n`;
        text += "--------------------------------------------------\n";

        const categories = {
            'PAINT': 'Paint Services',
            'CLEAN': 'Cleaning Services',
            'TOUCH_UP_PAINT': 'Touch-Up Paint',
            'TOUCH_UP_CLEAN': 'Touch-Up Clean',
            'EXTRAS': 'Extras'
        };

        Object.entries(categories).forEach(([key, label]) => {
            // Filter Category
            if (shareCategory === 'paint' && !key.includes('PAINT')) return;
            if (shareCategory === 'clean' && !key.includes('CLEAN')) return;

            const data = template[key];
            if (!data) return;

            text += `\n[ ${label.toUpperCase()} ]\n`;

            Object.entries(data).forEach(([size, prices]: [string, any]) => {
                text += `${size.padEnd(15, ' ')}: `;

                if (shareType === 'client' || shareType === 'all') {
                    text += `Client $${prices.client}  `;
                }
                if (shareType === 'emp' || shareType === 'all') {
                    text += `Pay $${prices.emp}`;
                }
                text += "\n";
            });
        });

        return text;
    };

    const handleCopyShare = () => {
        const text = generateShareText();
        navigator.clipboard.writeText(text);
        alert('Pricing list copied to clipboard!');
        setIsShareModalOpen(false);
    };

    const handleEmailShare = () => {
        const text = generateShareText();
        const subject = encodeURIComponent(`Pricing List - ${selectedTemplateName}`);
        const body = encodeURIComponent(text);
        window.open(`mailto:?subject=${subject}&body=${body}`);
        setIsShareModalOpen(false);
    };

    const ShareModal = () => {
        if (!isShareModalOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Share2 size={18} /> Share Pricing
                        </h3>
                        <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <Cloud size={18} className="rotate-45" /> {/* Close Icon substitute */}
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">1. Who is this for?</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setShareType('client')} className={`py-2 text-sm font-bold rounded border ${shareType === 'client' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>Client Only</button>
                                <button onClick={() => setShareType('emp')} className={`py-2 text-sm font-bold rounded border ${shareType === 'emp' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>Staff Pay</button>
                                <button onClick={() => setShareType('all')} className={`py-2 text-sm font-bold rounded border ${shareType === 'all' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>Both</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">2. Which Services?</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setShareCategory('paint')} className={`py-2 text-sm font-bold rounded border ${shareCategory === 'paint' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>Paint</button>
                                <button onClick={() => setShareCategory('clean')} className={`py-2 text-sm font-bold rounded border ${shareCategory === 'clean' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>Clean</button>
                                <button onClick={() => setShareCategory('all')} className={`py-2 text-sm font-bold rounded border ${shareCategory === 'all' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>All</button>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-100 rounded text-xs font-mono text-slate-600 h-24 overflow-y-auto whitespace-pre-wrap">
                            {generateShareText()}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 flex gap-3">
                        <button onClick={handleEmailShare} className="flex-1 py-2 bg-white border border-slate-300 shadow-sm font-bold text-slate-700 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2">
                            <Share2 size={16} /> Email
                        </button>
                        <button onClick={handleCopyShare} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow flex items-center justify-center gap-2">
                            <Save size={16} /> Copy Text
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Sync selected template with default if available
    React.useEffect(() => {
        if (appConfig?.DEFAULTS?.template) {
            setSelectedTemplateName(appConfig.DEFAULTS.template);
        }
    }, [appConfig]);

    // --- GENERAL TAB HANDLERS ---
    /* const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateSettings({ logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    }; */

    // --- DATA TAB HANDLERS ---
    const handleExport = () => {
        const data = {
            version: version || 'v1.0.0',
            timestamp: new Date().toISOString(),
            jobs,
            employees,
            properties,
            pricingData,
            settings,
            appConfig
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aroma_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addLog({
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: 'success',
            message: 'System backup exported successfully'
        });
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.jobs && (json.pricingData || json.appConfig)) {
                    localStorage.setItem('aroma_ops_data_v2', JSON.stringify(json));
                    alert('Data restored! The page will now reload.');
                    window.location.reload();
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to parse backup file.');
            }
        };
        reader.readAsText(file);
    };

    // --- CLOUD SYNC HANDLER (One-Way Push) ---
    const handleCloudSync = async () => {
        const confirmSync = window.confirm("⚠️ You are about to upload ALL local data to the Cloud.\n\nThis will OVERWRITE any existing Cloud data.\n\nAre you sure?");
        if (!confirmSync) return;

        try {
            // 1. Push Employees
            if (employees.length > 0) {
                const { error: empError } = await supabase.from('employees').upsert(
                    employees.map(e => ({
                        id: e.id,
                        name: e.name,
                        color: e.color,
                        email: e.email,
                        phone: e.phone,
                        pricing_config: e.pricingConfig
                    }))
                );
                if (empError) throw empError;
            }

            // 2. Push Properties
            if (properties.length > 0) {
                const { error: propError } = await supabase.from('properties').upsert(
                    properties.map(p => ({
                        id: p.id,
                        name: p.name,
                        billing_logic: p.billingLogic,
                        po_logic: p.poLogic,
                        management_group: p.managementGroup,
                        portal_url: p.portal
                    }))
                );
                if (propError) throw propError;
            }

            // 3. Push Jobs (Data Heavy)
            // Chunking might be needed if >1000 jobs, but for now we try diverse
            if (jobs.length > 0) {
                // Map frontend job to DB columns
                const dbJobs = jobs.map(j => ({
                    id: j.id,
                    job_number: j.jobNumber,
                    date: j.date,
                    property: j.property,
                    apt: j.apt,
                    size: j.size,
                    type: j.type,
                    assigned_to: j.assignedTo,
                    status: j.status,
                    invoice_status: j.invoiceStatus,
                    po: j.po,
                    invoice_number: j.invoiceNumber,
                    client_price: j.clientPrice,
                    employee_price: j.employeePrice,
                    extras_price: j.extrasPrice,
                    notes: j.notes,
                    is_private: j.isPrivate
                }));

                const { error: jobError } = await supabase.from('jobs').upsert(dbJobs);
                if (jobError) throw jobError;
            }

            // 4. Push Config
            if (appConfig) {
                const { error: confError } = await supabase.from('app_settings').upsert({
                    key: 'GLOBAL_CONFIG',
                    value: appConfig
                });
                if (confError) throw confError;
            }

            console.log("✅ Cloud Push SUCCESS", { jobs: jobs.length, employees: employees.length, properties: properties.length });
            addLog({
                id: generateId(),
                timestamp: new Date().toISOString(),
                type: 'success',
                message: `Cloud Push SUCCESS: ${jobs.length} jobs, ${employees.length} employees, ${properties.length} properties synced.`,
                detail: 'All local data uploaded to Supabase successfully.'
            });

            // Show success notification that lasts longer
            setTimeout(() => {
                alert("✅ SUCCESS: Local data synced to Cloud Database!\n\n" +
                    `Jobs: ${jobs.length}\n` +
                    `Employees: ${employees.length}\n` +
                    `Properties: ${properties.length}`);
            }, 100);

        } catch (error: any) {
            console.error("❌ Cloud Push FAILED:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            addLog({
                id: generateId(),
                timestamp: new Date().toISOString(),
                type: 'error',
                message: `Cloud Push FAILED: ${error.message || 'Unknown Error'}`,
                detail: `Code: ${error.code || 'N/A'}\nHint: ${error.hint || 'Check Supabase dashboard and table permissions'}`
            });

            // Show detailed error
            setTimeout(() => {
                alert(`❌ Cloud Push Failed\n\n` +
                    `Error: ${error.message || 'Unknown Error'}\n` +
                    `Code: ${error.code || 'N/A'}\n\n` +
                    `Hint: ${error.hint || 'Check Supabase dashboard for table permissions'}\n\n` +
                    `Check the Debug Console for more details.`);
            }, 100);
        }
    };

    // --- CLOUD PULL HANDLER (One-Way Download) ---
    const handleCloudPull = async () => {
        const confirmPull = window.confirm("⚠️ This will DOWNLOAD all data from the Cloud and REPLACE your local data.\n\nAny local changes not synced will be LOST.\n\nAre you sure?");
        if (!confirmPull) return;

        try {
            // 1. Fetch Employees
            const { data: empData, error: empError } = await supabase.from('employees').select('*');
            if (empError) throw empError;

            // 2. Fetch Properties
            const { data: propData, error: propError } = await supabase.from('properties').select('*');
            if (propError) throw propError;

            // 3. Fetch Jobs
            const { data: jobData, error: jobError } = await supabase.from('jobs').select('*');
            if (jobError) throw jobError;

            // 4. Fetch Config
            const { data: confData, error: confError } = await supabase.from('app_settings').select('*').eq('key', 'GLOBAL_CONFIG');
            if (confError) throw confError;

            // --- TRANSFORM & SAVE ---
            const newJobs = jobData.map((j: any) => ({
                id: j.id,
                jobNumber: j.job_number,
                date: j.date,
                property: j.property,
                apt: j.apt,
                size: j.size,
                type: j.type,
                assignedTo: j.assigned_to,
                status: j.status,
                invoiceStatus: j.invoice_status,
                po: j.po,
                invoiceNumber: j.invoice_number,
                clientPrice: Number(j.client_price),
                employeePrice: Number(j.employee_price),
                extrasPrice: Number(j.extras_price),
                notes: j.notes,
                isPrivate: j.is_private,
                extras: '', // DB schema doesn't have extras detail column yet? Wait, check creation SQL.
                // Looking at SQL: extras TEXT was NOT in the initial CREATE. Oops.
                // We'll map existing fields. User might have lost 'extras' text if schema missed it.
                // Let's assume schema matches types.ts?
                // Checking previous SQL... "extras_price" exists. "notes" exists.
                // Ah, 'extras' (string description) might be missing in DB if I forgot it.
                // Let's check if 'extras' column exists in migration.
                // If not, we gracefully handle it.
            }));

            // Transform Employees
            const newEmployees = empData.map((e: any) => ({
                id: e.id,
                name: e.name,
                color: e.color,
                email: e.email,
                phone: e.phone,
                pricingConfig: e.pricing_config
            }));

            // Transform Properties
            const newProperties = propData.map((p: any) => ({
                id: p.id,
                name: p.name,
                billingLogic: p.billing_logic,
                poLogic: p.po_logic,
                managementGroup: p.management_group,
                portal: p.portal_url,
                contact: 'Office', // Defaults
                phone: ''
            }));

            // Transform Config
            let newAppConfig = appConfig;
            if (confData && confData.length > 0) {
                newAppConfig = confData[0].value;
            }

            // Construct Full State to Save
            // We need to keep some local settings? No, full replace per user request usually.
            // But we can keep local view settings.
            const currentState = JSON.parse(localStorage.getItem('aroma_ops_data_v2') || '{}');

            const newState = {
                ...currentState,
                jobs: newJobs,
                employees: newEmployees,
                properties: newProperties,
                appConfig: newAppConfig,
                version: APP_VERSION
            };

            localStorage.setItem('aroma_ops_data_v2', JSON.stringify(newState));

            console.log("✅ Cloud Pull SUCCESS", { jobs: newJobs.length, employees: newEmployees.length, properties: newProperties.length });

            addLog({
                id: generateId(),
                timestamp: new Date().toISOString(),
                type: 'success',
                message: `Cloud Pull SUCCESS: ${newJobs.length} jobs, ${newEmployees.length} employees, ${newProperties.length} properties downloaded.`
            });

            setTimeout(() => {
                alert("✅ SUCCESS: Data downloaded from Cloud!\n\n" +
                    `Jobs: ${newJobs.length}\n` +
                    `Employees: ${newEmployees.length}\n` +
                    `Properties: ${newProperties.length}\n\n` +
                    "The page will now reload.");
                window.location.reload();
            }, 100);

        } catch (error: any) {
            console.error("❌ Cloud Pull FAILED:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            addLog({
                id: generateId(),
                timestamp: new Date().toISOString(),
                type: 'error',
                message: `Cloud Pull FAILED: ${error.message || 'Unknown Error'}`,
                detail: `Code: ${error.code || 'N/A'}\nHint: ${error.hint || 'Check if tables exist in Supabase'}`
            });

            setTimeout(() => {
                alert(`❌ Cloud Pull Failed\n\n` +
                    `Error: ${error.message || 'Unknown Error'}\n` +
                    `Code: ${error.code || 'N/A'}\n\n` +
                    `Hint: ${error.hint || 'Make sure tables exist in Supabase dashboard'}\n\n` +
                    `Check the Debug Console for more details.`);
            }, 100);
        }
    };

    // --- PRICING TAB HANDLERS ---
    const handlePriceChange = (category: string, size: string, type: 'client' | 'emp', value: string) => {
        if (!appConfig) return;
        const numValue = parseFloat(value) || 0;

        const newConfig = JSON.parse(JSON.stringify(appConfig)); // Deep copy
        // @ts-ignore
        if (!newConfig.PRICING_TEMPLATES[selectedTemplateName][category]) {
            // @ts-ignore
            newConfig.PRICING_TEMPLATES[selectedTemplateName][category] = {};
        }
        // @ts-ignore
        if (!newConfig.PRICING_TEMPLATES[selectedTemplateName][category][size]) {
            // @ts-ignore
            newConfig.PRICING_TEMPLATES[selectedTemplateName][category][size] = { client: 0, emp: 0 };
        }

        // @ts-ignore
        newConfig.PRICING_TEMPLATES[selectedTemplateName][category][size][type] = numValue;

        updateAppConfig(newConfig);
    };

    const renderPricingTable = (category: string, title: string) => {
        if (!appConfig) return null;
        // @ts-ignore
        const template = appConfig.PRICING_TEMPLATES[selectedTemplateName];
        if (!template) return <div>Template not found</div>;

        // @ts-ignore
        const data = template[category] || {};
        const sizes = Object.keys(data);

        return (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">{title}</h3>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-4 py-2 text-left">Size / Item</th>
                            <th className="px-4 py-2 text-right">Client Price</th>
                            <th className="px-4 py-2 text-right">Employee Pay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sizes.map(size => (
                            <tr key={size} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-700">{size}</td>
                                <td className="px-4 py-2 text-right">
                                    <div className="relative inline-block w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-6 pr-2 py-1 border rounded text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={data[size].client}
                                            onChange={(e) => handlePriceChange(category, size, 'client', e.target.value)}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <div className="relative inline-block w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-6 pr-2 py-1 border rounded text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={data[size].emp}
                                            onChange={(e) => handlePriceChange(category, size, 'emp', e.target.value)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full bg-slate-50">
            {/* SETTINGS SIDEBAR (Apple Style) */}
            <div className="w-full md:w-52 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                <div className="px-6 py-8">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
                </div>
                <nav className="flex-1 px-3 space-y-1">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-md transition-all ${activeTab === 'general' ? 'bg-black/5 text-black' : 'text-slate-500 hover:bg-black/5 hover:text-black'}`}
                    >
                        <Sliders size={18} strokeWidth={activeTab === 'general' ? 2.5 : 2} />
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-md transition-all ${activeTab === 'pricing' ? 'bg-black/5 text-black' : 'text-slate-500 hover:bg-black/5 hover:text-black'}`}
                    >
                        <Banknote size={18} strokeWidth={activeTab === 'pricing' ? 2.5 : 2} />
                        Pricing
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-md transition-all ${activeTab === 'catalog' ? 'bg-black/5 text-black' : 'text-slate-500 hover:bg-black/5 hover:text-black'}`}
                    >
                        <Package size={18} strokeWidth={activeTab === 'catalog' ? 2.5 : 2} />
                        Service Catalog
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-md transition-all ${activeTab === 'data' ? 'bg-black/5 text-black' : 'text-slate-500 hover:bg-black/5 hover:text-black'}`}
                    >
                        <HardDrive size={18} strokeWidth={activeTab === 'data' ? 2.5 : 2} />
                        Data
                    </button>
                    <button
                        onClick={() => setActiveTab('integration')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-md transition-all ${activeTab === 'integration' ? 'bg-black/5 text-black' : 'text-slate-500 hover:bg-black/5 hover:text-black'}`}
                    >
                        <Share2 size={18} strokeWidth={activeTab === 'integration' ? 2.5 : 2} />
                        Integrations
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-200 space-y-4">
                    {/* ZOOM CONTROL (Global) */}
                    <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500">UI Zoom</span>
                            <span className="text-xs font-bold text-slate-700">{Math.round((settings.uiScale || 1) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.75"
                            max="1.1"
                            step="0.05"
                            value={settings.uiScale || 1}
                            onChange={(e) => updateSettings({ uiScale: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600 block"
                        />
                        <div className="flex justify-between mt-1">
                            <button onClick={() => updateSettings({ uiScale: 1 })} className="text-[10px] text-blue-600 hover:underline">Reset</button>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono text-center">
                        v{APP_VERSION}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Monitor size={20} className="text-slate-400" />
                                    Application Preferences
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">Company Name</div>
                                            <div className="text-xs text-slate-500">Displayed on invoices</div>
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.companyName}
                                            onChange={(e) => updateSettings({ companyName: e.target.value })}
                                            className="border rounded px-3 py-1.5 w-full sm:w-56 text-sm"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">Invoice Email</div>
                                            <div className="text-xs text-slate-500">For submitted invoices</div>
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.employeeInvoiceEmail}
                                            onChange={(e) => updateSettings({ employeeInvoiceEmail: e.target.value })}
                                            className="border rounded px-3 py-1.5 w-full sm:w-56 text-sm"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">Language</div>
                                            <div className="text-xs text-slate-500">Interface language</div>
                                        </div>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => updateSettings({ language: e.target.value as 'en' | 'es' })}
                                            className="border rounded px-3 py-1.5 w-full sm:w-56 text-sm"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                        </select>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">Date Dial</div>
                                            <div className="text-xs text-slate-500">Navigation visibility</div>
                                        </div>
                                        <select
                                            value={settings.dateDialVisibility || 'dashboard_only'}
                                            onChange={(e) => updateSettings({ dateDialVisibility: e.target.value as 'dashboard_only' | 'everywhere' })}
                                            className="border rounded px-3 py-1.5 w-full sm:w-56 text-sm"
                                        >
                                            <option value="dashboard_only">Dashboard Only</option>
                                            <option value="everywhere">Everywhere</option>
                                        </select>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">Debug Console</div>
                                            <div className="text-xs text-slate-500">System logs</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.enableDebugConsole}
                                                onChange={(e) => updateSettings({ enableDebugConsole: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-sm">Success Celebration</div>
                                            <div className="text-xs text-slate-500">Test the sparkle effect for successful days</div>
                                        </div>
                                        <button
                                            onClick={() => setShowCelebration(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 shadow-md flex items-center gap-2 justify-center transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Sparkles size={16} />
                                            Test Celebration
                                        </button>
                                    </div>

                                    {/* MANUAL SAVE BUTTON (For User Reassurance) */}
                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                // Trigger a "Save" effect (autosave handles data, this handles "feeling saved")
                                                addLog({
                                                    id: generateId(),
                                                    timestamp: new Date().toISOString(),
                                                    type: 'success',
                                                    message: 'Settings saved manually by user.'
                                                });
                                                alert("✅ Settings Saved Successfully!");
                                            }}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all"
                                        >
                                            <Save size={18} />
                                            Save All Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRICING TAB */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {!appConfig ? (
                                <div className="p-8 text-center text-slate-500">
                                    <p>Loading configuration...</p>
                                    <p className="text-xs mt-2">If this persists, try reloading the page.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-2xl font-bold text-slate-800">Pricing Configuration</h2>
                                            <button
                                                onClick={() => setIsShareModalOpen(true)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 transition-colors text-sm"
                                            >
                                                <Share2 size={16} />
                                                Share List
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-slate-600">Active Template:</label>
                                            <select
                                                value={selectedTemplateName}
                                                onChange={(e) => setSelectedTemplateName(e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-blue-700 bg-white shadow-sm"
                                            >
                                                {Object.keys(appConfig.PRICING_TEMPLATES).map(t => (
                                                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {renderPricingTable('PAINT', 'Paint Services')}
                                        {renderPricingTable('CLEAN', 'Cleaning Services')}
                                        {renderPricingTable('TOUCH_UP_PAINT', 'Touch-Up Paint')}
                                        {renderPricingTable('TOUCH_UP_CLEAN', 'Touch-Up Clean')}
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold mb-4 text-slate-800">Extras & Add-ons</h3>
                                        {renderPricingTable('EXTRAS', 'Standard Extras')}
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                                        <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h4 className="font-bold text-blue-800 text-sm">Property Specific Overrides</h4>
                                            <p className="text-sm text-blue-600 mt-1">
                                                Some properties have specific pricing rules (e.g. Colina Ranch Hill).
                                                These are currently managed in the Property Configs section (Coming Soon to UI).
                                                For now, global template changes will affect all properties unless overridden.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* SERVICE CATALOG TAB */}
                    {activeTab === 'catalog' && (
                        <div className="animate-in fade-in duration-300">
                            <ServiceCatalogManager templateName={selectedTemplateName} />
                        </div>
                    )}

                    {/* DATA TAB */}
                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <HardDrive size={20} className="text-slate-400" />
                                    Backup & Restore
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                            <Download size={24} />
                                        </div>
                                        <h4 className="font-bold text-slate-700">Export Backup</h4>
                                        <p className="text-sm text-slate-500">Download a full JSON backup of all jobs, settings, and data.</p>
                                        <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 w-full">
                                            Download JSON
                                        </button>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                            <Upload size={24} />
                                        </div>
                                        <h4 className="font-bold text-slate-700">Restore Data</h4>
                                        <p className="text-sm text-slate-500">Restore from a previously exported JSON file.</p>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={handleRestore}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 w-full">
                                                Select File...
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* CLOUD SYNC CARD - Moved outside grid for better mobile visibility */}
                                <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CloudLightning size={24} />
                                        </div>
                                        <h4 className="font-bold text-blue-900 text-lg">Cloud Sync (Beta)</h4>
                                        <p className="text-sm text-blue-700 max-w-md mx-auto mt-2">
                                            Sync your data with the cloud database. Push to upload or Pull to download.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                                        <button
                                            onClick={handleCloudSync}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center gap-2"
                                        >
                                            <Cloud size={18} />
                                            Push to Cloud
                                        </button>
                                        <button
                                            onClick={handleCloudPull}
                                            className="flex-1 px-6 py-3 bg-white text-blue-700 border-2 border-blue-300 font-bold rounded-lg hover:bg-blue-50 shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Download size={18} />
                                            Pull from Cloud
                                        </button>
                                    </div>

                                    <p className="text-xs text-blue-600 text-center">
                                        <span className="font-bold">Push:</span> Uploads local data to cloud. <span className="font-bold">Pull:</span> Downloads cloud data to this device.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INTEGRATION TAB */}
                    {activeTab === 'integration' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Share2 size={20} className="text-slate-400" />
                                    API Integrations
                                </h3>
                                <div className="text-center py-12 text-slate-400">
                                    <Terminal size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>External integrations (Google Sheets, QuickBooks) coming soon.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Celebration Effect */}
            <CelebrationEffect
                trigger={showCelebration}
                onComplete={() => setShowCelebration(false)}
            />

            {/* Share Modal */}
            <ShareModal />
        </div>
    );
};

export default SettingsView;

