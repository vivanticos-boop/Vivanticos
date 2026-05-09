'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MessageCircle,
  Truck,
  Phone,
  Mail,
  User,
  FileText,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import { formatPrice, formatDateTime, generateWhatsAppLink, getEstadoCotizacionColor } from '@/lib/utils';
import { toast } from 'sonner';
import type { EstadoCotizacion } from '@/types';

const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  transito: 'En Tránsito',
  pedido: 'Pedido',
};

const ESTADO_FLOW: Record<EstadoCotizacion, EstadoCotizacion[]> = {
  borrador: ['enviada', 'transito'],
  enviada: ['aprobada', 'rechazada'],
  aprobada: [],
  rechazada: ['borrador'],
  transito: ['pedido', 'borrador'],
  pedido: ['aprobada'],
};

export function CotizacionDetalleView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedCotizacionId = useAppStore(s => s.selectedCotizacionId);
  const setSelectedCotizacionId = useAppStore(s => s.setSelectedCotizacionId);

  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);
  const updateEstado = useCotizacionesStore(s => s.updateEstado);
  const updateEstadoSupabase = useCotizacionesStore(s => s.updateEstadoSupabase);
  const deleteCotizacion = useCotizacionesStore(s => s.deleteCotizacion);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const cotizacion = cotizaciones.find(c => c.id === selectedCotizacionId);

  if (!cotizacion) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-rose/20 flex items-center justify-center mb-4">
          <FileText size={28} className="text-viv-rose-dark" />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: 'var(--font-league-spartan)' }}
        >
          Cotización no encontrada
        </h3>
        <p className="text-muted-foreground text-sm">
          La cotización que buscas no existe o fue eliminada.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigateTo('cotizaciones')}
        >
          Volver a cotizaciones
        </Button>
      </div>
    );
  }

  const availableEstados = ESTADO_FLOW[cotizacion.estado] || [];

  const handleEstadoChange = (nuevoEstado: EstadoCotizacion) => {
    updateEstado(cotizacion.id, nuevoEstado);
    updateEstadoSupabase(cotizacion.id, nuevoEstado);
    toast.success(`Estado cambiado a ${ESTADO_LABELS[nuevoEstado]}`);
  };

  const handleEdit = () => {
    setSelectedCotizacionId(cotizacion.id);
    navigateTo('cotizacion-form');
  };

  const handleWhatsApp = () => {
    const itemLines = cotizacion.items.map(item => {
      const opcionesStr = item.opciones_seleccionadas
        .map(op => op.valor_nombre)
        .filter(name => !name.toLowerCase().startsWith('sin'))
        .join(', ');
      const optionsPart = opcionesStr ? ` (${opcionesStr})` : '';
      return `• ${item.producto_nombre}${optionsPart} - ${formatPrice((item.precio_total_item || item.subtotal) * item.cantidad)}`;
    }).join('\n');

    const message =
      `¡Hola ${cotizacion.cliente_nombre}! 🧸\n\n` +
      `Te comparto tu cotización de *Vivanticos - Mobiliario Infantil*:\n\n` +
      `${itemLines}\n\n` +
      `Total: *${formatPrice(cotizacion.total)}*` +
      (cotizacion.descuento_total > 0
        ? `\n¡Incluye un descuento de ${formatPrice(cotizacion.descuento_total)}! 🎉`
        : '') +
      `\n\n¿Te gustaría algún ajuste? Estoy aquí para ayudarte 😊` +
      `\n\n— Vivanticos · Mobiliario Infantil · Amor en cada detalle 💛`;

    const link = generateWhatsAppLink(cotizacion.cliente_telefono, message);
    window.open(link, '_blank');
  };

  const handleCrearEntrega = () => {
    setSelectedCotizacionId(cotizacion.id);
    navigateTo('entrega-form');
  };

  const handleDelete = () => {
    deleteCotizacion(cotizacion.id);
    toast.success('Cotización eliminada');
    setDeleteDialogOpen(false);
    navigateTo('cotizaciones');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img
              src="/logo-vivanticos.jpeg"
              alt="Vivanticos"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Cotización
            </p>
            <h2
              className="text-xl md:text-2xl font-bold truncate"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              {cotizacion.cliente_nombre}
            </h2>
          </div>
        </div>
        <div className="flex-1" />
      </div>

      {/* Status + Actions bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Current status badge */}
        <Badge className={`${getEstadoCotizacionColor(cotizacion.estado)} border-0 text-xs font-semibold px-3 py-1`}>
          {ESTADO_LABELS[cotizacion.estado]}
        </Badge>

        {/* Status change dropdown */}
        {availableEstados.length > 0 && (
          <Select onValueChange={val => handleEstadoChange(val as EstadoCotizacion)}>
            <SelectTrigger className="h-8 w-auto gap-1 text-xs border-dashed">
              <ChevronDown size={12} />
              <SelectValue placeholder="Cambiar estado" />
            </SelectTrigger>
            <SelectContent>
              {availableEstados.map(estado => (
                <SelectItem key={estado} value={estado}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      estado === 'aprobada' ? 'bg-viv-sage' :
                      estado === 'enviada' ? 'bg-viv-peach' :
                      estado === 'rechazada' ? 'bg-viv-rose' :
                      'bg-muted-foreground'
                    }`} />
                    {ESTADO_LABELS[estado]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex-1" />

        {/* Last updated */}
        <span className="text-[10px] text-muted-foreground">
          Actualizado: {formatDateTime(cotizacion.actualizado_en)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: Client + Items */}
        <div className="md:col-span-2 space-y-4">
          {/* Client Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle
                className="text-sm"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                <User size={14} className="inline mr-1.5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{cotizacion.cliente_nombre}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone size={12} />
                  <span>{cotizacion.cliente_telefono}</span>
                </div>
                {cotizacion.cliente_email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail size={12} />
                    <span>{cotizacion.cliente_email}</span>
                  </div>
                )}
              </div>
              {cotizacion.cliente_cedula && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold">CC:</span>
                  <span>{cotizacion.cliente_cedula}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle
                className="text-sm"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                <ShoppingBag size={14} className="inline mr-1.5" />
                Productos ({cotizacion.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-3">
                {cotizacion.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                        <p className="text-sm font-semibold">{item.producto_nombre}</p>
                      </div>
                      <p
                        className="text-sm font-bold text-viv-sage-dark flex-shrink-0"
                        style={{ fontFamily: 'var(--font-league-spartan)' }}
                      >
                        {formatPrice(item.subtotal * item.cantidad)}
                      </p>
                    </div>

                    {/* Options */}
                    {item.opciones_seleccionadas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.opciones_seleccionadas.map((op, i) => (
                          <Badge
                            key={`${op.opcion_id}-${op.valor_id}-${i}`}
                            variant="outline"
                            className="text-[10px] border-viv-beige"
                          >
                            {op.opcion_nombre}: {op.valor_nombre}
                            {op.incremento_precio > 0 && (
                              <span className="ml-1 text-viv-sage-dark font-semibold">
                                +{formatPrice(op.incremento_precio)}
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Price breakdown */}
                    <div className="mt-2 pl-5 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio base</span>
                        <span>{formatPrice(item.precio_unitario)}</span>
                      </div>
                      {item.opciones_seleccionadas.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Incrementos</span>
                          <span className="text-viv-sage-dark">
                            +{formatPrice(item.opciones_seleccionadas.reduce((s, o) => s + o.incremento_precio, 0))}
                          </span>
                        </div>
                      )}
                      {(item.descuento_aplicado || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Descuento</span>
                          <span className="text-viv-rose-dark">-{formatPrice(item.descuento_aplicado)}</span>
                        </div>
                      )}
                      <Separator className="my-1" />
                      <div className="flex justify-between font-semibold">
                        <span>Precio final</span>
                        <span className="text-viv-sage-dark">{formatPrice(item.precio_total_item || item.subtotal)}</span>
                      </div>
                      {item.cantidad > 1 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>{formatPrice(item.precio_total_item || item.subtotal)} x {item.cantidad}</span>
                          <span className="font-semibold text-foreground">{formatPrice((item.precio_total_item || item.subtotal) * item.cantidad)}</span>
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Cantidad: {item.cantidad}</span>
                      <span>{formatPrice(item.precio_unitario)} c/u</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {cotizacion.notas && (
            <Card className="border-0 shadow-sm bg-viv-beige/10">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notas
                </p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{cotizacion.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Summary + Actions */}
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-viv-sage/5 to-viv-peach/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
                  <img
                    src="/logo-vivanticos.jpeg"
                    alt="Vivanticos"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3
                    className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    Resumen
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Vivanticos · Mobiliario Infantil</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-semibold">{formatPrice(cotizacion.subtotal)}</span>
              </div>
              {cotizacion.items.some(item => (item.descuento_aplicado || 0) > 0) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal sin descuento</span>
                  <span className="text-sm">{formatPrice(cotizacion.items.reduce((s, item) => s + item.subtotal * item.cantidad, 0))}</span>
                </div>
              )}
              {cotizacion.descuento_total > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-viv-rose-dark">Descuento</span>
                  <span className="text-sm font-semibold text-viv-rose-dark">
                    -{formatPrice(cotizacion.descuento_total)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span
                  className="text-base font-bold"
                  style={{ fontFamily: 'var(--font-league-spartan)' }}
                >
                  Total
                </span>
                <span
                  className="text-2xl font-bold text-viv-sage-dark"
                  style={{ fontFamily: 'var(--font-league-spartan)' }}
                >
                  {formatPrice(cotizacion.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Created date */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText size={12} />
                <span>Creada: {formatDateTime(cotizacion.creado_en)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <h3
                className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                Acciones
              </h3>

              <Button
                variant="outline"
                className="w-full justify-start border-viv-sage/30 text-viv-sage-dark hover:bg-viv-sage/10"
                onClick={handleEdit}
              >
                <Edit size={16} className="mr-2" />
                Editar
              </Button>

              {cotizacion.estado === 'transito' && (
                <Button
                  className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => handleEstadoChange('pedido')}
                >
                  <ShoppingBag size={16} className="mr-2" />
                  Pasar a Pedido
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start border-green-500/30 text-green-600 hover:bg-green-50"
                onClick={handleWhatsApp}
              >
                <MessageCircle size={16} className="mr-2" />
                Enviar WhatsApp
              </Button>

              {(cotizacion.estado === 'pedido' || cotizacion.estado === 'aprobada') && (
                <Button
                  className="w-full justify-start bg-viv-sage hover:bg-viv-sage-dark text-white"
                  onClick={handleCrearEntrega}
                >
                  <Truck size={16} className="mr-2" />
                  Programar Entrega
                </Button>
              )}

              <Separator className="my-2" />

              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Eliminar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Eliminar cotización?</DialogTitle>
                    <DialogDescription>
                      Se eliminará la cotización de <strong>{cotizacion.cliente_nombre}</strong> por un total de{' '}
                      <strong>{formatPrice(cotizacion.total)}</strong>. Esta acción no se puede deshacer.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-row gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      Eliminar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
