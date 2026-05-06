'use client';

import { useAppStore } from '@/stores/app-store';
import { LoginView } from '@/components/vivanticos/login-view';
import { AppShell } from '@/components/vivanticos/app-shell';

export default function Home() {
  const isLoggedIn = useAppStore(s => s.isLoggedIn);

  if (!isLoggedIn) {
    return <LoginView />;
  }

  return <AppShell />;
}
