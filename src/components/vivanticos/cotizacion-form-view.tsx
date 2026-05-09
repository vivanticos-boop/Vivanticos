'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';
import { useCatalogoStore } from '@/stores/data-store';
import { useClientesStore } from '@/stores/clientes-store';
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
import type { Cotizacion, ItemOpcionSeleccionada, OpcionalPredefinido, OpcionalCotizacion } from '@/types';

// Local form item type
interface FormItem {
  id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number; // price after discount
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
  const saveCotizacionToSupabase = useCotizacionesStore(s => s.saveCotizacionToSupabase);

  const productos = useCatalogoStore(s => s.productos);
  const categorias = useCatalogoStore(s => s.categorias);
  const subcategorias = useCatalogoStore(s => s.subcategorias);
  const opcionalesPredefinidos = useCatalogoStore(s => s.opcionalesPredefinidos);
  const getOpcionesByProducto = useCatalogoStore(s => s.getOpcionesByProducto);
  const getValoresByOpcion = useCatalogoStore(s => s.getValoresByOpcion);

  const clientes = useClientesStore(s => s.clientes);
  const searchClientes = useClientesStore(s => s.searchClientes);
  const loadFromSupabaseClientes = useClientesStore(s => s.loadFromSupabase);

  const isEditing = !!selectedCotizacionId;
  const existingCotizacion = isEditing
    ? cotizaciones.find(c => c.id === selectedCotizacionId)
    : null;

  // Client fields
  const [clienteNombre, setClienteNombre] = useState(() => existingCotizacion?.cliente_nombre || '');
  const [clienteTelefono, setClienteTelefono] = useState(() => existingCotizacion?.cliente_telefono || '');
  const [clienteEmail, setClienteEmail] = useState(() => existingCotizacion?.cliente_email || '');
  const [clienteDireccion, setClienteDireccion] = useState(() => existingCotizacion?.cliente_direccion || '');
  const [notas, setNotas] = useState(() => existingCotizacion?.notas || '');

  // Client autocomplete state
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const clientSuggestionsRef = useRef<HTMLDivElement>(null);

