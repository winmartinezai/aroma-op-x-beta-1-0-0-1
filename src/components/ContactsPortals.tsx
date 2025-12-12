
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronRight, ExternalLink, Search, Phone, User, Globe } from 'lucide-react';

const ContactsPortals: React.FC = () => {
  const { properties, portals } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Search matches
  const filteredProperties = properties.filter(p => {
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    return (
        p.name.toLowerCase().includes(term) ||
        (p.managementGroup && p.managementGroup.toLowerCase().includes(term)) ||
        (p.portal && p.portal.toLowerCase().includes(term))
    );
  });

  const bestMatch = searchText && filteredProperties.length > 0 ? filteredProperties[0] : null;
  const matchPortalUrl = bestMatch ? portals[bestMatch.portal] : null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      // NOTE: Removed auto-open logic. Tab only opens via the arrow button now.
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 overflow-hidden relative z-20">
      {/* Header Container */}
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center p-1 bg-white">
        
        {/* Accordion Trigger */}
        <div 
            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors shrink-0"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="text-slate-400">
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            <span className="font-bold text-slate-700 text-sm whitespace-nowrap">Contacts & Portals</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                {filteredProperties.length}
            </span>
        </div>

        {/* Separator (Desktop) */}
        <div className="hidden lg:block w-px h-6 bg-slate-200 mx-2"></div>

        {/* Search & Info Center Area */}
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 p-1">
            
            {/* Search Input - Dark Style with Fixed Off-White Font */}
            <div className="relative w-full sm:w-64 group" onClick={(e) => e.stopPropagation()}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
                <input 
                    type="text" 
                    placeholder="Quick Find..." 
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner font-medium"
                    value={searchText}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Quick Info Center (The "Radio Display") */}
            {bestMatch && !isOpen && (
                <div className="flex-1 w-full flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Match</span>
                        <span className="text-xs font-bold text-slate-800 truncate">{bestMatch.name}</span>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200"></div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-1 overflow-hidden">
                        {bestMatch.contact && (
                            <div className="flex items-center gap-1.5 truncate">
                                <User size={12} className="text-blue-500" />
                                <span className="truncate">{bestMatch.contact}</span>
                            </div>
                        )}
                        
                        {bestMatch.phone && (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <Phone size={12} className="text-emerald-500" />
                                <a href={`tel:${bestMatch.phone}`} className="hover:underline hover:text-emerald-700">{bestMatch.phone}</a>
                            </div>
                        )}

                        {matchPortalUrl && (
                            <a 
                                href={matchPortalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 transition-colors"
                            >
                                <Globe size={10} />
                                {bestMatch.portal}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Accordion Table Content */}
      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto max-h-60 custom-scrollbar">
            <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-4 py-2 border-b">Property</th>
                        <th className="px-4 py-2 border-b">Contact</th>
                        <th className="px-4 py-2 border-b">Phone</th>
                        <th className="px-4 py-2 border-b">Management</th>
                        <th className="px-4 py-2 border-b">Portal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredProperties.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">
                                No properties match "{searchText}"
                            </td>
                        </tr>
                    ) : (
                        filteredProperties.map((prop) => {
                            const portalUrl = portals[prop.portal];
                            const isMatch = searchText && prop.name.toLowerCase().includes(searchText.toLowerCase());
                            
                            return (
                                <tr key={prop.id} className={`transition-colors ${isMatch ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                                    <td className="px-4 py-2 font-medium text-slate-700">{prop.name}</td>
                                    <td className="px-4 py-2 text-slate-600">{prop.contact || '—'}</td>
                                    <td className="px-4 py-2 text-slate-600 font-mono">
                                        {prop.phone ? (
                                            <a href={`tel:${prop.phone.replace(/[^0-9]/g, '')}`} className="hover:text-blue-600 hover:underline">
                                                {prop.phone}
                                            </a>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">
                                        {prop.managementGroup && (
                                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase tracking-wide">
                                                {prop.managementGroup}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        {prop.portal ? (
                                            <a 
                                                href={portalUrl || '#'} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-1 font-medium hover:underline ${
                                                    portalUrl ? 'text-blue-600' : 'text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {prop.portal}
                                                {portalUrl && <ExternalLink size={10} />}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPortals;
// Force git update
