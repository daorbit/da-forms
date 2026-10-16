import type { NotificationSettings } from '@/types';

export function telegramAlertsOn(notifications: NotificationSettings): boolean {
  return notifications.telegramEnabled ?? Boolean(notifications.ownerEnabled || notifications.ownerInAppEnabled);
}
