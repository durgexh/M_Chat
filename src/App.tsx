/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useTransition } from 'react';
import {
  Menu,
  X,
  Radio,
  ShieldCheck,
  QrCode,
  Plus,
  WifiOff,
} from 'lucide-react';
import { Header } from './components/Header';
import { ChannelSidebar } from './components/ChannelSidebar';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { RadarDrawer } from './components/RadarDrawer';
import { QRModal } from './components/QRModal';
import { QRScanner } from './components/QRScanner';
import { CreateGroupModal } from './components/CreateGroupModal';
import { CallsignModal } from './components/CallsignModal';
import {
  GroupChannel,
  ChatMessage,
  PeerNode,
  BluetoothStatus,
  PowerProfileMode,
  MeshStats,
  MeshPacket,
} from './types';
import {
  getOrCreatePeerIdentity,
  updatePeerName,
  loadGroups,
  saveGroups,
  loadStoredMessages,
  saveStoredMessages,
  loadPowerMode,
  savePowerMode,
  loadWakeLockPref,
  saveWakeLockPref,
  OPEN_BROADCAST_GROUP,
} from './services/storage';
import { mesh } from './services/mesh';
import { encryptPayload, decryptPayload } from './services/crypto';
import { playTxChirp, playRxChirp, playPeerJoinedChirp } from './services/audio';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const isOnline = useOnlineStatus();
  const [, startTransition] = useTransition();

  // User identity
  const [peerId, setPeerId] = useState<string>('');
  const [peerName, setPeerName] = useState<string>('');

  // Groups and active channel
  const [groups, setGroups] = useState<GroupChannel[]>(() => loadGroups());
  const [activeGroupId, setActiveGroupId] = useState<string>(OPEN_BROADCAST_GROUP.id);

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());

  // Mesh & Telemetry state
  const [peers, setPeers] = useState<PeerNode[]>([]);
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothStatus>({
    isAvailable: false,
    isConnected: false,
  });
  const [powerMode, setPowerModeState] = useState<PowerProfileMode>(() => loadPowerMode());
  const [stats, setStats] = useState<MeshStats>({
    packetsSent: 0,
    packetsReceived: 0,
    packetsRelayed: 0,
    totalBytesOverhead: 0,
  });
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(() => loadWakeLockPref());

  // Views and Modals
  const [activeView, setActiveView] = useState<'chat' | 'radar'>('chat');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [qrModalGroup, setQrModalGroup] = useState<GroupChannel | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCallsignModal, setShowCallsignModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active group object
  const activeGroup = groups.find((g) => g.id === activeGroupId) || OPEN_BROADCAST_GROUP;

  // Notification helper
  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initialize identity & mesh transceiver on mount
  useEffect(() => {
    const identity = getOrCreatePeerIdentity();
    setPeerId(identity.peerId);
    setPeerName(identity.name);

    // Initialize mesh
    mesh.init(identity.peerId, identity.name, powerMode);

    // Subscribe to mesh events
    mesh.setSubscribers(
      (packet: MeshPacket) => {
        handleIncomingPacket(packet);
      },
      (newPeers: PeerNode[]) => {
        setPeers((prev) => {
          if (newPeers.length > prev.length) {
            playPeerJoinedChirp();
          }
          return newPeers;
        });
      },
      (btStatus: BluetoothStatus) => {
        setBluetoothStatus(btStatus);
      },
      (meshStats: MeshStats) => {
        setStats(meshStats);
      }
    );

    // Restore wake lock if preference was true
    if (loadWakeLockPref()) {
      mesh.toggleWakeLock(true).then((active) => setWakeLockActive(active));
    }
  }, []);

  // Sync groups & messages to localStorage
  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  // Handle incoming mesh packet
  const handleIncomingPacket = async (packet: MeshPacket) => {
    if (packet.t !== 2) return; // Only process chat messages here (t=2)

    const rawPacketBytes = new Blob([JSON.stringify(packet)]).size;

    // A. Public Broadcast
    if (packet.g === OPEN_BROADCAST_GROUP.id) {
      const msg: ChatMessage = {
        id: packet.i,
        groupId: OPEN_BROADCAST_GROUP.id,
        senderPeerId: packet.s,
        senderName: packet.sn || `Node-${packet.s.slice(0, 4)}`,
        text: packet.d,
        timestamp: packet.ts * 1000,
        isEncrypted: false,
        hopCount: 4 - packet.h,
        packetBytes: rawPacketBytes,
        isOutgoing: false,
      };

      playRxChirp();
      startTransition(() => {
        setMessages((prev) => [...prev, msg]);
      });
      return;
    }

    // B. Encrypted Group Message
    const targetGroup = groups.find((g) => g.id === packet.g);
    if (!targetGroup || !targetGroup.rawKeyBase64) {
      // We are not part of this group (didn't scan the QR code key)
      // As a mesh node we already relayed it if hop limit permitted, but cannot decrypt!
      return;
    }

    if (!packet.iv) return;

    try {
      const decryptedText = await decryptPayload(
        packet.d,
        packet.iv,
        targetGroup.rawKeyBase64
      );

      const msg: ChatMessage = {
        id: packet.i,
        groupId: targetGroup.id,
        senderPeerId: packet.s,
        senderName: packet.sn || `Node-${packet.s.slice(0, 4)}`,
        text: decryptedText,
        timestamp: packet.ts * 1000,
        isEncrypted: true,
        hopCount: 4 - packet.h,
        packetBytes: rawPacketBytes,
        isOutgoing: false,
      };

      playRxChirp();
      startTransition(() => {
        setMessages((prev) => [...prev, msg]);
      });
    } catch (err) {
      console.warn('Failed to decrypt packet with group key:', err);
    }
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    let payload = text;
    let iv: string | undefined = undefined;

    if (!activeGroup.isDirectBroadcast && activeGroup.rawKeyBase64) {
      // Encrypt with AES-GCM
      const encrypted = await encryptPayload(text, activeGroup.rawKeyBase64);
      payload = encrypted.ciphertextBase64;
      iv = encrypted.ivBase64;
    }

    const packet = mesh.broadcastMessage(activeGroup.id, payload, iv);
    playTxChirp();

    const rawBytes = new Blob([JSON.stringify(packet)]).size;
    const newMsg: ChatMessage = {
      id: packet.i,
      groupId: activeGroup.id,
      senderPeerId: peerId,
      senderName: peerName,
      text,
      timestamp: Date.now(),
      isEncrypted: !activeGroup.isDirectBroadcast,
      hopCount: 1,
      packetBytes: rawBytes,
      isOutgoing: true,
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  // Group created handler
  const handleGroupCreated = (newGroup: GroupChannel) => {
    setGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    setShowCreateGroup(false);
    // Automatically show QR for participants to scan
    setQrModalGroup(newGroup);
    showToast(`Created channel: ${newGroup.name}`);
  };

  // Group joined via QR scanner
  const handleGroupJoinedFromQR = (scannedGroup: GroupChannel) => {
    setShowScanner(false);
    const existing = groups.find((g) => g.id === scannedGroup.id);
    if (!existing) {
      setGroups((prev) => [...prev, scannedGroup]);
      setActiveGroupId(scannedGroup.id);
      showToast(`Joined encrypted channel: ${scannedGroup.name}`);
    } else {
      setActiveGroupId(existing.id);
      showToast(`Already member of ${existing.name}`);
    }
    setActiveView('chat');
  };

  // Delete/leave group
  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(OPEN_BROADCAST_GROUP.id);
    }
    showToast('Channel removed');
  };

  // Callsign update
  const handleSaveCallsign = (newName: string) => {
    setPeerName(newName);
    updatePeerName(newName);
    mesh.setPeerName(newName);
    showToast(`Callsign updated to ${newName}`);
  };

  // Power mode update
  const handleSelectPowerMode = (mode: PowerProfileMode) => {
    setPowerModeState(mode);
    savePowerMode(mode);
    mesh.setPowerMode(mode);
    showToast(`Power mode: ${mode}`);
  };

  // Wake lock toggle
  const handleToggleWakeLock = async (enabled: boolean) => {
    const success = await mesh.toggleWakeLock(enabled);
    setWakeLockActive(success);
    saveWakeLockPref(success);
  };

  // Bluetooth controls
  const handleRequestBluetooth = async () => {
    const connected = await mesh.requestBluetoothPairing();
    if (connected) {
      showToast('Bluetooth radio paired successfully');
    }
  };

  const handleDisconnectBluetooth = () => {
    mesh.disconnectBluetooth();
    showToast('Bluetooth disconnected');
  };

  const currentChannelMessages = messages.filter((m) => m.groupId === activeGroupId);

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0c10] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract (Single-row, 3 zones) */}
      <Header
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setMobileSidebarOpen(false);
        }}
        onOpenCreateGroup={() => setShowCreateGroup(true)}
        onOpenScanQR={() => setShowScanner(true)}
        peerCount={peers.length}
        bluetoothStatus={bluetoothStatus}
        powerMode={powerMode}
        peerName={peerName}
        onEditCallsign={() => setShowCallsignModal(true)}
      />

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero Internet Mode · Operating purely via local wireless & Bluetooth signals</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">OFFLINE READY</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar (Channels List) */}
        <div
          className={`fixed inset-y-0 left-0 z-40 md:static md:z-0 transform transition-transform duration-200 ease-in-out md:transform-none ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <ChannelSidebar
            groups={groups}
            activeGroupId={activeGroupId}
            onSelectGroup={(id) => {
              setActiveGroupId(id);
              setActiveView('chat');
              setMobileSidebarOpen(false);
            }}
            onOpenCreateGroup={() => {
              setShowCreateGroup(true);
              setMobileSidebarOpen(false);
            }}
            onOpenScanQR={() => {
              setShowScanner(true);
              setMobileSidebarOpen(false);
            }}
            onShowGroupQR={(g) => {
              setQrModalGroup(g);
              setMobileSidebarOpen(false);
            }}
            onDeleteGroup={handleDeleteGroup}
          />
        </div>

        {/* Workspace Viewport (Chat or Radar) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d1017]">
          {activeView === 'radar' ? (
            /* Radar & Mesh Telemetry View */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <RadarDrawer
                peers={peers}
                bluetoothStatus={bluetoothStatus}
                powerMode={powerMode}
                onSelectPowerMode={handleSelectPowerMode}
                onRequestBluetooth={handleRequestBluetooth}
                onDisconnectBluetooth={handleDisconnectBluetooth}
                wakeLockActive={wakeLockActive}
                onToggleWakeLock={handleToggleWakeLock}
                stats={stats}
                currentPeerId={peerId}
                currentPeerName={peerName}
              />
            </div>
          ) : (
            /* Tactical Chat Stream */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Channel Mobile Header bar */}
              <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0a0c10]">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="flex items-center gap-2 text-xs font-semibold text-white"
                >
                  <Menu className="w-4 h-4 text-emerald-400" />
                  <span className="truncate max-w-[180px]">{activeGroup.name}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  {!activeGroup.isDirectBroadcast && (
                    <button
                      onClick={() => setQrModalGroup(activeGroup)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-emerald-400"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowScanner(true)}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                  >
                    Scan
                  </button>
                </div>
              </div>

              {/* Message List */}
              <MessageList
                messages={currentChannelMessages}
                currentPeerId={peerId}
                activeGroup={activeGroup}
                onOpenQR={() => setQrModalGroup(activeGroup)}
              />

              {/* Message Input pinned to bottom */}
              <MessageInput
                channelName={activeGroup.name}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white shadow-xl animate-in fade-in duration-150 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {qrModalGroup && (
        <QRModal group={qrModalGroup} onClose={() => setQrModalGroup(null)} />
      )}

      {showScanner && (
        <QRScanner
          onGroupFound={handleGroupJoinedFromQR}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          creatorPeerId={peerId}
          onGroupCreated={handleGroupCreated}
          onClose={() => setShowCreateGroup(false)}
        />
      )}

      {showCallsignModal && (
        <CallsignModal
          currentName={peerName}
          onSave={handleSaveCallsign}
          onClose={() => setShowCallsignModal(false)}
        />
      )}
    </div>
  );
}
