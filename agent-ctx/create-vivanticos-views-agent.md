# Task: Create Three Vivanticos View Components

## Summary
Created three 'use client' React components for the Vivanticos children's furniture dashboard app.

## Files Created

### 1. `/home/z/my-project/src/components/vivanticos/usuarios-view.tsx`
- **Export**: `UsuariosView`
- User management view with access control (admin/jefe only)
- Search by name/email
- Filter tabs: Todos, Administradores, Jefes, Vendedores
- User cards in responsive grid (1 col mobile, 2 cols md)
- Each card shows: avatar with rol color initials, nombre, email, teléfono, role badge, active/inactive switch, edit/delete buttons
- Delete confirmation dialog (admin only can delete)
- All hooks called before conditional returns (fixed lint error)

### 2. `/home/z/my-project/src/components/vivanticos/usuario-form-view.tsx`
- **Export**: `UsuarioFormView`
- Create/edit user form based on selectedUsuarioId
- Permission-based role filtering: admin sees all roles, jefe only sees vendedor
- Form fields: Nombre, Email, Teléfono, Rol (select), Activo (switch)
- Validation: required fields, email format, duplicate email check
- Submit creates/updates user, navigates to 'usuarios', toasts success
- Cancel button goes back

### 3. `/home/z/my-project/src/components/vivanticos/configuracion-view.tsx`
- **Export**: `ConfiguracionView`
- Current user info card with avatar, name, email, role badge
- Sync section: "Sincronizar datos" button with loading state, last sync timestamp, "Respaldar datos" button (localStorage)
- Notifications section: list with read/unread state, "Marcar todas como leídas" button, clickable to mark as read
- Theme section placeholder (dark mode coming soon)
- About section: app version 1.0.0, brand info
- Logout button (destructive styling)

## Design Decisions
- Followed existing codebase patterns (card structure, heading styles, color conventions)
- Used Vivanticos color palette (bg-viv-sage, bg-viv-rose, bg-viv-peach, etc.)
- League Spartan font for headings
- Consistent with existing components like catalogo-view and producto-form-view
- All components are responsive (mobile-first)
- Used sonner for toast notifications

## Lint Status
- No errors in the three created files
- Pre-existing lint error in entrega-form-view.tsx (unrelated)
