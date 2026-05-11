'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, Plus, Grid3X3, List, Truck, PackageX, MessageCircle, FileText, RefreshCw, Hammer, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { generateCatalogPDF } from '@/lib/pdf-catalog';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 4;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar datos de Supabase al montar
  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  const filtered = filteredProductos();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroCategoria, filtroSubcategoria, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Subcategories filtered by selected category
  const subcategoriasFiltradas = useMemo(() => {
    if (!filtroCategoria) return [];
    return subcategorias.filter(s => s.categoria_id === filtroCategoria && s.activa);
  }, [filtroCategoria, subcategorias]);

  // Get category name
  const categoriaNombre = useMemo(() => {
    if (!filtroCategoria) return null;
    const cat = categorias.find(c => c.id === filtroCategoria);
    return cat?.nombre || null;
  }, [filtroCategoria, categorias]);

  // ===== WhatsApp: Share link to public catalog =====
  const handleShareWhatsApp = () => {
    const baseUrl = window.location.origin;
    const isCategory = !!filtroCategoria;
    const catalogUrl = isCategory
      ? `${baseUrl}/share?cat=${encodeURIComponent(filtroCategoria)}`
      : `${baseUrl}/share`;

    const catText = categoriaNombre ? ` ${categoriaNombre}` : '';
    const msg = `¡Hola! Te comparto nuestro catálogo${catText} Vivanticos 🧸\n\n👉 ${catalogUrl}\n\n— Vivanticos · Muebles y Decoración Infantil 💛`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ===== PDF: Generate downloadable PDF file =====
  const handleSharePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateCatalogPDF(filtered, categoriaNombre);
      toast.success('PDF descargado exitosamente');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Error generando el PDF. Intenta de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
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
          {/* Share buttons */}
          <Button
            variant="outline"
            size="sm"
            className="border-green-500 text-green-600 hover:bg-green-50"
            onClick={handleShareWhatsApp}
            disabled={filtered.length === 0}
          >
            <MessageCircle size={14} className="mr-1" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-viv-sage text-viv-sage-dark hover:bg-viv-sage/10"
            onClick={handleSharePDF}
            disabled={filtered.length === 0 || isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <FileText size={14} className="mr-1" />
            )}
            <span className="hidden sm:inline">{isGeneratingPDF ? 'Generando...' : 'PDF'}</span>
          </Button>

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
          {paginatedProducts.map(producto => {
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

                  {/* Badges */}
                  {producto.entrega_inmediata ? (
                    <Badge className="absolute bottom-2 left-2 bg-emerald-500 text-white border-0 text-[10px] gap-1 px-2 py-0.5">
                      <Truck size={10} />
                      Entrega inmediata
                    </Badge>
                  ) : (
                    <Badge className="absolute bottom-2 left-2 bg-amber-600 text-white border-0 text-[10px] gap-1 px-2 py-0.5">
                      <Hammer size={10} />
                      Fabricación
                    </Badge>
                  )}
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
          {paginatedProducts.map(producto => {
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

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {producto.entrega_inmediata ? (
                      <Badge className="bg-emerald-500 text-white border-0 text-[10px] gap-1">
                        <Truck size={10} />
                        <span className="hidden sm:inline">Entrega inmediata</span>
                        <span className="sm:hidden">Inmediata</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-600 text-white border-0 text-[10px] gap-1">
                        <Hammer size={10} />
                        <span className="hidden sm:inline">Fabricación</span>
                        <span className="sm:hidden">Fab.</span>
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
