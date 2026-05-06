'use client';

import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { useEntregasStore } from '@/stores/entregas-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, FileText, Truck, DollarSign,
  TrendingUp, Clock, ArrowRight, AlertCircle,
  Calendar,
} from 'lucide-react';
import { formatPrice, formatDate, getEstadoCotizacionColor, getEstadoEntregaColor } from '@/lib/utils';

export function DashboardView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const setSelectedCotizacionId = useAppStore(s => s.setSelectedCotizacionId);
  const setSelectedEntregaId = useAppStore(s => s.setSelectedEntregaId);

  const productos = useCatalogoStore(s => s.productos);
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);
  const entregas = useEntregasStore(s => s.entregas);
  const getProximasEntregas = useEntregasStore(s => s.getProximasEntregas);

  // KPIs
  const totalProductos = productos.filter(p => p.activo).length;
  const cotizacionesPendientes = cotizaciones.filter(c => c.estado === 'borrador' || c.estado === 'enviada').length;
  const entregasPendientes = entregas.filter(e => e.estado === 'pendiente').length;
  const ventasTotales = cotizaciones.filter(c => c.estado === 'aprobada').reduce((sum, c) => sum + c.total, 0);
  const proximasEntregas = getProximasEntregas(7);

  // Cotizaciones recientes
  const cotizacionesRecientes = [...cotizaciones].sort((a, b) =>
    new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>
          Bienvenido a Vivanticos
        </h2>
        <p className="text-muted-foreground mt-1">Resumen general de tu actividad</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 shadow-sm bg-viv-sage/10 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('catalogo')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-viv-sage/20">
                <Package size={18} className="text-viv-sage-dark" />
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>{totalProductos}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Productos activos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-viv-peach/10 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('cotizaciones')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-viv-peach/20">
                <FileText size={18} className="text-viv-peach-dark" />
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>{cotizacionesPendientes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cotizaciones pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-viv-bluegrey/10 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('entregas')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-viv-bluegrey/20">
                <Truck size={18} className="text-viv-bluegrey" />
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>{entregasPendientes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Entregas pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-viv-rose/10 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-viv-rose/20">
                <DollarSign size={18} className="text-viv-rose-dark" />
              </div>
              <TrendingUp size={14} className="text-viv-sage-dark" />
            </div>
            <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              {formatPrice(ventasTotales)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ventas aprobadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Próximas Entregas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-viv-bluegrey" />
                  Próximas Entregas
                </div>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigateTo('entregas')}>
                Ver todas <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {proximasEntregas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay entregas próximas
              </p>
            ) : (
              <div className="space-y-2">
                {proximasEntregas.slice(0, 4).map(e => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => { setSelectedEntregaId(e.id); navigateTo('entregas'); }}
                  >
                    <div className="p-1.5 rounded-lg bg-viv-bluegrey/20">
                      <Calendar size={14} className="text-viv-bluegrey" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.cliente_nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.fecha_entrega)}</p>
                    </div>
                    <Badge className={`text-[10px] px-2 py-0 h-5 border-0 ${getEstadoEntregaColor(e.estado)}`}>
                      {e.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cotizaciones Recientes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-viv-peach-dark" />
                  Cotizaciones Recientes
                </div>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigateTo('cotizaciones')}>
                Ver todas <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {cotizacionesRecientes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay cotizaciones
              </p>
            ) : (
              <div className="space-y-2">
                {cotizacionesRecientes.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => { setSelectedCotizacionId(c.id); navigateTo('cotizacion-detalle'); }}
                  >
                    <div className="p-1.5 rounded-lg bg-viv-peach/20">
                      <FileText size={14} className="text-viv-peach-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.cliente_nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.items.length} item(s) · {formatPrice(c.total)}</p>
                    </div>
                    <Badge className={`text-[10px] px-2 py-0 h-5 border-0 ${getEstadoCotizacionColor(c.estado)}`}>
                      {c.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-viv-sage/10 via-viv-peach/10 to-viv-rose/10">
        <CardContent className="p-4 md:p-6">
          <h3 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-league-spartan)' }}>
            Acciones Rápidas
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={() => {
                useAppStore.getState().setSelectedCotizacionId(null);
                navigateTo('cotizacion-form');
              }}
            >
              <FileText size={16} className="mr-2" />
              Nueva Cotización
            </Button>
            <Button
              className="bg-viv-peach hover:bg-viv-peach-dark text-white"
              onClick={() => navigateTo('producto-form')}
            >
              <Package size={16} className="mr-2" />
              Nuevo Producto
            </Button>
            <Button
              variant="outline"
              className="border-viv-bluegrey text-viv-bluegrey hover:bg-viv-bluegrey/10"
              onClick={() => {
                useAppStore.getState().setSelectedEntregaId(null);
                navigateTo('entrega-form');
              }}
            >
              <Truck size={16} className="mr-2" />
              Programar Entrega
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
