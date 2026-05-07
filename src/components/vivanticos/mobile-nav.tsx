'use client';

import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  Users,
} from 'lucide-react';
import type { AppView } from '@/types';

const NAV_ITEMS: { view: AppView; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { view: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={20} /> },
  { view: 'catalogo', label: 'Catálogo', icon: <Package size={20} /> },
  { view: 'cotizaciones', label: 'Cotizar', icon: <FileText size={20} /> },
  { view: 'entregas', label: 'Entregas', icon: <Truck size={20} /> },
  { view: 'usuarios', label: 'Usuarios', icon: <Users size={20} />, roles: ['admin', 'jefe'] },
];

export function MobileNav() {
  const currentView = useAppStore(s => s.currentView);
  const navigateTo = useAppStore(s => s.navigateTo);
  const currentUser = useAppStore(s => s.currentUser);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(item => {
          if (item.roles && currentUser && !item.roles.includes(currentUser.rol)) return null;

          const isActive = currentView === item.view ||
            (item.view === 'catalogo' && ['producto-detalle', 'producto-form'].includes(currentView)) ||
            (item.view === 'cotizaciones' && ['cotizacion-form', 'cotizacion-detalle'].includes(currentView)) ||
            (item.view === 'entregas' && ['entrega-form'].includes(currentView)) ||
            (item.view === 'usuarios' && ['usuario-form'].includes(currentView));

          return (
            <button
              key={item.view}
              onClick={() => navigateTo(item.view)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[56px]',
                isActive
                  ? 'text-viv-sage-dark'
                  : 'text-muted-foreground'
              )}
            >
              <span className={cn(
                'p-1.5 rounded-lg transition-all',
                isActive && 'bg-viv-sage/15'
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
