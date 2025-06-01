'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';
import { motionVariants, useMotionPreferences } from '@/lib/motion-preferences';
import { screenReader, aria, ariaLabels } from '@/lib/accessibility-utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 
  | 'top-left' 
  | 'top-right' 
  | 'top-center'
  | 'bottom-left' 
  | 'bottom-right' 
  | 'bottom-center';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  onClose?: () => void;
  link?: {
    href: string;
    label: string;
    external?: boolean;
  };
  timestamp?: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  position: NotificationPosition;
  setPosition: (position: NotificationPosition) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: NotificationPosition;
  maxNotifications?: number;
}

export function NotificationProvider({ 
  children, 
  position: initialPosition = 'top-right',
  maxNotifications = 5
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [position, setPosition] = useState<NotificationPosition>(initialPosition);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = aria.generateId('notification');
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      
      // Limit number of notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      
      return updated;
    });

    // Announce to screen reader
    const announcement = `${notification.type} notification: ${notification.title}${
      notification.message ? `. ${notification.message}` : ''
    }`;
    screenReader.announce(announcement, notification.type === 'error' ? 'assertive' : 'polite');

    return id;
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.onClose) {
        notification.onClose();
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    screenReader.announce('All notifications cleared', 'polite');
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    position,
    setPosition,
  };

  useEffect(() => {
    // Setup notification listeners
    // ... existing code ...
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // ... existing cleanup code ...
    };
  }, []);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const context = useContext(NotificationContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!context) return null;

  const { notifications, position } = context;

  if (!mounted || typeof window === 'undefined') return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return createPortal(
    <div
      className={cn(
        'fixed z-50 w-full max-w-sm pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
}

interface NotificationItemProps {
  notification: Notification;
  index: number;
}

function NotificationItem({ notification, index }: NotificationItemProps) {
  const context = useContext(NotificationContext);
  const { prefersReducedMotion } = useMotionPreferences();
  
  // Auto-remove non-persistent notifications
  useEffect(() => {
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        if (context) {
          context.removeNotification(notification.id);
        }
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, context]);
  
  if (!context) return null;

  const { removeNotification } = context;

  const handleClose = () => {
    removeNotification(notification.id);
  };

  const handleAction = (action: NotificationAction) => {
    action.onClick();
    if (!notification.persistent) {
      removeNotification(notification.id);
    }
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorClasses = {
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300',
    },
  };

  const Icon = icons[notification.type];
  const colors = colorClasses[notification.type];

  return (
    <motion.div
      layout
      variants={motionVariants.notification}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={prefersReducedMotion}
      className="pointer-events-auto"
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        className={cn(
          'relative rounded-lg border p-4 shadow-lg backdrop-blur-sm',
          colors.container
        )}
      >
        <div className="flex items-start space-x-3">
          <Icon 
            className={cn('h-5 w-5 flex-shrink-0 mt-0.5', colors.icon)}
            aria-hidden="true"
          />
          
          <div className="flex-1 min-w-0">
            <h4 className={cn('text-sm font-medium', colors.title)}>
              {notification.title}
            </h4>
            
            {notification.message && (
              <p className={cn('mt-1 text-sm', colors.message)}>
                {notification.message}
              </p>
            )}

            {notification.link && (
              <a
                href={notification.link.href}
                target={notification.link.external ? '_blank' : '_self'}
                rel={notification.link.external ? 'noopener noreferrer' : undefined}
                className={cn(
                  'mt-2 inline-flex items-center text-sm font-medium underline hover:no-underline',
                  colors.title
                )}
              >
                {notification.link.label}
                {notification.link.external && (
                  <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" />
                )}
              </a>
            )}

            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => handleAction(action)}
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors',
                      action.variant === 'primary'
                        ? 'bg-white/80 text-gray-900 hover:bg-white dark:bg-gray-800/80 dark:text-gray-100 dark:hover:bg-gray-800'
                        : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5',
              colors.icon
            )}
            aria-label={ariaLabels.actions.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!notification.persistent && notification.duration && notification.duration > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ 
              duration: prefersReducedMotion ? 0 : notification.duration / 1000,
              ease: 'linear'
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  const showSuccess = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'timestamp'>>) => {
    return context.addNotification({ ...options, type: 'success', title });
  }, [context]);

  const showError = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'timestamp'>>) => {
    return context.addNotification({ ...options, type: 'error', title });
  }, [context]);

  const showWarning = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'timestamp'>>) => {
    return context.addNotification({ ...options, type: 'warning', title });
  }, [context]);

  const showInfo = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'timestamp'>>) => {
    return context.addNotification({ ...options, type: 'info', title });
  }, [context]);

  return {
    ...context,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

export function GlobalNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // ... existing code ...
  }, []);

  return (
    <NotificationProvider>
      {/* Rest of the component content */}
    </NotificationProvider>
  );
} 