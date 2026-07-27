import type {
  DerivGatewayPort,
  DerivProposal,
  DerivBuyResult,
} from '@trading-platform/application';
import { DerivApiError } from '@trading-platform/application';

/**
 * DerivGatewayAdapter — the ONLY component permitted to speak the
 * Deriv WebSocket protocol directly (per ADR-003 and the "Single Deriv
 * access point" architecture principle).
 *
 * Confirmed in Phase 1 (see PHASE1_FINDINGS.md) and encoded here as
 * constants so Phase 5 implementation has a fixed reference point:
 *   - Endpoint: wss://ws.derivws.com/websockets/v3?app_id=<id>
 *   - Auth: `authorize` call using a Personal Access Token (PAT)
 *   - Session times out after 2 minutes of inactivity — a keepalive
 *     ping/time call is required and is a Phase 5 implementation item.
 *   - No fixed published rate limit; must call `website_status` and
 *     read `api_call_limits`, then self-throttle client-side.
 *
 * Phase 2 scope: interface satisfied only. Real WebSocket wiring,
 * reconnect/resubscribe logic, and rate-limit self-throttling are
 * Phase 5 (Deriv Integration).
 */
export const DERIV_WS_ENDPOINT_TEMPLATE = 'wss://ws.derivws.com/websockets/v3?app_id={APP_ID}';
export const DERIV_SESSION_INACTIVITY_TIMEOUT_MS = 120_000;

export class DerivGatewayAdapter implements DerivGatewayPort {
  private connected = false;

  constructor(
    private readonly appId: string,
    private readonly wsEndpoint: string = DERIV_WS_ENDPOINT_TEMPLATE.replace('{APP_ID}', appId),
  ) {}

  async authenticate(_apiToken: string): Promise<void> {
    // TODO(Phase 5): open WebSocket to this.wsEndpoint, send
    // `authorize` with _apiToken, await response, set this.connected.
    throw new DerivApiError('DerivGatewayAdapter.authenticate not yet implemented (Phase 5)');
  }

  async getProposal(_params: {
    symbol: string;
    contractType: string;
    stake: number;
    duration: number;
  }): Promise<DerivProposal> {
    // TODO(Phase 5): send `proposal` request; validate contractType
    // against a live `contracts_for` lookup before sending (see
    // PHASE1_FINDINGS.md, section 5).
    throw new DerivApiError('DerivGatewayAdapter.getProposal not yet implemented (Phase 5)');
  }

  async buy(_proposalId: string, _price: number): Promise<DerivBuyResult> {
    // TODO(Phase 5): send `buy` request with proposal id + price.
    throw new DerivApiError('DerivGatewayAdapter.buy not yet implemented (Phase 5)');
  }

  async subscribeToContract(
    _contractId: string,
    _onUpdate: (update: unknown) => void,
  ): Promise<void> {
    // TODO(Phase 5): send `proposal_open_contract` with subscribe: 1,
    // route stream messages to _onUpdate; re-subscribe on reconnect
    // per the Reconnection Workflow sequence diagram.
    throw new DerivApiError(
      'DerivGatewayAdapter.subscribeToContract not yet implemented (Phase 5)',
    );
  }

  async getPortfolio(): Promise<unknown[]> {
    // TODO(Phase 5): send `portfolio` request.
    throw new DerivApiError('DerivGatewayAdapter.getPortfolio not yet implemented (Phase 5)');
  }

  async getActiveSymbols(): Promise<unknown[]> {
    // TODO(Phase 5): send `active_symbols` request.
    throw new DerivApiError('DerivGatewayAdapter.getActiveSymbols not yet implemented (Phase 5)');
  }

  async getContractsFor(_symbol: string): Promise<unknown[]> {
    // TODO(Phase 5): send `contracts_for` request for _symbol.
    throw new DerivApiError('DerivGatewayAdapter.getContractsFor not yet implemented (Phase 5)');
  }

  async getApiCallLimits(): Promise<Record<string, unknown>> {
    // TODO(Phase 5): send `website_status` request, return
    // `api_call_limits` field per PHASE1_FINDINGS.md section 3.
    throw new DerivApiError('DerivGatewayAdapter.getApiCallLimits not yet implemented (Phase 5)');
  }

  isConnected(): boolean {
    return this.connected;
  }
}
