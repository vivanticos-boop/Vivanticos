'use client';

import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Edit, Trash2, Tag, Ruler, Bed, Layers,
  MessageCircle, FileText,
} from 'lucide-react';
import { formatPrice, getRolName } from '@/lib/utils';
import { toast } from 'sonner';

export function ProductoDetalleView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedProductoId = useAppStore(s => s.selectedProductoId);
  const setSelectedProductoId = useAppStore(s => s.setSelectedProductoId);
  const currentUser = useAppStore(s => s.currentUser);
  const canManage = currentUser?.rol !== 'vendedor';

  const productos = useCatalogoStore(s => s.productos);
  const categorias = useCatalogoStore(s => s.categorias);
  const subcategorias = useCatalogoStore(s => s.subcategorias);
  const getOpcionesByProducto = useCatalogoStore(s => s.getOpcionesByProducto);
  const getValoresByOpcion = useCatalogoStore(s => s.getValoresByOpcion);
  const deleteProducto = useCatalogoStore(s => s.deleteProducto);

  const producto = productos.find(p => p.id === selectedProductoId);
  if (!producto) return <div>Producto no encontrado</div>;

  const categoria = categorias.find(c => c.id === producto.categoria_id);
  const subcategoria = subcategorias.find(s => s.id === producto.subcategoria_id);
  const opciones = getOpcionesByProducto(producto.id);

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteProducto(producto.id);
      toast.success('Producto eliminado');
      navigateTo('catalogo');
    }
  };

  const handleWhatsApp = () => {
    const msg = `¡Hola! Te comparto información sobre *${producto.nombre}* de Vivanticos:\n\n` +
      `Código: ${producto.codigo}\n` +
      `Precio: ${formatPrice(producto.precio_base)}\n\n` +
      producto.descripcion +
      `\n\n— Vivanticos · Mobiliario Infantil 💛`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{producto.codigo}</p>
          <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>
            {producto.nombre}
          </h2>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-viv-peach text-viv-peach-dark hover:bg-viv-peach/10"
              onClick={() => { setSelectedProductoId(producto.id); navigateTo('producto-form'); }}
            >
              <Edit size={14} className="mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Gallery */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-viv-sage/10 via-viv-peach/10 to-viv-rose/10 flex items-center justify-center">
            {producto.imagenes.length > 0 ? (
              <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl opacity-20">🧸</span>
            )}
          </div>
          {producto.imagenes.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {producto.imagenes.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-viv-sage transition-colors cursor-pointer">
                  <img src={img} alt={`${producto.nombre} ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Product Info */}
        <div className="space-y-4">
          {/* Price */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Precio base</p>
                  <p className="text-3xl font-bold text-viv-sage-dark" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                    {formatPrice(producto.precio_base)}
                  </p>
                </div>
                {producto.descuento_tipo && producto.descuento_tipo !== 'ninguno' && (
                  <Badge className="bg-viv-rose text-white border-0">
                    <Tag size={12} className="mr-1" />
                    Descuento {formatPrice(producto.descuento_valor || 0)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle size={14} className="mr-1" />
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-viv-sage hover:bg-viv-sage-dark text-white"
                  onClick={() => {
                    setSelectedProductoId(producto.id);
                    useAppStore.getState().setSelectedCotizacionId(null);
                    navigateTo('cotizacion-form');
                  }}
                >
                  <FileText size={14} className="mr-1" />
                  Cotizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {categoria && (
                  <Badge variant="secondary" className="bg-viv-sage/10 text-viv-sage-dark">
                    {categoria.icono} {categoria.nombre}
                  </Badge>
                )}
                {subcategoria && (
                  <Badge variant="secondary" className="bg-viv-peach/10 text-viv-peach-dark">
                    {subcategoria.nombre}
                  </Badge>
                )}
              </div>
              <Separator className="my-3" />
              <p className="text-sm text-foreground/80">{producto.descripcion}</p>
            </CardContent>
          </Card>

          {/* Options */}
          {opciones.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                  Configuraciones Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-3">
                  {opciones.map(op => {
                    const valores = getValoresByOpcion(op.id);
                    const iconMap: Record<string, React.ReactNode> = {
                      medida: <Ruler size={14} />,
                      colchon: <Bed size={14} />,
                      lenceria: <Layers size={14} />,
                      extra: <Tag size={14} />,
                    };
                    return (
                      <div key={op.id}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-muted-foreground">{iconMap[op.tipo]}</span>
                          <span className="text-xs font-semibold uppercase tracking-wider">{op.nombre}</span>
                          {op.requerida && <span className="text-[10px] text-viv-rose">*requerido</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {valores.filter(v => v.activo).map(v => (
                            <Badge
                              key={v.id}
                              variant="outline"
                              className="text-xs border-viv-beige"
                            >
                              {v.nombre}
                              {v.precio_incremento > 0 && (
                                <span className="ml-1 text-viv-sage-dark font-semibold">
                                  +{formatPrice(v.precio_incremento)}
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical description (internal only) */}
          {producto.descripcion_tecnica && canManage && (
            <Card className="border-0 shadow-sm bg-viv-beige/10">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  🔒 Descripción Técnica (Solo interno)
                </p>
                <p className="text-sm text-foreground/70">{producto.descripcion_tecnica}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
