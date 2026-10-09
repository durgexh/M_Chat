export interface GroupChannel {
  id: string; // unique group id hex (e.g. g_7e3a9b1c)
  name: string;
  creatorPeerId: string;
  createdAt: number;
  rawKeyBase64: string; // 256-bit AES-GCM raw key exported as base64
  saltBase64: string;
  isDirectBroadcast?: boolean; // true for open emergency broadcast
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderPeerId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isEncrypted: boolean;
  hopCount: number;
  packetBytes: number;
  isOutgoing: boolean;
}

// Compact packet for over-the-air local radio mesh (minimizing overhead)
export interface MeshPacket {
  t: 1 | 2 | 3 | 4; // 1: BEACON, 2: GROUP_MSG, 3: ACK, 4: PING
  i: string; // Packet ID (e.g. 8 chars)
  s: string; // Sender Peer ID (e.g. 6 chars)
  sn?: string; // Sender Pseudonym
  g: string; // Group ID
  h: number; // Hop Limit / TTL (e.g. 3)
  iv?: string; // Initialization vector base64
  d: string; // Data (ciphertext or plain beacon payload)
  ts: number; // Unix timestamp in seconds
}

export interface PeerNode {
  peerId: string;
  name: string;
  lastSeen: number;
  estimatedRssi: number; // dBm e.g. -54 dBm
  hopDistance: number;
  channel: 'bluetooth' | 'mesh-radio' | 'broadcast';
}

export type PowerProfileMode = 'ultra-low' | 'balanced' | 'tactical';

export interface PowerProfileConfig {
  mode: PowerProfileMode;
  beaconIntervalMs: number;
  estimatedBatteryDrainPercentPerHour: number;
  description: string;
}

export interface BluetoothStatus {
  isAvailable: boolean;
  isConnected: boolean;
  deviceName?: string;
  error?: string;
}

export interface MeshStats {
  packetsSent: number;
  packetsReceived: number;
  packetsRelayed: number;
  totalBytesOverhead: number;
}
