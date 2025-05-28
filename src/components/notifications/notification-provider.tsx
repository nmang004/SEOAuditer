'use client';

import * as React from 'react';
import { Toast, ToastViewport, ToastProvider } from '@/components/ui/toast';
import { usePathname } from 'next/navigation';

export type NotificationType = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onOpenChange?: (open: boolean) => void;
  progress?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  dismissAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const pathname = usePathname();

  // Clear notifications when route changes
  React.useEffect(() => {
    dismissAll();
  }, [pathname]);

  const showNotification = React.useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setNotifications((prev) => {
      // Limit the number of notifications to 5
      const updated = [...prev];
      if (updated.length >= 5) {
        updated.shift();
      }
      return [...updated, { ...notification, id }];
    });

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNotification = React.useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, ...updates } : notification
      )
    );
  }, []);

  const dismissAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const value = React.useMemo(
    () => ({
      showNotification,
      dismissNotification,
      updateNotification,
      dismissAll,
    }),
    [showNotification, dismissNotification, updateNotification, dismissAll]
  );

  return (
    <ToastProvider>
      <NotificationContext.Provider value={value}>
        {children}
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                dismissNotification(notification.id);
              }
              notification.onOpenChange?.(open);
            }}
            duration={notification.duration}
            variant={notification.type === 'error' ? 'destructive' : 'default'}
            className="w-full sm:w-auto"
          >
            <div className="grid gap-1">
              {notification.title && (
                <div className="text-sm font-medium">
                  {notification.title}
                </div>
              )}
              {notification.description && (
                <div className="text-sm opacity-90">
                  {notification.description}
                </div>
              )}
              {notification.progress !== undefined && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-background/20">
                  <div
                    className="h-full bg-foreground/50 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, notification.progress))}%` }}
                  />
                </div>
              )}
            </div>
            {notification.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  notification.action?.onClick();
                }}
                className="ml-4 rounded-md bg-transparent px-3 py-1.5 text-sm font-medium text-primary underline-offset-4 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {notification.action.label}
              </button>
            )}
          </Toast>
        ))}
        <ToastViewport />
      </NotificationContext.Provider>
    </ToastProvider>
  );
}

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Helper hooks for common notification types
export function useNotify() {
  const { showNotification } = useNotification();

  return {
    success: (title: string, description?: string, options?: Omit<Notification, 'id' | 'type' | 'title' | 'description'>) =>
      showNotification({ type: 'success', title, description, ...options }),
    error: (title: string, description?: string, options?: Omit<Notification, 'id' | 'type' | 'title' | 'description'>) =>
      showNotification({ type: 'error', title, description, ...options }),
    warning: (title: string, description?: string, options?: Omit<Notification, 'id' | 'type' | 'title' | 'description'>) =>
      showNotification({ type: 'warning', title, description, ...options }),
    info: (title: string, description?: string, options?: Omit<Notification, 'id' | 'type' | 'title' | 'description'>) =>
      showNotification({ type: 'info', title, description, ...options }),
    default: (title: string, description?: string, options?: Omit<Notification, 'id' | 'type' | 'title' | 'description'>) =>
      showNotification({ type: 'default', title, description, ...options }),
  };
}
