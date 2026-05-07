// ==========================================
// STORE DE DATOS (CATÁLOGO) - VIVANTICOS
// Con integración Supabase + datos demo fallback
// ==========================================

import { create } from 'zustand';
import type { Categoria, Subcategoria, Producto, ProductoOpcion, ProductoOpcionValor, TipoProducto, TipoOpcionInput } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// --- Helper: Check if ID is a valid UUID ---
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// --- Persistencia localStorage ---
const STORAGE_KEY = 'vivanticos-catalogo';

function loadFromStorage(): Partial<CatalogoState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        categorias: parsed.categorias || [],
        subcategorias: parsed.subcategorias || [],
        productos: parsed.productos || [],
        opciones: parsed.opciones || [],
        opcionValores: parsed.opcionValores || [],
      };
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }
  return null;
}

function saveToStorage(state: CatalogoState) {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      categorias: state.categorias,
      subcategorias: state.subcategorias,
      productos: state.productos,
      opciones: state.opciones,
      opcionValores: state.opcionValores,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

interface CatalogoState {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  productos: Producto[];
  opciones: ProductoOpcion[];
  opcionValores: ProductoOpcionValor[];
  searchTerm: string;
  filtroCategoria: string | null;
  filtroSubcategoria: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  setSearchTerm: (term: string) => void;
  setFiltroCategoria: (catId: string | null) => void;
  setFiltroSubcategoria: (subId: string | null) => void;
  addProducto: (p: Producto) => void;
  updateProducto: (p: Producto) => void;
  deleteProducto: (id: string) => void;
  addCategoria: (c: Categoria) => void;
  updateCategoria: (c: Categoria) => void;
  deleteCategoria: (id: string) => void;
  addSubcategoria: (s: Subcategoria) => void;
  updateSubcategoria: (s: Subcategoria) => void;
  deleteSubcategoria: (id: string) => void;
  getOpcionesByProducto: (productoId: string) => ProductoOpcion[];
  getValoresByOpcion: (opcionId: string) => ProductoOpcionValor[];
  filteredProductos: () => Producto[];
  loadFromSupabase: () => Promise<void>;
  saveProductoToSupabase: (p: Producto, opciones?: any[]) => Promise<boolean>;
  deleteProductoFromSupabase: (id: string) => Promise<boolean>;
  saveCategoriaToSupabase: (c: Categoria) => Promise<boolean>;
  deleteCategoriaFromSupabase: (id: string) => Promise<boolean>;
  saveSubcategoriaToSupabase: (s: Subcategoria) => Promise<boolean>;
  deleteSubcategoriaFromSupabase: (id: string) => Promise<boolean>;
  syncLocalToSupabase: () => Promise<void>;
}

export const useCatalogoStore = create<CatalogoState>((set, get) => {
  // Try loading from localStorage first (survives page refreshes)
  const stored = typeof window !== 'undefined' ? loadFromStorage() : null;

  return {
  categorias: stored?.categorias || [],
  subcategorias: stored?.subcategorias || [],
  productos: stored?.productos || [],
  opciones: stored?.opciones || [],
  opcionValores: stored?.opcionValores || [],
  searchTerm: '',
  filtroCategoria: null,
  filtroSubcategoria: null,
  isLoaded: false,
  isLoading: false,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFiltroCategoria: (catId) => set({ filtroCategoria: catId, filtroSubcategoria: null }),
  setFiltroSubcategoria: (subId) => set({ filtroSubcategoria: subId }),

  addProducto: (p) => set((s) => {
    const newState = { productos: [...s.productos, p] };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),
  updateProducto: (p) => set((s) => {
    const newState = { productos: s.productos.map(prod => prod.id === p.id ? p : prod) };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),
  deleteProducto: (id) => set((s) => {
    const newState = { productos: s.productos.filter(p => p.id !== id) };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),

  addCategoria: (c) => set((s) => {
    const newState = { categorias: [...s.categorias, c] };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),
  updateCategoria: (c) => set((s) => {
    const newState = { categorias: s.categorias.map(cat => cat.id === c.id ? c : cat) };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),
  deleteCategoria: (id) => set((s) => {
    const newState = { categorias: s.categorias.filter(c => c.id !== id) };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),

  addSubcategoria: (sub) => set((s) => {
    const newState = { subcategorias: [...s.subcategorias, sub] };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),
  updateSubcategoria: (sub) => set((s) => {
    const newState = { subcategorias: s.subcategorias.map(su => su.id === sub.id ? sub : su) };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),
  deleteSubcategoria: (id) => set((s) => {
    const newState = { subcategorias: s.subcategorias.filter(su => su.id !== id) };
    saveToStorage({ ...s, ...newState } as CatalogoState);
    return newState;
  }),

  getOpcionesByProducto: (productoId) => get().opciones.filter(o => o.producto_id === productoId),
  getValoresByOpcion: (opcionId) => get().opcionValores.filter(v => v.opcion_id === opcionId),

  filteredProductos: () => {
    const { productos, searchTerm, filtroCategoria, filtroSubcategoria } = get();
    return productos.filter(p => {
      const matchSearch = !searchTerm ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = !filtroCategoria || p.categoria_id === filtroCategoria;
      const matchSubcategoria = !filtroSubcategoria || p.subcategoria_id === filtroSubcategoria;
      return matchSearch && matchCategoria && matchSubcategoria && p.activo;
    });
  },

  // --- Cargar datos desde Supabase ---
  loadFromSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase no configurado, usando datos locales');
      set({ isLoaded: true });
      return;
    }

    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      // Cargar todas las tablas en paralelo
      const [catRes, subRes, prodRes, opRes, valRes] = await Promise.all([
        supabase.from('categorias').select('*').order('orden'),
        supabase.from('subcategorias').select('*').order('orden'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('producto_opciones').select('*').order('orden'),
        supabase.from('producto_opcion_valores').select('*'),
      ]);

      if (catRes.error) throw catRes.error;
      if (subRes.error) throw subRes.error;
      if (prodRes.error) throw prodRes.error;
      if (opRes.error) throw opRes.error;
      if (valRes.error) throw valRes.error;

      // Mapear datos de Supabase al formato de la app
      const categorias: Categoria[] = (catRes.data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        icono: c.icono || undefined,
        orden: c.orden || 0,
        activa: c.activa ?? true,
      }));

      const subcategorias: Subcategoria[] = (subRes.data || []).map((s: any) => ({
        id: s.id,
        categoria_id: s.categoria_id,
        nombre: s.nombre,
        orden: s.orden || 0,
        activa: s.activa ?? true,
      }));

      const productos: Producto[] = (prodRes.data || []).map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        subcategoria_id: p.subcategoria_id || undefined,
        descripcion: p.descripcion || '',
        medidas: p.medidas || '',
        material: p.material || '',
        garantia: p.garantia || '',
        precio_base: p.precio_base || 0,
        precio_descuento: p.precio_descuento || 0,
        tipo_producto: (p.tipo_producto || 'otro') as TipoProducto,
        descuento_base: p.descuento_base || 0,
        entrega_inmediata: p.entrega_inmediata ?? false,
        imagenes: p.imagenes || [],
        activo: p.activo ?? true,
        creado_en: p.creado_en || new Date().toISOString(),
        actualizado_en: p.actualizado_en || new Date().toISOString(),
      }));

      const opciones: ProductoOpcion[] = (opRes.data || []).map((o: any) => ({
        id: o.id,
        producto_id: o.producto_id,
        nombre: o.nombre,
        tipo: (o.tipo === 'checkbox' ? 'checkbox' : 'select') as TipoOpcionInput,
        requerida: o.requerida ?? false,
        orden: o.orden || 0,
      }));

      const opcionValores: ProductoOpcionValor[] = (valRes.data || []).map((v: any) => ({
        id: v.id,
        opcion_id: v.opcion_id,
        nombre: v.nombre,
        incremento_precio: v.incremento_precio || v.precio_incremento || 0,
        activo: v.activo ?? true,
      }));

      // Obtener datos locales actuales
      const localState = get();

      // --- Sync: Push local items to Supabase if they don't exist there ---
      const supabaseCatIds = new Set(categorias.map(c => c.id));
      const supabaseSubIds = new Set(subcategorias.map(s => s.id));
      const supabaseProdIds = new Set(productos.map(p => p.id));

      // Find local items that are NOT in Supabase (created locally, not yet synced)
      const localCatsToSync = localState.categorias.filter(c => !supabaseCatIds.has(c.id));
      const localSubsToSync = localState.subcategorias.filter(s => !supabaseSubIds.has(s.id));
      const localProdsToSync = localState.productos.filter(p => !supabaseProdIds.has(p.id));

      // Push local categories to Supabase
      for (const cat of localCatsToSync) {
        try {
          if (isUUID(cat.id)) {
            // Try to insert with the existing UUID
            const { error } = await supabase.from('categorias').insert({
              id: cat.id,
              nombre: cat.nombre,
              icono: cat.icono || null,
              orden: cat.orden,
              activa: cat.activa,
            });
            if (!error) {
              categorias.push(cat);
            } else {
              console.warn('Could not sync local category to Supabase:', cat.nombre, error.message);
              // Keep it locally anyway
              categorias.push(cat);
            }
          } else {
            // Non-UUID ID — insert without ID, let Supabase generate UUID
            const { data, error } = await supabase.from('categorias').insert({
              nombre: cat.nombre,
              icono: cat.icono || null,
              orden: cat.orden,
              activa: cat.activa,
            }).select().single();

            if (!error && data) {
              categorias.push({ ...cat, id: data.id });
            } else {
              console.warn('Could not sync local category to Supabase:', cat.nombre, error?.message);
              categorias.push(cat); // Keep locally
            }
          }
        } catch (e) {
          console.warn('Error syncing category:', cat.nombre, e);
          categorias.push(cat); // Keep locally
        }
      }

      // Push local subcategories to Supabase
      for (const sub of localSubsToSync) {
        try {
          // Find the matching category (might have been remapped to UUID)
          const matchedCat = categorias.find(c =>
            c.id === sub.categoria_id ||
            localCatsToSync.find(lc => lc.id === sub.categoria_id && c.nombre === lc.nombre)
          );

          if (!matchedCat) {
            console.warn('Skipping subcategory sync - no matching category:', sub.nombre);
            subcategorias.push(sub); // Keep locally
            continue;
          }

          if (isUUID(sub.id)) {
            const { error } = await supabase.from('subcategorias').insert({
              id: sub.id,
              categoria_id: matchedCat.id,
              nombre: sub.nombre,
              orden: sub.orden,
              activa: sub.activa,
            });
            if (!error) {
              subcategorias.push({ ...sub, categoria_id: matchedCat.id });
            } else {
              subcategorias.push(sub);
            }
          } else {
            const { data, error } = await supabase.from('subcategorias').insert({
              categoria_id: matchedCat.id,
              nombre: sub.nombre,
              orden: sub.orden,
              activa: sub.activa,
            }).select().single();

            if (!error && data) {
              subcategorias.push({ ...sub, id: data.id, categoria_id: matchedCat.id });
            } else {
              subcategorias.push(sub);
            }
          }
        } catch (e) {
          console.warn('Error syncing subcategory:', sub.nombre, e);
          subcategorias.push(sub);
        }
      }

      // Push local products to Supabase
      for (const prod of localProdsToSync) {
        try {
          const prodData = {
            codigo: prod.codigo,
            nombre: prod.nombre,
            categoria_id: prod.categoria_id,
            subcategoria_id: prod.subcategoria_id || null,
            descripcion: prod.descripcion,
            medidas: prod.medidas,
            material: prod.material,
            garantia: prod.garantia,
            precio_base: prod.precio_base,
            precio_descuento: prod.precio_descuento,
            tipo_producto: prod.tipo_producto,
            descuento_base: prod.descuento_base,
            entrega_inmediata: prod.entrega_inmediata,
            imagenes: prod.imagenes,
            activo: prod.activo,
          };

          const { data, error } = await supabase.from('productos').insert(prodData).select().single();

          if (!error && data) {
            productos.push({ ...prod, id: data.id });
            // Also sync options for this product
            const localOps = localState.opciones.filter(o => o.producto_id === prod.id);
            for (const op of localOps) {
              const { data: newOp, error: opErr } = await supabase.from('producto_opciones').insert({
                producto_id: data.id,
                nombre: op.nombre,
                tipo: op.tipo,
                requerida: op.requerida,
                orden: op.orden,
              }).select().single();

              if (!opErr && newOp) {
                opciones.push({ ...op, id: newOp.id, producto_id: data.id });
                // Sync option values
                const localVals = localState.opcionValores.filter(v => v.opcion_id === op.id);
                for (const val of localVals) {
                  const { data: newVal, error: valErr } = await supabase.from('producto_opcion_valores').insert({
                    opcion_id: newOp.id,
                    nombre: val.nombre,
                    incremento_precio: val.incremento_precio,
                    activo: val.activo,
                  }).select().single();
                  if (!valErr && newVal) {
                    opcionValores.push({ ...val, id: newVal.id, opcion_id: newOp.id });
                  } else {
                    opcionValores.push({ ...val, opcion_id: newOp.id });
                  }
                }
              }
            }
          } else {
            console.warn('Could not sync product to Supabase:', prod.nombre, error?.message);
            productos.push(prod); // Keep locally
          }
        } catch (e) {
          console.warn('Error syncing product:', prod.nombre, e);
          productos.push(prod); // Keep locally
        }
      }

      // NUNCA sobrescribir datos locales con datos vacíos de Supabase
      // Si Supabase tiene datos, usarlos (son la fuente de verdad)
      // Si Supabase está vacío para alguna tabla, mantener los datos locales
      const finalCategorias = categorias.length > 0 ? categorias : localState.categorias;
      const finalSubcategorias = subcategorias.length > 0 ? subcategorias : localState.subcategorias;
      const finalProductos = productos.length > 0 ? productos : localState.productos;
      const finalOpciones = opciones.length > 0 ? opciones : localState.opciones;
      const finalOpcionValores = opcionValores.length > 0 ? opcionValores : localState.opcionValores;

      set({
        categorias: finalCategorias,
        subcategorias: finalSubcategorias,
        productos: finalProductos,
        opciones: finalOpciones,
        opcionValores: finalOpcionValores,
        isLoaded: true,
        isLoading: false,
      });

      // Save to localStorage after loading from Supabase
      const currentState = get();
      saveToStorage(currentState);

      console.log(`Catálogo cargado: ${finalProductos.length} productos, ${finalCategorias.length} categorías, ${finalSubcategorias.length} subcategorías (Supabase: ${productos.length} prod, ${categorias.length} cat)`);
    } catch (error) {
      console.error('Error cargando datos desde Supabase:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // --- Sync all local data to Supabase ---
  syncLocalToSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    const state = get();
    console.log('Sincronizando datos locales a Supabase...');

    try {
      // Load current Supabase data to check what exists
      const { data: existingCats } = await supabase.from('categorias').select('id');
      const { data: existingSubs } = await supabase.from('subcategorias').select('id');
      const { data: existingProds } = await supabase.from('productos').select('id');

      const existingCatIds = new Set((existingCats || []).map(c => c.id));
      const existingSubIds = new Set((existingSubs || []).map(s => s.id));
      const existingProdIds = new Set((existingProds || []).map(p => p.id));

      let synced = 0;

      // Sync categories
      for (const cat of state.categorias) {
        if (!existingCatIds.has(cat.id)) {
          const catData = {
            nombre: cat.nombre,
            icono: cat.icono || null,
            orden: cat.orden,
            activa: cat.activa,
          };
          const { data, error } = await supabase.from('categorias').insert(catData).select().single();
          if (!error && data) {
            // Replace local fake ID with Supabase UUID
            set((s) => ({
              categorias: s.categorias.map(c => c.id === cat.id ? { ...c, id: data.id } : c),
            }));
            synced++;
          } else {
            console.warn('Error syncing category:', cat.nombre, error?.message);
          }
        }
      }

      // Sync subcategories
      const currentState = get();
      for (const sub of currentState.subcategorias) {
        if (!existingSubIds.has(sub.id)) {
          const subData = {
            categoria_id: sub.categoria_id,
            nombre: sub.nombre,
            orden: sub.orden,
            activa: sub.activa,
          };
          const { data, error } = await supabase.from('subcategorias').insert(subData).select().single();
          if (!error && data) {
            set((s) => ({
              subcategorias: s.subcategorias.map(su => su.id === sub.id ? { ...su, id: data.id } : su),
            }));
            synced++;
          } else {
            console.warn('Error syncing subcategory:', sub.nombre, error?.message);
          }
        }
      }

      // Sync products
      const stateAfterSubs = get();
      for (const prod of stateAfterSubs.productos) {
        if (!existingProdIds.has(prod.id)) {
          const prodData = {
            codigo: prod.codigo,
            nombre: prod.nombre,
            categoria_id: prod.categoria_id,
            subcategoria_id: prod.subcategoria_id || null,
            descripcion: prod.descripcion,
            medidas: prod.medidas,
            material: prod.material,
            garantia: prod.garantia,
            precio_base: prod.precio_base,
            precio_descuento: prod.precio_descuento,
            tipo_producto: prod.tipo_producto,
            descuento_base: prod.descuento_base,
            entrega_inmediata: prod.entrega_inmediata,
            imagenes: prod.imagenes,
            activo: prod.activo,
          };
          const { data, error } = await supabase.from('productos').insert(prodData).select().single();
          if (!error && data) {
            // Replace local fake ID with Supabase UUID
            const oldProdId = prod.id;
            const newProdId = data.id;
            set((s) => ({
              productos: s.productos.map(p => p.id === oldProdId ? { ...p, id: newProdId } : p),
              opciones: s.opciones.map(o => o.producto_id === oldProdId ? { ...o, producto_id: newProdId } : o),
            }));
            synced++;

            // Sync product options
            const opsForProd = get().opciones.filter(o => o.producto_id === newProdId);
            for (const op of opsForProd) {
              const opData = {
                producto_id: newProdId,
                nombre: op.nombre,
                tipo: op.tipo,
                requerida: op.requerida,
                orden: op.orden,
              };
              const { data: newOp, error: opErr } = await supabase.from('producto_opciones').insert(opData).select().single();
              if (!opErr && newOp) {
                const oldOpId = op.id;
                const newOpId = newOp.id;
                set((s) => ({
                  opciones: s.opciones.map(o => o.id === oldOpId ? { ...o, id: newOpId } : o),
                  opcionValores: s.opcionValores.map(v => v.opcion_id === oldOpId ? { ...v, opcion_id: newOpId } : v),
                }));

                // Sync option values
                const valsForOp = get().opcionValores.filter(v => v.opcion_id === newOpId);
                for (const val of valsForOp) {
                  const valData = {
                    opcion_id: newOpId,
                    nombre: val.nombre,
                    incremento_precio: val.incremento_precio,
                    activo: val.activo,
                  };
                  const { data: newVal, error: valErr } = await supabase.from('producto_opcion_valores').insert(valData).select().single();
                  if (!valErr && newVal) {
                    set((s) => ({
                      opcionValores: s.opcionValores.map(v => v.id === val.id ? { ...v, id: newVal.id } : v),
                    }));
                  }
                }
              }
            }
          } else {
            console.warn('Error syncing product:', prod.nombre, error?.message);
          }
        }
      }

      // Save updated state to localStorage
      saveToStorage(get());
      console.log(`Sincronización completada: ${synced} items sincronizados`);
    } catch (error) {
      console.error('Error en syncLocalToSupabase:', error);
    }
  },

  // --- Guardar producto en Supabase ---
  saveProductoToSupabase: async (p: Producto, opciones?: any[]) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().productos.find(prod => prod.id === p.id);
      if (exists) {
        get().updateProducto(p);
      } else {
        get().addProducto(p);
      }
      return true;
    }

    try {
      const productoData = {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        subcategoria_id: p.subcategoria_id || null,
        descripcion: p.descripcion,
        medidas: p.medidas,
        material: p.material,
        garantia: p.garantia,
        precio_base: p.precio_base,
        precio_descuento: p.precio_descuento,
        tipo_producto: p.tipo_producto,
        descuento_base: p.descuento_base,
        entrega_inmediata: p.entrega_inmediata,
        imagenes: p.imagenes,
        activo: p.activo,
      };

      // Check if this product exists in Supabase (not just locally)
      if (isUUID(p.id)) {
        const { data: checkData } = await supabase.from('productos').select('id').eq('id', p.id).maybeSingle();

        if (checkData) {
          // UPDATE existing product in Supabase
          const { error } = await supabase
            .from('productos')
            .update(productoData)
            .eq('id', p.id);
          if (error) throw error;
          get().updateProducto(p);
        } else {
          // UUID exists locally but not in Supabase — insert without ID
          const { data, error } = await supabase
            .from('productos')
            .insert(productoData)
            .select()
            .single();
          if (error) throw error;
          // Replace local entry with Supabase UUID
          const oldId = p.id;
          const newId = data.id;
          set((s) => ({
            productos: s.productos.map(prod => prod.id === oldId ? { ...p, id: newId } : prod),
            opciones: s.opciones.map(o => o.producto_id === oldId ? { ...o, producto_id: newId } : o),
          }));
          saveToStorage(get());
        }
      } else {
        // Non-UUID ID — this is a new product, insert without ID
        const { data, error } = await supabase
          .from('productos')
          .insert(productoData)
          .select()
          .single();
        if (error) throw error;
        // Replace local entry with Supabase UUID
        const oldId = p.id;
        const newId = data.id;
        set((s) => {
          const exists = s.productos.find(prod => prod.id === oldId);
          if (exists) {
            return {
              productos: s.productos.map(prod => prod.id === oldId ? { ...p, id: newId } : prod),
              opciones: s.opciones.map(o => o.producto_id === oldId ? { ...o, producto_id: newId } : o),
            };
          } else {
            return {
              productos: [...s.productos, { ...p, id: newId }],
            };
          }
        });
        saveToStorage(get());
      }

      // Save opciones if provided
      const productoId = get().productos.find(prod =>
        prod.codigo === p.codigo && prod.nombre === p.nombre
      )?.id || p.id;

      if (opciones && opciones.length > 0) {
        // Delete old opciones and their valores
        const { data: oldOps } = await supabase
          .from('producto_opciones')
          .select('id')
          .eq('producto_id', productoId);

        if (oldOps && oldOps.length > 0) {
          const oldOpIds = oldOps.map((o: any) => o.id);
          await supabase.from('producto_opcion_valores').delete().in('opcion_id', oldOpIds);
          await supabase.from('producto_opciones').delete().eq('producto_id', productoId);
        }

        // Remove local opciones for this product
        set((s) => ({
          opciones: s.opciones.filter(o => o.producto_id !== productoId),
          opcionValores: s.opcionValores.filter(v =>
            !s.opciones.filter(o => o.producto_id === productoId).some(o => o.id === v.opcion_id)
          ),
        }));

        // Insert new opciones
        for (const op of opciones) {
          const { data: newOp, error: opErr } = await supabase
            .from('producto_opciones')
            .insert({
              producto_id: productoId,
              nombre: op.nombre,
              tipo: op.tipo,
              requerida: op.requerida,
              orden: op.orden,
            })
            .select()
            .single();
          if (opErr) {
            console.error('Error saving opcion:', opErr);
            continue;
          }

          // Add opcion to local state
          set((s) => ({
            opciones: [...s.opciones, {
              id: newOp.id,
              producto_id: productoId,
              nombre: newOp.nombre,
              tipo: (newOp.tipo === 'checkbox' ? 'checkbox' : 'select') as TipoOpcionInput,
              requerida: newOp.requerida ?? false,
              orden: newOp.orden || 0,
            }],
          }));

          // Insert valores for this opcion
          if (op.valores && op.valores.length > 0) {
            const incPrecio = v_incremento => v_incremento?.incremento_precio || v_incremento?.precio_incremento || 0;
            const valoresData = op.valores.map((v: any) => ({
              opcion_id: newOp.id,
              nombre: v.nombre,
              incremento_precio: incPrecio(v),
              activo: v.activo ?? true,
            }));
            const { data: insertedVals, error: valErr } = await supabase
              .from('producto_opcion_valores')
              .insert(valoresData)
              .select();
            if (valErr) {
              console.error('Error saving opcion valores:', valErr);
            } else if (insertedVals) {
              const newVals = insertedVals.map((iv: any) => ({
                id: iv.id,
                opcion_id: newOp.id,
                nombre: iv.nombre,
                incremento_precio: iv.incremento_precio || iv.precio_incremento || 0,
                activo: iv.activo ?? true,
              }));
              set((s) => ({
                opcionValores: [...s.opcionValores, ...newVals],
              }));
            }
          }
        }

        // Save updated state to localStorage
        saveToStorage(get());
      }

      return true;
    } catch (error) {
      console.error('Error guardando producto en Supabase:', error);
      const exists = get().productos.find(prod => prod.id === p.id);
      if (exists) {
        get().updateProducto(p);
      } else {
        get().addProducto(p);
      }
      return false;
    }
  },

  // --- Eliminar producto de Supabase ---
  deleteProductoFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteProducto(id);
      return true;
    }

    try {
      // Delete option values first, then options, then product
      const { data: ops } = await supabase.from('producto_opciones').select('id').eq('producto_id', id);
      if (ops && ops.length > 0) {
        const opIds = ops.map((o: any) => o.id);
        await supabase.from('producto_opcion_valores').delete().in('opcion_id', opIds);
      }
      await supabase.from('producto_opciones').delete().eq('producto_id', id);
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      get().deleteProducto(id);
      return true;
    } catch (error) {
      console.error('Error eliminando producto de Supabase:', error);
      get().deleteProducto(id);
      return false;
    }
  },

  // --- Guardar categoría en Supabase ---
  saveCategoriaToSupabase: async (c: Categoria) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().categorias.find(cat => cat.id === c.id);
      if (exists) {
        get().updateCategoria(c);
      } else {
        get().addCategoria(c);
      }
      return true;
    }

    try {
      const categoriaData = {
        nombre: c.nombre,
        icono: c.icono || null,
        orden: c.orden,
        activa: c.activa,
      };

      if (isUUID(c.id)) {
        // ID is UUID — might exist in Supabase
        const { data: existingInDb } = await supabase
          .from('categorias')
          .select('id')
          .eq('id', c.id)
          .maybeSingle();

        if (existingInDb) {
          // UPDATE existing category in Supabase
          const { error } = await supabase
            .from('categorias')
            .update(categoriaData)
            .eq('id', c.id);
          if (error) throw error;
          get().updateCategoria(c);
        } else {
          // UUID exists locally but not in Supabase — insert with the same UUID
          const { error } = await supabase
            .from('categorias')
            .insert({ id: c.id, ...categoriaData });
          if (error) {
            // If insert with UUID fails, try without
            const { data, error: insertErr } = await supabase
              .from('categorias')
              .insert(categoriaData)
              .select()
              .single();
            if (insertErr) throw insertErr;
            // Replace local UUID with the new one from Supabase
            set((s) => ({
              categorias: s.categorias.map(cat => cat.id === c.id ? { ...c, id: data.id } : cat),
            }));
            saveToStorage(get());
          } else {
            get().updateCategoria(c);
          }
        }
      } else {
        // Non-UUID ID — this is a NEW category created locally
        // Insert without ID, let Supabase generate a UUID
        const { data, error } = await supabase
          .from('categorias')
          .insert(categoriaData)
          .select()
          .single();
        if (error) throw error;

        // Replace the local fake-ID entry with the Supabase UUID
        const realId = data.id;
        set((s) => {
          const exists = s.categorias.find(cat => cat.id === c.id);
          if (exists) {
            return { categorias: s.categorias.map(cat => cat.id === c.id ? { ...c, id: realId } : cat) };
          } else {
            return { categorias: [...s.categorias, { ...c, id: realId }] };
          }
        });
        saveToStorage(get());
      }

      return true;
    } catch (error) {
      console.error('Error guardando categoría en Supabase:', error);
      const exists = get().categorias.find(cat => cat.id === c.id);
      if (!exists) {
        get().addCategoria(c);
      }
      return false;
    }
  },

  // --- Eliminar categoría de Supabase ---
  deleteCategoriaFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteCategoria(id);
      return true;
    }

    try {
      // Delete subcategories in Supabase first
      await supabase.from('subcategorias').delete().eq('categoria_id', id);
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);
      if (error) throw error;
      get().deleteCategoria(id);
      return true;
    } catch (error) {
      console.error('Error eliminando categoría de Supabase:', error);
      get().deleteCategoria(id);
      return false;
    }
  },

  // --- Guardar subcategoría en Supabase ---
  saveSubcategoriaToSupabase: async (s: Subcategoria) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().subcategorias.find(sub => sub.id === s.id);
      if (exists) {
        get().updateSubcategoria(s);
      } else {
        get().addSubcategoria(s);
      }
      return true;
    }

    try {
      // Resolve categoria_id: if it's a non-UUID, find the matching UUID from the store
      let resolvedCatId = s.categoria_id;
      if (!isUUID(resolvedCatId)) {
        const matchingCat = get().categorias.find(c => c.id === resolvedCatId);
        if (matchingCat && isUUID(matchingCat.id)) {
          resolvedCatId = matchingCat.id;
        }
      }

      const subcategoriaData = {
        nombre: s.nombre,
        categoria_id: resolvedCatId,
        orden: s.orden,
        activa: s.activa,
      };

      if (isUUID(s.id)) {
        // ID is UUID — might exist in Supabase
        const { data: existingInDb } = await supabase
          .from('subcategorias')
          .select('id')
          .eq('id', s.id)
          .maybeSingle();

        if (existingInDb) {
          // UPDATE existing subcategory in Supabase
          const { error } = await supabase
            .from('subcategorias')
            .update(subcategoriaData)
            .eq('id', s.id);
          if (error) throw error;
          get().updateSubcategoria({ ...s, categoria_id: resolvedCatId });
        } else {
          // UUID exists locally but not in Supabase — insert with same UUID
          const { error } = await supabase
            .from('subcategorias')
            .insert({ id: s.id, ...subcategoriaData });
          if (error) {
            const { data, error: insertErr } = await supabase
              .from('subcategorias')
              .insert(subcategoriaData)
              .select()
              .single();
            if (insertErr) throw insertErr;
            set((state) => ({
              subcategorias: state.subcategorias.map(sub => sub.id === s.id ? { ...s, id: data.id, categoria_id: resolvedCatId } : sub),
            }));
            saveToStorage(get());
          } else {
            get().updateSubcategoria({ ...s, categoria_id: resolvedCatId });
          }
        }
      } else {
        // Non-UUID ID — this is a NEW subcategory created locally
        const { data, error } = await supabase
          .from('subcategorias')
          .insert(subcategoriaData)
          .select()
          .single();
        if (error) throw error;

        // Replace the local fake-ID entry with the Supabase UUID
        const realId = data.id;
        set((state) => {
          const exists = state.subcategorias.find(sub => sub.id === s.id);
          if (exists) {
            return { subcategorias: state.subcategorias.map(sub => sub.id === s.id ? { ...s, id: realId, categoria_id: resolvedCatId } : sub) };
          } else {
            return { subcategorias: [...state.subcategorias, { ...s, id: realId, categoria_id: resolvedCatId }] };
          }
        });
        saveToStorage(get());
      }

      return true;
    } catch (error) {
      console.error('Error guardando subcategoría en Supabase:', error);
      const exists = get().subcategorias.find(sub => sub.id === s.id);
      if (!exists) {
        get().addSubcategoria(s);
      }
      return false;
    }
  },

  // --- Eliminar subcategoría de Supabase ---
  deleteSubcategoriaFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteSubcategoria(id);
      return true;
    }

    try {
      const { error } = await supabase
        .from('subcategorias')
        .delete()
        .eq('id', id);
      if (error) throw error;
      get().deleteSubcategoria(id);
      return true;
    } catch (error) {
      console.error('Error eliminando subcategoría de Supabase:', error);
      get().deleteSubcategoria(id);
      return false;
    }
  },
  };
});
