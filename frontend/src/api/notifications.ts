import { apiRequest } from './client';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  related_type?: string;
  related_id?: string;
  is_read: boolean;
  sent_at: string;
  delivery_status: string;
  created_at: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return apiRequest<NotificationItem[]>('/notifications');
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiRequest<{ unread_count: number }>('/notifications/unread-count');
  return res.unread_count;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  return apiRequest<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await apiRequest<{ updated: number }>('/notifications/read-all', {
    method: 'POST',
  });
  return res.updated;
}
