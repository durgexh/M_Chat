import { GroupChannel, ChatMessage, PowerProfileMode } from '../types';
import { generateRandomHex } from './crypto';

const STORAGE_KEYS = {
  USER_ID: 'bitchat_peer_id',
  USER_NAME: 'bitchat_peer_name',
  GROUPS: 'bitchat_groups_v1',
  MESSAGES: 'bitchat_messages_v1',
  POWER_MODE: 'bitchat_power_mode',
  WAKELOCK_ENABLED: 'bitchat_wakelock_enabled',
};

const CALLSIGN_PREFIXES = ['Ghost', 'Viper', 'Nova', 'Echo', 'Raven', 'Cipher', 'Shadow', 'Apex', 'Delta', 'Zero', 'Kestrel', 'Phantom'];

export function getOrCreatePeerIdentity(): { peerId: string; name: string } {
  if (typeof window === 'undefined') {
    return { peerId: 'peer_node0', name: 'Node-00' };
  }

  let peerId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!peerId) {
    peerId = `node_${generateRandomHex(3)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, peerId);
  }

  let name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  if (!name) {
    const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
    const num = Math.floor(100 + Math.random() * 900);
    name = `${prefix}-${num}`;
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  }

  return { peerId, name };
}

export function updatePeerName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_NAME, name.trim());
}

// Initial open broadcast group (unencrypted emergency/beacon channel)
export const OPEN_BROADCAST_GROUP: GroupChannel = {
  id: 'open_broadcast',
  name: 'Open Radio (Public)',
  creatorPeerId: 'system',
  createdAt: 0,
  rawKeyBase64: '',
  saltBase64: '',
  isDirectBroadcast: true,
};

export function loadGroups(): GroupChannel[] {
  if (typeof window === 'undefined') return [OPEN_BROADCAST_GROUP];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (!raw) return [OPEN_BROADCAST_GROUP];
    const parsed: GroupChannel[] = JSON.parse(raw);
    if (!parsed.some(g => g.id === OPEN_BROADCAST_GROUP.id)) {
      return [OPEN_BROADCAST_GROUP, ...parsed];
    }
    return parsed;
  } catch {
    return [OPEN_BROADCAST_GROUP];
  }
}

export function saveGroups(groups: GroupChannel[]): void {
  if (typeof window === 'undefined') return;
  const filtered = groups.filter(g => g.id !== OPEN_BROADCAST_GROUP.id);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filtered));
}

export function loadStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  // Keep last 300 messages to minimize localStorage bloat
  const trimmed = messages.slice(-300);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(trimmed));
}

export function loadPowerMode(): PowerProfileMode {
  if (typeof window === 'undefined') return 'balanced';
  const val = localStorage.getItem(STORAGE_KEYS.POWER_MODE) as PowerProfileMode;
  if (val === 'ultra-low' || val === 'balanced' || val === 'tactical') {
    return val;
  }
  return 'balanced';
}

export function savePowerMode(mode: PowerProfileMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.POWER_MODE, mode);
}

export function loadWakeLockPref(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.WAKELOCK_ENABLED) === 'true';
}

export function saveWakeLockPref(val: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WAKELOCK_ENABLED, val ? 'true' : 'false');
}
