'use client';

import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  Users,
  Settings,
  X,
  Download,
  FolderTree,
} from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import type { AppView } from '@/types';

interface SidebarProps {
  onClose?: () => void;
}

const NAV_ITEMS: { view: AppView; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { view: 'catalogo', label: 'Catálogo', icon: <Package size={20} /> },
  { view: 'categorias', label: 'Categorías', icon: <FolderTree size={20} />, roles: ['admin', 'jefe'] },
  { view: 'cotizaciones', label: 'Cotizaciones', icon: <FileText size={20} /> },
  { view: 'entregas', label: 'Entregas', icon: <Truck size={20} /> },
  { view: 'usuarios', label: 'Usuarios', icon: <Users size={20} />, roles: ['admin', 'jefe'] },
  { view: 'configuracion', label: 'Configuración', icon: <Settings size={20} /> },
];

export function Sidebar({ onClose }: SidebarProps) {
  const currentView = useAppStore(s => s.currentView);
  const navigateTo = useAppStore(s => s.navigateTo);
  const currentUser = useAppStore(s => s.currentUser);
  const { canInstall, promptInstall } = usePwaInstall();

  const handleNav = (view: AppView) => {
    navigateTo(view);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <img
              src="/logo-vivanticos.jpeg"
              alt="Vivanticos"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Vivanticos
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Mobiliario Infantil</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          // Filtrar por rol
          if (item.roles && currentUser && !item.roles.includes(currentUser.rol)) return null;

          const isActive = currentView === item.view ||
            (item.view === 'catalogo' && ['producto-detalle', 'producto-form'].includes(currentView)) ||
            (item.view === 'categorias' && false) ||
            (item.view === 'cotizaciones' && ['cotizacion-form', 'cotizacion-detalle'].includes(currentView)) ||
            (item.view === 'entregas' && ['entrega-form'].includes(currentView)) ||
            (item.view === 'usuarios' && ['usuario-form'].includes(currentView));

          return (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-viv-sage/15 text-viv-sage-dark'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className={cn(isActive && 'text-viv-sage-dark')}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Install App Button */}
      {canInstall && (
        <div className="px-3 pb-2">
          <button
            onClick={async () => {
              await promptInstall();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-viv-sage-dark bg-viv-sage/10 hover:bg-viv-sage/20 transition-all duration-200"
          >
            <Download size={20} className="text-viv-sage-dark" />
            Instalar App
          </button>
        </div>
      )}

      {/* User info */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-viv-peach/30 flex items-center justify-center text-sm font-semibold text-viv-peach-dark">
            {currentUser?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
