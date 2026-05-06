'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useUsuariosStore } from '@/stores/usuarios-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ShieldOff,
  Users,
  UserCheck,
  Shield,
  UserCog,
  Phone,
  Mail,
} from 'lucide-react';
import { getRolName, getRolColor } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

type FilterTab = 'todos' | 'admin' | 'jefe' | 'vendedor';

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'todos', label: 'Todos', icon: <Users size={14} /> },
  { key: 'admin', label: 'Administradores', icon: <Shield size={14} /> },
  { key: 'jefe', label: 'Jefes', icon: <UserCog size={14} /> },
  { key: 'vendedor', label: 'Vendedores', icon: <UserCheck size={14} /> },
];

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UsuariosView() {
  const currentUser = useAppStore(s => s.currentUser);
  const navigateTo = useAppStore(s => s.navigateTo);
  const setSelectedUsuarioId = useAppStore(s => s.setSelectedUsuarioId);

  const usuarios = useUsuariosStore(s => s.usuarios);
  const toggleActivo = useUsuariosStore(s => s.toggleActivo);
  const deleteUsuario = useUsuariosStore(s => s.deleteUsuario);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<string | null>(null);

  const isAdmin = currentUser?.rol === 'admin';

  // Filter users
  const filteredUsuarios = useMemo(() => {
    let result = usuarios;

    // Filter by role tab
    if (activeFilter !== 'todos') {
      result = result.filter(u => u.rol === activeFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        u =>
          u.nombre.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    return result;
  }, [usuarios, activeFilter, searchTerm]);

  // Permission check: only admin and jefe can access
  if (currentUser?.rol === 'vendedor') {
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
          Solo administradores y jefes pueden gestionar usuarios.
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

  const handleEdit = (id: string) => {
    setSelectedUsuarioId(id);
    navigateTo('usuario-form');
  };

  const handleNewUser = () => {
    setSelectedUsuarioId(null);
    navigateTo('usuario-form');
  };

  const handleToggleActivo = (id: string) => {
    toggleActivo(id);
    const usuario = usuarios.find(u => u.id === id);
    if (usuario) {
      toast.success(
        `${usuario.nombre} ${!usuario.activo ? 'activado' : 'desactivado'}`
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (usuarioToDelete) {
      deleteUsuario(usuarioToDelete);
      toast.success('Usuario eliminado');
      setUsuarioToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setUsuarioToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            Usuarios
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredUsuarios.length} de {usuarios.length} usuarios
          </p>
        </div>
        <Button
          className="bg-viv-sage hover:bg-viv-sage-dark text-white"
          onClick={handleNewUser}
        >
          <Plus size={16} className="mr-2" />
          <span className="hidden sm:inline">Nuevo Usuario</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            className={
              activeFilter === tab.key
                ? 'bg-viv-sage hover:bg-viv-sage-dark text-white'
                : ''
            }
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.icon}
            <span className="ml-1.5 hidden sm:inline">{tab.label}</span>
            <span className="ml-1.5 sm:hidden">
              {tab.key === 'todos'
                ? 'Todos'
                : tab.key === 'admin'
                ? 'Admin'
                : tab.key === 'jefe'
                ? 'Jefes'
                : 'Vend.'}
            </span>
          </Button>
        ))}
      </div>

      {/* Users Grid */}
      {filteredUsuarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-sage/10 flex items-center justify-center mb-4">
            <Users size={28} className="text-viv-sage/50" />
          </div>
          <p className="text-muted-foreground">
            No se encontraron usuarios
          </p>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-1">
              Intenta con otro término de búsqueda
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsuarios.map(usuario => (
            <Card
              key={usuario.id}
              className="border-0 shadow-sm hover:shadow-md transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    {usuario.avatar_url && (
                      <AvatarImage
                        src={usuario.avatar_url}
                        alt={usuario.nombre}
                      />
                    )}
                    <AvatarFallback
                      className={`${getRolColor(usuario.rol)} text-sm font-bold`}
                    >
                      {getInitials(usuario.nombre)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-semibold text-sm truncate"
                        style={{ fontFamily: 'var(--font-league-spartan)' }}
                      >
                        {usuario.nombre}
                      </h3>
                      <Badge
                        className={`${getRolColor(usuario.rol)} text-[10px] border-0 px-2 py-0`}
                      >
                        {getRolName(usuario.rol)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Mail size={12} className="flex-shrink-0" />
                      <span className="truncate">{usuario.email}</span>
                    </div>

                    {usuario.telefono && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Phone size={12} className="flex-shrink-0" />
                        <span>{usuario.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Actions Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <Switch
                      checked={usuario.activo}
                      onCheckedChange={() => handleToggleActivo(usuario.id)}
                      className={
                        usuario.activo
                          ? 'data-[state=checked]:bg-viv-sage'
                          : ''
                      }
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-viv-sage-dark"
                      onClick={() => handleEdit(usuario.id)}
                      aria-label="Editar usuario"
                    >
                      <Pencil size={14} />
                    </Button>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => openDeleteDialog(usuario.id)}
                        aria-label="Eliminar usuario"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: 'var(--font-league-spartan)' }}
            >
              Eliminar usuario
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar este usuario? Esta acción no
            se puede deshacer.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
