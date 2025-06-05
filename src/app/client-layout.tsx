'use client';

import { useEffect, useState } from 'react';
import { Providers } from '@/components/providers';
import { pwa, isStandalone } from '@/lib/pwa';
import { useNetworkStatus } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MobileSheetProvider } from '@/components/ui/mobile-sheet';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Service Worker registration - TEMPORARILY DISABLED for email verification debugging
  useEffect(() => {
    if (mounted && 'serviceWorker' in navigator) {
      // TEMPORARILY DISABLE SERVICE WORKER REGISTRATION
      console.log('Service Worker registration temporarily disabled for debugging email verification');
      
      // Unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('Found', registrations.length, 'service worker registrations');
        registrations.forEach(registration => {
          registration.unregister().then(success => {
            console.log('Service Worker unregistered:', success);
          });
        });
      });
      
      setSwRegistered(false);
    }
  }, [mounted]);

  // PWA install prompt
  useEffect(() => {
    const handleInstallReady = () => {
      if (!isStandalone() && pwa.canInstall()) {
        setShowInstallPrompt(true);
      }
    };

    const handleInstalled = () => {
      setShowInstallPrompt(false);
    };

    window.addEventListener('pwa:installready', handleInstallReady);
    window.addEventListener('pwa:installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa:installready', handleInstallReady);
      window.removeEventListener('pwa:installed', handleInstalled);
    };
  }, []);

  // Network status monitoring
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isOnline) {
      // Show offline banner after a delay to avoid flashing
      timeoutId = setTimeout(() => {
        setShowOfflineBanner(true);
      }, 1000);
    } else {
      setShowOfflineBanner(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOnline]);

  // Request permissions and setup
  useEffect(() => {
    if (mounted) {
      // Request persistent storage
      pwa.requestPersistentStorage().then(granted => {
        console.log('Persistent storage:', granted ? 'granted' : 'denied');
      });

      // Request notification permission for PWA
      pwa.requestNotificationPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, [mounted]);

  // Clean up browser extension artifacts
  useEffect(() => {
    setMounted(true);
    
    const cleanupAttributes = () => {
      const body = document.body;
      if (body) {
        body.removeAttribute('data-new-gr-c-s-check-loaded');
        body.removeAttribute('data-gr-ext-installed');
      }
    };

    cleanupAttributes();
    const timer = setTimeout(cleanupAttributes, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleInstallApp = async () => {
    const result = await pwa.install();
    if (result?.outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdateApp = () => {
    pwa.skipWaiting();
    window.location.reload();
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <MobileSheetProvider>
      <Providers>
        {children}

        {/* Offline Banner */}
        <AnimatePresence>
          {showOfflineBanner && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white"
            >
              <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm">
                <WifiOff className="h-4 w-4" />
                <span>You're offline. Some features may be limited.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Online Banner (brief notification when coming back online) */}
        <AnimatePresence>
          {mounted && isOnline && showOfflineBanner && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white"
              onAnimationComplete={() => {
                setTimeout(() => setShowOfflineBanner(false), 2000);
              }}
            >
              <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm">
                <Wifi className="h-4 w-4" />
                <span>Back online! Data will sync automatically.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Update Available */}
        <AnimatePresence>
          {updateAvailable && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">Update Available</h4>
                      <p className="text-sm text-muted-foreground">
                        A new version of the app is ready to install.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdateApp}>
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUpdateAvailable(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Install Prompt */}
        <AnimatePresence>
          {showInstallPrompt && !sessionStorage.getItem('installPromptDismissed') && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                      <Download className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">Install SEO Director</h4>
                      <p className="text-sm text-muted-foreground">
                        Get the full app experience with offline access and faster loading.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismissInstall}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleInstallApp} className="flex-1">
                      Install App
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDismissInstall}
                    >
                      Not Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Development indicators */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-2 left-2 z-50 text-xs">
            <div className="bg-background border rounded px-2 py-1 shadow-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'} | SW: {swRegistered ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Providers>
    </MobileSheetProvider>
  );
}
