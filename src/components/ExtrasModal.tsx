import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { getExtrasList } from '../utils/pricing';
import type { Job } from '../types/types';
import { useApp } from '../context/AppContext';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onSave: (jobId: string, summary: string, total: number) => void;
}

const ExtrasModal: React.FC<ExtrasModalProps> = ({ isOpen, onClose, job, onSave }) => {
  const { appConfig } = useApp();
  if (!isOpen || !job) return null;

  const [rows, setRows] = useState<{ name: string; price: number }[]>([]);
  const availableExtras = getExtrasList(job.property, appConfig) || {};

  useEffect(() => {
    if (job.extras) {
      const parts = job.extras.split(',').map(s => s.trim());
      const parsed = parts.map(p => {
        const match = p.match(/(.*) \(\$(\d+)\)/);
        if (match) return { name: match[1], price: parseInt(match[2]) };
        return { name: p, price: 0 };
      });
      setRows(parsed);
    } else {
      setRows([{ name: '', price: 0 }]);
    }
  }, [job]);

  const updateRow = (index: number, field: 'name' | 'price', value: string | number) => {
    const newRows = [...rows];
    if (field === 'name') {
      newRows[index].name = value as string;
      // Auto-fill price if known
      // @ts-ignore
      const known = availableExtras[value as string];
      if (known) newRows[index].price = known.client;
    } else {
      newRows[index].price = Number(value);
    }
    setRows(newRows);
  };

  const addRow = () => setRows([...rows, { name: '', price: 0 }]);
  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const handleSave = () => {
    const validRows = rows.filter(r => r.name);
    const summary = validRows.map(r => `${r.name} ($${r.price})`).join(', ');
    const total = validRows.reduce((sum, r) => sum + Number(r.price), 0);
    onSave(job.id, summary, total);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">Manage Extras</h2>
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  list="extras-list"
                  type="text"
                  value={row.name}
                  onChange={(e) => updateRow(i, 'name', e.target.value)}
                  placeholder="Extra Name"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="w-24 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  value={row.price}
                  onChange={(e) => updateRow(i, 'price', e.target.value)}
                  className="w-full p-2 pl-5 border rounded text-sm"
                />
              </div>
              <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <datalist id="extras-list">
            {Object.keys(availableExtras).map(k => <option key={k} value={k} />)}
          </datalist>
          <button onClick={addRow} className="text-blue-600 text-sm font-bold flex items-center gap-1">
            <Plus size={14} /> Add Row
          </button>
        </div>
        <div className="flex justify-between items-center mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setRows([{ name: 'No Extra', price: 0 }])}
              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold ring-1 ring-inset ring-green-600/20"
            >
              No Extra
            </button>
            <button
              onClick={() => setRows([])}
              className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold ring-1 ring-inset ring-slate-300"
            >
              Clear (Blank)
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtrasModal;
