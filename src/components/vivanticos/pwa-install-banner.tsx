'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function PwaInstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInstalled || dismissed) return;

    // Show banner quickly - after 1.5 seconds
    const timer = setTimeout(() => {
      // Check if user dismissed it recently (within 7 days)
      const dismissedAt = localStorage.getItem('pwa-banner-dismissed');
      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }
      setShowBanner(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInstalled, dismissed]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', String(Date.now()));
  };

  if (!showBanner || isInstalled || !canInstall) return null;

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
