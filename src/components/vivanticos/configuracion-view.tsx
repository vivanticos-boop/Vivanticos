'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Shield,
  RefreshCw,
  Save,
  Bell,
  BellOff,
  CheckCheck,
  Info,
  LogOut,
  Clock,
  Moon,
  Package,
} from 'lucide-react';
import { getRolName, getRolColor, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

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

  if (!currentUser) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const now = new Date().toISOString();
      setLastSync(now);
      toast.success('Datos sincronizados');
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
      // Simulate backup to localStorage
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
              <p className="text-sm font-medium">Sincronizar datos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Actualiza los datos con el servidor
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
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
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

      {/* Notifications Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-base"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              <Bell size={16} className="inline mr-2" />
              Notificaciones
            </CardTitle>
            {unreadCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-viv-sage-dark hover:text-viv-sage-dark hover:bg-viv-sage/10"
                onClick={handleMarkAllRead}
              >
                <CheckCheck size={14} className="mr-1" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
          {unreadCount() > 0 && (
            <Badge className="bg-viv-rose text-white border-0 text-[10px] w-fit">
              {unreadCount()} sin leer
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {notificaciones.length === 0 ? (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 rounded-xl bg-viv-sage/10 flex items-center justify-center mb-3">
                <BellOff size={20} className="text-viv-sage/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {notificaciones.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificacionClick(notif.id)}
                  className={`w-full text-left rounded-lg p-3 transition-colors ${
                    notif.leida
                      ? 'bg-transparent hover:bg-muted/50'
                      : 'bg-viv-beige/30 hover:bg-viv-beige/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {notif.leida ? (
                        <Bell size={14} className="text-muted-foreground/50" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-viv-rose mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${
                            notif.leida
                              ? 'text-muted-foreground'
                              : 'font-semibold'
                          }`}
                        >
                          {notif.titulo}
                        </p>
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          notif.leida
                            ? 'text-muted-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {notif.mensaje}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {formatDateTime(notif.creado_en)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
            <span className="font-mono text-xs">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plataforma</span>
            <span className="text-xs">Web App</span>
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
