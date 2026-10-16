import type { NotificationSettings } from '../models/form.model.js';

export function telegramAlertsOn(notifications: NotificationSettings | undefined): boolean {
  if (!notifications) return false;
  return notifications.telegramEnabled ?? Boolean(notifications.ownerEnabled || notifications.ownerInAppEnabled);
}

export function chatAlertsOn(notifications: NotificationSettings | undefined): boolean {
  return Boolean(notifications?.ownerEnabled || notifications?.ownerInAppEnabled);
}
