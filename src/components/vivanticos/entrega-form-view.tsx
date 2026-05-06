'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useEntregasStore } from '@/stores/entregas-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Truck,
  User,
  Phone,
  MapPin,
  Package,
  FileText,
  Calendar,
  Bell,
} from 'lucide-react';
import { formatDate, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Entrega, EntregaItem, EstadoEntrega } from '@/types';

interface FormItem {
  id: string;
  producto_nombre: string;
  cantidad: number;
  configuracion: string;
}

const ESTADO_LABELS: Record<EstadoEntrega, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  completado: 'Completado',
};

// Helper to compute initial form state from existing entrega or cotización
function getInitialFormState(
  existingEntrega: Entrega | null,
  linkedCotizacion: { cliente_nombre: string; cliente_telefono: string; items: { producto_nombre: string; opciones_seleccionadas: { valor_nombre: string }[]; cantidad: number }[] } | null
) {
  if (existingEntrega) {
    return {
      clienteNombre: existingEntrega.cliente_nombre,
      clienteTelefono: existingEntrega.cliente_telefono,
      clienteDireccion: existingEntrega.cliente_direccion,
      fechaEntrega: existingEntrega.fecha_entrega,
      estado: existingEntrega.estado,
      notas: existingEntrega.notas || '',
      items: existingEntrega.items.map(i => ({
        id: i.id,
        producto_nombre: i.producto_nombre,
        cantidad: i.cantidad,
        configuracion: i.configuracion || '',
      })),
    };
  }

  if (linkedCotizacion) {
    return {
      clienteNombre: linkedCotizacion.cliente_nombre,
      clienteTelefono: linkedCotizacion.cliente_telefono,
      clienteDireccion: '',
      fechaEntrega: '',
      estado: 'pendiente' as EstadoEntrega,
      notas: '',
      items: linkedCotizacion.items.map(ci => ({
        id: generateId(),
        producto_nombre: ci.producto_nombre +
          (ci.opciones_seleccionadas.length > 0
            ? ' - ' + ci.opciones_seleccionadas.map(o => o.valor_nombre).join(', ')
            : ''),
        cantidad: ci.cantidad,
        configuracion: '',
      })),
    };
  }

  return {
    clienteNombre: '',
    clienteTelefono: '',
    clienteDireccion: '',
    fechaEntrega: '',
    estado: 'pendiente' as EstadoEntrega,
    notas: '',
    items: [] as FormItem[],
  };
}

