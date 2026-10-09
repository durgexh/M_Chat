import React from 'react';
import {
  Activity,
  Bluetooth,
  Battery,
  Shield,
  Wifi,
  Radio,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import {
  PeerNode,
  BluetoothStatus,
  PowerProfileMode,
  MeshStats,
} from '../types';
import { POWER_PROFILES } from '../services/mesh';

interface RadarDrawerProps {
  peers: PeerNode[];
  bluetoothStatus: BluetoothStatus;
  powerMode: PowerProfileMode;
  onSelectPowerMode: (mode: PowerProfileMode) => void;
  onRequestBluetooth: () => void;
  onDisconnectBluetooth: () => void;
  wakeLockActive: boolean;
  onToggleWakeLock: (enabled: boolean) => void;
  stats: MeshStats;
  currentPeerId: string;
  currentPeerName: string;
}

export const RadarDrawer: React.FC<RadarDrawerProps> = ({
  peers,
  bluetoothStatus,
  powerMode,
  onSelectPowerMode,
  onRequestBluetooth,
  onDisconnectBluetooth,
  wakeLockActive,
  onToggleWakeLock,
  stats,
  currentPeerId,
  currentPeerName,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-8">
      {/* Top Banner: Local Mesh Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#11141c] border border-slate-800 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Mesh Telemetry
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">P2P Decentralized</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Local Radio Transceiver
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Direct wireless communication across devices without servers, mobile towers, or internet connectivity.
          </p>
        </div>

        {/* Local Node Tag */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto font-mono text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Your Node</div>
            <div className="text-white font-semibold">{currentPeerName} ({currentPeerId.slice(0, 7)})</div>
          </div>
        </div>
      </div>

      {/* Grid: Bluetooth + Power Management + Protocol Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Bluetooth Hardware Interface */}
        <div className="p-4 rounded-xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Bluetooth className="w-4 h-4 text-sky-400" />
                <span>Bluetooth Radio</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                bluetoothStatus.isConnected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : bluetoothStatus.isAvailable
                  ? 'bg-sky-950 text-sky-400 border border-sky-800'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}>
                {bluetoothStatus.isConnected ? 'Connected' : bluetoothStatus.isAvailable ? 'Ready' : 'Restricted'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {bluetoothStatus.isConnected
                ? `Paired to ${bluetoothStatus.deviceName || 'BLE Device'}`
                : bluetoothStatus.isAvailable
                ? 'Scan and pair directly with Bluetooth Low Energy radios.'
                : 'Web Bluetooth requires Chrome/Edge on Android/Desktop or installed PWA.'}
            </p>

            {bluetoothStatus.error && (
              <p className="mt-2 text-[11px] text-amber-400 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{bluetoothStatus.error}</span>
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            {bluetoothStatus.isConnected ? (
              <button
                onClick={onDisconnectBluetooth}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                Disconnect BLE
              </button>
            ) : (
              <button
                onClick={onRequestBluetooth}
                className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Pair Bluetooth Radio</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Power & Battery Conservation Profile */}
        <div className="p-4 rounded-xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span>Power Profile</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                ~{POWER_PROFILES[powerMode].batteryDrainPercent}% / hr
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {POWER_PROFILES[powerMode].description}
            </p>

            {/* Profile Selector */}
            <div className="grid grid-cols-3 gap-1.5 mt-3 p-1 bg-slate-900 rounded-lg border border-slate-800">
              {(['ultra-low', 'balanced', 'tactical'] as PowerProfileMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSelectPowerMode(mode)}
                  className={`py-1 text-[11px] font-medium rounded capitalize transition-colors ${
                    powerMode === mode
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'ultra-low' ? 'Low Power' : mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Screen Wake Lock</span>
            <button
              onClick={() => onToggleWakeLock(!wakeLockActive)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                wakeLockActive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {wakeLockActive ? 'Active (Awake)' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Card 3: Lightweight Protocol Metrics */}
        <div className="p-4 rounded-xl bg-[#11141c] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Data Overhead</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Low-Overhead
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-xs">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Sent</div>
                <div className="text-white font-semibold tabular-nums">{stats.packetsSent} pkts</div>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Received</div>
                <div className="text-white font-semibold tabular-nums">{stats.packetsReceived} pkts</div>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Relayed</div>
                <div className="text-white font-semibold tabular-nums">{stats.packetsRelayed} hops</div>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Radio Traffic</div>
                <div className="text-emerald-400 font-semibold tabular-nums">
                  {stats.totalBytesOverhead > 1024
                    ? `${(stats.totalBytesOverhead / 1024).toFixed(1)} KB`
                    : `${stats.totalBytesOverhead} B`}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Average packet payload is under 90 bytes.</span>
          </div>
        </div>
      </div>

      {/* Discovered Nearby Mesh Nodes List */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#11141c] border border-slate-800 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white">
              Nearby Active Nodes ({peers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Scanning every {POWER_PROFILES[powerMode].beaconIntervalMs / 1000}s
          </span>
        </div>

        {peers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Activity className="w-6 h-6 animate-pulse text-emerald-500/50" />
            </div>
            <p className="text-sm font-medium text-slate-300">Listening for wireless signals...</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Open MChat in another browser tab or on another nearby device within local range to discover each other automatically.
            </p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-800/80">
            {peers.map((peer) => (
              <div
                key={peer.peerId}
                className="py-3 flex items-center justify-between gap-4 first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                    {peer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{peer.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({peer.peerId})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{peer.hopDistance === 1 ? 'Direct Link' : `${peer.hopDistance} hops`}</span>
                      <span>·</span>
                      <span>{peer.channel}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-emerald-400 font-semibold tabular-nums">
                    {peer.estimatedRssi} dBm
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Seen {Math.max(1, Math.floor((Date.now() - peer.lastSeen) / 1000))}s ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
