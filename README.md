# 🧸 Vivanticos - Mobiliario Infantil

Sistema de gestión integral para Vivanticos - Mobiliario Infantil. Dashboard responsivo para administración de catálogo, cotizaciones, usuarios y entregas.

## 🚀 Módulos

- **Catálogo** - Productos con configuraciones, medidas, extras y descuentos
- **Cotizaciones** - Creación dinámica con exportación a WhatsApp y PDF
- **Usuarios** - Gestión con roles (admin, jefe, vendedor)
- **Entregas** - Calendario mensual con estados y notificaciones
- **Dashboard** - KPIs y accesos rápidos

## 🛠️ Tecnologías

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Estado**: Zustand
- **UI**: shadcn/ui + Tailwind CSS 4
- **Backend**: Supabase
- **Imágenes**: Cloudinary
- **Deploy**: Vercel

## 🔧 Configuración

1. Clonar el repositorio
2. Instalar dependencias: `bun install`
3. Copiar `.env.example` a `.env.local` y configurar variables
4. Ejecutar en Supabase el script SQL: `download/supabase-schema.sql`
5. Crear upload preset en Cloudinary: `vivanticos`
6. Iniciar: `bun run dev`

## 🔑 Credenciales Demo

- **Admin**: admin@vivanticos.com
- **Jefe**: jefe@vivanticos.com
- **Vendedor**: vendedor@vivanticos.com

## 📦 Despliegue en Vercel

1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático

## 📁 Estructura

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Supabase)
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout con fuentes
│   └── globals.css        # Estilos Vivanticos
├── components/
│   ├── ui/                # shadcn/ui componentes
│   └── vivanticos/        # Componentes de la app
├── stores/                # Zustand stores
├── lib/                   # Utilidades y configuración
├── types/                 # TypeScript types
└── hooks/                 # Custom hooks

download/
└── supabase-schema.sql    # Script SQL completo
```
