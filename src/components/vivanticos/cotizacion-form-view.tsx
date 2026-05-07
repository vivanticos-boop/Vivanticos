'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Plus, Trash2, Save, Search, ShoppingCart, X, Ruler, Bed, Layers, Tag, Check,
} from 'lucide-react';
import { formatPrice, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Cotizacion, CotizacionItem, ItemOpcionSeleccionada, ProductoOpcion, ProductoOpcionValor, TipoOpcionInput } from '@/types';
import { TIPO_PRODUCTO_LABELS } from '@/types';

// Local form item type
interface FormItem {
  id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number; // effective base price (precio_descuento if set, else precio_base)
  opciones_seleccionadas: ItemOpcionSeleccionada[];
  subtotal: number; // precio_unitario + sum of incrementos
  configuracion: Record<string, any>;
  precio_total_item: number; // subtotal - descuento_aplicado
  descuento_aplicado: number;
}

// Icon helper based on option name
const getOpcionIcon = (nombre: string): React.ReactNode => {
  const lower = nombre.toLowerCase();
  if (lower.includes('medida')) return <Ruler size={14} />;
  if (lower.includes('colch')) return <Bed size={14} />;
  if (lower.includes('lencer') || lower.includes('ropa')) return <Layers size={14} />;
  return <Tag size={14} />;
};

