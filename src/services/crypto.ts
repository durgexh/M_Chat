/**
 * Web Cryptography API implementation for 256-bit AES-GCM encrypted mesh groups.
 * Completely local, zero-server, hardware-accelerated on modern mobile and desktop chips.
 */

// Helper to convert Uint8Array to base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate a random ID (hex string)
export function generateRandomHex(byteCount = 4): string {
  const bytes = new Uint8Array(byteCount);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Key cache to avoid re-importing crypto keys on every packet
const cryptoKeyCache = new Map<string, CryptoKey>();

async function importAesKey(rawKeyBase64: string): Promise<CryptoKey> {
  const cached = cryptoKeyCache.get(rawKeyBase64);
  if (cached) return cached;

  const rawBytes = base64ToBuffer(rawKeyBase64);
  const key = await window.crypto.subtle.importKey(
    'raw',
    rawBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  cryptoKeyCache.set(rawKeyBase64, key);
  return key;
}

/**
 * Generate a new 256-bit AES-GCM group key and initialization salt
 */
export async function generateGroupCredentials() {
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const rawExported = await window.crypto.subtle.exportKey('raw', key);
  const rawKeyBase64 = bufferToBase64(rawExported);

  const saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);
  const saltBase64 = bufferToBase64(saltBytes);

  return {
    rawKeyBase64,
    saltBase64,
  };
}

/**
 * Encrypt a text payload with AES-GCM using a unique 96-bit (12-byte) IV
 */
export async function encryptPayload(
  plainText: string,
  rawKeyBase64: string
): Promise<{ ciphertextBase64: string; ivBase64: string }> {
  const key = await importAesKey(rawKeyBase64);
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // 12-byte IV standard for AES-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    data
  );

  return {
    ciphertextBase64: bufferToBase64(encryptedBuffer),
    ivBase64: bufferToBase64(iv),
  };
}

/**
 * Decrypt an AES-GCM ciphertext using the group key
 */
export async function decryptPayload(
  ciphertextBase64: string,
  ivBase64: string,
  rawKeyBase64: string
): Promise<string> {
  const key = await importAesKey(rawKeyBase64);
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encode group credentials into a compact QR invitation link
 */
export function encodeGroupInvite(group: {
  id: string;
  name: string;
  rawKeyBase64: string;
  saltBase64: string;
}): string {
  // Use compact URL-safe format: mchat://join?i=<id>&n=<name>&k=<key>&s=<salt>
  const params = new URLSearchParams({
    i: group.id,
    n: group.name,
    k: group.rawKeyBase64,
    s: group.saltBase64,
  });
  return `mchat://join?${params.toString()}`;
}

/**
 * Parse group credentials from a scanned QR payload or pasted token
 */
export function parseGroupInvite(
  payload: string
): { id: string; name: string; rawKeyBase64: string; saltBase64: string } | null {
  const trimmed = payload.trim();
  try {
    let searchString = '';
    if (trimmed.startsWith('mchat://join?')) {
      searchString = trimmed.replace('mchat://join?', '');
    } else if (trimmed.startsWith('bitchat://join?')) {
      searchString = trimmed.replace('bitchat://join?', '');
    } else if (trimmed.includes('?')) {
      searchString = trimmed.split('?')[1];
    } else {
      searchString = trimmed;
    }

    const params = new URLSearchParams(searchString);
    const id = params.get('i') || params.get('id');
    const name = params.get('n') || params.get('name');
    const rawKeyBase64 = params.get('k') || params.get('key');
    const saltBase64 = params.get('s') || params.get('salt') || '';

    if (id && name && rawKeyBase64) {
      return {
        id,
        name: decodeURIComponent(name),
        rawKeyBase64,
        saltBase64,
      };
    }
  } catch (err) {
    console.error('Failed to parse group invite:', err);
  }

  // Fallback to JSON parsing if user pasted raw JSON
  try {
    const json = JSON.parse(trimmed);
    if (json.id && json.rawKeyBase64) {
      return {
        id: json.id,
        name: json.name || 'Encrypted Group',
        rawKeyBase64: json.rawKeyBase64,
        saltBase64: json.saltBase64 || '',
      };
    }
  } catch {
    // Not json
  }

  return null;
}
