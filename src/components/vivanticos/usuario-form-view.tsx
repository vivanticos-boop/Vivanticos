'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useUsuariosStore } from '@/stores/usuarios-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  UserPlus,
  ShieldOff,
  User,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { generateId, getRolName } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserRole, Usuario } from '@/types';

// Available roles based on current user's permissions
function getAvailableRoles(currentRole: UserRole | undefined): UserRole[] {
  if (currentRole === 'admin') {
    return ['admin', 'jefe', 'vendedor'];
  }
  if (currentRole === 'jefe') {
    return ['vendedor'];
  }
  return [];
}

export function UsuarioFormView() {
  const navigateTo = useAppStore(s => s.navigateTo);
  const goBack = useAppStore(s => s.goBack);
  const selectedUsuarioId = useAppStore(s => s.selectedUsuarioId);
  const currentUser = useAppStore(s => s.currentUser);

  const usuarios = useUsuariosStore(s => s.usuarios);
  const addUsuario = useUsuariosStore(s => s.addUsuario);
  const updateUsuario = useUsuariosStore(s => s.updateUsuario);

  const isEditing = !!selectedUsuarioId;
  const existingUsuario = isEditing
    ? usuarios.find(u => u.id === selectedUsuarioId) ?? null
    : null;

  const availableRoles = useMemo(
    () => getAvailableRoles(currentUser?.rol),
    [currentUser?.rol]
  );

  // Form state
  const [nombre, setNombre] = useState(existingUsuario?.nombre ?? '');
  const [email, setEmail] = useState(existingUsuario?.email ?? '');
  const [telefono, setTelefono] = useState(existingUsuario?.telefono ?? '');
  const [rol, setRol] = useState<UserRole>(existingUsuario?.rol ?? 'vendedor');
  const [activo, setActivo] = useState(existingUsuario?.activo ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // If editing and role is not in available roles for current user, show error
  if (
    isEditing &&
    existingUsuario &&
    !availableRoles.includes(existingUsuario.rol) &&
    currentUser?.rol !== 'admin'
  ) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-viv-rose/20 flex items-center justify-center mb-4">
          <ShieldOff size={28} className="text-viv-rose-dark" />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: 'var(--font-league-spartan)' }}
        >
          Sin permisos
        </h3>
        <p className="text-muted-foreground text-sm">
          No tienes permisos para editar este usuario.
        </p>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          Volver
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    // Validation
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('El email no es válido');
      return;
    }
    if (!rol) {
      toast.error('Selecciona un rol');
      return;
    }

    // Check for duplicate email (except when editing the same user)
    const duplicateEmail = usuarios.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== selectedUsuarioId
    );
    if (duplicateEmail) {
      toast.error('Ya existe un usuario con ese email');
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();

    const usuarioData: Usuario = {
      id: isEditing ? existingUsuario!.id : generateId(),
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim() || undefined,
      rol,
      activo,
      creado_en: isEditing ? existingUsuario!.creado_en : now,
    };

    if (isEditing) {
      updateUsuario(usuarioData);
      toast.success('Usuario actualizado');
    } else {
      addUsuario(usuarioData);
      toast.success('Usuario creado');
    }

    navigateTo('usuarios');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
          </p>
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            {isEditing ? existingUsuario?.nombre || 'Editar' : 'Crear Usuario'}
          </h2>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-base"
            style={{ fontFamily: 'var(--font-league-spartan)' }}
          >
            <UserPlus size={16} className="inline mr-2" />
            Información del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label
              htmlFor="nombre"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              <User size={12} className="inline mr-1" />
              Nombre *
            </Label>
            <Input
              id="nombre"
              placeholder="Nombre completo"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              <Mail size={12} className="inline mr-1" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label
              htmlFor="telefono"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              <Phone size={12} className="inline mr-1" />
              Teléfono
            </Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="573001112233"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="h-10"
            />
          </div>

          <Separator />

          {/* Rol */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider">
              <Shield size={12} className="inline mr-1" />
              Rol *
            </Label>
            <Select
              value={rol}
              onValueChange={(v: UserRole) => setRol(v)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(r => (
                  <SelectItem key={r} value={r}>
                    {getRolName(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUser?.rol === 'jefe' && (
              <p className="text-[10px] text-muted-foreground">
                Solo puedes crear usuarios con rol de Vendedor
              </p>
            )}
          </div>

          <Separator />

          {/* Activo Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Estado
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activo
                  ? 'El usuario puede acceder al sistema'
                  : 'El usuario está desactivado'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  activo ? 'text-viv-sage-dark' : 'text-muted-foreground'
                }`}
              >
                {activo ? 'Activo' : 'Inactivo'}
              </span>
              <Switch
                checked={activo}
                onCheckedChange={setActivo}
                className={activo ? 'data-[state=checked]:bg-viv-sage' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={goBack}>
              Cancelar
            </Button>
            <Button
              className="bg-viv-sage hover:bg-viv-sage-dark text-white"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Save size={16} className="mr-2" />
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Actualizar'
                : 'Crear Usuario'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
