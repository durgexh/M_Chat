import React from 'react';
import { Radio, QrCode, Plus, Activity } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { BluetoothStatus, PowerProfileMode } from '../types';

interface HeaderProps {
  activeView: 'chat' | 'radar';
  onSelectView: (view: 'chat' | 'radar') => void;
  onOpenCreateGroup: () => void;
  onOpenScanQR: () => void;
  peerCount: number;
  bluetoothStatus: BluetoothStatus;
  powerMode: PowerProfileMode;
  peerName: string;
  onEditCallsign: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenCreateGroup,
  onOpenScanQR,
  peerCount,
  bluetoothStatus,
  powerMode,
  peerName,
  onEditCallsign,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-[#0a0c10]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4 md:gap-8">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#/"
          className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span>MChat</span>
          <span className="text-[10px] font-mono font-medium text-emerald-400/80 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
            MESH
          </span>
        </a>

        {/* Callsign trigger button */}
        <button
          onClick={onEditCallsign}
          title="Click to change your radio pseudonym"
          className="hidden sm:inline-flex items-center text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <span className="text-slate-600 mr-1">ID:</span>
          <span className="text-emerald-400 underline decoration-slate-700 underline-offset-2">{peerName}</span>
        </button>
      </div>

      {/* Zone 2: Navigation & Status Links */}
      <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectView('chat')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'chat' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <span>Channels</span>
        </button>

        <button
          onClick={() => onSelectView('radar')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'radar' ? 'text-white font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Radio Radar</span>
          <span className="text-[11px] font-mono tabular-nums text-emerald-400 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.2">
            {peerCount}
          </span>
        </button>

        {/* Quick status indicator */}
        <span className="hidden lg:inline text-xs text-slate-500 whitespace-nowrap shrink-0 font-mono">
          {bluetoothStatus.isConnected ? 'BLE Active' : 'Mesh Broadcast'} · {powerMode}
        </span>
      </nav>

      {/* Zone 3: 1 Primary Action + Quick Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <PWAInstallButton compact />

        <button
          onClick={onOpenCreateGroup}
          title="Create an encrypted group"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>New Group</span>
        </button>

        <button
          onClick={onOpenScanQR}
          title="Scan QR to join encrypted group"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Scan QR</span>
        </button>
      </div>
    </header>
  );
};
