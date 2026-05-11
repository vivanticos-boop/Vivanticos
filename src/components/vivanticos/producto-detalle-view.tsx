'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Edit, Trash2, Ruler, Bed, Layers, Tag,
  MessageCircle, FileText, Truck, Shield, Package,
  Ruler as MeasureIcon, Hammer, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export function ProductoDetalleView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedProductoId = useAppStore(s => s.selectedProductoId);
  const setSelectedProductoId = useAppStore(s => s.setSelectedProductoId);
  const currentUser = useAppStore(s => s.currentUser);
  const isLoggedIn = useAppStore(s => s.isLoggedIn);
  const canManage = currentUser?.rol !== 'vendedor';

  const productos = useCatalogoStore(s => s.productos);
  const categorias = useCatalogoStore(s => s.categorias);
  const subcategorias = useCatalogoStore(s => s.subcategorias);
  const filtroCategoria = useCatalogoStore(s => s.filtroCategoria);
  const getOpcionesByProducto = useCatalogoStore(s => s.getOpcionesByProducto);
  const getValoresByOpcion = useCatalogoStore(s => s.getValoresByOpcion);
  const deleteProducto = useCatalogoStore(s => s.deleteProducto);
  const deleteProductoFromSupabase = useCatalogoStore(s => s.deleteProductoFromSupabase);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const producto = productos.find(p => p.id === selectedProductoId);
  if (!producto) return <div>Producto no encontrado</div>;

  const categoria = categorias.find(c => c.id === producto.categoria_id);
  const subcategoria = subcategorias.find(s => s.id === producto.subcategoria_id);
  const opciones = getOpcionesByProducto(producto.id);

  // Get category name for sharing
  const categoriaNombre = categoria?.nombre || null;

  // Products to share: same category or all
  const productosToShare = filtroCategoria
    ? productos.filter(p => p.categoria_id === filtroCategoria && p.activo)
    : productos.filter(p => p.activo);

  // Up to 4 images
  const imagenes = producto.imagenes.slice(0, 4);

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProductoFromSupabase(producto.id);
      toast.success('Producto eliminado');
      navigateTo('catalogo');
    }
  };

  // Image carousel navigation
  const goNextImage = () => setSelectedImageIdx(i => (i + 1) % imagenes.length);
  const goPrevImage = () => setSelectedImageIdx(i => (i - 1 + imagenes.length) % imagenes.length);

  // ===== WhatsApp: Share catalog (all or by category) =====
  const handleWhatsApp = () => {
    const isCategory = !!filtroCategoria;

    let msg = isCategory
      ? `¡Hola! Te comparto nuestro catálogo ${categoriaNombre} Vivanticos 🧸\n\n`
      : `¡Hola! Te comparto nuestro catálogo Vivanticos 🧸\n\n`;

    productosToShare.forEach((p, i) => {
      msg += `*${i + 1}. ${p.nombre}*\n`;
      msg += `Precio: ${formatPrice(p.precio_base)}\n`;

      if (p.descripcion) {
        const desc = p.descripcion.length > 120
          ? p.descripcion.substring(0, 120) + '...'
          : p.descripcion;
        msg += `${desc}\n`;
      }

      if (p.garantia) {
        msg += `🛡️ Garantía: ${p.garantia}\n`;
      }

      if (p.entrega_inmediata) {
        msg += `🚚 Entrega inmediata\n`;
      } else {
        msg += `🔨 Fabricación\n`;
      }

      // First image
      if (p.imagenes.length > 0) {
        msg += `${p.imagenes[0]}\n`;
      }

      msg += '\n';
    });

    msg += `— Vivanticos · Muebles y Decoración Infantil 💛`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ===== PDF: Share catalog (all or by category) =====
  const handlePDF = () => {
    const isCategory = !!filtroCategoria;
    const title = isCategory
      ? `Catálogo ${categoriaNombre}`
      : 'Catálogo';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.');
      return;
    }

    const productsHtml = productosToShare.map((p, i) => {
      const imagesHtml = p.imagenes.length > 0
        ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(p.imagenes.length, 4)},1fr);gap:8px;margin:12px 0;">
            ${p.imagenes.map(img => `<img src="${img}" style="width:100%;height:auto;border-radius:6px;object-fit:cover;max-height:200px;" />`).join('')}
          </div>`
        : `<div style="text-align:center;padding:20px 0;color:#ccc;font-size:36px;">🧸</div>`;

      const badgesHtml = `
        ${p.entrega_inmediata
          ? `<span style="display:inline-block;background:#7c8c6e;color:white;padding:4px 12px;border-radius:16px;font-size:11px;font-weight:600;">🚚 Entrega Inmediata</span>`
          : `<span style="display:inline-block;background:#b8a090;color:white;padding:4px 12px;border-radius:16px;font-size:11px;font-weight:600;">🔨 Fabricación</span>`
        }
      `;

      const garantiaHtml = p.garantia
        ? `<div style="margin-top:8px;font-size:12px;color:#888;"><span style="font-weight:600;">🛡️ Garantía:</span> ${p.garantia}</div>`
        : '';

      return `
        <div style="border-bottom:1px solid #f0ebe6;padding:20px 0;${i === 0 ? 'padding-top:0;' : ''}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;">
            <div>
              <span style="font-size:10px;color:#bbb;letter-spacing:1px;text-transform:uppercase;">${p.codigo}</span>
              <h3 style="font-family:'League Spartan',sans-serif;font-size:18px;font-weight:700;color:#333;margin:2px 0 6px;">${p.nombre}</h3>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-family:'League Spartan',sans-serif;font-size:22px;font-weight:800;color:#7c8c6e;">${formatPrice(p.precio_base)}</div>
              <div style="margin-top:4px;">${badgesHtml}</div>
            </div>
          </div>
          ${imagesHtml}
          ${p.descripcion ? `<p style="font-size:13px;color:#666;line-height:1.5;margin-top:8px;">${p.descripcion}</p>` : ''}
          ${garantiaHtml}
        </div>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} — Vivanticos</title>
  <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color:#333; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div style="max-width:700px;margin:0 auto;padding:40px 32px;">
    <!-- Header with logo -->
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;border-bottom:3px solid #e8a0b6;padding-bottom:20px;">
      <img src="/logo-vivanticos.jpeg" style="width:56px;height:56px;border-radius:12px;object-fit:contain;" />
      <div>
        <div style="font-family:'League Spartan',sans-serif;font-size:22px;font-weight:800;color:#7c8c6e;">Vivanticos</div>
        <div style="font-size:12px;color:#999;letter-spacing:2px;text-transform:uppercase;">Muebles y Decoración Infantil</div>
      </div>
    </div>

    <!-- Catalog title -->
    <h1 style="font-family:'League Spartan',sans-serif;font-size:28px;font-weight:800;color:#333;margin-bottom:8px;">
      ${title}
    </h1>
    <p style="font-size:13px;color:#999;margin-bottom:24px;">${productosToShare.length} producto${productosToShare.length !== 1 ? 's' : ''} disponible${productosToShare.length !== 1 ? 's' : ''}</p>

    <!-- Products -->
    ${productsHtml}

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;">
      <div style="font-size:12px;color:#bbb;">Vivanticos · Muebles y Decoración Infantil · www.vivanticos.com</div>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const iconMap: Record<string, React.ReactNode> = {
    medida: <Ruler size={14} />,
    colchon: <Bed size={14} />,
    lenceria: <Layers size={14} />,
    extra: <Tag size={14} />,
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
            <img
              src="/logo-vivanticos.jpeg"
              alt="Vivanticos"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">
              {producto.codigo}
            </p>
            <h2
              className="text-xl md:text-2xl font-bold truncate"
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              {producto.nombre}
            </h2>
          </div>
        </div>
        <div className="flex-1" />
        {canManage && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-viv-peach text-viv-peach-dark hover:bg-viv-peach/10"
              onClick={() => {
                setSelectedProductoId(producto.id);
                navigateTo('producto-form');
              }}
            >
              <Edit size={14} className="mr-1" />
              <span className="hidden sm:inline">Editar</span>
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
        {/* ===== Image Gallery with Carousel ===== */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-viv-sage/10 via-viv-peach/10 to-viv-rose/10 flex items-center justify-center relative">
            {imagenes.length > 0 ? (
              <>
                <img
                  src={imagenes[selectedImageIdx] || imagenes[0]}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
                {/* Carousel arrows */}
                {imagenes.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); goPrevImage(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goNextImage(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight size={18} />
                    </button>
                    {/* Dot indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imagenes.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(i); }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === selectedImageIdx ? 'bg-white' : 'bg-white/50'
                          }`}
                          aria-label={`Imagen ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <span className="text-8xl opacity-20">🧸</span>
            )}
          </div>
          {imagenes.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIdx(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors cursor-pointer ${
                    i === selectedImageIdx
                      ? 'border-viv-sage ring-2 ring-viv-sage/30'
                      : 'border-transparent hover:border-viv-sage/50'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${producto.nombre} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* ===== Product Info ===== */}
        <div className="space-y-4">
          {/* Price Card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Precio</p>
                  <p
                    className="text-3xl font-bold text-viv-sage-dark"
                    style={{ fontFamily: 'var(--font-league-spartan)' }}
                  >
                    {formatPrice(producto.precio_base)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {producto.entrega_inmediata ? (
                    <Badge className="bg-emerald-500 text-white border-0 text-xs">
                      <Truck size={12} className="mr-1" />
                      Entrega inmediata
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-600 text-white border-0 text-xs">
                      <Hammer size={12} className="mr-1" />
                      Fabricación
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex gap-2">
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
                  onClick={handlePDF}
                >
                  <FileText size={14} className="mr-1" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category & Subcategory badges */}
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
            </CardContent>
          </Card>

          {/* ===== Internal-only info section (SOLO LOGGED IN) ===== */}
          {isLoggedIn && (
            <Card className="border-0 shadow-sm bg-viv-beige/20">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle
                  className="text-sm flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-league-spartan)' }}
                >
                  🔒 Información Interna
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {producto.descripcion && (
                  <div className="flex gap-2.5">
                    <Package size={16} className="text-viv-sage-dark mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Descripción
                      </p>
                      <p className="text-sm text-foreground/80">{producto.descripcion}</p>
                    </div>
                  </div>
                )}
                {producto.medidas && (
                  <div className="flex gap-2.5">
                    <MeasureIcon size={16} className="text-viv-sage-dark mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Medidas
                      </p>
                      <p className="text-sm text-foreground/80">{producto.medidas}</p>
                    </div>
                  </div>
                )}
                {producto.material && (
                  <div className="flex gap-2.5">
                    <Layers size={16} className="text-viv-sage-dark mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Material
                      </p>
                      <p className="text-sm text-foreground/80">{producto.material}</p>
                    </div>
                  </div>
                )}
                {producto.garantia && (
                  <div className="flex gap-2.5">
                    <Shield size={16} className="text-viv-sage-dark mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Garantía
                      </p>
                      <p className="text-sm text-foreground/80">{producto.garantia}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== Options/Configurations section ===== */}
          {opciones.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle
                  className="text-sm"
                  style={{ fontFamily: 'var(--font-league-spartan)' }}
                >
                  Configuraciones Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-3">
                  {opciones.map(op => {
                    const valores = getValoresByOpcion(op.id);
                    return (
                      <div key={op.id}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-muted-foreground">
                            {iconMap[op.tipo] || <Tag size={14} />}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {op.nombre}
                          </span>
                          {op.requerida && (
                            <span className="text-[10px] text-viv-rose">*requerido</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {valores
                            .filter(v => v.activo)
                            .map(v => (
                              <Badge
                                key={v.id}
                                variant="outline"
                                className="text-xs border-viv-beige"
                              >
                                {v.nombre}
                                {v.incremento_precio > 0 && (
                                  <span className="ml-1 text-viv-sage-dark font-semibold">
                                    +{formatPrice(v.incremento_precio)}
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
        </div>
      </div>
    </div>
  );
}
