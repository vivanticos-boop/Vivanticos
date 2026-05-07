'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, RefreshCw, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useSwUpdate } from '@/hooks/use-sw-update';

export function LoginView() {
  const login = useAppStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { checkForUpdate, applyUpdate, hasUpdate, isUpdating } = useSwUpdate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simular delay de autenticación
    await new Promise(r => setTimeout(r, 800));
    const success = login(email, password);
    if (!success) {
      toast.error('Credenciales incorrectas');
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await checkForUpdate();
    await new Promise(r => setTimeout(r, 1000));
    if (hasUpdate) {
      toast.success('Actualización encontrada. Actualizando...');
      await applyUpdate();
    } else {
      toast.success('Estás en la versión más reciente');
    }
    setSyncing(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#FAFAF8] via-[#F5F0EB] to-[#FAFAF8] p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-40 h-40 rounded-2xl bg-white shadow-md shadow-viv-beige/20 overflow-hidden border border-viv-beige/30">
            <img
              src="/logo-vivanticos.jpeg"
              alt="Vivanticos - Mobiliario Infantil"
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>

        <Card className="border-0 shadow-lg shadow-viv-beige/20">
          <CardHeader className="text-center pb-2">
            <CardTitle style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@vivanticos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-viv-sage hover:bg-viv-sage-dark text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10"
                onClick={handleSync}
                disabled={syncing || isUpdating}
              >
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                {syncing ? 'Buscando...' : hasUpdate ? 'Actualizar' : 'Actualizar App'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 border-viv-bluegrey text-viv-bluegrey hover:bg-viv-bluegrey/10"
                onClick={() => toast.success('Respaldo guardado')}
              >
                Respaldo
              </Button>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-6 p-3 rounded-lg bg-viv-peach/10 border border-viv-peach/30">
              <p className="text-xs text-muted-foreground font-medium mb-2">Credenciales de demo:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-medium">Admin:</span> admin@vivanticos.com / Vivanticos2025</p>
                <p><span className="font-medium">Jefe:</span> jefe@vivanticos.com / Vivanticos2025</p>
                <p><span className="font-medium">Vendedor:</span> vendedor@vivanticos.com / Vivanticos2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
