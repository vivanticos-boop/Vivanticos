'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { LoginView } from '@/components/vivanticos/login-view';
import { AppShell } from '@/components/vivanticos/app-shell';
import { PwaInstallBanner } from '@/components/vivanticos/pwa-install-banner';
import { useSwUpdate } from '@/hooks/use-sw-update';

export default function Home() {
  const isLoggedIn = useAppStore(s => s.isLoggedIn);
  const { checkForUpdate, hasUpdate, applyUpdate } = useSwUpdate();

  // Auto-check for updates when app loads
  useEffect(() => {
    // Check after 3 seconds to not block initial load
    const timer = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Auto-apply update if found (with a small delay to let user see the toast)
  useEffect(() => {
    if (hasUpdate) {
      const timer = setTimeout(() => {
        applyUpdate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasUpdate, applyUpdate]);

  return (
    <>
      {isLoggedIn ? <AppShell /> : <LoginView />}
      <PwaInstallBanner />
    </>
  );
}
