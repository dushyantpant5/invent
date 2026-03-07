interface ISignUpPayload {
  email: string;
  password: string;
}

export async function encryptSignupPayload(payload: ISignUpPayload): Promise<string> {
  return encryptStringAesGcm(JSON.stringify(payload));
}

export async function decryptSignUpPayload(encryptedBase64: string): Promise<ISignUpPayload> {
  const json = await decryptStringAesGcm(encryptedBase64);
  return JSON.parse(json) as ISignUpPayload;
}

export async function encryptInventoryData(inventoryId: string): Promise<string> {
  return encryptStringAesGcm(inventoryId);
}

export async function decryptInventoryData(encryptedBase64: string): Promise<string> {
  return decryptStringAesGcm(encryptedBase64);
}

// --- Internal ---

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const GCM_IV_BYTE_LENGTH = 12;

let cachedAesGcmKey: CryptoKey | null = null;

async function getAesGcmKey(): Promise<CryptoKey> {
  if (!process.env.USER_PAYLOAD_SECRET) {
    throw new Error('USER_PAYLOAD_SECRET environment variable is missing');
  }
  if (cachedAesGcmKey) return cachedAesGcmKey;
  const secretBytes = encoder.encode(process.env.USER_PAYLOAD_SECRET);
  const hash = await crypto.subtle.digest('SHA-256', secretBytes);
  cachedAesGcmKey = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  return cachedAesGcmKey;
}

async function encryptStringAesGcm(plain: string): Promise<string> {
  const key = await getAesGcmKey();
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTE_LENGTH));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain));
  const ctUint8 = new Uint8Array(ct);
  const combined = new Uint8Array(iv.length + ctUint8.length);
  combined.set(iv, 0);
  combined.set(ctUint8, iv.length);
  return toBase64(combined);
}

async function decryptStringAesGcm(b64: string): Promise<string> {
  const key = await getAesGcmKey();
  const combined = fromBase64(b64);
  if (combined.length < GCM_IV_BYTE_LENGTH) throw new Error('Ciphertext too short');
  const iv = combined.subarray(0, GCM_IV_BYTE_LENGTH).slice();
  const ct = combined.subarray(GCM_IV_BYTE_LENGTH).slice();
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return decoder.decode(plainBuf);
}

function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
    }
    return btoa(binary);
  }
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  throw new Error('No base64 encoder available');
}

function fromBase64(b64: string): Uint8Array {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
  throw new Error('No base64 decoder available');
}
