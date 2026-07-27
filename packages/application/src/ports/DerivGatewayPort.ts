/**
 * DerivGatewayPort — the single abstraction for all Deriv API access.
 * Per the Architecture doc's "Single Deriv access point" principle,
 * only one Infrastructure adapter (DerivGatewayAdapter) implements
 * this; no other component may talk to Deriv directly.
 *
 * Method bodies/behavior are NOT implemented in Phase 2 — see
 * PHASE1_FINDINGS.md for the confirmed auth flow, endpoint, and rate
 * limit behavior this interface is designed around.
 */
export interface DerivProposal {
  proposalId: string;
  askPrice: number;
  payout: number;
  spot: number;
}

export interface DerivBuyResult {
  contractId: string;
  buyPrice: number;
  transactionId: string;
}

export interface DerivGatewayPort {
  authenticate(apiToken: string): Promise<void>;
  getProposal(params: {
    symbol: string;
    contractType: string;
    stake: number;
    duration: number;
  }): Promise<DerivProposal>;
  buy(proposalId: string, price: number): Promise<DerivBuyResult>;
  subscribeToContract(contractId: string, onUpdate: (update: unknown) => void): Promise<void>;
  getPortfolio(): Promise<unknown[]>;
  getActiveSymbols(): Promise<unknown[]>;
  getContractsFor(symbol: string): Promise<unknown[]>;
  getApiCallLimits(): Promise<Record<string, unknown>>;
  isConnected(): boolean;
}
