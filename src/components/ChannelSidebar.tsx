import React from 'react';
import {
  ShieldCheck,
  Radio,
  Plus,
  QrCode,
  Trash2,
} from 'lucide-react';
import { GroupChannel } from '../types';

interface ChannelSidebarProps {
  groups: GroupChannel[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenScanQR: () => void;
  onShowGroupQR: (group: GroupChannel) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  groups,
  activeGroupId,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenScanQR,
  onShowGroupQR,
  onDeleteGroup,
}) => {
  return (
    <aside className="w-full md:w-72 lg:w-80 shrink-0 border-r border-slate-800 bg-[#0c0e14] flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Wireless Channels
          </h2>
          <p className="text-[11px] text-slate-500 font-mono">
            {groups.length} active {groups.length === 1 ? 'frequency' : 'frequencies'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenCreateGroup}
            title="Create new encrypted group"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenScanQR}
            title="Scan QR to join"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {groups.map((group) => {
          const isActive = group.id === activeGroupId;

          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                isActive
                  ? 'bg-slate-800/90 text-white'
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    group.isDirectBroadcast
                      ? 'bg-amber-950/60 border border-amber-800/40 text-amber-400'
                      : 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                  }`}
                >
                  {group.isDirectBroadcast ? (
                    <Radio className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="truncate">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {group.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                    {group.isDirectBroadcast ? 'Public Broadcast' : 'AES-256 Encrypted'}
                  </div>
                </div>
              </div>

              {/* Group Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                {!group.isDirectBroadcast && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowGroupQR(group);
                    }}
                    title="Show invite QR"
                    className="p-1 rounded text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                )}

                {!group.isDirectBroadcast && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup(group.id);
                    }}
                    title="Leave and delete channel key"
                    className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Field Guide Footer */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
        <div>ZERO CLOUD · ZERO SERVER</div>
        <div className="text-[10px] text-slate-600 mt-0.5">Air-gapped mesh architecture</div>
      </div>
    </aside>
  );
};
