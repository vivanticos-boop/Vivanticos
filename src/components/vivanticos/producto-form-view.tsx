'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, ImagePlus, Ruler, Bed, Layers, Tag, GripVertical, X, Save, Package, Truck, Loader2 } from 'lucide-react';
import { formatPrice, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Producto, TipoOpcionInput, TipoProducto } from '@/types';
import { TIPO_PRODUCTO_LABELS } from '@/types';

// Local type for managing option + values together in the form
interface FormOpcion {
  id: string;
  tipo: TipoOpcionInput;
  nombre: string;
  requerida: boolean;
  orden: number;
  valores: FormOpcionValor[];
}

interface FormOpcionValor {
  id: string;
  nombre: string;
  incremento_precio: number;
  activo: boolean;
}

const OPCION_TIPO_LABELS: Record<TipoOpcionInput, string> = {
  select: 'Selección',
  checkbox: 'Casilla',
};

const OPCION_TIPO_ICONS: Record<TipoOpcionInput, React.ReactNode> = {
  select: <Tag size={14} />,
  checkbox: <Tag size={14} />,
};

// Helper to compute initial form state from an existing product
function getInitialFormState(
  existingProducto: Producto | null,
  opciones: { id: string; producto_id: string; tipo: TipoOpcionInput; nombre: string; requerida: boolean; orden: number }[],
  opcionValores: { id: string; opcion_id: string; nombre: string; incremento_precio: number; activo: boolean }[]
) {
  if (!existingProducto) {
    return {
      codigo: '',
      nombre: '',
      categoriaId: '',
      subcategoriaId: '',
      descripcion: '',
      medidas: '',
      material: '',
      garantia: '',
      precioBase: '',
      precioDescuento: '',
      tipoProducto: 'otro' as TipoProducto,
      descuentoBase: '',
      entregaInmediata: false,
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
        incremento_precio: v.incremento_precio,
        activo: v.activo,
      })),
    };
  });

  return {
    codigo: existingProducto.codigo,
    nombre: existingProducto.nombre,
    categoriaId: existingProducto.categoria_id,
    subcategoriaId: existingProducto.subcategoria_id || '',
    descripcion: existingProducto.descripcion || '',
    medidas: existingProducto.medidas || '',
    material: existingProducto.material || '',
    garantia: existingProducto.garantia || '',
    precioBase: String(existingProducto.precio_base),
    precioDescuento: existingProducto.precio_descuento > 0 ? String(existingProducto.precio_descuento) : '',
    tipoProducto: existingProducto?.tipo_producto || 'otro',
    descuentoBase: existingProducto?.descuento_base ? String(existingProducto.descuento_base) : '',
    entregaInmediata: existingProducto.entrega_inmediata ?? false,
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
  const saveProductoToSupabase = useCatalogoStore(s => s.saveProductoToSupabase);

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
  const [medidas, setMedidas] = useState(() => initialState.medidas);
  const [material, setMaterial] = useState(() => initialState.material);
  const [garantia, setGarantia] = useState(() => initialState.garantia);
  const [precioBase, setPrecioBase] = useState(() => initialState.precioBase);
  const [entregaInmediata, setEntregaInmediata] = useState(() => initialState.entregaInmediata);
  const [imagenes, setImagenes] = useState<string[]>(() => initialState.imagenes);
  const [activo, setActivo] = useState(() => initialState.activo);
  const [formOpciones, setFormOpciones] = useState<FormOpcion[]>(() => initialState.formOpciones);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Image upload: Direct to Cloudinary with signed signature ---
  const uploadingStates = useState<Record<number, boolean>>({});
  const setUploading = (index: number, val: boolean) => {
    uploadingStates[1](prev => ({ ...prev, [index]: val }));
  };
  const isUploading = (index: number) => uploadingStates[0][index] || false;

  // Hidden file input ref for reliable mobile file selection
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadIndex = useRef<number>(0);

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB');
      return;
    }

    setUploading(index, true);

    try {
      // Step 1: Get signed upload params from our API
      const signResponse = await fetch('/api/cloudinary?folder=vivanticos/productos');
      if (!signResponse.ok) {
        const errData = await signResponse.json();
        throw new Error(errData.error || 'Error obteniendo firma de subida');
      }
      const signData = await signResponse.json();

      // Step 2: Upload directly to Cloudinary from the browser
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('api_key', signData.api_key);
      cloudinaryFormData.append('timestamp', signData.timestamp);
      cloudinaryFormData.append('signature', signData.signature);
      cloudinaryFormData.append('folder', signData.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
        { method: 'POST', body: cloudinaryFormData }
      );

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json();
        console.error('Cloudinary upload error:', errData);
        throw new Error(errData.error?.message || 'Error al subir imagen a Cloudinary');
      }

      const data = await uploadResponse.json();
      const newImagenes = [...imagenes];
      if (index < newImagenes.length) {
        newImagenes[index] = data.secure_url;
      } else {
        newImagenes.push(data.secure_url);
      }
      setImagenes(newImagenes);
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploading(index, false);
    }
  };

  const handleFileSelect = (index: number) => {
    pendingUploadIndex.current = index;
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(pendingUploadIndex.current, file);
    }
  };
  const setCategoriaId = useCallback((newCatId: string) => {
    setCategoriaIdRaw(newCatId);
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

  // Computed price values for preview
  const precioBaseNum = Number(precioBase) || 0;

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

  const removeImage = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  // --- Option management ---
  const addOpcion = () => {
    const newOpcion: FormOpcion = {
      id: generateId(),
      tipo: 'select' as TipoOpcionInput,
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
              incremento_precio: 0,
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

  // --- Submit ---
  const handleSubmit = async () => {
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
      medidas: medidas.trim(),
      material: material.trim(),
      garantia: garantia.trim(),
      precio_base: Number(precioBase),
      precio_descuento: 0,
      tipo_producto: 'otro',
      descuento_base: 0,
      entrega_inmediata: entregaInmediata,
      imagenes,
      activo,
      creado_en: isEditing ? existingProducto!.creado_en : now,
      actualizado_en: now,
    };

    // Save to Supabase (with local fallback)
    await saveProductoToSupabase(productoData, formOpciones);

    toast.success('Producto guardado');
    navigateTo('catalogo');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Hidden file input for image upload — always in DOM for mobile compatibility */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* ========== Header ========== */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="Volver">
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

      {/* ========== Información Básica ========== */}
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

          {/* Descripción — Solo visible dentro de la app */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wider">
              Descripción{' '}
              <span className="text-viv-peach-dark font-normal normal-case tracking-normal text-[11px]">
                (Solo visible dentro de la app)
              </span>
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción interna del producto..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              className="bg-viv-beige/5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Medidas — Solo visible dentro de la app */}
            <div className="space-y-1.5">
              <Label htmlFor="medidas" className="text-xs font-semibold uppercase tracking-wider">
                Medidas{' '}
                <span className="text-viv-peach-dark font-normal normal-case tracking-normal text-[11px]">
                  (Solo app)
                </span>
              </Label>
              <div className="relative">
                <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="medidas"
                  placeholder="Ej: 120x60cm"
                  value={medidas}
                  onChange={e => setMedidas(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            {/* Material — Solo visible dentro de la app */}
            <div className="space-y-1.5">
              <Label htmlFor="material" className="text-xs font-semibold uppercase tracking-wider">
                Material{' '}
                <span className="text-viv-peach-dark font-normal normal-case tracking-normal text-[11px]">
                  (Solo app)
                </span>
              </Label>
              <Input
                id="material"
                placeholder="Ej: MDF 18mm"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Garantía — Solo visible dentro de la app */}
            <div className="space-y-1.5">
              <Label htmlFor="garantia" className="text-xs font-semibold uppercase tracking-wider">
                Garantía{' '}
                <span className="text-viv-peach-dark font-normal normal-case tracking-normal text-[11px]">
                  (Solo app)
                </span>
              </Label>
              <Input
                id="garantia"
                placeholder="Ej: 6 meses"
                value={garantia}
                onChange={e => setGarantia(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== Precio ========== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Precio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            {precioBaseNum > 0 && (
              <div className="rounded-xl bg-viv-beige/10 border border-viv-beige/30 p-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl font-bold text-viv-sage-dark" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                    {formatPrice(precioBaseNum)}
                  </span>
                  <span className="text-xs text-muted-foreground">Precio base</span>
                </div>
              </div>
            )}
          </div>

          {/* Entrega Inmediata toggle */}
          <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${entregaInmediata ? 'bg-viv-sage/15' : 'bg-muted'}`}>
                <Truck size={18} className={entregaInmediata ? 'text-viv-sage-dark' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-semibold">Entrega Inmediata</p>
                <p className="text-xs text-muted-foreground">
                  {entregaInmediata ? 'Disponible para entrega inmediata' : 'Tiempo de producción estándar'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEntregaInmediata(!entregaInmediata)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-viv-sage ${
                entregaInmediata ? 'bg-viv-sage' : 'bg-muted-foreground/30'
              }`}
              role="switch"
              aria-checked={entregaInmediata}
              aria-label="Entrega inmediata"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  entregaInmediata ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ========== Imágenes ========== */}
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
                {/* Replace image overlay */}
                <button
                  onClick={() => handleFileSelect(index)}
                  className="absolute bottom-1.5 left-1.5 right-1.5 py-1 rounded-lg bg-black/50 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity text-center"
                >
                  Reemplazar
                </button>
              </div>
            ))}

            {/* Upload slots for empty positions */}
            {Array.from({ length: Math.max(0, 4 - imagenes.length) }).map((_, i) => {
              const slotIndex = imagenes.length + i;
              return (
                <button
                  key={`upload-${i}`}
                  onClick={() => handleFileSelect(slotIndex)}
                  disabled={isUploading(slotIndex)}
                  className="aspect-square rounded-xl border-2 border-dashed border-viv-sage/30 hover:border-viv-sage/60 bg-viv-sage/5 hover:bg-viv-sage/10 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer group disabled:opacity-50 disabled:cursor-wait"
                  aria-label="Subir imagen"
                >
                  {isUploading(slotIndex) ? (
                    <>
                      <Loader2 size={24} className="text-viv-sage animate-spin" />
                      <span className="text-[10px] text-viv-sage font-medium">
                        Subiendo...
                      </span>
                    </>
                  ) : (
                    <>
                      <ImagePlus
                        size={24}
                        className="text-viv-sage/50 group-hover:text-viv-sage transition-colors"
                      />
                      <span className="text-[10px] text-viv-sage/50 group-hover:text-viv-sage font-medium transition-colors">
                        Subir imagen
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Máximo 4 imágenes (máx 10MB cada una). Toca para seleccionar.
          </p>
        </CardContent>
      </Card>

      {/* ========== Status & Actions ========== */}
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
