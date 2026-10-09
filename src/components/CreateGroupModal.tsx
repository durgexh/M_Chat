import React, { useState } from 'react';
import { X, ShieldPlus, Lock, Zap } from 'lucide-react';
import { GroupChannel } from '../types';
import { generateGroupCredentials, generateRandomHex } from '../services/crypto';

interface CreateGroupModalProps {
  creatorPeerId: string;
  onGroupCreated: (group: GroupChannel) => void;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  creatorPeerId,
  onGroupCreated,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const groupName = name.trim() || 'Tactical Mesh';

    setIsGenerating(true);
    try {
      const credentials = await generateGroupCredentials();
      const newGroup: GroupChannel = {
        id: `g_${generateRandomHex(4)}`,
        name: groupName,
        creatorPeerId,
        createdAt: Date.now(),
        rawKeyBase64: credentials.rawKeyBase64,
        saltBase64: credentials.saltBase64,
        isDirectBroadcast: false,
      };

      onGroupCreated(newGroup);
    } catch (err) {
      console.error('Failed to generate group credentials:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-[#11141c] border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldPlus className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white">Create Encrypted Channel</h2>
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Channel Name / Callsign
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Field Ops Alpha, Zone 4"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              maxLength={32}
            />
          </div>

          {/* Tactical Security Guarantee */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Server Cryptography</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A 256-bit AES-GCM group key will be generated directly in your browser hardware. No database, server, or cloud service will ever see or store this key.
            </p>
          </div>

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
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Create & Show QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