export function CotizacionFormView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedCotizacionId = useAppStore(s => s.selectedCotizacionId);
  const setSelectedCotizacionId = useAppStore(s => s.setSelectedCotizacionId);
  const currentUser = useAppStore(s => s.currentUser);

  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);
  const addCotizacion = useCotizacionesStore(s => s.addCotizacion);
  const updateCotizacion = useCotizacionesStore(s => s.updateCotizacion);

  const productos = useCatalogoStore(s => s.productos);
  const getOpcionesByProducto = useCatalogoStore(s => s.getOpcionesByProducto);
  const getValoresByOpcion = useCatalogoStore(s => s.getValoresByOpcion);

  const isEditing = !!selectedCotizacionId;
  const existingCotizacion = isEditing
    ? cotizaciones.find(c => c.id === selectedCotizacionId)
    : null;

  // Client fields
  const [clienteNombre, setClienteNombre] = useState(() => existingCotizacion?.cliente_nombre || '');
  const [clienteTelefono, setClienteTelefono] = useState(() => existingCotizacion?.cliente_telefono || '');
  const [clienteEmail, setClienteEmail] = useState(() => existingCotizacion?.cliente_email || '');
  const [notas, setNotas] = useState(() => existingCotizacion?.notas || '');

  // Items
  const [items, setItems] = useState<FormItem[]>(() =>
    existingCotizacion?.items.map(item => ({
      id: item.id,
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      opciones_seleccionadas: item.opciones_seleccionadas,
      subtotal: item.subtotal,
      configuracion: item.configuracion || {},
      precio_total_item: item.precio_total_item || item.subtotal,
      descuento_aplicado: item.descuento_aplicado || 0,
    })) || []
  );

  // Product selector state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');
  const [optionSelections, setOptionSelections] = useState<Record<string, string>>({});
  const [checkboxSelections, setCheckboxSelections] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products for search
  const filteredProductos = useMemo(() => {
    if (!productSearch.trim()) return productos.filter(p => p.activo);
    const term = productSearch.toLowerCase();
    return productos.filter(
      p => p.activo && (p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term))
    );
  }, [productos, productSearch]);

  // Currently selected product
  const selectedProducto = useMemo(
    () => productos.find(p => p.id === selectedProductoId),
    [productos, selectedProductoId]
  );

  // Options for selected product
  const selectedProductoOpciones = useMemo(
    () => selectedProductoId ? getOpcionesByProducto(selectedProductoId) : [],
    [selectedProductoId, getOpcionesByProducto]
  );

  // Calculate price for currently selected product
  const calculateItemPrice = useMemo(() => {
    if (!selectedProducto) return { base: 0, incrementos: 0, descuento: 0, total: 0 };

    // Effective base price
    const base = selectedProducto.precio_descuento > 0 && selectedProducto.precio_descuento < selectedProducto.precio_base
      ? selectedProducto.precio_descuento
      : selectedProducto.precio_base;

    // Calculate incrementos from selected options
    let incrementos = 0;
    for (const opcion of selectedProductoOpciones) {
      if (opcion.tipo === 'select') {
        const selectedValId = optionSelections[opcion.id];
        if (selectedValId) {
          const valor = getValoresByOpcion(opcion.id).find(v => v.id === selectedValId);
          if (valor) incrementos += valor.incremento_precio;
        }
      } else if (opcion.tipo === 'checkbox') {
        if (checkboxSelections[opcion.id]) {
          const valores = getValoresByOpcion(opcion.id).filter(v => v.activo);
          if (valores.length > 0) incrementos += valores[0].incremento_precio;
        }
      }
    }

    // Descuento automático por tipo_producto
    const descuento = selectedProducto.descuento_base || 0;

    // Total
    const total = base + incrementos - descuento;

    return { base, incrementos, descuento, total };
  }, [selectedProducto, selectedProductoOpciones, optionSelections, checkboxSelections, getValoresByOpcion]);

  // Build opciones_seleccionadas for saving
  const buildOpcionesSeleccionadas = (): ItemOpcionSeleccionada[] => {
    const result: ItemOpcionSeleccionada[] = [];
    for (const opcion of selectedProductoOpciones) {
      if (opcion.tipo === 'select') {
        const selectedValId = optionSelections[opcion.id];
        if (selectedValId) {
          const valor = getValoresByOpcion(opcion.id).find(v => v.id === selectedValId);
          if (valor) {
            result.push({
              opcion_id: opcion.id,
              opcion_nombre: opcion.nombre,
              opcion_tipo: 'select',
              valor_id: valor.id,
              valor_nombre: valor.nombre,
              incremento_precio: valor.incremento_precio,
            });
          }
        }
      } else if (opcion.tipo === 'checkbox') {
        if (checkboxSelections[opcion.id]) {
          const valores = getValoresByOpcion(opcion.id).filter(v => v.activo);
          if (valores.length > 0) {
            result.push({
              opcion_id: opcion.id,
              opcion_nombre: opcion.nombre,
              opcion_tipo: 'checkbox',
              valor_id: valores[0].id,
              valor_nombre: valores[0].nombre,
              incremento_precio: valores[0].incremento_precio,
            });
          }
        }
      }
    }
    return result;
  };

  // Build configuracion JSON
  const buildConfiguracion = (): Record<string, any> => {
    const config: Record<string, any> = {};
    for (const opcion of selectedProductoOpciones) {
      if (opcion.tipo === 'select') {
        const selectedValId = optionSelections[opcion.id];
        if (selectedValId) {
          const valor = getValoresByOpcion(opcion.id).find(v => v.id === selectedValId);
          if (valor) config[opcion.nombre] = valor.nombre;
        }
      } else if (opcion.tipo === 'checkbox') {
        config[opcion.nombre] = checkboxSelections[opcion.id] ? 'Incluido' : 'No incluido';
      }
    }
    return config;
  };

  // Totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.precio_total_item * item.cantidad, 0);
    const descuento = items.reduce((sum, item) => sum + item.descuento_aplicado * item.cantidad, 0);
    const baseTotal = items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);
    const incrementos = items.reduce((sum, item) => sum + (item.subtotal - item.precio_unitario) * item.cantidad, 0);
    return { baseTotal, incrementos, descuento, subtotal, total: subtotal };
  }, [items]);

  // Handle selecting a product
  const handleSelectProduct = (productoId: string) => {
    setSelectedProductoId(productoId);
    setOptionSelections({});
    setCheckboxSelections({});
    setProductSearch('');
  };

  // Handle option value change for select type
  const handleOptionChange = (opcionId: string, valorId: string) => {
    setOptionSelections(prev => ({ ...prev, [opcionId]: valorId }));
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (opcionId: string) => {
    setCheckboxSelections(prev => ({ ...prev, [opcionId]: !prev[opcionId] }));
  };

  // Add item to list
  const handleAddItem = () => {
    if (!selectedProducto) {
      toast.error('Selecciona un producto');
      return;
    }

    // Check required options
    for (const op of selectedProductoOpciones) {
      if (op.requerida && op.tipo === 'select' && !optionSelections[op.id]) {
        toast.error(`Selecciona una opción para ${op.nombre}`);
        return;
      }
    }

    const { base, incrementos, descuento, total } = calculateItemPrice;
    const opcionesSeleccionadas = buildOpcionesSeleccionadas();
    const configuracion = buildConfiguracion();

    const newItem: FormItem = {
      id: generateId(),
      producto_id: selectedProducto.id,
      producto_nombre: selectedProducto.nombre,
      cantidad: 1,
      precio_unitario: base,
      opciones_seleccionadas: opcionesSeleccionadas,
      subtotal: base + incrementos,
      configuracion,
      precio_total_item: total,
      descuento_aplicado: descuento,
    };

    setItems([...items, newItem]);
    setSelectedProductoId('');
    setOptionSelections({});
    setCheckboxSelections({});
    toast.success(`${selectedProducto.nombre} agregado`);
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  // Update item quantity
  const handleQuantityChange = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setItems(items.map(i =>
      i.id === itemId ? { ...i, cantidad: qty } : i
    ));
  };

  // Submit form
  const handleSubmit = () => {
    if (!clienteNombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    if (!clienteTelefono.trim()) {
      toast.error('El teléfono del cliente es obligatorio');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    const cotizacionData: Cotizacion = {
      id: isEditing ? existingCotizacion!.id : generateId(),
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      cliente_email: clienteEmail.trim() || undefined,
      items: items.map(item => ({
        id: item.id,
        cotizacion_id: isEditing ? existingCotizacion!.id : '',
        producto_id: item.producto_id,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        opciones_seleccionadas: item.opciones_seleccionadas,
        subtotal: item.subtotal,
        configuracion: item.configuracion,
        precio_total_item: item.precio_total_item,
        descuento_aplicado: item.descuento_aplicado,
      })),
      subtotal: totals.subtotal,
      descuento_total: totals.descuento,
      total: totals.total,
      estado: isEditing ? existingCotizacion!.estado : 'borrador',
      vendedor_id: currentUser?.id || 'u3',
      notas: notas.trim() || undefined,
      creado_en: isEditing ? existingCotizacion!.creado_en : now,
      actualizado_en: now,
    };

    if (isEditing) {
      updateCotizacion(cotizacionData);
    } else {
      addCotizacion(cotizacionData);
    }

    setSelectedCotizacionId(cotizacionData.id);
    toast.success(isEditing ? 'Cotización actualizada' : 'Cotización creada');
    navigateTo('cotizacion-detalle');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {isEditing ? 'Editar cotización' : 'Nueva cotización'}
            </p>
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              {isEditing ? existingCotizacion?.cliente_nombre || 'Editar' : 'Crear Cotización'}
            </h2>
          </div>
        </div>
        <div className="flex-1" />
        <Button
          className="bg-viv-sage hover:bg-viv-sage-dark text-white"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Save size={16} className="mr-2" />
          <span className="hidden sm:inline">{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
          <span className="sm:hidden">{isSubmitting ? '...' : 'Guardar'}</span>
        </Button>
      </div>

      {/* Client Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Nombre *
              </Label>
              <Input
                placeholder="Nombre del cliente"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Teléfono *
              </Label>
              <Input
                placeholder="573001234567"
                value={clienteTelefono}
                onChange={e => setClienteTelefono(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Email
            </Label>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={clienteEmail}
              onChange={e => setClienteEmail(e.target.value)}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Agregar Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Search & Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Producto
            </Label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Product list for selection */}
          {!selectedProductoId && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border/50 divide-y divide-border/30">
              {filteredProductos.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No se encontraron productos
                </div>
              ) : (
                filteredProductos.map(producto => (
                  <button
                    key={producto.id}
                    onClick={() => handleSelectProduct(producto.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-viv-sage/5 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🧸</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{producto.nombre}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {producto.codigo}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {producto.precio_descuento > 0 && producto.precio_descuento < producto.precio_base ? (
                        <>
                          <p className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(producto.precio_base)}
                          </p>
                          <p className="text-sm font-bold text-viv-sage-dark">
                            {formatPrice(producto.precio_descuento)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-viv-sage-dark">
                          {formatPrice(producto.precio_base)}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected product with options */}
          {selectedProducto && (
            <div className="rounded-xl border border-viv-sage/20 bg-viv-sage/5 p-4 space-y-4">
              {/* Product name with deselect */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-viv-sage-dark" />
                  <span className="text-sm font-bold">{selectedProducto.nombre}</span>
                  {selectedProducto.precio_descuento > 0 && selectedProducto.precio_descuento < selectedProducto.precio_base ? (
                    <Badge className="bg-viv-rose/15 text-viv-rose-dark border-0 text-[10px]">
                      Oferta
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-viv-sage/30 text-viv-sage-dark">
                      {formatPrice(selectedProducto.precio_base)}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedProductoId('');
                    setOptionSelections({});
                    setCheckboxSelections({});
                  }}
                >
                  <X size={14} />
                </Button>
              </div>

              {/* Options Section */}
              {selectedProductoOpciones.length > 0 && (
                <div className="space-y-3">
                  <p
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    Configuración
                  </p>
                  {selectedProductoOpciones.map(opcion => {
                    const valores = getValoresByOpcion(opcion.id).filter(v => v.activo);

                    if (opcion.tipo === 'checkbox') {
                      // Checkbox option: toggle switch
                      const isChecked = checkboxSelections[opcion.id] || false;
                      const checkboxValor = valores.length > 0 ? valores[0] : null;
                      return (
                        <div
                          key={opcion.id}
                          className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isChecked ? 'bg-viv-sage/15' : 'bg-muted'}`}>
                              {getOpcionIcon(opcion.nombre)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{opcion.nombre}</p>
                              {checkboxValor && checkboxValor.incremento_precio > 0 && (
                                <p className="text-[10px] text-muted-foreground">
                                                  +{formatPrice(checkboxValor.incremento_precio)}
                                </p>
                              )}
                            </div>
                            {opcion.requerida && (
                              <span className="text-viv-rose text-[10px] font-semibold">*req</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCheckboxToggle(opcion.id)}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-viv-sage ${
                              isChecked ? 'bg-viv-sage' : 'bg-muted-foreground/30'
                            }`}
                            role="switch"
                            aria-checked={isChecked}
                            aria-label={opcion.nombre}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    }

                    // Select option: dropdown
                    return (
                      <div key={opcion.id} className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          {getOpcionIcon(opcion.nombre)}
                          {opcion.nombre}
                          {opcion.requerida && (
                            <span className="text-viv-rose text-[10px]">*requerido</span>
                          )}
                        </Label>
                        <Select
                          value={optionSelections[opcion.id] || ''}
                          onValueChange={val => handleOptionChange(opcion.id, val)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder={`Seleccionar ${opcion.nombre.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {valores.map(valor => (
                              <SelectItem key={valor.id} value={valor.id}>
                                {valor.nombre}
                                {valor.incremento_precio > 0 && (
                                  <span className="ml-2 text-viv-sage-dark font-semibold">
                                    +{formatPrice(valor.incremento_precio)}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="rounded-xl bg-background border border-border/50 p-3 space-y-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2"
                  style={{ fontFamily: 'var(--font-league-spartan)' }}
                >
                  Desglose de precio
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Precio base</span>
                  <span className="text-xs font-semibold">{formatPrice(calculateItemPrice.base)}</span>
                </div>
                {calculateItemPrice.incrementos > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Incrementos</span>
                    <span className="text-xs font-semibold text-viv-sage-dark">
                      +{formatPrice(calculateItemPrice.incrementos)}
                    </span>
                  </div>
                )}
                {calculateItemPrice.descuento > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Descuento ({TIPO_PRODUCTO_LABELS[selectedProducto.tipo_producto] || selectedProducto.tipo_producto})
                    </span>
                    <span className="text-xs font-semibold text-viv-rose-dark">
                      -{formatPrice(calculateItemPrice.descuento)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    Precio final
                  </span>
                  <span
                    className="text-lg font-bold text-viv-sage-dark"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    {formatPrice(calculateItemPrice.total)}
                  </span>
                </div>
              </div>

              {/* Add button */}
              <Button
                className="w-full bg-viv-sage hover:bg-viv-sage-dark text-white"
                onClick={handleAddItem}
              >
                <Plus size={16} className="mr-1.5" />
                Agregar al presupuesto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items List */}
      {items.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-base"
                style={{ fontFamily: 'var(--font-league-spartan)' }}
              >
                Productos ({items.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item, index) => {
                const producto = productos.find(p => p.id === item.producto_id);
                const itemIncrementos = item.subtotal - item.precio_unitario;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                        <span className="text-sm font-semibold truncate">{item.producto_nombre}</span>
                        {producto && producto.precio_descuento > 0 && producto.precio_descuento < producto.precio_base && (
                          <Badge className="bg-viv-rose/15 text-viv-rose-dark border-0 text-[10px]">
                            Oferta
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {/* Selected options badges */}
                    {item.opciones_seleccionadas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-5">
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

                    {/* Price breakdown per item */}
                    <div className="pl-5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Precio base</span>
                        <span className="font-medium">{formatPrice(item.precio_unitario)}</span>
                      </div>
                      {itemIncrementos > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Incrementos</span>
                          <span className="font-medium text-viv-sage-dark">+{formatPrice(itemIncrementos)}</span>
                        </div>
                      )}
                      {item.descuento_aplicado > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Descuento</span>
                          <span className="font-medium text-viv-rose-dark">-{formatPrice(item.descuento_aplicado)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Precio unitario</span>
                        <span className="font-semibold text-viv-sage-dark">{formatPrice(item.precio_total_item)}</span>
                      </div>
                    </div>

                    {/* Quantity + total */}
                    <div className="flex items-center justify-between pl-5 pt-1 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Cant:</Label>
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                            className="px-2 py-1 text-sm hover:bg-muted transition-colors"
                            disabled={item.cantidad <= 1}
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-sm font-semibold border-x min-w-[2rem] text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                            className="px-2 py-1 text-sm hover:bg-muted transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-bold text-viv-sage-dark"
                          style={{ fontFamily: 'var(--font-league-spartan)' }}
                        >
                          {formatPrice(item.precio_total_item * item.cantidad)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-viv-sage/5 to-viv-peach/5">
          <CardContent className="p-4 space-y-2">
            <h3
              className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              Resumen
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Precio base</span>
              <span className="text-sm font-semibold">{formatPrice(totals.baseTotal)}</span>
            </div>
            {totals.incrementos > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Incrementos</span>
                <span className="text-sm font-semibold text-viv-sage-dark">
                  +{formatPrice(totals.incrementos)}
                </span>
              </div>
            )}
            {totals.descuento > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-viv-rose-dark">Descuentos</span>
                <span className="text-sm font-semibold text-viv-rose-dark">
                  -{formatPrice(totals.descuento)}
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
                {formatPrice(totals.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Notas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notas adicionales sobre la cotización..."
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={goBack}>
              Cancelar
            </Button>
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Save size={16} className="mr-2" />
              {isEditing ? 'Actualizar Cotización' : 'Crear Cotización'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
