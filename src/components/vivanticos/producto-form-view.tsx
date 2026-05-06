'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ImagePlus,
  Ruler,
  Bed,
  Layers,
  Tag,
  GripVertical,
  X,
  Save,
  Package,
} from 'lucide-react';
import { formatPrice, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Producto, TipoOpcion } from '@/types';

// Local type for managing option + values together in the form
interface FormOpcion {
  id: string;
  tipo: TipoOpcion;
  nombre: string;
  requerida: boolean;
  orden: number;
  valores: FormOpcionValor[];
}

interface FormOpcionValor {
  id: string;
  nombre: string;
  precio_incremento: number;
  activo: boolean;
}

const OPCION_TIPO_LABELS: Record<TipoOpcion, string> = {
  medida: 'Medida',
  colchon: 'Colchón',
  lenceria: 'Lencería',
  extra: 'Extra',
};

const OPCION_TIPO_ICONS: Record<TipoOpcion, React.ReactNode> = {
  medida: <Ruler size={14} />,
  colchon: <Bed size={14} />,
  lenceria: <Layers size={14} />,
  extra: <Tag size={14} />,
};

// Helper to compute initial form state from an existing product
function getInitialFormState(existingProducto: Producto | null, opciones: { id: string; producto_id: string; tipo: TipoOpcion; nombre: string; requerida: boolean; orden: number }[], opcionValores: { id: string; opcion_id: string; nombre: string; precio_incremento: number; activo: boolean }[]) {
  if (!existingProducto) {
    return {
      codigo: '',
      nombre: '',
      categoriaId: '',
      subcategoriaId: '',
      descripcion: '',
      descripcionTecnica: '',
      precioBase: '',
      descuentoTipo: 'ninguno' as const,
      descuentoValor: '',
      imagenes: [] as string[],
      activo: true,
      formOpciones: [] as FormOpcion[],
    };
  }

  const existingOpciones = opciones.filter(o => o.producto_id === existingProducto.id);
  const loadedOpciones: FormOpcion[] = existingOpciones.map(op => {
    const vals = opcionValores.filter(v => v.opcion_id === op.id);
    return {
      id: op.id,
      tipo: op.tipo,
      nombre: op.nombre,
      requerida: op.requerida,
      orden: op.orden,
      valores: vals.map(v => ({
        id: v.id,
        nombre: v.nombre,
        precio_incremento: v.precio_incremento,
        activo: v.activo,
      })),
    };
  });

  return {
    codigo: existingProducto.codigo,
    nombre: existingProducto.nombre,
    categoriaId: existingProducto.categoria_id,
    subcategoriaId: existingProducto.subcategoria_id || '',
    descripcion: existingProducto.descripcion,
    descripcionTecnica: existingProducto.descripcion_tecnica,
    precioBase: String(existingProducto.precio_base),
    descuentoTipo: existingProducto.descuento_tipo || 'ninguno',
    descuentoValor: String(existingProducto.descuento_valor || ''),
    imagenes: existingProducto.imagenes,
    activo: existingProducto.activo,
    formOpciones: loadedOpciones,
  };
}

