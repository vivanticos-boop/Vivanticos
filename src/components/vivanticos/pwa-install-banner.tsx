'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner for iOS too after a delay
    if (ios) {
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa-ios-dismissed', 'true');
    }
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-viv-beige/30 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-viv-sage/10 flex items-center justify-center flex-shrink-0">
              <img
                src="/logo-vivanticos.jpeg"
                alt="Vivanticos"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                Instalar Vivanticos
              </p>
              <p className="text-[11px] text-muted-foreground">
                Acceso rápido desde tu pantalla
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {isIOS ? (
          <div className="text-xs text-muted-foreground space-y-2 bg-viv-sage/5 rounded-xl p-3">
            <p className="font-semibold text-foreground">Para instalar en iOS:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Toca el ícono <span className="inline-flex"><Smartphone size={12} /></span> de <strong>Compartir</strong> en Safari</li>
              <li>Selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong></li>
              <li>Toca <strong>&quot;Agregar&quot;</strong></li>
            </ol>
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            className="w-full bg-viv-sage hover:bg-viv-sage-dark text-white h-10"
          >
            <Download size={16} className="mr-2" />
            Instalar App
          </Button>
        )}
      </div>
    </div>
  );
}
