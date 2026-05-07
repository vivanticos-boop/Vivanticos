'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UpdateInfo {
  hasUpdate: boolean;
  isUpdating: boolean;
  applyUpdate: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
}

export function useSwUpdate(): UpdateInfo {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const toastShownRef = useRef(false);

  // Listen for SW updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Listen for messages from the Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        // New SW activated — reload to get fresh content
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.success('App actualizada', {
            duration: 4000,
            description: 'Nueva versión disponible. Recargando...',
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
      if (event.data && event.data.type === 'FORCE_RELOAD') {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Check for waiting SW on load
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      registrationRef.current = reg;

      // If there's a waiting worker, an update is ready
      if (reg.waiting) {
        setHasUpdate(true);
        showUpdateToast();
      }

      // Listen for new workers
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed and waiting
            setHasUpdate(true);
            showUpdateToast();
          }
        });
      });
    });

    // Periodic check every 5 minutes (mobile needs this)
    const interval = setInterval(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            setHasUpdate(true);
            showUpdateToast();
          }
        }
      } catch {}
    }, 300000);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const showUpdateToast = () => {
    if (toastShownRef.current) return;
    toastShownRef.current = true;
    toast.info('Actualización disponible', {
      duration: 8000,
      action: {
        label: 'Actualizar',
        onClick: () => applyUpdate(),
      },
    });
  };

  const applyUpdate = async () => {
    setIsUpdating(true);

    try {
      const reg = registrationRef.current || await navigator.serviceWorker.getRegistration();

      if (reg?.waiting) {
        // Tell the waiting SW to activate
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        // The SW will claim clients and we'll get a message, then reload
        // Safety: force reload after 3s if SW message doesn't trigger it
        setTimeout(() => window.location.reload(), 3000);
      } else if (reg?.installing) {
        // Wait for install to finish, then skip waiting
        reg.installing.addEventListener('statechange', () => {
          if (reg.installing?.state === 'installed') {
            reg.installing.postMessage({ type: 'SKIP_WAITING' });
          }
        });
        setTimeout(() => window.location.reload(), 3000);
      } else {
        // No update pending, force a full cache clear and reload
        if (reg) {
          reg.active?.postMessage({ type: 'FORCE_UPDATE' });
        }
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch {
      // Fallback: just reload
      window.location.reload();
    }
  };

  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        registrationRef.current = reg;
        await reg.update();
        // If there's a waiting worker after update check
        if (reg.waiting) {
          setHasUpdate(true);
          showUpdateToast();
        }
      }
    } catch (err) {
      console.log('SW update check failed:', err);
    }
  }, []);

  return { hasUpdate, isUpdating, applyUpdate, checkForUpdate };
}
