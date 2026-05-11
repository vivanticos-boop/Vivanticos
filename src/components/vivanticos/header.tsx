'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { useEntregasStore } from '@/stores/entregas-store';
import { useUsuariosStore } from '@/stores/usuarios-store';
import { useClientesStore } from '@/stores/clientes-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Menu, Bell, LogOut, RefreshCw, Clock,
  Truck, FileText, AlertTriangle, CheckCircle2,
  Clock3, Info, CheckCheck,
} from 'lucide-react';
import { formatDateTime, formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import { useSwUpdate } from '@/hooks/use-sw-update';
import type { TipoNotificacion } from '@/types';

// Icon + color map for notification types
const NOTIF_CONFIG: Record<TipoNotificacion, { icon: React.ReactNode; color: string; bg: string }> = {
  entrega_hoy: {
    icon: <Truck size={14} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  entrega_manana: {
    icon: <Clock3 size={14} />,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  entrega_vencida: {
    icon: <AlertTriangle size={14} />,
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  cotizacion_aprobada: {
    icon: <CheckCircle2 size={14} />,
    color: 'text-viv-sage-dark',
    bg: 'bg-viv-sage/20',
  },
  cotizacion_pendiente: {
    icon: <FileText size={14} />,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  info: {
    icon: <Info size={14} />,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export function Header() {
  const currentUser = useAppStore(s => s.currentUser);
  const setSidebarOpen = useAppStore(s => s.setSidebarOpen);
  const logout = useAppStore(s => s.logout);
  const notificaciones = useAppStore(s => s.notificaciones);
  const unreadCount = useAppStore(s => s.unreadCount());
  const markNotificacionLeida = useAppStore(s => s.markNotificacionLeida);
  const markAllNotificacionesLeidas = useAppStore(s => s.markAllNotificacionesLeidas);
  const generateNotificaciones = useAppStore(s => s.generateNotificaciones);
  const lastSync = useAppStore(s => s.lastSync);
  const { checkForUpdate, applyUpdate, hasUpdate, isUpdating } = useSwUpdate();

  // Get loadFromSupabase functions from all stores
  const loadCatalogo = useCatalogoStore(s => s.loadFromSupabase);
  const loadCotizaciones = useCotizacionesStore(s => s.loadFromSupabase);
  const loadEntregas = useEntregasStore(s => s.loadFromSupabase);
  const loadUsuarios = useUsuariosStore(s => s.loadFromSupabase);
  const loadClientes = useClientesStore(s => s.loadFromSupabase);

  // Get current data for notification generation
  const entregas = useEntregasStore(s => s.entregas);
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);

  // Generate notifications when data changes
  useEffect(() => {
    if (entregas.length > 0 || cotizaciones.length > 0) {
      generateNotificaciones(entregas, cotizaciones);
    }
  }, [entregas, cotizaciones, generateNotificaciones]);

  const handleSync = async () => {
    useAppStore.getState().setIsLoading(true);
    toast.info('Sincronizando datos...');
    
    try {
      // 1. Sync ALL data from Supabase first
      await Promise.all([
        loadCatalogo(),
        loadUsuarios(),
        loadClientes(),
        loadCotizaciones(),
        loadEntregas(),
      ]);

      // 2. Check for SW update
      await checkForUpdate();
      await new Promise(r => setTimeout(r, 500));
      
      if (hasUpdate) {
        toast.success('¡Datos sincronizados! Actualizando app...');
        await applyUpdate();
      } else {
        useAppStore.getState().setLastSync(new Date().toISOString());
        toast.success('¡Sincronización completa!', {
          description: 'Catálogo, usuarios, cotizaciones y entregas actualizados'
        });
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      toast.error('Error al sincronizar algunos datos');
    }
    
    useAppStore.getState().setIsLoading(false);
  };

  // Handle notification click — navigate to related item
  const handleNotificacionClick = (n: typeof notificaciones[0]) => {
    markNotificacionLeida(n.id);

    if (n.relacionado_tipo === 'entrega' && n.relacionado_id) {
      useAppStore.getState().setSelectedEntregaId(n.relacionado_id);
      useAppStore.getState().navigateTo('entregas');
    } else if (n.relacionado_tipo === 'cotizacion' && n.relacionado_id) {
      useAppStore.getState().setSelectedCotizacionId(n.relacionado_id);
      useAppStore.getState().navigateTo('cotizacion-detalle');
    }
  };

  // Sort: unread first, then by date
  const sortedNotificaciones = [...notificaciones].sort((a, b) => {
    if (a.leida !== b.leida) return a.leida ? 1 : -1;
    return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime();
  });

  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border flex items-center px-4 md:px-6 gap-3 safe-area-top" style={{ height: 'calc(3.5rem + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={20} />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last sync */}
      {lastSync && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>Últ. sync: {formatDateTime(lastSync)}</span>
        </div>
      )}

      {/* Sync button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        onClick={handleSync}
        title="Sincronizar datos"
      >
        <RefreshCw size={18} />
      </Button>

      {/* Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell size={18} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-viv-rose text-white border-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          {/* Header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-viv-sage-dark hover:text-viv-sage-dark hover:bg-viv-sage/10 px-2"
                onClick={markAllNotificacionesLeidas}
              >
                <CheckCheck size={12} className="mr-1" />
                Leer todas
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto">
            {sortedNotificaciones.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                  <Bell size={18} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sin notificaciones
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Las alertas de entregas y cotizaciones aparecerán aquí
                </p>
              </div>
            ) : (
              sortedNotificaciones.slice(0, 15).map(n => {
                const config = NOTIF_CONFIG[n.tipo] || NOTIF_CONFIG.info;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificacionClick(n)}
                    className="w-full text-left p-3 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className={cn("flex-1 min-w-0", n.leida && "opacity-50")}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{n.titulo}</p>
                          {!n.leida && (
                            <div className="w-1.5 h-1.5 rounded-full bg-viv-sage flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensaje}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatTimeAgo(n.creado_en)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => useAppStore.getState().clearNotificaciones()}
              >
                Limpiar todo
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* User & Logout */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-viv-peach/30 flex items-center justify-center text-xs font-semibold text-viv-peach-dark">
            {currentUser?.nombre?.charAt(0) || 'U'}
          </div>
          <span className="text-sm font-medium max-w-[120px] truncate">{currentUser?.nombre}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
