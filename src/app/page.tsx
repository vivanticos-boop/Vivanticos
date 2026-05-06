'use client';

import { useAppStore } from '@/stores/app-store';
import { LoginView } from '@/components/vivanticos/login-view';
import { AppShell } from '@/components/vivanticos/app-shell';
import { PwaInstallBanner } from '@/components/vivanticos/pwa-install-banner';

export default function Home() {
  const isLoggedIn = useAppStore(s => s.isLoggedIn);

  return (
    <>
      {isLoggedIn ? <AppShell /> : <LoginView />}
      <PwaInstallBanner />
    </>
  );
}
