'use client';

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
import { Menu, Bell, LogOut, RefreshCw, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useSwUpdate } from '@/hooks/use-sw-update';

export function Header() {
  const currentUser = useAppStore(s => s.currentUser);
  const setSidebarOpen = useAppStore(s => s.setSidebarOpen);
  const logout = useAppStore(s => s.logout);
  const notificaciones = useAppStore(s => s.notificaciones);
  const unreadCount = useAppStore(s => s.unreadCount());
  const markNotificacionLeida = useAppStore(s => s.markNotificacionLeida);
  const lastSync = useAppStore(s => s.lastSync);
  const { checkForUpdate, applyUpdate, hasUpdate, isUpdating } = useSwUpdate();

  // Get loadFromSupabase functions from all stores
  const loadCatalogo = useCatalogoStore(s => s.loadFromSupabase);
  const loadCotizaciones = useCotizacionesStore(s => s.loadFromSupabase);
  const loadEntregas = useEntregasStore(s => s.loadFromSupabase);
  const loadUsuarios = useUsuariosStore(s => s.loadFromSupabase);
  const loadClientes = useClientesStore(s => s.loadFromSupabase);

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
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Notificaciones
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sin notificaciones
              </div>
            ) : (
              notificaciones.slice(0, 10).map(n => (
                <button
                  key={n.id}
                  onClick={() => markNotificacionLeida(n.id)}
                  className="w-full text-left p-3 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && (
                      <div className="w-2 h-2 rounded-full bg-viv-sage mt-1.5 flex-shrink-0" />
                    )}
                    <div className={cn("flex-1", n.leida && "opacity-60")}>
                      <p className="text-sm font-medium">{n.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.mensaje}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
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
