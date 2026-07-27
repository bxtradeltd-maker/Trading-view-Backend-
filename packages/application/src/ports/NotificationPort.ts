export interface NotificationPort {
  notify(message: string, options?: { urgent?: boolean }): Promise<void>;
}
