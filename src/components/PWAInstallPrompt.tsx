import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInStandaloneMode(isStandalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already dismissed, in standalone mode, or no prompt available
  if (
    isInStandaloneMode || 
    localStorage.getItem('pwa-install-dismissed') === 'true'
  ) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-primary to-accent text-white border-none shadow-2xl mx-auto max-w-sm md:max-w-md">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg mb-1">Install Medinix App</h3>
              <p className="text-xs sm:text-sm text-white/90 leading-tight">
                {isIOS 
                  ? "Tap the Share button below, then 'Add to Home Screen'" 
                  : "Get quick access and push notifications"
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isIOS && (
              <Button
                onClick={handleInstallClick}
                size="sm"
                disabled={!deferredPrompt}
                className="flex-1 sm:flex-none bg-white text-primary hover:bg-white/90 font-semibold h-10 disabled:opacity-60"
                title={deferredPrompt ? 'Install the app' : 'Use browser menu → Add to Home screen'}
              >
                <Download className="h-4 w-4 mr-2" />
                Install Now
              </Button>
            )}
            {isIOS && (
              <Button
                size="sm"
                className="flex-1 sm:flex-none bg-white text-primary hover:bg-white/90 font-semibold h-10 pointer-events-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Tap Share ↓
              </Button>
            )}
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-10 w-10 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;