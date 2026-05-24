import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { NOTIFICATIONS_ENABLED } from '../config/featureFlags';
import type { Notification } from '../types';

interface NotificationContextValue {
  enabled: boolean;
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/** Stub until GET/PATCH /api/notifications exist on the backend. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const value: NotificationContextValue = {
    enabled: NOTIFICATIONS_ENABLED,
    notifications: [],
    unreadCount: 0,
    markRead: async () => {},
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