export function EntregaFormView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedEntregaId = useAppStore(s => s.selectedEntregaId);
  const selectedCotizacionId = useAppStore(s => s.selectedCotizacionId);
  const currentUser = useAppStore(s => s.currentUser);
  const addNotificacion = useAppStore(s => s.addNotificacion);
  const setSelectedEntregaId = useAppStore(s => s.setSelectedEntregaId);
  const setSelectedCotizacionId = useAppStore(s => s.setSelectedCotizacionId);

  const addEntrega = useEntregasStore(s => s.addEntrega);
  const updateEntrega = useEntregasStore(s => s.updateEntrega);
  const getEntrega = useEntregasStore(s => s.getEntrega);
  const getCotizacion = useCotizacionesStore(s => s.getCotizacion);

  const isEditing = !!selectedEntregaId;
  const existingEntrega = isEditing ? getEntrega(selectedEntregaId) : null;
  const linkedCotizacion = selectedCotizacionId
    ? getCotizacion(selectedCotizacionId)
    : null;

  // Compute initial state lazily from existing data
  const initialState = useMemo(
    () => getInitialFormState(existingEntrega ?? null, linkedCotizacion ?? null),
    [existingEntrega, linkedCotizacion]
  );

  // Form state with lazy initialization
  const [clienteNombre, setClienteNombre] = useState(() => initialState.clienteNombre);
  const [clienteTelefono, setClienteTelefono] = useState(() => initialState.clienteTelefono);
  const [clienteDireccion, setClienteDireccion] = useState(() => initialState.clienteDireccion);
  const [fechaEntrega, setFechaEntrega] = useState(() => initialState.fechaEntrega);
  const [estado, setEstado] = useState<EstadoEntrega>(() => initialState.estado);
  const [notas, setNotas] = useState(() => initialState.notas);
  const [items, setItems] = useState<FormItem[]>(() => initialState.items);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Items management
  const addItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        producto_nombre: '',
        cantidad: 1,
        configuracion: '',
      },
    ]);
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) {
      toast.error('Debe haber al menos un item');
      return;
    }
    setItems(items.filter(i => i.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof FormItem, value: string | number) => {
    setItems(
      items.map(i => (i.id === itemId ? { ...i, [field]: value } : i))
    );
  };

  // Submit handler
  const handleSubmit = () => {
    // Validation
    if (!clienteNombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    if (!clienteTelefono.trim()) {
      toast.error('El teléfono del cliente es obligatorio');
      return;
    }
    if (!clienteDireccion.trim()) {
      toast.error('La dirección del cliente es obligatoria');
      return;
    }
    if (!fechaEntrega) {
      toast.error('La fecha de entrega es obligatoria');
      return;
    }
    if (items.length === 0) {
      toast.error('Debe agregar al menos un item');
      return;
    }
    const hasEmptyItem = items.some(i => !i.producto_nombre.trim());
    if (hasEmptyItem) {
      toast.error('Todos los items deben tener un nombre de producto');
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const entregaItems: EntregaItem[] = items.map(i => ({
      id: i.id,
      producto_nombre: i.producto_nombre.trim(),
      cantidad: i.cantidad,
      configuracion: i.configuracion.trim() || undefined,
    }));

    const entregaData: Entrega = {
      id: isEditing ? existingEntrega!.id : generateId(),
      cotizacion_id: isEditing
        ? existingEntrega!.cotizacion_id
        : selectedCotizacionId || undefined,
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      cliente_direccion: clienteDireccion.trim(),
      fecha_entrega: fechaEntrega,
      estado,
      notas: notas.trim() || undefined,
      items: entregaItems,
      vendedor_id: isEditing ? existingEntrega!.vendedor_id : (currentUser?.id || 'u3'),
      creado_en: isEditing ? existingEntrega!.creado_en : now,
      actualizado_en: now,
    };

    if (isEditing) {
      updateEntrega(entregaData);
      toast.success('Entrega actualizada exitosamente');
    } else {
      addEntrega(entregaData);

      // Add notifications for delivery reminders
      // 1. 1 day before at 12pm
      addNotificacion({
        tipo: 'entrega_manana',
        titulo: 'Entrega mañana',
        mensaje: `Entrega mañana: ${entregaData.items.map(i => i.producto_nombre).join(', ')} para ${clienteNombre.trim()}`,
        relacionado_id: entregaData.id,
      });

      // 2. Same day at 8am
      addNotificacion({
        tipo: 'entrega_hoy',
        titulo: 'Entrega hoy',
        mensaje: `Entrega hoy: ${entregaData.items.map(i => i.producto_nombre).join(', ')} para ${clienteNombre.trim()}`,
        relacionado_id: entregaData.id,
      });

      toast.success('Entrega creada exitosamente');
    }

    // Clear selections and navigate
    setSelectedEntregaId(null);
    setSelectedCotizacionId(null);
    navigateTo('entregas');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {isEditing ? 'Editar entrega' : 'Nueva entrega'}
          </p>
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            {isEditing ? 'Modificar Entrega' : 'Programar Entrega'}
          </h2>
        </div>
        <Button
          className="bg-viv-sage hover:bg-viv-sage-dark text-white"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Save size={16} className="mr-2" />
          <span className="hidden sm:inline">
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </span>
          <span className="sm:hidden">
            {isSubmitting ? '...' : 'Guardar'}
          </span>
        </Button>
      </div>

      {/* Cotización reference */}
      {linkedCotizacion && !isEditing && (
        <Card className="border-0 shadow-sm bg-viv-peach/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-viv-peach/20">
                <FileText size={16} className="text-viv-peach-dark" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Desde Cotización
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {linkedCotizacion.cliente_nombre} ·{' '}
                  {linkedCotizacion.items.length} item(s) ·{' '}
                  {formatDate(linkedCotizacion.creado_en)}
                </p>
              </div>
              <Badge className="bg-viv-peach text-gray-800 border-0 text-[10px]">
                {linkedCotizacion.estado}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cliente Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <User size={16} className="text-viv-sage-dark" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cliente_nombre"
                className="text-xs font-semibold uppercase tracking-wider"
              >
                Nombre *
              </Label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="cliente_nombre"
                  placeholder="Nombre del cliente"
                  value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cliente_telefono"
                className="text-xs font-semibold uppercase tracking-wider"
              >
                Teléfono *
              </Label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="cliente_telefono"
                  placeholder="573001234567"
                  value={clienteTelefono}
                  onChange={e => setClienteTelefono(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label
              htmlFor="cliente_direccion"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Dirección *
            </Label>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <Textarea
                id="cliente_direccion"
                placeholder="Dirección completa de entrega"
                value={clienteDireccion}
                onChange={e => setClienteDireccion(e.target.value)}
                className="pl-9 min-h-[70px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <Calendar size={16} className="text-viv-bluegrey" />
            Detalles de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fecha_entrega"
                className="text-xs font-semibold uppercase tracking-wider"
              >
                Fecha de Entrega *
              </Label>
              <Input
                id="fecha_entrega"
                type="date"
                value={fechaEntrega}
                onChange={e => setFechaEntrega(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Estado
              </Label>
              <Select
                value={estado}
                onValueChange={(v: EstadoEntrega) => setEstado(v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9BACAD]" />
                      Pendiente
                    </span>
                  </SelectItem>
                  <SelectItem value="entregado">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#B3BA95]" />
                      Entregado
                    </span>
                  </SelectItem>
                  <SelectItem value="completado">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D7C1A8]" />
                      Completado
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-base flex items-center gap-2"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              <Package size={16} className="text-viv-beige" />
              Productos / Items
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10"
              onClick={addItem}
            >
              <Plus size={14} className="mr-1" />
              Agregar item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-xl bg-viv-beige/10 flex items-center justify-center mb-3">
                <Package size={20} className="text-viv-beige/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay items agregados
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega al menos un producto para la entrega
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2"
                >
                  {/* Item header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium w-6 flex-shrink-0">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder="Nombre del producto"
                        value={item.producto_nombre}
                        onChange={e =>
                          updateItem(item.id, 'producto_nombre', e.target.value)
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          ×
                        </span>
                        <Input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={e =>
                            updateItem(
                              item.id,
                              'cantidad',
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="h-9 pl-5 text-sm text-center"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar item"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {/* Configuración */}
                  <div className="pl-8">
                    <Input
                      placeholder="Configuración (opcional): color, talla, acabado..."
                      value={item.configuracion}
                      onChange={e =>
                        updateItem(item.id, 'configuracion', e.target.value)
                      }
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base flex items-center gap-2"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <FileText size={16} className="text-viv-rose-dark" />
            Notas Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Instrucciones especiales, horario preferido, referencias de ubicación..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Notifications info (only when creating) */}
      {!isEditing && (
        <Card className="border-0 shadow-sm bg-viv-bluegrey/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-viv-bluegrey/15">
                <Bell size={16} className="text-viv-bluegrey" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Recordatorios automáticos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Al crear esta entrega se programarán los siguientes recordatorios:
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-viv-peach" />
                    1 día antes a las 12:00 pm — Notificación de entrega mañana
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-viv-sage" />
                    Mismo día a las 8:00 am — Notificación de entrega hoy
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button variant="outline" onClick={goBack} className="order-2 sm:order-1">
              Cancelar
            </Button>
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white order-1 sm:order-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Truck size={16} className="mr-2" />
              {isEditing ? 'Actualizar Entrega' : 'Programar Entrega'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
