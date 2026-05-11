'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Mail,
  Shield,
  RefreshCw,
  Save,
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  Info,
  LogOut,
  Clock,
  Moon,
  Package,
  Download,
  Smartphone,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getRolName, getRolColor, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useSwUpdate } from '@/hooks/use-sw-update';
import { usePushNotifications } from '@/hooks/use-push-notifications';

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ConfiguracionView() {
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const lastSync = useAppStore(s => s.lastSync);
  const setLastSync = useAppStore(s => s.setLastSync);
  const isLoading = useAppStore(s => s.isLoading);
  const setIsLoading = useAppStore(s => s.setIsLoading);
  const notificaciones = useAppStore(s => s.notificaciones);
  const markNotificacionLeida = useAppStore(s => s.markNotificacionLeida);
  const unreadCount = useAppStore(s => s.unreadCount);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const { checkForUpdate, applyUpdate, hasUpdate, isUpdating } = useSwUpdate();
  const [justInstalled, setJustInstalled] = useState(false);

  // Push notifications hook
  const push = usePushNotifications();

  if (!currentUser) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      await checkForUpdate();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (hasUpdate) {
        toast.success('Actualización encontrada. Actualizando...');
        await applyUpdate();
      } else {
        const now = new Date().toISOString();
        setLastSync(now);
        toast.success('Datos sincronizados. Estás en la versión más reciente');
      }
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const backupData = {
        timestamp: new Date().toISOString(),
        user: currentUser,
        notificaciones,
      };
      localStorage.setItem(
        'vivanticos-backup',
        JSON.stringify(backupData)
      );
      toast.success('Respaldo guardado en el dispositivo');
    } catch {
      toast.error('Error al respaldar');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleMarkAllRead = () => {
    notificaciones.forEach(n => {
      if (!n.leida) {
        markNotificacionLeida(n.id);
      }
    });
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const handleNotificacionClick = (id: string) => {
    const notif = notificaciones.find(n => n.id === id);
    if (notif && !notif.leida) {
      markNotificacionLeida(id);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
  };

  const handleTogglePush = async () => {
    if (push.isSubscribed) {
      const result = await push.unsubscribe();
      if (result?.success) {
        toast.success('Notificaciones push desactivadas');
      } else {
        toast.error('Error al desactivar notificaciones push');
      }
    } else {
      const result = await push.subscribe();
      if (result?.success) {
        toast.success('¡Notificaciones push activadas! Recibirás alertas aunque la app esté cerrada');
      } else {
        if (push.permissionStatus === 'denied') {
          toast.error('Permiso denegado. Ve a la configuración del navegador para permitir notificaciones', {
            duration: 5000,
          });
        } else {
          toast.error(result?.error || 'Error al activar notificaciones push');
        }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-league-spartan)' }}
        >
          Configuración
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      {/* Current User Info Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <User size={16} className="inline mr-2" />
            Mi Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {currentUser.avatar_url && (
                <AvatarImage
                  src={currentUser.avatar_url}
                  alt={currentUser.nombre}
                />
              )}
              <AvatarFallback
                className={`${getRolColor(currentUser.rol)} text-lg font-bold`}
              >
                {getInitials(currentUser.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base truncate"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                {currentUser.nombre}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Mail size={12} className="flex-shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <Badge
                className={`${getRolColor(currentUser.rol)} text-xs border-0 mt-2 px-2.5 py-0.5`}
              >
                <Shield size={10} className="mr-1" />
                {getRolName(currentUser.rol)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Install Section */}
      {(canInstall || isInstalled) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-base"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              <Smartphone size={16} className="inline mr-2" />
              App Móvil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isInstalled || justInstalled ? (
              <div className="flex items-center gap-3 bg-viv-sage/10 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-viv-sage/20 flex items-center justify-center flex-shrink-0">
                  <Check size={20} className="text-viv-sage-dark" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-viv-sage-dark">App instalada</p>
                  <p className="text-xs text-muted-foreground">Vivanticos está instalada en tu dispositivo</p>
                </div>
              </div>
            ) : isIOS ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-viv-peach/15 flex items-center justify-center flex-shrink-0">
                    <Download size={20} className="text-viv-peach-dark" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instalar en iOS</p>
                    <p className="text-xs text-muted-foreground">Agrega Vivanticos a tu pantalla de inicio</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-2 bg-viv-sage/5 rounded-xl p-3">
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Toca el ícono de <strong>Compartir</strong> en Safari (cuadrado con flecha arriba)</li>
                    <li>Desplázate y selecciona <strong>"Agregar a pantalla de inicio"</strong></li>
                    <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-viv-peach/15 flex items-center justify-center flex-shrink-0">
                    <Download size={20} className="text-viv-peach-dark" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Instalar aplicación</p>
                    <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-viv-sage hover:bg-viv-sage-dark text-white h-10"
                  onClick={async () => {
                    const accepted = await promptInstall();
                    if (accepted) {
                      setJustInstalled(true);
                      toast.success('App instalada correctamente');
                    }
                  }}
                >
                  <Download size={16} className="mr-2" />
                  Instalar App
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Push Notifications Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <BellRing size={16} className="inline mr-2" />
            Notificaciones Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!push.isSupported ? (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">No soportado</p>
                <p className="text-xs text-muted-foreground">
                  Tu navegador no soporta notificaciones push. Usa Chrome o Edge para esta función.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Notificaciones push</p>
                    {push.isSubscribed ? (
                      <Badge className="bg-viv-sage text-white border-0 text-[10px] px-1.5 py-0">
                        Activo
                      </Badge>
                    ) : push.permissionStatus === 'denied' ? (
                      <Badge className="bg-red-500 text-white border-0 text-[10px] px-1.5 py-0">
                        Bloqueado
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {push.isSubscribed
                      ? 'Recibirás alertas de entregas y cotizaciones aunque la app esté cerrada'
                      : push.permissionStatus === 'denied'
                        ? 'Permiso bloqueado. Ve a la configuración del navegador para permitir notificaciones'
                        : 'Activa para recibir alertas incluso con la app cerrada'}
                  </p>
                </div>
                <Switch
                  checked={push.isSubscribed}
                  onCheckedChange={handleTogglePush}
                  disabled={push.isLoading || push.permissionStatus === 'denied'}
                />
              </div>

              {push.permissionStatus === 'denied' && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
                  <strong>Permiso bloqueado:</strong> Para reactivar, ve a la configuración de tu navegador →
                  Sitios → Notificaciones → Permitir para vivanticos.vercel.app
                </div>
              )}

              {push.isSubscribed && (
                <div className="bg-viv-sage/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Check size={14} className="text-viv-sage-dark" />
                    <p className="text-xs font-semibold text-viv-sage-dark">Notificaciones activas</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se verificarán entregas pendientes, vencidas y cotizaciones cada 5 minutos.
                    También verás las alertas en la campana de la app.
                  </p>
                </div>
              )}

              {push.error && (
                <p className="text-xs text-red-500">{push.error}</p>
              )}
            </>
          )}

          <Separator />

          {/* In-app notifications section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Notificaciones en la app</p>
                <p className="text-xs text-muted-foreground">
                  Alertas dentro de Vivanticos (siempre activas)
                </p>
              </div>
              {unreadCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-viv-sage-dark hover:text-viv-sage-dark hover:bg-viv-sage/10"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck size={14} className="mr-1" />
                  Marcar leídas
                </Button>
              )}
            </div>
            {unreadCount() > 0 && (
              <Badge className="bg-viv-rose text-white border-0 text-[10px] w-fit mb-3">
                {unreadCount()} sin leer
              </Badge>
            )}
            {notificaciones.length === 0 ? (
              <div className="text-center py-4">
                <div className="mx-auto w-10 h-10 rounded-xl bg-viv-sage/10 flex items-center justify-center mb-2">
                  <BellOff size={16} className="text-viv-sage/50" />
                </div>
                <p className="text-xs text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {notificaciones.slice(0, 10).map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificacionClick(notif.id)}
                    className={`w-full text-left rounded-lg p-2.5 transition-colors ${
                      notif.leida
                        ? 'bg-transparent hover:bg-muted/50'
                        : 'bg-viv-beige/30 hover:bg-viv-beige/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {notif.leida ? (
                          <Bell size={12} className="text-muted-foreground/50" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-viv-rose mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${notif.leida ? 'text-muted-foreground' : 'font-semibold'}`}>
                          {notif.titulo}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${notif.leida ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                          {notif.mensaje}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <RefreshCw size={16} className="inline mr-2" />
            Sincronización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Sincronizar y actualizar</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sincroniza datos y busca actualizaciones de la app
              </p>
              {lastSync && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <Clock size={10} />
                  <span>Última sincronización: {formatDateTime(lastSync)}</span>
                </div>
              )}
            </div>
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={handleSync}
              disabled={isSyncing || isLoading}
              size="sm"
            >
              <RefreshCw
                size={14}
                className={`mr-1.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Buscando...' : hasUpdate ? 'Actualizar ahora' : 'Sincronizar'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Respaldar datos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guarda una copia local de tus datos
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleBackup}
              disabled={isBackingUp}
              size="sm"
              className="border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10"
            >
              <Save
                size={14}
                className={`mr-1.5 ${isBackingUp ? 'animate-pulse' : ''}`}
              />
              {isBackingUp ? 'Guardando...' : 'Respaldar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Section (Placeholder) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <Moon size={16} className="inline mr-2" />
            Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo oscuro</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Próximamente disponible
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] bg-viv-bluegrey/15 text-viv-bluegrey"
            >
              Próximamente
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <Info size={16} className="inline mr-2" />
            Acerca de
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-viv-sage/15 flex items-center justify-center">
              <Package size={20} className="text-viv-sage-dark" />
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                Vivanticos
              </p>
              <p className="text-xs text-muted-foreground">
                Gestión de mobiliario infantil
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Versión</span>
            <span className="font-mono text-xs">1.8.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plataforma</span>
            <span className="text-xs">Web App + Push</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut size={16} className="mr-2" />
        Cerrar sesión
      </Button>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
}
