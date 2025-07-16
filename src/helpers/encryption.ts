import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

if (!process.env.USER_PAYLOAD_SECRET) {
  throw new Error('USER_PAYLOAD_SECRET environment variable is missing');
}

const key = crypto.createHash('sha256').update(process.env.USER_PAYLOAD_SECRET).digest();
const iv = Buffer.alloc(16, 0);

interface ISignUpPayload {
  email: string;
  password: string;
}

export function encryptSignupPayload(payload: ISignUpPayload): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

export function decryptSignUpPayload(encryptedBase64: string): ISignUpPayload {
  const encryptedData = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

export function encryptInventoryData(inventoryId: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(inventoryId, 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

export function decryptInventoryData(encryptedBase64: string): string {
  const encryptedData = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString('utf8');
}
