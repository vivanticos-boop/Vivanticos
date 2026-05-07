'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCatalogoStore } from '@/stores/data-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldOff,
  FolderTree,
  Tag,
  GripVertical,
} from 'lucide-react';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';
import type { Categoria, Subcategoria } from '@/types';

// ─── Form state types ───
interface CategoriaFormData {
  nombre: string;
  icono: string;
  orden: number;
}

interface SubcategoriaFormData {
  nombre: string;
  orden: number;
  activa: boolean;
}

const EMPTY_CAT_FORM: CategoriaFormData = { nombre: '', icono: '', orden: 0 };
const EMPTY_SUB_FORM: SubcategoriaFormData = { nombre: '', orden: 0, activa: true };

export function CategoriasView() {
  // ─── Stores ───
  const currentUser = useAppStore(s => s.currentUser);
  const navigateTo = useAppStore(s => s.navigateTo);

  const categorias = useCatalogoStore(s => s.categorias);
  const subcategorias = useCatalogoStore(s => s.subcategorias);
  const addCategoria = useCatalogoStore(s => s.addCategoria);
  const updateCategoria = useCatalogoStore(s => s.updateCategoria);
  const deleteCategoria = useCatalogoStore(s => s.deleteCategoria);
  const addSubcategoria = useCatalogoStore(s => s.addSubcategoria);
  const updateSubcategoria = useCatalogoStore(s => s.updateSubcategoria);
  const deleteSubcategoria = useCatalogoStore(s => s.deleteSubcategoria);
  const saveCategoriaToSupabase = useCatalogoStore(s => s.saveCategoriaToSupabase);
  const deleteCategoriaFromSupabase = useCatalogoStore(s => s.deleteCategoriaFromSupabase);
  const saveSubcategoriaToSupabase = useCatalogoStore(s => s.saveSubcategoriaToSupabase);
  const deleteSubcategoriaFromSupabase = useCatalogoStore(s => s.deleteSubcategoriaFromSupabase);

  // ─── Local state ───
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [deleteCatDialogOpen, setDeleteCatDialogOpen] = useState(false);
  const [deleteSubDialogOpen, setDeleteSubDialogOpen] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<CategoriaFormData>(EMPTY_CAT_FORM);

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [parentCatId, setParentCatId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState<SubcategoriaFormData>(EMPTY_SUB_FORM);

  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // ─── Access control ───
  const canManage = currentUser?.rol === 'admin' || currentUser?.rol === 'jefe';

  // ─── Sorted categories ───
  const sortedCategorias = useMemo(
    () => [...categorias].sort((a, b) => a.orden - b.orden),
    [categorias]
  );

  // ─── Subcategories by category ───
  const getSubsForCat = (catId: string) =>
    subcategorias
      .filter(s => s.categoria_id === catId)
      .sort((a, b) => a.orden - b.orden);

  // ─── Toggle expand ───
  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // ─── Category CRUD ───
  const openNewCatDialog = () => {
    setEditingCatId(null);
    setCatForm({ ...EMPTY_CAT_FORM, orden: categorias.length + 1 });
    setCatDialogOpen(true);
  };

  const openEditCatDialog = (cat: Categoria) => {
    setEditingCatId(cat.id);
    setCatForm({
      nombre: cat.nombre,
      icono: cat.icono || '',
      orden: cat.orden,
    });
    setCatDialogOpen(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }
    setSaving(true);
    try {
      if (editingCatId) {
        // Update existing
        const existing = categorias.find(c => c.id === editingCatId);
        if (!existing) return;
        const updated: Categoria = {
          ...existing,
          nombre: catForm.nombre.trim(),
          icono: catForm.icono.trim() || undefined,
          orden: catForm.orden,
        };
        updateCategoria(updated);
        await saveCategoriaToSupabase(updated);
        toast.success('Categoría actualizada');
      } else {
        // Create new
        const newCat: Categoria = {
          id: generateId(),
          nombre: catForm.nombre.trim(),
          icono: catForm.icono.trim() || undefined,
          orden: catForm.orden,
          activa: true,
        };
        addCategoria(newCat);
        await saveCategoriaToSupabase(newCat);
        toast.success('Categoría creada');
      }
      setCatDialogOpen(false);
    } catch {
      toast.error('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCatActiva = async (cat: Categoria) => {
    const updated: Categoria = { ...cat, activa: !cat.activa };
    updateCategoria(updated);
    await saveCategoriaToSupabase(updated);
    toast.success(updated.activa ? 'Categoría activada' : 'Categoría desactivada');
  };

  const openDeleteCatDialog = (catId: string) => {
    setCatToDelete(catId);
    setDeleteCatDialogOpen(true);
  };

  const handleConfirmDeleteCat = async () => {
    if (!catToDelete) return;
    // Delete all subcategories first
    const subs = getSubsForCat(catToDelete);
    for (const sub of subs) {
      deleteSubcategoria(sub.id);
      await deleteSubcategoriaFromSupabase(sub.id);
    }
    deleteCategoria(catToDelete);
    await deleteCategoriaFromSupabase(catToDelete);
    toast.success('Categoría eliminada');
    setCatToDelete(null);
    setDeleteCatDialogOpen(false);
  };

  // ─── Subcategory CRUD ───
  const openNewSubDialog = (catId: string) => {
    setParentCatId(catId);
    setEditingSubId(null);
    const currentSubs = getSubsForCat(catId);
    setSubForm({ ...EMPTY_SUB_FORM, orden: currentSubs.length + 1 });
    setSubDialogOpen(true);
  };

  const openEditSubDialog = (sub: Subcategoria) => {
    setParentCatId(sub.categoria_id);
    setEditingSubId(sub.id);
    setSubForm({
      nombre: sub.nombre,
      orden: sub.orden,
      activa: sub.activa,
    });
    setSubDialogOpen(true);
  };

  const handleSaveSub = async () => {
    if (!subForm.nombre.trim()) {
      toast.error('El nombre de la subcategoría es obligatorio');
      return;
    }
    if (!parentCatId) return;
    setSaving(true);
    try {
      if (editingSubId) {
        // Update existing
        const existing = subcategorias.find(s => s.id === editingSubId);
        if (!existing) return;
        const updated: Subcategoria = {
          ...existing,
          nombre: subForm.nombre.trim(),
          orden: subForm.orden,
          activa: subForm.activa,
        };
        updateSubcategoria(updated);
        await saveSubcategoriaToSupabase(updated);
        toast.success('Subcategoría actualizada');
      } else {
        // Create new
        const newSub: Subcategoria = {
          id: generateId(),
          nombre: subForm.nombre.trim(),
          categoria_id: parentCatId,
          orden: subForm.orden,
          activa: subForm.activa,
        };
        addSubcategoria(newSub);
        await saveSubcategoriaToSupabase(newSub);
        toast.success('Subcategoría creada');
      }
      setSubDialogOpen(false);
    } catch {
      toast.error('Error al guardar la subcategoría');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubActiva = async (sub: Subcategoria) => {
    const updated: Subcategoria = { ...sub, activa: !sub.activa };
    updateSubcategoria(updated);
    await saveSubcategoriaToSupabase(updated);
    toast.success(updated.activa ? 'Subcategoría activada' : 'Subcategoría desactivada');
  };

  const openDeleteSubDialog = (subId: string) => {
    setSubToDelete(subId);
    setDeleteSubDialogOpen(true);
  };

  const handleConfirmDeleteSub = async () => {
    if (!subToDelete) return;
    deleteSubcategoria(subToDelete);
    await deleteSubcategoriaFromSupabase(subToDelete);
    toast.success('Subcategoría eliminada');
    setSubToDelete(null);
    setDeleteSubDialogOpen(false);
  };

  // ─── Access denied ───
  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-rose/20 flex items-center justify-center mb-4">
          <ShieldOff size={28} className="text-viv-rose-dark" />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: 'var(--font-league-spartan)' }}
        >
          Acceso restringido
        </h3>
        <p className="text-muted-foreground text-sm">
          Solo administradores y jefes pueden gestionar categorías.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigateTo('dashboard')}
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  // ─── Render ───
  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Categorías y Subcategorías
          </h2>
          <p className="text-sm text-muted-foreground">
            {categorias.length} categorías · {subcategorias.length} subcategorías
          </p>
        </div>
        <Button
          className="bg-viv-sage hover:bg-viv-sage-dark text-white"
          onClick={openNewCatDialog}
        >
          <Plus size={16} className="mr-2" />
          <span className="hidden sm:inline">Nueva Categoría</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      {/* ─── Category List ─── */}
      {sortedCategorias.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-sage/10 flex items-center justify-center mb-4">
            <FolderTree size={28} className="text-viv-sage/50" />
          </div>
          <h3
            className="text-lg font-semibold text-muted-foreground mb-1"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Sin categorías
          </h3>
          <p className="text-sm text-muted-foreground">
            Crea tu primera categoría para organizar el catálogo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategorias.map(cat => {
            const catSubs = getSubsForCat(cat.id);
            const isExpanded = expandedCats.has(cat.id);

            return (
              <Card
                key={cat.id}
                className={`border-0 shadow-sm hover:shadow-md transition-all ${
                  !cat.activa ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  {/* Category header row */}
                  <div className="flex items-center gap-3">
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
                      aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </button>

                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-viv-sage/15 flex items-center justify-center flex-shrink-0 text-lg">
                      {cat.icono || '📁'}
                    </div>

                    {/* Name + badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="font-semibold text-sm truncate"
                          style={{ fontFamily: 'var(--font-league-spartan)' }}
                        >
                          {cat.nombre}
                        </h3>
                        <Badge
                          className={`text-[10px] border-0 px-2 py-0 ${
                            cat.activa
                              ? 'bg-viv-sage/20 text-viv-sage-dark'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <GripVertical size={10} className="mr-0.5" />
                          #{cat.orden}
                        </Badge>
                        <Badge
                          className={`text-[10px] border-0 px-2 py-0 ${
                            catSubs.length > 0
                              ? 'bg-viv-peach/30 text-viv-peach-dark'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Tag size={10} className="mr-0.5" />
                          {catSubs.length} sub{catSubs.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {cat.activa ? 'Activa' : 'Inactiva'}
                      </span>
                      <Switch
                        checked={cat.activa}
                        onCheckedChange={() => handleToggleCatActiva(cat)}
                        className={cat.activa ? 'data-[state=checked]:bg-viv-sage' : ''}
                        aria-label="Activar/desactivar categoría"
                      />
                    </div>

                    {/* Edit / Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-viv-sage-dark"
                        onClick={() => openEditCatDialog(cat)}
                        aria-label="Editar categoría"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => openDeleteCatDialog(cat.id)}
                        aria-label="Eliminar categoría"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* ─── Expanded subcategories ─── */}
                  {isExpanded && (
                    <div className="mt-3 ml-9">
                      <Separator className="mb-3" />

                      {catSubs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No hay subcategorías en esta categoría
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {catSubs.map(sub => (
                            <div
                              key={sub.id}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                                !sub.activa
                                  ? 'bg-muted/40 opacity-60'
                                  : 'bg-muted/30 hover:bg-muted/50'
                              }`}
                            >
                              {/* Order badge */}
                              <Badge
                                className={`text-[10px] border-0 px-1.5 py-0 ${
                                  sub.activa
                                    ? 'bg-viv-bluegrey/20 text-viv-bluegrey'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {sub.orden}
                              </Badge>

                              {/* Name */}
                              <span
                                className={`flex-1 text-sm truncate ${
                                  !sub.activa ? 'text-muted-foreground line-through' : ''
                                }`}
                              >
                                {sub.nombre}
                              </span>

                              {/* Active toggle */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                  {sub.activa ? 'Activa' : 'Inactiva'}
                                </span>
                                <Switch
                                  checked={sub.activa}
                                  onCheckedChange={() => handleToggleSubActiva(sub)}
                                  className={
                                    sub.activa
                                      ? 'data-[state=checked]:bg-viv-sage'
                                      : ''
                                  }
                                  aria-label="Activar/desactivar subcategoría"
                                />
                              </div>

                              {/* Edit / Delete */}
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-viv-sage-dark"
                                  onClick={() => openEditSubDialog(sub)}
                                  aria-label="Editar subcategoría"
                                >
                                  <Pencil size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => openDeleteSubDialog(sub.id)}
                                  aria-label="Eliminar subcategoría"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New subcategory button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full border-dashed border-viv-sage/40 text-viv-sage-dark hover:bg-viv-sage/10 hover:border-viv-sage"
                        onClick={() => openNewSubDialog(cat.id)}
                      >
                        <Plus size={14} className="mr-1.5" />
                        Nueva Subcategoría
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Category Create/Edit Dialog ─── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-league-spartan)' }}>
              {editingCatId ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {editingCatId
                ? 'Modifica los datos de la categoría.'
                : 'Completa los datos para crear una nueva categoría.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="cat-icono">Ícono (emoji)</Label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-viv-sage/15 flex items-center justify-center text-2xl flex-shrink-0">
                  {catForm.icono || '📁'}
                </div>
                <Input
                  id="cat-icono"
                  placeholder="Ej: 🛏️ 📐 ✨"
                  value={catForm.icono}
                  onChange={e => setCatForm(prev => ({ ...prev, icono: e.target.value }))}
                  className="flex-1"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-nombre">Nombre</Label>
              <Input
                id="cat-nombre"
                placeholder="Nombre de la categoría"
                value={catForm.nombre}
                onChange={e => setCatForm(prev => ({ ...prev, nombre: e.target.value }))}
                maxLength={50}
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="cat-orden">Orden</Label>
              <Input
                id="cat-orden"
                type="number"
                min={0}
                value={catForm.orden}
                onChange={e =>
                  setCatForm(prev => ({
                    ...prev,
                    orden: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Las categorías se ordenan de menor a mayor.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCatDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={handleSaveCat}
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : editingCatId
                  ? 'Guardar Cambios'
                  : 'Crear Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Subcategory Create/Edit Dialog ─── */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-league-spartan)' }}>
              {editingSubId ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
            </DialogTitle>
            <DialogDescription>
              {editingSubId
                ? 'Modifica los datos de la subcategoría.'
                : 'Completa los datos para crear una nueva subcategoría.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Parent category (read-only indicator) */}
            {parentCatId && (
              <div className="flex items-center gap-2 rounded-lg bg-viv-sage/10 px-3 py-2">
                <span className="text-lg">
                  {categorias.find(c => c.id === parentCatId)?.icono || '📁'}
                </span>
                <span className="text-sm font-medium text-viv-sage-dark">
                  {categorias.find(c => c.id === parentCatId)?.nombre || 'Categoría'}
                </span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="sub-nombre">Nombre</Label>
              <Input
                id="sub-nombre"
                placeholder="Nombre de la subcategoría"
                value={subForm.nombre}
                onChange={e => setSubForm(prev => ({ ...prev, nombre: e.target.value }))}
                maxLength={50}
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="sub-orden">Orden</Label>
              <Input
                id="sub-orden"
                type="number"
                min={0}
                value={subForm.orden}
                onChange={e =>
                  setSubForm(prev => ({
                    ...prev,
                    orden: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <div>
                <Label className="text-sm">Activa</Label>
                <p className="text-[10px] text-muted-foreground">
                  Las subcategorías inactivas no se muestran en el catálogo.
                </p>
              </div>
              <Switch
                checked={subForm.activa}
                onCheckedChange={checked =>
                  setSubForm(prev => ({ ...prev, activa: checked }))
                }
                className={subForm.activa ? 'data-[state=checked]:bg-viv-sage' : ''}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSubDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={handleSaveSub}
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : editingSubId
                  ? 'Guardar Cambios'
                  : 'Crear Subcategoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Category Confirmation ─── */}
      <Dialog open={deleteCatDialogOpen} onOpenChange={setDeleteCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Eliminar categoría
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta categoría? Se eliminarán
              también todas sus subcategorías. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteCatDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteCat}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Subcategory Confirmation ─── */}
      <Dialog open={deleteSubDialogOpen} onOpenChange={setDeleteSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-league-spartan)' }}>
              Eliminar subcategoría
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta subcategoría? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteSubDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSub}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