export function ProductoFormView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedProductoId = useAppStore(s => s.selectedProductoId);
  const currentUser = useAppStore(s => s.currentUser);
  const canManage = currentUser?.rol === 'admin' || currentUser?.rol === 'jefe';

  const productos = useCatalogoStore(s => s.productos);
  const categorias = useCatalogoStore(s => s.categorias);
  const subcategorias = useCatalogoStore(s => s.subcategorias);
  const opciones = useCatalogoStore(s => s.opciones);
  const opcionValores = useCatalogoStore(s => s.opcionValores);
  const addProducto = useCatalogoStore(s => s.addProducto);
  const updateProducto = useCatalogoStore(s => s.updateProducto);

  const isEditing = !!selectedProductoId;
  const existingProducto = isEditing
    ? productos.find(p => p.id === selectedProductoId) ?? null
    : null;

  // Initialize form state lazily from existing product data
  const initialState = useMemo(
    () => getInitialFormState(existingProducto, opciones, opcionValores),
    [existingProducto, opciones, opcionValores]
  );

  const [codigo, setCodigo] = useState(() => initialState.codigo);
  const [nombre, setNombre] = useState(() => initialState.nombre);
  const [categoriaId, setCategoriaIdRaw] = useState(() => initialState.categoriaId);
  const [subcategoriaId, setSubcategoriaId] = useState(() => initialState.subcategoriaId);
  const [descripcion, setDescripcion] = useState(() => initialState.descripcion);
  const [descripcionTecnica, setDescripcionTecnica] = useState(() => initialState.descripcionTecnica);
  const [precioBase, setPrecioBase] = useState(() => initialState.precioBase);
  const [descuentoTipo, setDescuentoTipo] = useState<'ninguno' | 'colchon' | 'cuna'>(() => initialState.descuentoTipo as 'ninguno' | 'colchon' | 'cuna');
  const [descuentoValor, setDescuentoValor] = useState(() => initialState.descuentoValor);
  const [imagenes, setImagenes] = useState<string[]>(() => initialState.imagenes);
  const [activo, setActivo] = useState(() => initialState.activo);
  const [formOpciones, setFormOpciones] = useState<FormOpcion[]>(() => initialState.formOpciones);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wrap setCategoriaId to also reset subcategoria when category changes
  const setCategoriaId = useCallback((newCatId: string) => {
    setCategoriaIdRaw(newCatId);
    // Check if current subcategoria belongs to the new category
    const subBelongsToCategory = subcategorias.some(
      s => s.id === subcategoriaId && s.categoria_id === newCatId
    );
    if (!subBelongsToCategory) {
      setSubcategoriaId('');
    }
  }, [subcategoriaId, subcategorias]);

  // Filtered subcategorias based on selected category
  const filteredSubcategorias = useMemo(() => {
    if (!categoriaId) return [];
    return subcategorias.filter(s => s.categoria_id === categoriaId && s.activa);
  }, [categoriaId, subcategorias]);

  // Permission check
  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-rose/20 flex items-center justify-center mb-4">
          <Package size={28} className="text-viv-rose-dark" />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: 'var(--font-league-spartan)' }}
        >
          Acceso restringido
        </h3>
        <p className="text-muted-foreground text-sm">
          Solo administradores y jefes pueden gestionar productos.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigateTo('catalogo')}
        >
          Volver al catálogo
        </Button>
      </div>
    );
  }

  // --- Option management ---
  const addOpcion = () => {
    const newOpcion: FormOpcion = {
      id: generateId(),
      tipo: 'medida',
      nombre: '',
      requerida: false,
      orden: formOpciones.length + 1,
      valores: [],
    };
    setFormOpciones([...formOpciones, newOpcion]);
  };

  const removeOpcion = (opcionId: string) => {
    setFormOpciones(formOpciones.filter(o => o.id !== opcionId));
  };

  const updateOpcion = (opcionId: string, field: keyof FormOpcion, value: unknown) => {
    setFormOpciones(
      formOpciones.map(o =>
        o.id === opcionId ? { ...o, [field]: value } : o
      )
    );
  };

  const addValorToOpcion = (opcionId: string) => {
    setFormOpciones(
      formOpciones.map(o => {
        if (o.id !== opcionId) return o;
        return {
          ...o,
          valores: [
            ...o.valores,
            {
              id: generateId(),
              nombre: '',
              precio_incremento: 0,
              activo: true,
            },
          ],
        };
      })
    );
  };

  const removeValorFromOpcion = (opcionId: string, valorId: string) => {
    setFormOpciones(
      formOpciones.map(o => {
        if (o.id !== opcionId) return o;
        return {
          ...o,
          valores: o.valores.filter(v => v.id !== valorId),
        };
      })
    );
  };

  const updateValorInOpcion = (
    opcionId: string,
    valorId: string,
    field: keyof FormOpcionValor,
    value: unknown
  ) => {
    setFormOpciones(
      formOpciones.map(o => {
        if (o.id !== opcionId) return o;
        return {
          ...o,
          valores: o.valores.map(v =>
            v.id === valorId ? { ...v, [field]: value } : v
          ),
        };
      })
    );
  };

  // --- Image management ---
  const handleImageUpload = (_index: number) => {
    // Placeholder: In production this would open Cloudinary upload widget
    toast.info('Subida de imagen (Cloudinary) - próximamente');
  };

  const removeImage = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  // --- Submit ---
  const handleSubmit = () => {
    // Validation
    if (!codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!categoriaId) {
      toast.error('Selecciona una categoría');
      return;
    }
    if (!precioBase || Number(precioBase) <= 0) {
      toast.error('El precio base debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();

    const productoData: Producto = {
      id: isEditing ? existingProducto!.id : generateId(),
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId || undefined,
      descripcion: descripcion.trim(),
      descripcion_tecnica: descripcionTecnica.trim(),
      precio_base: Number(precioBase),
      imagenes,
      activo,
      descuento_tipo: descuentoTipo === 'ninguno' ? undefined : descuentoTipo,
      descuento_valor:
        descuentoTipo !== 'ninguno' && descuentoValor
          ? Number(descuentoValor)
          : undefined,
      creado_en: isEditing ? existingProducto!.creado_en : now,
      actualizado_en: now,
    };

    if (isEditing) {
      updateProducto(productoData);
    } else {
      addProducto(productoData);
    }

    toast.success('Producto guardado');
    navigateTo('catalogo');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </p>
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            {isEditing ? existingProducto?.nombre || 'Editar' : 'Crear Producto'}
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

      {/* Basic Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-1.5">
              <Label htmlFor="codigo" className="text-xs font-semibold uppercase tracking-wider">
                Código *
              </Label>
              <Input
                id="codigo"
                placeholder="Ej: CUN-LUN-001"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wider">
                Nombre *
              </Label>
              <Input
                id="nombre"
                placeholder="Nombre del producto"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoría */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Categoría *
              </Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter(c => c.activa)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icono && <span className="mr-1.5">{cat.icono}</span>}
                        {cat.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategoría */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Subcategoría
              </Label>
              <Select
                value={subcategoriaId}
                onValueChange={setSubcategoriaId}
                disabled={!categoriaId}
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={
                      categoriaId ? 'Seleccionar subcategoría' : 'Primero selecciona categoría'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubcategorias.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wider">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del producto para el cliente..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          {/* Descripción técnica */}
          <div className="space-y-1.5">
            <Label
              htmlFor="descripcionTecnica"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Descripción Técnica{' '}
              <span className="text-muted-foreground font-normal">(Solo interno)</span>
            </Label>
            <Textarea
              id="descripcionTecnica"
              placeholder="Especificaciones técnicas, materiales, procesos..."
              value={descripcionTecnica}
              onChange={e => setDescripcionTecnica(e.target.value)}
              rows={3}
              className="bg-viv-beige/5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Discount */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Precio y Descuento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Precio base */}
            <div className="space-y-1.5">
              <Label htmlFor="precioBase" className="text-xs font-semibold uppercase tracking-wider">
                Precio Base (COP) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="precioBase"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={precioBase}
                  onChange={e => setPrecioBase(e.target.value)}
                  className="h-10 pl-7"
                />
              </div>
              {precioBase && Number(precioBase) > 0 && (
                <p className="text-xs text-viv-sage-dark font-semibold">
                  {formatPrice(Number(precioBase))}
                </p>
              )}
            </div>

            {/* Tipo de descuento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Tipo de Descuento
              </Label>
              <Select
                value={descuentoTipo}
                onValueChange={(v: 'ninguno' | 'colchon' | 'cuna') => {
                  setDescuentoTipo(v);
                  if (v === 'ninguno') setDescuentoValor('');
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin descuento</SelectItem>
                  <SelectItem value="colchon">Descuento colchón</SelectItem>
                  <SelectItem value="cuna">Descuento cuna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor de descuento */}
          {descuentoTipo !== 'ninguno' && (
            <div className="space-y-1.5 animate-fade-in">
              <Label
                htmlFor="descuentoValor"
                className="text-xs font-semibold uppercase tracking-wider"
              >
                Valor de Descuento (COP)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="descuentoValor"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={descuentoValor}
                  onChange={e => setDescuentoValor(e.target.value)}
                  className="h-10 pl-7"
                />
              </div>
              {descuentoValor && Number(descuentoValor) > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-viv-rose/15 text-viv-rose-dark border-0">
                    <Tag size={12} className="mr-1" />
                    Descuento {descuentoTipo === 'colchon' ? 'colchón' : 'cuna'}:{' '}
                    {formatPrice(Number(descuentoValor))}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Existing images */}
            {imagenes.map((img, index) => (
              <div
                key={`img-${index}`}
                className="relative aspect-square rounded-xl overflow-hidden bg-viv-sage/5 border border-dashed border-viv-sage/30 group"
              >
                <img
                  src={img}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar imagen"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Placeholder upload slots */}
            {Array.from({ length: Math.max(0, 4 - imagenes.length) }).map((_, i) => (
              <button
                key={`upload-${i}`}
                onClick={() => handleImageUpload(imagenes.length + i)}
                className="aspect-square rounded-xl border-2 border-dashed border-viv-sage/30 hover:border-viv-sage/60 bg-viv-sage/5 hover:bg-viv-sage/10 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                aria-label="Subir imagen"
              >
                <ImagePlus
                  size={24}
                  className="text-viv-sage/50 group-hover:text-viv-sage transition-colors"
                />
                <span className="text-[10px] text-viv-sage/50 group-hover:text-viv-sage font-medium transition-colors">
                  Subir imagen
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Máximo 4 imágenes. Haz clic en un espacio para subir.
          </p>
        </CardContent>
      </Card>

      {/* Options / Configurations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-base"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              Configuraciones / Opciones
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10"
              onClick={addOpcion}
            >
              <Plus size={14} className="mr-1" />
              Agregar opción
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formOpciones.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-xl bg-viv-sage/10 flex items-center justify-center mb-3">
                <Tag size={20} className="text-viv-sage/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay opciones configuradas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega opciones como medida, colchón, lencería o extras
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {formOpciones.map((opcion, opIndex) => (
                <div
                  key={opcion.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3"
                >
                  {/* Option header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <GripVertical
                      size={16}
                      className="text-muted-foreground/50 flex-shrink-0"
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      #{opIndex + 1}
                    </span>

                    {/* Option type select */}
                    <Select
                      value={opcion.tipo}
                      onValueChange={(v: TipoOpcion) =>
                        updateOpcion(opcion.id, 'tipo', v)
                      }
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPCION_TIPO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-1.5">
                              {OPCION_TIPO_ICONS[key as TipoOpcion]}
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Option name */}
                    <Input
                      placeholder="Nombre de la opción"
                      value={opcion.nombre}
                      onChange={e =>
                        updateOpcion(opcion.id, 'nombre', e.target.value)
                      }
                      className="h-8 flex-1 min-w-[120px] text-sm"
                    />

                    {/* Required toggle */}
                    <button
                      onClick={() =>
                        updateOpcion(opcion.id, 'requerida', !opcion.requerida)
                      }
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors flex-shrink-0 ${
                        opcion.requerida
                          ? 'bg-viv-rose/15 text-viv-rose-dark'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {opcion.requerida ? 'Requerido' : 'Opcional'}
                    </button>

                    {/* Remove option */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOpcion(opcion.id)}
                      aria-label="Eliminar opción"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {/* Option icon + type badge */}
                  <div className="flex items-center gap-2 pl-7">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        opcion.tipo === 'medida'
                          ? 'bg-viv-bluegrey/15 text-viv-bluegrey'
                          : opcion.tipo === 'colchon'
                          ? 'bg-viv-sage/15 text-viv-sage-dark'
                          : opcion.tipo === 'lenceria'
                          ? 'bg-viv-peach/15 text-viv-peach-dark'
                          : 'bg-viv-beige/15 text-viv-beige'
                      }`}
                    >
                      {OPCION_TIPO_ICONS[opcion.tipo]}
                      <span className="ml-1">{OPCION_TIPO_LABELS[opcion.tipo]}</span>
                    </Badge>
                  </div>

                  <Separator />

                  {/* Option values */}
                  <div className="space-y-2 pl-7">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">
                        Valores ({opcion.valores.length})
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-viv-sage-dark hover:text-viv-sage-dark hover:bg-viv-sage/10"
                        onClick={() => addValorToOpcion(opcion.id)}
                      >
                        <Plus size={12} className="mr-1" />
                        Agregar valor
                      </Button>
                    </div>

                    {opcion.valores.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-2">
                        Sin valores. Agrega al menos un valor.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {opcion.valores.map((valor) => (
                          <div
                            key={valor.id}
                            className="flex items-center gap-2 bg-background rounded-lg p-2"
                          >
                            <Input
                              placeholder="Nombre del valor"
                              value={valor.nombre}
                              onChange={e =>
                                updateValorInOpcion(
                                  opcion.id,
                                  valor.id,
                                  'nombre',
                                  e.target.value
                                )
                              }
                              className="h-8 flex-1 min-w-0 text-sm"
                            />
                            <div className="relative w-28 sm:w-32 flex-shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                                +$
                              </span>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={
                                  valor.precio_incremento > 0
                                    ? valor.precio_incremento
                                    : ''
                                }
                                onChange={e =>
                                  updateValorInOpcion(
                                    opcion.id,
                                    valor.id,
                                    'precio_incremento',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="h-8 pl-8 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                removeValorFromOpcion(opcion.id, valor.id)
                              }
                              aria-label="Eliminar valor"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status & Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Estado:
              </span>
              <button
                onClick={() => setActivo(!activo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activo
                    ? 'bg-viv-sage/15 text-viv-sage-dark'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {activo ? '✓ Activo' : '○ Inactivo'}
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={goBack}>
                Cancelar
              </Button>
              <Button
                className="bg-viv-sage hover:bg-viv-sage-dark text-white"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Save size={16} className="mr-2" />
                {isEditing ? 'Actualizar' : 'Crear Producto'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
