import type { NotificationPort } from '@trading-platform/application';
import { InfrastructureError } from '@trading-platform/application';

/**
 * Telegram implementation of NotificationPort. Uses the Bot API's
 * sendMessage endpoint directly over HTTPS — no heavyweight SDK
 * dependency needed for this single call.
 *
 * Phase 2 scope: interface satisfied, HTTP call wired. Retry/backoff
 * policy for notification delivery failures (should never block
 * trading — see RUNBOOK.md's "non-blocking design" requirement for
 * Phase 10) is deliberately left as a TODO.
 */
export class TelegramNotificationAdapter implements NotificationPort {
  constructor(
    private readonly botToken: string,
    private readonly chatId: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async notify(message: string, options?: { urgent?: boolean }): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const prefixed = options?.urgent ? `🚨 ${message}` : message;

    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: this.chatId, text: prefixed }),
      });

      if (!response.ok) {
        // TODO(Phase 10): route to a non-blocking retry queue instead
        // of throwing synchronously, per the notifications
        // non-blocking design requirement.
        throw new InfrastructureError('Telegram sendMessage failed', {
          status: response.status,
        });
      }
    } catch (error) {
      if (error instanceof InfrastructureError) throw error;
      throw new InfrastructureError('Telegram notification request failed', {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
