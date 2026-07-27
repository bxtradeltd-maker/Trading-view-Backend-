import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import type { EncryptionPort } from '@trading-platform/application';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Node `crypto` implementation of EncryptionPort using AES-256-GCM,
 * for column-level encryption of strategy secrets (DB_SECRET_ENCRYPTION_KEY,
 * see backend .env.example and DATABASE.md). Ciphertext format:
 * base64(iv):base64(authTag):base64(ciphertext).
 */
export class NodeEncryptionAdapter implements EncryptionPort {
  private readonly key: Buffer;

  constructor(encryptionKey: string) {
    // Derives a 32-byte key from the provided secret. A fixed salt is
    // acceptable here because the *key* (DB_SECRET_ENCRYPTION_KEY) is
    // already a high-entropy secret, not a user password.
    this.key = scryptSync(encryptionKey, 'trading-platform-static-salt', 32);
  }

  async encrypt(plaintext: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  async decrypt(ciphertext: string): Promise<string> {
    const [ivB64, authTagB64, dataB64] = ciphertext.split(':');
    if (!ivB64 || !authTagB64 || !dataB64) {
      throw new Error('Malformed ciphertext: expected iv:authTag:data');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
