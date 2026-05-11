'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Truck, Hammer, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

// Direct Supabase client (no auth needed for public read)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vtwaekybydhkjiureafm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d2Fla3lieWRoa2ppdXJlYWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDM2MTMsImV4cCI6MjA5MzU3OTYxM30.sqY-eG7VfJmuT_Z6vrGKkQlQlzRWwljF_E0BI9m-ruY';
const sb = createClient(supabaseUrl, supabaseAnonKey);

interface PublicProduct {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  garantia: string;
  precio_base: number;
  categoria_id: string;
  subcategoria_id?: string;
  entrega_inmediata: boolean;
  imagenes: string[];
  activo: boolean;
}

interface PublicCategory {
  id: string;
  nombre: string;
  icono?: string;
  orden: number;
  activa: boolean;
}

const ITEMS_PER_PAGE = 4;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ShareCatalogoPage() {
  const [productos, setProductos] = useState<PublicProduct[]>([]);
  const [categorias, setCategorias] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          sb.from('categorias').select('*').eq('activa', true).order('orden'),
          sb.from('productos').select('*').eq('activo', true).order('nombre'),
        ]);

        if (catRes.data) setCategorias(catRes.data as PublicCategory[]);
        if (prodRes.data) setProductos(prodRes.data as PublicProduct[]);
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Read category from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('cat');
    if (catParam) setSelectedCatId(catParam);
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedProductId(null);
  }, [selectedCatId]);

  // Filtered products
  const filtered = useMemo(() => {
    if (!selectedCatId) return productos;
    return productos.filter(p => p.categoria_id === selectedCatId);
  }, [productos, selectedCatId]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const categoriaNombre = useMemo(() => {
    if (!selectedCatId) return null;
    return categorias.find(c => c.id === selectedCatId)?.nombre || null;
  }, [selectedCatId, categorias]);

  // Selected product detail
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return productos.find(p => p.id === selectedProductId) || null;
  }, [selectedProductId, productos]);

  // WhatsApp contact
  const handleWhatsApp = () => {
    const msg = encodeURIComponent('¡Hola! Vi el catálogo de Vivanticos y me interesa conocer más información 🧸');
    window.open(`https://wa.me/573016143040?text=${msg}`, '_blank');
  };

  // Image carousel
  const goNextImage = () => {
    if (!selectedProduct) return;
    setSelectedImageIdx(i => (i + 1) % selectedProduct.imagenes.length);
  };
  const goPrevImage = () => {
    if (!selectedProduct) return;
    setSelectedImageIdx(i => (i - 1 + selectedProduct.imagenes.length) % selectedProduct.imagenes.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf8f5] to-[#f5f0eb]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src="/logo-vivanticos.jpeg" alt="Vivanticos" className="w-12 h-12 object-contain rounded-xl" />
          </div>
          <p className="text-sm text-gray-500">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  // ===== PRODUCT DETAIL VIEW =====
  if (selectedProduct) {
    const imagenes = selectedProduct.imagenes.slice(0, 4);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5f0eb]">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Back button */}
          <button
            onClick={() => { setSelectedProductId(null); setSelectedImageIdx(0); }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={18} />
            Volver al catálogo
          </button>

          {/* Image carousel */}
          <div className="aspect-square bg-white rounded-2xl shadow-sm overflow-hidden relative mb-4">
            {imagenes.length > 0 ? (
              <>
                <img
                  src={imagenes[selectedImageIdx]}
                  alt={selectedProduct.nombre}
                  className="w-full h-full object-cover"
                />
                {imagenes.length > 1 && (
                  <>
                    <button
                      onClick={goPrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={goNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imagenes.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImageIdx(i)}
                          className={`w-2 h-2 rounded-full ${i === selectedImageIdx ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl opacity-20">🧸</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {imagenes.length > 1 && (
            <div className="flex gap-2 mb-4">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIdx(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    i === selectedImageIdx ? 'border-[#7c8c6e] ring-2 ring-[#7c8c6e]/30' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Product info */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{selectedProduct.codigo}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              {selectedProduct.nombre}
            </h1>
            <div className="flex items-center justify-between mt-3">
              <p className="text-2xl font-bold text-[#7c8c6e]" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                {formatPrice(selectedProduct.precio_base)}
              </p>
              {selectedProduct.entrega_inmediata ? (
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

          {/* Description */}
          {selectedProduct.descripcion && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedProduct.descripcion}</p>
            </div>
          )}

          {/* Garantía */}
          {selectedProduct.garantia && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">🛡️ Garantía</h3>
              <p className="text-sm text-gray-600">{selectedProduct.garantia}</p>
            </div>
          )}

          {/* WhatsApp CTA */}
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-base"
            onClick={handleWhatsApp}
          >
            <MessageCircle size={20} className="mr-2" />
            Me interesa — Escríbenos
          </Button>
        </div>
      </div>
    );
  }

  // ===== CATALOG GRID VIEW =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f5f0eb]">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-md flex items-center justify-center flex-shrink-0">
            <img src="/logo-vivanticos.jpeg" alt="Vivanticos" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-league-spartan)' }}>
              {categoriaNombre ? `Catálogo ${categoriaNombre}` : 'Catálogo Vivanticos'}
            </h1>
            <p className="text-xs text-gray-500">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''} · Muebles y Decoración Infantil
            </p>
          </div>
        </div>

        {/* Category pills */}
        <ScrollArea className="w-full whitespace-nowrap mb-4">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setSelectedCatId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedCatId ? 'bg-[#7c8c6e] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCatId === cat.id ? 'bg-[#7c8c6e] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.icono && <span className="mr-1">{cat.icono}</span>}
                {cat.nombre}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl opacity-30">🧸</span>
            <p className="text-sm text-gray-400 mt-4">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {paginated.map(producto => (
              <button
                key={producto.id}
                onClick={() => { setSelectedProductId(producto.id); setSelectedImageIdx(0); }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-[#e8ece4] to-[#f0ebe6] relative overflow-hidden">
                  {producto.imagenes.length > 0 ? (
                    <img
                      src={producto.imagenes[0]}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-30">🧸</span>
                    </div>
                  )}
                  {producto.entrega_inmediata ? (
                    <Badge className="absolute bottom-1.5 left-1.5 bg-emerald-500 text-white border-0 text-[9px] gap-0.5 px-1.5 py-0">
                      <Truck size={8} />
                      Inmediata
                    </Badge>
                  ) : (
                    <Badge className="absolute bottom-1.5 left-1.5 bg-amber-600 text-white border-0 text-[9px] gap-0.5 px-1.5 py-0">
                      <Hammer size={8} />
                      Fabricación
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">{producto.codigo}</p>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{producto.nombre}</h3>
                  <p className="text-sm font-bold text-[#7c8c6e] mt-1" style={{ fontFamily: 'var(--font-league-spartan)' }}>
                    {formatPrice(producto.precio_base)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* WhatsApp CTA at bottom */}
        <div className="mt-6 pb-4">
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-base"
            onClick={handleWhatsApp}
          >
            <MessageCircle size={20} className="mr-2" />
            ¿Te interesa un producto? Escríbenos
          </Button>
        </div>
      </div>
    </div>
  );
}
