'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, FileText, Phone, Mail, CalendarDays, ShoppingBag } from 'lucide-react';
import { formatPrice, formatDateTime, getEstadoCotizacionColor } from '@/lib/utils';
import type { EstadoCotizacion } from '@/types';

const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  borrador: 'Borradores',
  enviada: 'Enviadas',
  aprobada: 'Aprobadas',
  rechazada: 'Rechazadas',
};

export function CotizacionesView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const setSelectedCotizacionId = useAppStore(s => s.setSelectedCotizacionId);

  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('todas');

  const filteredCotizaciones = useMemo(() => {
    let result = [...cotizaciones];

    // Filter by estado
    if (activeTab !== 'todas') {
      result = result.filter(c => c.estado === activeTab);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.cliente_nombre.toLowerCase().includes(term) ||
        c.cliente_telefono.includes(term) ||
        (c.cliente_email && c.cliente_email.toLowerCase().includes(term))
      );
    }

    // Sort by newest first
    result.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

    return result;
  }, [cotizaciones, activeTab, searchTerm]);

  // Count by estado
  const counts = useMemo(() => {
    const base = { todas: cotizaciones.length, borrador: 0, enviada: 0, aprobada: 0, rechazada: 0 };
    cotizaciones.forEach(c => { base[c.estado]++; });
    return base;
  }, [cotizaciones]);

  const handleCotizacionClick = (id: string) => {
    setSelectedCotizacionId(id);
    navigateTo('cotizacion-detalle');
  };

  const handleNuevaCotizacion = () => {
    setSelectedCotizacionId(null);
    navigateTo('cotizacion-form');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img
              src="/logo-vivanticos.jpeg"
              alt="Vivanticos"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              Cotizaciones
            </h2>
            <p className="text-sm text-muted-foreground">
              {cotizaciones.length} cotizaciones en total
            </p>
          </div>
        </div>
        <Button
          className="bg-viv-sage hover:bg-viv-sage-dark text-white"
          onClick={handleNuevaCotizacion}
        >
          <Plus size={16} className="mr-2" />
          <span className="hidden sm:inline">Nueva Cotización</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger
            value="todas"
            className="data-[state=active]:bg-viv-sage data-[state=active]:text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            Todas ({counts.todas})
          </TabsTrigger>
          {Object.entries(ESTADO_LABELS).map(([key, label]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-viv-sage data-[state=active]:text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              {label} ({counts[key as EstadoCotizacion]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Cotizaciones Grid */}
      {filteredCotizaciones.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-sage/10 flex items-center justify-center mb-4">
            <FileText size={28} className="text-viv-sage/40" />
          </div>
          <h3
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            {searchTerm ? 'Sin resultados' : 'No hay cotizaciones'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : activeTab !== 'todas'
                ? `No hay cotizaciones en estado ${ESTADO_LABELS[activeTab as EstadoCotizacion]?.toLowerCase()}`
                : 'Crea tu primera cotización'}
          </p>
          {!searchTerm && activeTab === 'todas' && (
            <Button
              className="mt-4 bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={handleNuevaCotizacion}
            >
              <Plus size={16} className="mr-2" />
              Nueva Cotización
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCotizaciones.map(cot => (
            <Card
              key={cot.id}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleCotizacionClick(cot.id)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Top row: client name + status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-sm font-bold truncate group-hover:text-viv-sage-dark transition-colors"
                      style={{ fontFamily: 'var(--font-league-spartan)' }}
                    >
                      {cot.cliente_nombre}
                    </h3>
                  </div>
                  <Badge className={`${getEstadoCotizacionColor(cot.estado)} text-[10px] flex-shrink-0 border-0`}>
                    {cot.estado.charAt(0).toUpperCase() + cot.estado.slice(1)}
                  </Badge>
                </div>

                {/* Client contact */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone size={12} className="flex-shrink-0" />
                    <span className="truncate">{cot.cliente_telefono}</span>
                  </div>
                  {cot.cliente_email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail size={12} className="flex-shrink-0" />
                      <span className="truncate">{cot.cliente_email}</span>
                    </div>
                  )}
                </div>

                {/* Items count + date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShoppingBag size={12} />
                    <span>{cot.items.length} {cot.items.length === 1 ? 'producto' : 'productos'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays size={12} />
                    <span>{formatDateTime(cot.creado_en)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span
                      className="text-lg font-bold text-viv-sage-dark"
                      style={{ fontFamily: 'var(--font-league-spartan)' }}
                    >
                      {formatPrice(cot.total)}
                    </span>
                  </div>
                  {cot.descuento_total > 0 && (
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-viv-rose-dark">Descuento aplicado</span>
                      <span className="text-[10px] text-viv-rose-dark font-semibold">
                        -{formatPrice(cot.descuento_total)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
