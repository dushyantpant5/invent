interface ISignUpPayload {
  email: string;
  password: string;
}

export async function encryptSignupPayload(payload: ISignUpPayload): Promise<string> {
  return await encryptStringAesGcm(JSON.stringify(payload));
}

export async function decryptSignUpPayload(encryptedBase64: string): Promise<ISignUpPayload> {
  const json = await decryptStringAesGcm(encryptedBase64);
  return JSON.parse(json) as ISignUpPayload;
}

export async function encryptInventoryData(inventoryId: string): Promise<string> {
  return await encryptStringAesGcm(inventoryId);
}

export async function decryptInventoryData(encryptedBase64: string): Promise<string> {
  return await decryptStringAesGcm(encryptedBase64);
}

// Config

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const GCM_IV_BYTE_LENGTH = 12;

let cachedAesGcmKey: CryptoKey | null = null;

//Private Functions

async function getAesGcmKey(): Promise<CryptoKey> {
  if (!process.env.USER_PAYLOAD_SECRET) {
    throw new Error('USER_PAYLOAD_SECRET environment variable is missing');
  }
  if (cachedAesGcmKey) return cachedAesGcmKey;
  const secret = process.env.USER_PAYLOAD_SECRET as string;
  const secretBytes = encoder.encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', secretBytes);
  const key = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  cachedAesGcmKey = key;
  return key;
}

async function encryptStringAesGcm(plain: string): Promise<string> {
  const key = await getAesGcmKey();
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTE_LENGTH));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain));
  const ctUint8 = new Uint8Array(ct);
  const combined = new Uint8Array(iv.length + ctUint8.length);
  combined.set(iv, 0);
  combined.set(ctUint8, iv.length);
  return convertToBase64(combined);
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
function convertToBase64(arrayBytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    // Convert to binary string in chunks to avoid stack limits
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < arrayBytes.length; i += chunk) {
      const slice = arrayBytes.subarray(i, Math.min(i + chunk, arrayBytes.length));
      binary += String.fromCharCode(...slice);
    }
    return btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(arrayBytes).toString('base64');
  } else {
    throw new Error('No base64 encoder available');
  }
}

function fromBase64(b64: string): Uint8Array {
  b64 = normalizeBase64(b64);
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const len = binary.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
    return out;
  } else if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  } else {
    throw new Error('No base64 decoder available');
  }
}

function normalizeBase64(b64: string): string {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return b64;
}
