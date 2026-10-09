import React, { useState } from 'react';
import { X, User, RefreshCw, Check } from 'lucide-react';

interface CallsignModalProps {
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

const CALLSIGN_PREFIXES = ['Ghost', 'Viper', 'Nova', 'Echo', 'Raven', 'Cipher', 'Shadow', 'Apex', 'Delta', 'Zero', 'Kestrel', 'Phantom', 'Ronin', 'Specter'];

export const CallsignModal: React.FC<CallsignModalProps> = ({
  currentName,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(currentName);

  const handleRandomize = () => {
    const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setName(`${prefix}-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-[#11141c] border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white">Radio Callsign</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Pseudonym / Mesh Identifier
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleRandomize}
                title="Randomize callsign"
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            No accounts or email required. This pseudonym is announced locally over wireless beacons to nearby peers.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Callsign</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
