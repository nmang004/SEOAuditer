// PWA utilities for service worker management and offline functionality

export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAConfig {
  swUrl: string;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class PWAManager {
  private installPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as PWAInstallPrompt;
      this.dispatchEvent('installready');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.dispatchEvent('installed');
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.dispatchEvent('online');
      this.syncFailedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.dispatchEvent('offline');
    });
  }

  // Register service worker
  async register(config: PWAConfig): Promise<ServiceWorkerRegistration | undefined> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service workers not supported or running on server');
      return undefined;
    }
    
    try {
      const registration = await navigator.serviceWorker.register(config.swUrl);
      this.registration = registration;

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                config.onUpdate?.(registration);
                this.dispatchEvent('updateavailable', { registration });
              } else {
                // Content is cached for offline use
                config.onSuccess?.(registration);
                this.dispatchEvent('cached');
              }
            }
          });
        }
      });

      // Check for existing service worker updates
      if (registration.waiting) {
        config.onUpdate?.(registration);
        this.dispatchEvent('updateavailable', { registration });
      }

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !this.registration) {
      return false;
    }
    return await this.registration.unregister();
  }

  // Skip waiting and activate new service worker
  skipWaiting() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Check if app can be installed
  canInstall(): boolean {
    return typeof window !== 'undefined' && this.installPrompt !== null;
  }

  // Show install prompt
  async install(): Promise<{ outcome: 'accepted' | 'dismissed' } | null> {
    if (typeof window === 'undefined' || !this.installPrompt) return null;

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      this.installPrompt = null;
      return choiceResult;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return null;
    }
  }

  // Check if app is installed
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof window === 'undefined' || !('storage' in navigator) || !('persist' in navigator.storage)) {
      return false;
    }
    return await navigator.storage.persist();
  }

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if (typeof window === 'undefined' || !('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }
    return await navigator.storage.estimate();
  }

  // Background sync for failed requests
  async syncFailedRequests() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync-analysis');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Store failed request for background sync
  async storeFailedRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }) {
    if (typeof window === 'undefined') return;
    
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['failed-requests'], 'readwrite');
      const store = transaction.objectStore('failed-requests');
      await this.addToStore(store, {
        ...request,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to store failed request:', error);
    }
  }

  // IndexedDB helpers
  private openDatabase(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB not available on server'));
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('rival-outranker-db', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('failed-requests')) {
          db.createObjectStore('failed-requests', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cached-data')) {
          db.createObjectStore('cached-data', { keyPath: 'key' });
        }
      };
    });
  }

  private addToStore(store: IDBObjectStore, data: any): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Custom event dispatcher
  private dispatchEvent(type: string, detail?: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`pwa:${type}`, { detail }));
    }
  }

  // Push notification support
  async subscribeToPush(publicKey: string): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if notifications are supported and get permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications are not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Show local notification
  showNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') {
      return;
    }
    
    if ('serviceWorker' in navigator && this.registration) {
      // Use service worker for better handling
      this.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  }
}

// Create singleton instance - only on client side
let pwaInstance: PWAManager | null = null;

export const pwa = new Proxy({} as PWAManager, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      // Return safe defaults for server-side rendering
      const safeMethods = {
        register: () => Promise.resolve(undefined),
        unregister: () => Promise.resolve(false),
        skipWaiting: () => {},
        canInstall: () => false,
        install: () => Promise.resolve(null),
        isInstalled: () => false,
        getNetworkStatus: () => true,
        requestPersistentStorage: () => Promise.resolve(false),
        getStorageEstimate: () => Promise.resolve(null),
        syncFailedRequests: () => Promise.resolve(),
        storeFailedRequest: () => Promise.resolve(),
        subscribeToPush: () => Promise.resolve(null),
        requestNotificationPermission: () => Promise.resolve('denied' as NotificationPermission),
        showNotification: () => {},
      };
      return safeMethods[prop as keyof typeof safeMethods] || (() => {});
    }
    
    // Initialize on client side
    if (!pwaInstance) {
      pwaInstance = new PWAManager();
    }
    
    return pwaInstance[prop as keyof PWAManager];
  }
});

// Utility functions
export function isPWASupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function supportsWebShare(): boolean {
  return typeof window !== 'undefined' && 'share' in navigator;
}

export async function shareContent(data: ShareData): Promise<boolean> {
  if (typeof window === 'undefined' || !supportsWebShare()) {
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    console.error('Web Share failed:', error);
    return false;
  }
}

// Haptic feedback for supported devices
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
  };
  navigator.vibrate(patterns[type]);
}

export default pwa; 