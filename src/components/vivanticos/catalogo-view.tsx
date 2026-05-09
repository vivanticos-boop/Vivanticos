'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, Plus, Grid3X3, List, Truck, PackageX, MessageCircle, FileText, Tag, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export function CatalogoView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const setSelectedProductoId = useAppStore(s => s.setSelectedProductoId);
  const canManage = useAppStore(s => s.currentUser?.rol !== 'vendedor');

  const categorias = useCatalogoStore(s => s.categorias);
  const subcategorias = useCatalogoStore(s => s.subcategorias);
  const productos = useCatalogoStore(s => s.productos);
  const filtroCategoria = useCatalogoStore(s => s.filtroCategoria);
  const setFiltroCategoria = useCatalogoStore(s => s.setFiltroCategoria);
  const filtroSubcategoria = useCatalogoStore(s => s.filtroSubcategoria);
  const setFiltroSubcategoria = useCatalogoStore(s => s.setFiltroSubcategoria);
  const searchTerm = useCatalogoStore(s => s.searchTerm);
  const setSearchTerm = useCatalogoStore(s => s.setSearchTerm);
  const filteredProductos = useCatalogoStore(s => s.filteredProductos);
  const isLoaded = useCatalogoStore(s => s.isLoaded);
  const isLoading = useCatalogoStore(s => s.isLoading);
  const loadFromSupabase = useCatalogoStore(s => s.loadFromSupabase);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Cargar datos de Supabase al montar — siempre refrescar para multi-dispositivo
  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  const filtered = filteredProductos();

  // Subcategories filtered by selected category
  const subcategoriasFiltradas = useMemo(() => {
    if (!filtroCategoria) return [];
    return subcategorias.filter(s => s.categoria_id === filtroCategoria && s.activa);
  }, [filtroCategoria, subcategorias]);

  // Compute discount percentage for badge
  const getDiscountPercent = (base: number, descuento: number): number => {
    if (base <= 0 || descuento <= 0) return 0;
    return Math.round(((base - descuento) / base) * 100);
  };

  // WhatsApp share from card: ONLY name + price + up to 4 images. NO technical info.
  const handleWhatsAppFromCard = (e: React.MouseEvent, producto: typeof productos[0]) => {
    e.stopPropagation();
    const hasDiscount = producto.precio_descuento > 0;
    const priceText = hasDiscount
      ? `Precio: ~${formatPrice(producto.precio_base)}~ *${formatPrice(producto.precio_descuento)}*`
      : `Precio: *${formatPrice(producto.precio_base)}*`;

    let msg = `¡Hola! Te comparto información sobre *${producto.nombre}* de Vivanticos:\n\n` +
      `Código: ${producto.codigo}\n` +
      priceText;

    if (producto.entrega_inmediata) {
      msg += `\n🚚 Entrega inmediata`;
    }

    const imagenes = producto.imagenes.slice(0, 4);
    if (imagenes.length > 0) {
      msg += '\n\n';
      imagenes.forEach((img) => {
        msg += img + '\n';
      });
    }

    msg += `\n— Vivanticos · Mobiliario Infantil 💛`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // PDF share from card: ONLY name + price + up to 4 images. NO technical info.
  const handlePDFFromCard = (e: React.MouseEvent, producto: typeof productos[0]) => {
    e.stopPropagation();
    const hasDiscount = producto.precio_descuento > 0;
    const discountPercent = hasDiscount
      ? Math.round(((producto.precio_base - producto.precio_descuento) / producto.precio_base) * 100)
      : 0;
    const imagenes = producto.imagenes.slice(0, 4);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Permite las ventanas emergentes.');
      return;
    }

    const imagesHtml = imagenes.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(imagenes.length, 2)},1fr);gap:12px;margin:24px 0;">
          ${imagenes.map(img => `<img src="${img}" style="width:100%;height:auto;border-radius:8px;object-fit:cover;max-height:300px;" />`).join('')}
        </div>`
      : `<div style="text-align:center;padding:40px 0;color:#999;font-size:48px;">🧸</div>`;

    const priceHtml = hasDiscount
      ? `<div style="margin-bottom:8px;">
          <span style="text-decoration:line-through;color:#999;font-size:18px;">${formatPrice(producto.precio_base)}</span>
          <span style="background:#e8a0b6;color:white;padding:4px 12px;border-radius:20px;font-size:13px;margin-left:10px;font-weight:600;">-${discountPercent}%</span>
        </div>
        <div style="font-size:36px;font-weight:800;color:#7c8c6e;font-family:'League Spartan',sans-serif;">
          ${formatPrice(producto.precio_descuento)}
        </div>`
      : `<div style="font-size:36px;font-weight:800;color:#7c8c6e;font-family:'League Spartan',sans-serif;">
          ${formatPrice(producto.precio_base)}
        </div>`;

    const entregaBadge = producto.entrega_inmediata
      ? `<div style="display:inline-block;background:#7c8c6e;color:white;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-top:12px;">
          🚚 Entrega Inmediata
        </div>`
      : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${producto.nombre} — Vivanticos</title>
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
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;border-bottom:3px solid #e8a0b6;padding-bottom:24px;">
      <img src="/logo-vivanticos.jpeg" style="width:56px;height:56px;border-radius:12px;object-fit:contain;" />
      <div>
        <div style="font-family:'League Spartan',sans-serif;font-size:22px;font-weight:800;color:#7c8c6e;">Vivanticos</div>
        <div style="font-size:12px;color:#999;letter-spacing:2px;text-transform:uppercase;">Mobiliario Infantil</div>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <span style="font-size:11px;color:#999;letter-spacing:1.5px;text-transform:uppercase;">${producto.codigo}</span>
    </div>
    <h1 style="font-family:'League Spartan',sans-serif;font-size:32px;font-weight:800;color:#333;margin-bottom:20px;">
      ${producto.nombre}
    </h1>
    ${imagesHtml}
    <div style="background:#faf8f5;border-radius:16px;padding:24px;margin-top:24px;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Precio</div>
      ${priceHtml}
      ${entregaBadge}
    </div>
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
      <div style="font-size:12px;color:#bbb;">Vivanticos · Mobiliario Infantil · www.vivanticos.com</div>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center flex-shrink-0">
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
              Catálogo
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => loadFromSupabase()}
            disabled={isLoading}
            title="Refrescar catálogo desde la nube"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          {canManage && (
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={() => {
                setSelectedProductoId(null);
                navigateTo('producto-form');
              }}
            >
              <Plus size={16} className="mr-2" />
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar producto o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-viv-sage/15 text-viv-sage-dark'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            aria-label="Vista cuadrícula"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-viv-sage/15 text-viv-sage-dark'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            aria-label="Vista lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* ─── Category Filter Pills ─── */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={filtroCategoria === null ? 'default' : 'outline'}
            size="sm"
            className={
              filtroCategoria === null
                ? 'bg-viv-sage hover:bg-viv-sage-dark text-white'
                : ''
            }
            onClick={() => setFiltroCategoria(null)}
          >
            Todos
          </Button>
          {categorias
            .filter(c => c.activa)
            .sort((a, b) => a.orden - b.orden)
            .map(cat => (
              <Button
                key={cat.id}
                variant={filtroCategoria === cat.id ? 'default' : 'outline'}
                size="sm"
                className={
                  filtroCategoria === cat.id
                    ? 'bg-viv-sage hover:bg-viv-sage-dark text-white'
                    : ''
                }
                onClick={() => setFiltroCategoria(cat.id)}
              >
                {cat.icono && <span className="mr-1">{cat.icono}</span>}
                {cat.nombre}
              </Button>
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* ─── Subcategory Filter Pills ─── */}
      {filtroCategoria && subcategoriasFiltradas.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              variant={filtroSubcategoria === null ? 'default' : 'outline'}
              size="sm"
              className={
                filtroSubcategoria === null
                  ? 'bg-viv-peach hover:bg-viv-peach/80 text-gray-800 border-viv-peach'
                  : ''
              }
              onClick={() => setFiltroSubcategoria(null)}
            >
              Todas
            </Button>
            {subcategoriasFiltradas
              .sort((a, b) => a.orden - b.orden)
              .map(sub => (
                <Button
                  key={sub.id}
                  variant={filtroSubcategoria === sub.id ? 'default' : 'outline'}
                  size="sm"
                  className={
                    filtroSubcategoria === sub.id
                      ? 'bg-viv-peach hover:bg-viv-peach/80 text-gray-800 border-viv-peach'
                      : ''
                  }
                  onClick={() => setFiltroSubcategoria(sub.id)}
                >
                  {sub.nombre}
                </Button>
              ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* ─── Product List / Grid ─── */}
      {filtered.length === 0 ? (
        /* ─── Empty State ─── */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 rounded-3xl bg-viv-sage/10 flex items-center justify-center mb-4">
            <PackageX size={40} className="text-viv-sage/40" />
          </div>
          <h3
            className="text-lg font-semibold text-muted-foreground mb-1"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Sin resultados
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            No se encontraron productos con los filtros actuales. Intenta
            cambiar la categoría o el término de búsqueda.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── Grid Mode ─── */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map(producto => {
            return (
              <Card
                key={producto.id}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                onClick={() => {
                  setSelectedProductoId(producto.id);
                  navigateTo('producto-detalle');
                }}
              >
                {/* Image area */}
                <div className="aspect-square bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center relative overflow-hidden">
                  {producto.imagenes.length > 0 ? (
                    <img
                      src={producto.imagenes[0]}
                      alt={producto.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">
                      🧸
                    </span>
                  )}

                  {/* Entrega inmediata badge */}
                  {producto.entrega_inmediata && (
                    <Badge className="absolute bottom-2 left-2 bg-emerald-500 text-white border-0 text-[10px] gap-1 px-2 py-0.5">
                      <Truck size={10} />
                      Entrega inmediata
                    </Badge>
                  )}

                  {/* Quick share overlay on hover */}
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => handleWhatsAppFromCard(e, producto)}
                      className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md hover:bg-green-600 transition-colors"
                      aria-label="Compartir por WhatsApp"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={(e) => handlePDFFromCard(e, producto)}
                      className="w-8 h-8 rounded-full bg-viv-sage text-white flex items-center justify-center shadow-md hover:bg-viv-sage-dark transition-colors"
                      aria-label="Generar PDF"
                      title="PDF"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                </div>

                {/* Card content */}
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {producto.codigo}
                  </p>
                  <h3 className="text-sm font-semibold mt-0.5 truncate">
                    {producto.nombre}
                  </h3>

                  {/* Price display */}
                  <div className="mt-1">
                    <span
                      className="text-base font-bold text-viv-sage-dark"
                      style={{ fontFamily: 'var(--font-league-spartan)' }}
                    >
                      {formatPrice(producto.precio_base)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ─── List Mode ─── */
        <div className="space-y-2">
          {filtered.map(producto => {
            return (
              <Card
                key={producto.id}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedProductoId(producto.id);
                  navigateTo('producto-detalle');
                }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {producto.imagenes.length > 0 ? (
                      <img
                        src={producto.imagenes[0]}
                        alt={producto.nombre}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl">🧸</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {producto.codigo}
                    </p>
                    <h3 className="text-sm font-semibold truncate">
                      {producto.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-sm font-bold text-viv-sage-dark"
                        style={{ fontFamily: 'var(--font-league-spartan)' }}
                      >
                        {formatPrice(producto.precio_base)}
                      </span>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {producto.entrega_inmediata && (
                      <Badge className="bg-emerald-500 text-white border-0 text-[10px] gap-1">
                        <Truck size={10} />
                        <span className="hidden sm:inline">Entrega inmediata</span>
                        <span className="sm:hidden">Inmediata</span>
                      </Badge>
                    )}
                    {/* Quick share in list mode */}
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={(e) => handleWhatsAppFromCard(e, producto)}
                        className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                        aria-label="WhatsApp"
                        title="Compartir por WhatsApp"
                      >
                        <MessageCircle size={12} />
                      </button>
                      <button
                        onClick={(e) => handlePDFFromCard(e, producto)}
                        className="w-7 h-7 rounded-full bg-viv-sage text-white flex items-center justify-center hover:bg-viv-sage-dark transition-colors"
                        aria-label="PDF"
                        title="Generar PDF"
                      >
                        <FileText size={12} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
