'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, Plus, Filter, Grid3X3, List } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function CatalogoView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const setSelectedProductoId = useAppStore(s => s.setSelectedProductoId);
  const canManage = useAppStore(s => s.currentUser?.rol !== 'vendedor');

  const categorias = useCatalogoStore(s => s.categorias);
  const filtroCategoria = useCatalogoStore(s => s.filtroCategoria);
  const setFiltroCategoria = useCatalogoStore(s => s.setFiltroCategoria);
  const searchTerm = useCatalogoStore(s => s.searchTerm);
  const setSearchTerm = useCatalogoStore(s => s.setSearchTerm);
  const filteredProductos = useCatalogoStore(s => s.filteredProductos);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const productos = filteredProductos();

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img
              src="/logo-vivanticos.jpeg"
              alt="Vivanticos"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Catálogo
            </h2>
            <p className="text-sm text-muted-foreground">{productos.length} productos</p>
          </div>
        </div>
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

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-viv-sage/15 text-viv-sage-dark' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-viv-sage/15 text-viv-sage-dark' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Category filters */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={filtroCategoria === null ? 'default' : 'outline'}
            size="sm"
            className={filtroCategoria === null ? 'bg-viv-sage hover:bg-viv-sage-dark text-white' : ''}
            onClick={() => setFiltroCategoria(null)}
          >
            Todos
          </Button>
          {categorias.filter(c => c.activa).map(cat => (
            <Button
              key={cat.id}
              variant={filtroCategoria === cat.id ? 'default' : 'outline'}
              size="sm"
              className={filtroCategoria === cat.id ? 'bg-viv-sage hover:bg-viv-sage-dark text-white' : ''}
              onClick={() => setFiltroCategoria(cat.id)}
            >
              {cat.icono && <span className="mr-1">{cat.icono}</span>}
              {cat.nombre}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Product Grid */}
      {productos.length === 0 ? (
        <div className="text-center py-12">
          <Package2Icon />
          <p className="text-muted-foreground mt-2">No se encontraron productos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {productos.map(producto => (
            <Card
              key={producto.id}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
              onClick={() => { setSelectedProductoId(producto.id); navigateTo('producto-detalle'); }}
            >
              <div className="aspect-square bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center relative">
                {producto.imagenes.length > 0 ? (
                  <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">🧸</span>
                )}
                {producto.descuento_tipo && producto.descuento_tipo !== 'ninguno' && (
                  <Badge className="absolute top-2 right-2 bg-viv-rose text-white border-0 text-[10px]">
                    -{formatPrice(producto.descuento_valor || 0)}
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{producto.codigo}</p>
                <h3 className="text-sm font-semibold mt-0.5 truncate">{producto.nombre}</h3>
                <p className="text-base font-bold text-viv-sage-dark mt-1" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                  {formatPrice(producto.precio_base)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {productos.map(producto => (
            <Card
              key={producto.id}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => { setSelectedProductoId(producto.id); navigateTo('producto-detalle'); }}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-viv-sage/10 to-viv-peach/10 flex items-center justify-center flex-shrink-0">
                  {producto.imagenes.length > 0 ? (
                    <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-xl">🧸</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{producto.codigo}</p>
                  <h3 className="text-sm font-semibold truncate">{producto.nombre}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-viv-sage-dark">{formatPrice(producto.precio_base)}</p>
                  {producto.descuento_tipo && producto.descuento_tipo !== 'ninguno' && (
                    <Badge className="bg-viv-rose text-white border-0 text-[10px]">
                      Descuento
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Package2Icon() {
  return (
    <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-sage/10 flex items-center justify-center">
      <span className="text-3xl opacity-40">📦</span>
    </div>
  );
}
