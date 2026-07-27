/**
 * Strategy entity — represents one configured TradingView-driven
 * strategy (name, webhook secret reference, enabled flag, risk config
 * reference). Encrypted secret storage is an Infrastructure concern
 * (EncryptionPort); the entity only holds a reference/handle to it.
 */
export class Strategy {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public enabled: boolean,
    public readonly webhookSecretRef: string,
    public readonly configVersion: number,
  ) {}
}
