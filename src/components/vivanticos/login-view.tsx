'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useUsuariosStore } from '@/stores/usuarios-store';
import { useCatalogoStore } from '@/stores/data-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { useEntregasStore } from '@/stores/entregas-store';
import { useClientesStore } from '@/stores/clientes-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, RefreshCw, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useSwUpdate } from '@/hooks/use-sw-update';

// 52 frases motivacionales — una por semana del año
const WEEKLY_QUOTES = [
  // Enero
  'Cada mueble que creamos lleva amor y dedicación para los más pequeños del hogar',
  'Convertir sueños en espacios llenos de magia, eso es Vivanticos',
  'Un cuarto de bebé no es solo un espacio, es un mundo de ilusiones',
  'Diseñamos con el corazón para que los peques crezcan rodeados de belleza',
  // Febrero
  'Cada cuna que fabricamos es el primer hogar de una nueva historia',
  'Los grandes negocios empiezan con pequeños sueños y mucho esfuerzo',
  'No esperes el momento perfecto, crea muebles que hagan perfecto cada momento',
  'La perseverancia transforma una idea en un hogar lleno de vida',
  // Marzo
  'Cada detalle importa cuando se trata del bienestar de un bebé',
  'La creatividad es el motor que mueve nuestras manos y nuestros sueños',
  'Un buen día de trabajo es aquel donde aprendes algo nuevo',
  'No vendemos muebles, creamos espacios donde nace la felicidad',
  // Abril
  'La excelencia no es un acto, es un hábito que cultivamos cada día',
  'Detrás de cada producto hay una familia que confía en nosotros',
  'El éxito se construye día a día, cuna a cuna, sueño a sueño',
  'Cada entrega es una promesa cumplida y una sonrisa garantizada',
  // Mayo
  'La pasión por lo que hacemos se nota en cada acabado y cada detalle',
  'Los desafíos son oportunidades disfrazadas de muebles por armar',
  'Un equipo que sueña juntos, construye negocios que perduran',
  'La calidad no se negocia, se teje con amor en cada rincón',
  // Junio
  'Hoy es un buen día para hacer la diferencia en la vida de una familia',
  'No hay atajos hacia el éxito, pero sí hay muebles que hacen el camino más bello',
  'La constancia es la llave que abre puertas que el talento solo puede soñar',
  'Cada cliente satisfecho es un embajador de nuestra pasión',
  // Julio
  'Innovar es atreverse a crear lo que nadie imaginó para los más pequeños',
  'El mejor momento para empezar fue ayer, el segundo mejor es ahora',
  'Cada semana es una nueva oportunidad para superar lo logrado',
  'Los muebles no solo decoran, cuentan historias de amor y familia',
  // Agosto
  'Soñar en grande no cuesta nada, construir esos sueños vale todo',
  'La diferencia entre lo ordinario y lo extraordinario está en la dedicación',
  'Un bebé merece lo mejor, y eso es lo que nos motiva a mejorar cada día',
  'El trabajo duro vence al talento cuando el talento no trabaja duro',
  // Septiembre
  'Cada diseño es una carta de amor escrita en madera y tela',
  'La paciencia y el cuidado transforman la materia prima en una obra de arte',
  'No importa cuántas veces caigas, importa cuántas veces volvemos a crear',
  'La diferencia está en los detalles que otros no ven pero los papás sí sienten',
  // Octubre
  'El éxito de Vivanticos se mide en sonrisas, no solo en ventas',
  'Creemos en el poder de transformar espacios y vidas con lo que hacemos',
  'Cada semana trae consigo una nueva oportunidad para ser mejores',
  'La inspiración viene de los pequeños, la ejecución de los valientes',
  // Noviembre
  'Un mueble bien hecho es un abrazo que dura años en el hogar de una familia',
  'No se trata de vender más, se trata de impactar mejor la vida de cada cliente',
  'La disciplina es el puente entre las metas y los logros',
  'Cada niño merece un espacio donde su imaginación vuele sin límites',
  // Diciembre
  'El fin del año es el momento perfecto para soñar más grande',
  'Agradecemos cada familia que nos permitió ser parte de su historia',
  'Cerrar un año con propósito es abrir el siguiente con determinación',
  'Lo que construimos con amor perdura más allá del tiempo',
  // Extras
  'El futuro pertenece a quienes creen en la belleza de sus sueños',
  'Cada mañana es un lienzo en blanco, píntalo con pasión y propósito',
  'Vivanticos no es solo una marca, es una familia que crea para familias',
  'El mejor regalo para un bebé es un hogar lleno de amor y buenos momentos',
];

function getWeeklyQuote(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysSinceStart / 7);
  return WEEKLY_QUOTES[weekNumber % WEEKLY_QUOTES.length];
}

export function LoginView() {
  const login = useAppStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { checkForUpdate, applyUpdate, hasUpdate, isUpdating } = useSwUpdate();

  // Get loadFromSupabase functions
  const loadUsuarios = useUsuariosStore(s => s.loadFromSupabase);
  const loadCatalogo = useCatalogoStore(s => s.loadFromSupabase);
  const loadCotizaciones = useCotizacionesStore(s => s.loadFromSupabase);
  const loadEntregas = useEntregasStore(s => s.loadFromSupabase);
  const loadClientes = useClientesStore(s => s.loadFromSupabase);

  // Load users from Supabase on mount (for fresh credentials)
  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

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
    toast.info('Sincronizando datos...');
    
    try {
      // Sync ALL data from Supabase
      await Promise.all([
        loadUsuarios(),
        loadCatalogo(),
        loadClientes(),
        loadCotizaciones(),
        loadEntregas(),
      ]);

      // Check for SW update
      await checkForUpdate();
      await new Promise(r => setTimeout(r, 500));
      
      if (hasUpdate) {
        toast.success('¡Datos sincronizados! Actualizando app...');
        await applyUpdate();
      } else {
        toast.success('¡Sincronización completa!', {
          description: 'Usuarios, catálogo y datos actualizados'
        });
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      toast.error('Error al sincronizar algunos datos');
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
              alt="Vivanticos - Muebles y Decoración Infantil"
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

            {/* Frase motivacional semanal */}
            <div className="mt-6 p-4 rounded-lg bg-viv-sage/5 border border-viv-sage/15 text-center">
              <p className="text-xs text-viv-sage-dark/80 italic leading-relaxed">
                "{getWeeklyQuote()}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
