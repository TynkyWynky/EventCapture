import { getBackendApiAuthToken, resolveBackendWebSocketUrl } from '@/services/backendApi';

import type { RemoteNotificationItem } from '@/services/notificationsApi';

export type NotificationSocketMessage =
  | {
      type: 'notification.created';
      item: RemoteNotificationItem;
      unread_count: number;
    }
  | {
      type: 'notification.read_all';
      unread_count: number;
    }
  | {
      type: 'pong';
    };

interface NotificationSocketHandlers {
  onMessage: (message: NotificationSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}

export interface NotificationSocketConnection {
  disconnect: () => void;
  ping: () => void;
}

export async function connectNotificationsRealtime(
  handlers: NotificationSocketHandlers
): Promise<NotificationSocketConnection> {
  const token = getBackendApiAuthToken();
  if (!token) {
    throw new Error('Authentication required.');
  }

  const socketUrl = await resolveBackendWebSocketUrl('/ws/notifications', { token });
  const socket = new WebSocket(socketUrl);

  socket.onopen = () => {
    handlers.onOpen?.();
  };
  socket.onerror = () => {
    handlers.onError?.();
  };
  socket.onclose = () => {
    handlers.onClose?.();
  };
  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(String(event.data)) as NotificationSocketMessage;
      handlers.onMessage(payload);
    } catch {
      // Ignore malformed socket payloads and keep the connection alive.
    }
  };

  return {
    disconnect: () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    },
    ping: () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    },
  };
}
