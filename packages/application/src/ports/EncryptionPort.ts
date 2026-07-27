/**
 * EncryptionPort — column-level encryption for strategy secrets
 * (webhook secrets, API tokens at rest). See DATABASE.md for the
 * encrypted-secrets-column requirement this backs.
 */
export interface EncryptionPort {
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}