  // Load clientes from Supabase on mount
  useEffect(() => {
    loadFromSupabaseClientes();
  }, [loadFromSupabaseClientes]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientSuggestionsRef.current && !clientSuggestionsRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching clients for autocomplete
  const matchingClientes = useMemo(() => {
    if (!clienteNombre.trim() || clienteNombre.length < 2) return [];
    return searchClientes(clienteNombre).slice(0, 5);
  }, [clienteNombre, searchClientes]);

  // Select a client from autocomplete
  const handleSelectCliente = (cliente: typeof clientes[0]) => {
    setClienteNombre(cliente.nombre);
    setClienteTelefono(cliente.telefono);
    setClienteEmail(cliente.email || '');
    setClienteDireccion(cliente.direccion || '');
    setShowClientSuggestions(false);
  };

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

  // Product selector state - cascading selection
  const [selectionStep, setSelectionStep] = useState<'categoria' | 'subcategoria' | 'producto'>('categoria');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('');
  const [selectedSubcategoriaId, setSelectedSubcategoriaId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');
  const [optionSelections, setOptionSelections] = useState<Record<string, string>>({});
  const [checkboxSelections, setCheckboxSelections] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descuentoSeleccionado, setDescuentoSeleccionado] = useState<0 | 5 | 10>(0); // 0%, 5%, 10%

  // --- Vinyl calculator state ---
  const [viniloAncho, setViniloAncho] = useState<number>(0);
  const [viniloAlto, setViniloAlto] = useState<number>(0);
  const [viniloParedCompleta, setViniloParedCompleta] = useState(true);
  const [viniloAltoPintura, setViniloAltoPintura] = useState<number>(1.10);
  const [viniloLlevaMoldura, setViniloLlevaMoldura] = useState(false);
  const [viniloAltoVinilo, setViniloAltoVinilo] = useState<number>(0);
  const [viniloConstante, setViniloConstante] = useState<number>(230000);
  const [viniloCargoDiseno, setViniloCargoDiseno] = useState<number>(300000);

  // Quotation-level opcionales
  const [opcionalesCotizacion, setOpcionalesCotizacion] = useState<OpcionalCotizacion[]>([]);

  const handleAddOpcionalCotizacion = (opcional: OpcionalPredefinido) => {
    const exists = opcionalesCotizacion.some(o => o.opcional_predefinido_id === opcional.id);
    if (exists) {
      toast.error('Esta opción ya fue agregada');
      return;
    }
    setOpcionalesCotizacion([...opcionalesCotizacion, {
      id: generateId(),
      opcional_predefinido_id: opcional.id,
      nombre: opcional.nombre,
      valor: opcional.valor,
    }]);
  };

  const handleUpdateOpcionalCotizacion = (id: string, nuevoValor: number) => {
    setOpcionalesCotizacion(opcionalesCotizacion.map(o =>
      o.id === id ? { ...o, valor: nuevoValor } : o
    ));
  };

  const handleRemoveOpcionalCotizacion = (id: string) => {
    setOpcionalesCotizacion(opcionalesCotizacion.filter(o => o.id !== id));
  };

  // Filter subcategorias by selected categoria
  const filteredSubcategorias = useMemo(() => {
    if (!selectedCategoriaId) return [];
    return subcategorias.filter(s => s.categoria_id === selectedCategoriaId && s.activa);
  }, [subcategorias, selectedCategoriaId]);

  // Filter products by selected subcategoria
  const filteredProductos = useMemo(() => {
    let result = productos.filter(p => p.activo);
    
    // Filter by subcategoria if selected
    if (selectedSubcategoriaId) {
      result = result.filter(p => p.subcategoria_id === selectedSubcategoriaId);
    } else if (selectedCategoriaId) {
      // If only categoria selected, show products from that categoria (without subcategoria or matching)
      result = result.filter(p => p.categoria_id === selectedCategoriaId);
    }
    
    // Apply search filter
    if (productSearch.trim()) {
      const term = productSearch.toLowerCase();
      result = result.filter(
        p => p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [productos, selectedCategoriaId, selectedSubcategoriaId, productSearch]);

  // Get selected categoria name
  const selectedCategoria = useMemo(
    () => categorias.find(c => c.id === selectedCategoriaId),
    [categorias, selectedCategoriaId]
  );

  // Get selected subcategoria name
  const selectedSubcategoria = useMemo(
    () => subcategorias.find(s => s.id === selectedSubcategoriaId),
    [subcategorias, selectedSubcategoriaId]
  );

  // Currently selected product
  const selectedProducto = useMemo(
    () => productos.find(p => p.id === selectedProductoId),
    [productos, selectedProductoId]
  );

  // Check if selected product belongs to Vinilos subcategory (not Molduras or Pinturas)
  const isViniloProduct = useMemo(() => {
    if (!selectedProducto) return false;
    const cat = categorias.find(c => c.id === selectedProducto.categoria_id);
    if (!cat?.nombre?.toLowerCase().includes('vinilo')) return false;
    // Only products in the "Vinilos" subcategory get the calculator, not Molduras or Pinturas
    const subcat = subcategorias.find(s => s.id === selectedProducto.subcategoria_id);
    return subcat?.nombre?.toLowerCase().includes('vinilo') || false;
  }, [selectedProducto, categorias, subcategorias]);

  // Options for selected product
  const selectedProductoOpciones = useMemo(
    () => selectedProductoId ? getOpcionesByProducto(selectedProductoId) : [],
    [selectedProductoId, getOpcionesByProducto]
  );

  // Calculate price for currently selected product
  const calculateItemPrice = useMemo(() => {
    if (!selectedProducto) return { base: 0, incrementos: 0, descuento: 0, total: 0 };

    // Vinilo products use wall area formula
    if (isViniloProduct) {
      if (viniloAncho <= 0 || viniloAlto <= 0) return { base: 0, incrementos: 0, descuento: 0, total: 0 };

      if (viniloParedCompleta) {
        // Full wall with vinyl
        const area = viniloAncho * viniloAlto;
        const base = Math.round(area * viniloConstante);
        return { base, incrementos: 0, descuento: 0, total: base };
      } else {
        // Design: paint + (moldura) + vinyl
        const altoVinilo = viniloAltoVinilo > 0 ? viniloAltoVinilo : (viniloAlto - viniloAltoPintura);
        const areaVinilo = viniloAncho * altoVinilo;
        const precioVinilo = Math.round(areaVinilo * viniloConstante);

        // Design charge: $300,000 per 3m of wall width
        const cargosDiseno = viniloLlevaMoldura ? Math.ceil(viniloAncho / 3) * viniloCargoDiseno : 0;

        const total = precioVinilo + cargosDiseno;
        return { base: precioVinilo, incrementos: cargosDiseno, descuento: 0, total };
      }
    }

    // Standard products — always start from precio_base
    const precioBase = selectedProducto.precio_base;
    const descuentoMonto = Math.round(precioBase * (descuentoSeleccionado / 100));
    const base = precioBase - descuentoMonto;

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

    const total = base + incrementos;

    return { base, incrementos, descuento: descuentoMonto, total };
  }, [selectedProducto, isViniloProduct, viniloAncho, viniloAlto, viniloParedCompleta, viniloAltoPintura, viniloLlevaMoldura, viniloAltoVinilo, viniloConstante, viniloCargoDiseno, descuentoSeleccionado, selectedProductoOpciones, optionSelections, checkboxSelections, getValoresByOpcion]);

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
    const opcionalesTotal = opcionalesCotizacion.reduce((sum, o) => sum + o.valor, 0);
    return { baseTotal, incrementos, descuento, opcionalesTotal, subtotal, total: subtotal + opcionalesTotal };
  }, [items, opcionalesCotizacion]);

  // Handle selecting a categoria
  const handleSelectCategoria = (categoriaId: string) => {
    setSelectedCategoriaId(categoriaId);
    setSelectedSubcategoriaId('');
    setSelectionStep('subcategoria');
  };

  // Handle selecting a subcategoria
  const handleSelectSubcategoria = (subcategoriaId: string) => {
    setSelectedSubcategoriaId(subcategoriaId);
    setSelectionStep('producto');
  };

  // Handle selecting a product
  const handleSelectProduct = (productoId: string) => {
    setSelectedProductoId(productoId);
    setOptionSelections({});
    setCheckboxSelections({});
    setProductSearch('');
    setDescuentoSeleccionado(0);

    // Reset vinyl calculator and set constant from product price
    // Only for products in the "Vinilos" subcategory (not Molduras or Pinturas)
    const prod = productos.find(p => p.id === productoId);
    const cat = prod ? categorias.find(c => c.id === prod.categoria_id) : null;
    const subcat = prod ? subcategorias.find(s => s.id === prod.subcategoria_id) : null;
    if (cat?.nombre?.toLowerCase().includes('vinilo') && subcat?.nombre?.toLowerCase().includes('vinilo') && prod) {
      setViniloAncho(0);
      setViniloAlto(0);
      setViniloParedCompleta(true);
      setViniloAltoPintura(1.10);
      setViniloLlevaMoldura(false);
      setViniloAltoVinilo(0);
      setViniloConstante(prod.precio_base);
      setViniloCargoDiseno(300000);
    }
  };

  // Handle going back in selection
  const handleBackStep = () => {
    if (selectionStep === 'producto') {
      setSelectedSubcategoriaId('');
      setSelectionStep('subcategoria');
    } else if (selectionStep === 'subcategoria') {
      setSelectedCategoriaId('');
      setSelectionStep('categoria');
    }
  };

  // Reset product selector
  const resetProductSelector = () => {
    setSelectionStep('categoria');
    setSelectedCategoriaId('');
    setSelectedSubcategoriaId('');
    setSelectedProductoId('');
    setProductSearch('');
    setOptionSelections({});
    setCheckboxSelections({});
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

    // Validate vinilo dimensions
    if (isViniloProduct) {
      if (viniloAncho <= 0 || viniloAlto <= 0) {
        toast.error('Ingresa las medidas de la pared');
        return;
      }
      if (!viniloParedCompleta && viniloLlevaMoldura && viniloAltoVinilo <= 0 && viniloAlto - viniloAltoPintura <= 0) {
        toast.error('El alto del vinilo debe ser mayor a 0');
        return;
      }
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

    // Build vinyl-specific configuracion
    const itemConfiguracion = isViniloProduct ? {
      tipo: 'vinilo',
      ancho: viniloAncho,
      alto: viniloAlto,
      paredCompleta: viniloParedCompleta,
      altoPintura: viniloParedCompleta ? 0 : viniloAltoPintura,
      llevaMoldura: viniloLlevaMoldura,
      altoVinilo: viniloParedCompleta ? viniloAlto : (viniloAltoVinilo > 0 ? viniloAltoVinilo : viniloAlto - viniloAltoPintura),
      constante: viniloConstante,
      cargoDiseno: viniloCargoDiseno,
      area: viniloAncho * (viniloParedCompleta ? viniloAlto : (viniloAltoVinilo > 0 ? viniloAltoVinilo : viniloAlto - viniloAltoPintura)),
    } : configuracion;

    // Build vinyl-specific opciones_seleccionadas
    const itemOpciones = isViniloProduct ? [
      ...opcionesSeleccionadas,
      ...(viniloParedCompleta ? [] : [{
        opcion_id: generateId(),
        opcion_nombre: 'Diseño pared',
        opcion_tipo: 'select' as const,
        valor_id: generateId(),
        valor_nombre: `Pintura ${viniloAltoPintura}m${viniloLlevaMoldura ? ' + Moldura' : ''} + Vinilo ${viniloAltoVinilo > 0 ? viniloAltoVinilo : (viniloAlto - viniloAltoPintura).toFixed(2)}m`,
        incremento_precio: calculateItemPrice.incrementos,
      }]),
    ] : opcionesSeleccionadas;

    const newItem: FormItem = {
      id: generateId(),
      producto_id: selectedProducto.id,
      producto_nombre: isViniloProduct
        ? `${selectedProducto.nombre} (${viniloAncho}×${viniloAlto}m)`
        : selectedProducto.nombre,
      cantidad: 1,
      precio_unitario: base,
      opciones_seleccionadas: itemOpciones,
      subtotal: base + incrementos,
      configuracion: itemConfiguracion,
      precio_total_item: total,
      descuento_aplicado: descuento,
    };

    setItems([...items, newItem]);
    resetProductSelector();
    toast.success(`${selectedProducto.nombre} agregado`);
  };

  // Update product option value per item
  const handleUpdateOpcionValue = (itemId: string, opcionId: string, nuevoValor: number) => {
    setItems(items.map(i => {
      if (i.id !== itemId) return i;
      const nuevasOpciones = i.opciones_seleccionadas.map(op =>
        op.opcion_id === opcionId ? { ...op, incremento_precio: nuevoValor } : op
      );
      const nuevosIncrementos = nuevasOpciones.reduce((sum, op) => sum + op.incremento_precio, 0);
      const nuevoSubtotal = i.precio_unitario + nuevosIncrementos;
      return {
        ...i,
        opciones_seleccionadas: nuevasOpciones,
        subtotal: nuevoSubtotal,
        precio_total_item: nuevoSubtotal - i.descuento_aplicado,
      };
    }));
  };

  // Remove product option from item
  const handleRemoveOpcionFromItem = (itemId: string, opcionId: string) => {
    setItems(items.map(i => {
      if (i.id !== itemId) return i;
      const nuevasOpciones = i.opciones_seleccionadas.filter(op => op.opcion_id !== opcionId);
      const nuevosIncrementos = nuevasOpciones.reduce((sum, op) => sum + op.incremento_precio, 0);
      const nuevoSubtotal = i.precio_unitario + nuevosIncrementos;
      return {
        ...i,
        opciones_seleccionadas: nuevasOpciones,
        subtotal: nuevoSubtotal,
        precio_total_item: nuevoSubtotal - i.descuento_aplicado,
      };
    }));
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

  // Update item precio base (editable)
  const handleUpdatePrecioBase = (itemId: string, nuevoPrecio: number) => {
    if (nuevoPrecio < 0) return;
    setItems(items.map(i => {
      if (i.id !== itemId) return i;
      const incrementos = i.subtotal - i.precio_unitario;
      const nuevoSubtotal = nuevoPrecio + incrementos;
      return {
        ...i,
        precio_unitario: nuevoPrecio,
        subtotal: nuevoSubtotal,
        precio_total_item: nuevoSubtotal - i.descuento_aplicado,
      };
    }));
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
      cliente_direccion: clienteDireccion.trim() || undefined,
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
      opcionales: opcionalesCotizacion.map(op => ({
        id: op.id,
        opcional_predefinido_id: op.opcional_predefinido_id,
        nombre: op.nombre,
        valor: op.valor,
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

    // Save to Supabase in background (non-blocking)
    saveCotizacionToSupabase(cotizacionData).then(success => {
      if (!success) {
        console.warn('Cotización guardada localmente pero no en Supabase');
      }
    });

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
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Nombre *
              </Label>
              <Input
                placeholder="Nombre del cliente"
                value={clienteNombre}
                onChange={e => {
                  setClienteNombre(e.target.value);
                  setShowClientSuggestions(true);
                }}
                onFocus={() => {
                  if (clienteNombre.length >= 2) setShowClientSuggestions(true);
                }}
                className="h-10"
              />
              {/* Client autocomplete suggestions */}
              {showClientSuggestions && matchingClientes.length > 0 && (
                <div
                  ref={clientSuggestionsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {matchingClientes.map(cliente => (
                    <button
                      key={cliente.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-viv-sage/10 transition-colors flex items-center gap-2"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cliente.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">{cliente.telefono}{cliente.email ? ` · ${cliente.email}` : ''}</p>
                      </div>
                      {cliente.direccion && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{cliente.direccion}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Dirección
              </Label>
              <Input
                placeholder="Cra 15 #82-34, Apt 502"
                value={clienteDireccion}
                onChange={e => setClienteDireccion(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Selector - Cascading: Categoria → Subcategoria → Producto */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-base"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              Agregar Producto
            </CardTitle>
            {(selectedProductoId || selectedCategoriaId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectionStep('categoria');
                  setSelectedCategoriaId('');
                  setSelectedSubcategoriaId('');
                  setSelectedProductoId('');
                  setProductSearch('');
                  setOptionSelections({});
                  setCheckboxSelections({});
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} className="mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Product with options */}
          {selectedProducto ? (
            <div className="rounded-xl border border-viv-sage/20 bg-viv-sage/5 p-4 space-y-4">
              {/* Product name with deselect */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-viv-sage-dark" />
                  <span className="text-sm font-bold">{selectedProducto.nombre}</span>
                  {isViniloProduct ? (
                    <Badge className="bg-viv-sage/15 text-viv-sage-dark border-0 text-[10px]">
                      Vinilo x m²
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

              {/* Vinyl Calculator */}
              {isViniloProduct && (
                <div className="space-y-3 rounded-xl bg-muted/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-viv-sage-dark"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    Cálculo Vinilo
                  </p>

                  {/* Wall dimensions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider">Ancho pared (mts)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="2.80"
                        value={viniloAncho || ''}
                        onChange={e => setViniloAncho(Number(e.target.value) || 0)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider">Alto pared (mts)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="2.30"
                        value={viniloAlto || ''}
                        onChange={e => setViniloAlto(Number(e.target.value) || 0)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Full wall toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViniloParedCompleta(!viniloParedCompleta)}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                        viniloParedCompleta ? 'bg-viv-sage' : 'bg-muted-foreground/30'
                      }`}
                      role="switch"
                      aria-checked={viniloParedCompleta}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        viniloParedCompleta ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="text-xs font-medium">Pared completa con vinilo</span>
                  </div>

                  {/* Design mode fields */}
                  {!viniloParedCompleta && (
                    <div className="space-y-3 pl-2 border-l-2 border-viv-sage/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider">Alto pintura (mts)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="1.10"
                            value={viniloAltoPintura || ''}
                            onChange={e => setViniloAltoPintura(Number(e.target.value) || 0)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider">Alto vinilo (mts)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={viniloAlto > 0 ? (viniloAlto - viniloAltoPintura).toFixed(2) : '1.20'}
                            value={viniloAltoVinilo || ''}
                            onChange={e => setViniloAltoVinilo(Number(e.target.value) || 0)}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>

                      {/* Moldura toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViniloLlevaMoldura(!viniloLlevaMoldura)}
                          className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                            viniloLlevaMoldura ? 'bg-viv-sage' : 'bg-muted-foreground/30'
                          }`}
                          role="switch"
                          aria-checked={viniloLlevaMoldura}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            viniloLlevaMoldura ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                        <span className="text-xs font-medium">Lleva moldura</span>
                      </div>
                    </div>
                  )}

                  {/* Editable constants */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider">Constante m² ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={viniloConstante}
                        onChange={e => setViniloConstante(Number(e.target.value) || 0)}
                        className="h-9 text-sm"
                      />
                    </div>
                    {!viniloParedCompleta && viniloLlevaMoldura && (
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider">Cargo diseño ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={viniloCargoDiseno}
                          onChange={e => setViniloCargoDiseno(Number(e.target.value) || 0)}
                          className="h-9 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Calculation result */}
                  {viniloAncho > 0 && viniloAlto > 0 && (
                    <div className="rounded-xl bg-background border border-border/50 p-3 space-y-1.5">
                      {viniloParedCompleta ? (
                        <>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Área ({viniloAncho} × {viniloAlto})</span>
                            <span className="font-medium">{(viniloAncho * viniloAlto).toFixed(2)} m²</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Precio ({(viniloAncho * viniloAlto).toFixed(2)} × {formatPrice(viniloConstante)})</span>
                            <span className="font-semibold">{formatPrice(calculateItemPrice.base)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Área vinilo ({viniloAncho} × {viniloAltoVinilo > 0 ? viniloAltoVinilo : (viniloAlto - viniloAltoPintura).toFixed(2)})</span>
                            <span className="font-medium">
                              {(viniloAncho * (viniloAltoVinilo > 0 ? viniloAltoVinilo : viniloAlto - viniloAltoPintura)).toFixed(2)} m²
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Precio vinilo</span>
                            <span className="font-medium">{formatPrice(calculateItemPrice.base)}</span>
                          </div>
                          {viniloLlevaMoldura && calculateItemPrice.incrementos > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">Cargo diseño (×{Math.ceil(viniloAncho / 3)})</span>
                              <span className="font-medium text-viv-sage-dark">+{formatPrice(calculateItemPrice.incrementos)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>Total</span>
                        <span className="text-lg font-bold text-viv-sage-dark" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                          {formatPrice(calculateItemPrice.total)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Discount selector — only for non-vinilo products */}
              {!isViniloProduct && (
                <div className="space-y-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    Descuento
                  </p>
                  <div className="flex gap-2">
                    {([0, 5, 10] as const).map(pct => {
                      const precioConDesc = Math.round(selectedProducto.precio_base * (1 - pct / 100));
                      const isSelected = descuentoSeleccionado === pct;
                      return (
                        <button
                          key={pct}
                          onClick={() => setDescuentoSeleccionado(pct)}
                          className={`flex-1 rounded-xl border p-2.5 text-center transition-all ${
                            isSelected
                              ? 'border-viv-sage bg-viv-sage/10 shadow-sm'
                              : 'border-border/50 bg-muted/20 hover:border-viv-sage/30'
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSelected ? 'text-viv-sage-dark' : 'text-muted-foreground'}`}>
                            {pct === 0 ? 'Base' : `-${pct}%`}
                          </p>
                          <p className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-viv-sage-dark' : 'text-foreground'}`}>
                            {formatPrice(precioConDesc)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* Price Breakdown - hidden for vinilo (shown in calculator) */}
              {!isViniloProduct && (
              <div className="rounded-xl bg-background border border-border/50 p-3 space-y-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2"
                  style={{ fontFamily: 'var(--font-league-spartan)' }}
                >
                  Desglose de precio
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Precio base</span>
                  <span className="text-xs font-semibold">{formatPrice(selectedProducto.precio_base)}</span>
                </div>
                {descuentoSeleccionado > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Descuento -{descuentoSeleccionado}%
                    </span>
                    <span className="text-xs font-semibold text-viv-rose-dark">
                      -{formatPrice(calculateItemPrice.descuento)}
                    </span>
                  </div>
                )}
                {calculateItemPrice.incrementos > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Incrementos</span>
                    <span className="text-xs font-semibold text-viv-sage-dark">
                      +{formatPrice(calculateItemPrice.incrementos)}
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
              )}

              {/* Add button */}
              <Button
                className="w-full bg-viv-sage hover:bg-viv-sage-dark text-white"
                onClick={handleAddItem}
              >
                <Plus size={16} className="mr-1.5" />
                Agregar al presupuesto
              </Button>
            </div>
          ) : (
            <>
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
                {selectionStep !== 'categoria' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackStep}
                    className="h-7 px-2 text-viv-sage-dark hover:bg-viv-sage/10"
                  >
                    <ArrowLeft size={14} className="mr-1" />
                    Atrás
                  </Button>
                )}
                <span className={selectionStep === 'categoria' ? 'text-foreground font-medium' : ''}>
                  Categorías
                </span>
                {selectedCategoria && (
                  <>
                    <span className="mx-1">›</span>
                    <span className={selectionStep === 'subcategoria' ? 'text-foreground font-medium' : ''}>
                      {selectedCategoria.nombre}
                    </span>
                  </>
                )}
                {selectedSubcategoria && (
                  <>
                    <span className="mx-1">›</span>
                    <span className="text-foreground font-medium">
                      {selectedSubcategoria.nombre}
                    </span>
                  </>
                )}
              </div>

              {/* Step: Categorias */}
              {selectionStep === 'categoria' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Selecciona una categoría para ver sus productos:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categorias.filter(c => c.activa).map(categoria => (
                      <button
                        key={categoria.id}
                        onClick={() => handleSelectCategoria(categoria.id)}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 hover:border-viv-sage/50 hover:bg-viv-sage/5 transition-all text-center gap-2"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center">
                          <span className="text-lg">{categoria.icono || '📁'}</span>
                        </div>
                        <span className="text-sm font-medium">{categoria.nombre}</span>
                      </button>
                    ))}
                  </div>
                  {categorias.filter(c => c.activa).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No hay categorías creadas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Subcategorias */}
              {selectionStep === 'subcategoria' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Selecciona una subcategoría de <strong>{selectedCategoria?.nombre}</strong>:
                  </p>
                  {filteredSubcategorias.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredSubcategorias.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSubcategoria(sub.id)}
                          className="flex items-center justify-center p-3 rounded-xl border border-border/50 hover:border-viv-sage/50 hover:bg-viv-sage/5 transition-all text-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center">
                            <span className="text-base">📦</span>
                          </div>
                          <span className="text-sm font-medium">{sub.nombre}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No hay subcategorías para esta categoría. Puedes ver los productos directamente:
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setSelectionStep('producto')}
                        className="border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10"
                      >
                        Ver productos de {selectedCategoria?.nombre}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Productos */}
              {selectionStep === 'producto' && (
                <>
                  {/* Product search */}
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

                  {/* Product list */}
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border/50 divide-y divide-border/30">
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
                            <p className="text-sm font-bold text-viv-sage-dark">
                              {formatPrice(producto.precio_base)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </>
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

                    {/* Selected options badges - editable */}
                    {item.opciones_seleccionadas.length > 0 && (
                      <div className="pl-5 space-y-1.5">
                        {item.opciones_seleccionadas.map((op, i) => (
                          <div
                            key={`${op.opcion_id}-${op.valor_id}-${i}`}
                            className="flex items-center gap-2"
                          >
                            <Badge
                              variant="outline"
                              className="text-[10px] border-viv-beige flex-shrink-0"
                            >
                              {op.opcion_nombre}: {op.valor_nombre}
                            </Badge>
                            <Input
                              type="number"
                              value={op.incremento_precio}
                              onChange={(e) => handleUpdateOpcionValue(item.id, op.opcion_id, Number(e.target.value) || 0)}
                              className="h-6 w-24 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleRemoveOpcionFromItem(item.id, op.opcion_id)}
                            >
                              <X size={10} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}



                    {/* Price breakdown per item - editable base price */}
                    <div className="pl-5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Precio base</span>
                        <Input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => handleUpdatePrecioBase(item.id, Number(e.target.value) || 0)}
                          className="h-6 w-28 text-xs text-right"
                        />
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
            {totals.opcionalesTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Opcionales</span>
                <span className="text-sm font-semibold text-viv-sage-dark">
                  +{formatPrice(totals.opcionalesTotal)}
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

      {/* Configuraciones / Opciones */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-base"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              Configuraciones / Opciones
            </CardTitle>
            <Select
              value=""
              onValueChange={(val) => {
                const opcional = opcionalesPredefinidos.find(o => o.id === val);
                if (opcional) {
                  handleAddOpcionalCotizacion(opcional);
                }
              }}
            >
              <SelectTrigger className="h-8 w-auto border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10 text-xs">
                <Plus size={14} className="mr-1" />
                <SelectValue placeholder="Agregar opción" />
              </SelectTrigger>
              <SelectContent>
                {opcionalesPredefinidos.filter(o => o.activo).map(op => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.nombre} ({formatPrice(op.valor)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {opcionalesCotizacion.length === 0 ? (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 rounded-xl bg-viv-sage/10 flex items-center justify-center mb-3">
                <Tag size={20} className="text-viv-sage/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sin opciones adicionales
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega aumentos de cuna, colchón, pintura, moldura u otros opcionales
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {opcionalesCotizacion.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  {getOpcionIcon(op.nombre)}
                  <Badge
                    variant="outline"
                    className="text-[10px] border-viv-beige flex-shrink-0"
                  >
                    {op.nombre}
                  </Badge>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={op.valor}
                      onChange={(e) => handleUpdateOpcionalCotizacion(op.id, Number(e.target.value) || 0)}
                      className="h-7 w-28 text-xs text-right"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveOpcionalCotizacion(op.id)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground font-medium">
                  Total opcionales
                </span>
                <span className="text-sm font-bold text-viv-sage-dark">
                  {formatPrice(opcionalesCotizacion.reduce((sum, o) => sum + o.valor, 0))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
