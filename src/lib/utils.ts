// ==========================================
// UTILITY FUNCTIONS - VIVANTICOS
// ==========================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear precio en COP
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Formatear fecha
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generar ID simple
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// WhatsApp link
export function generateWhatsAppLink(
  telefono: string,
  mensaje: string
): string {
  const cleanedPhone = telefono.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(mensaje);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
}

// Estado de entrega - color de fondo
export function getEstadoEntregaColor(estado: string): string {
  switch (estado) {
    case 'pendiente': return 'bg-viv-bluegrey text-white';
    case 'entregado': return 'bg-viv-sage text-white';
    case 'completado': return 'bg-viv-beige text-gray-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

// Estado de cotización - color
export function getEstadoCotizacionColor(estado: string): string {
  switch (estado) {
    case 'borrador': return 'bg-muted text-muted-foreground';
    case 'enviada': return 'bg-viv-peach text-gray-800';
    case 'aprobada': return 'bg-viv-sage text-gray-800';
    case 'rechazada': return 'bg-viv-rose text-gray-800';
    case 'transito': return 'bg-amber-100 text-amber-800';
    case 'pedido': return 'bg-blue-100 text-blue-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

// Nombre del rol
export function getRolName(rol: string): string {
  switch (rol) {
    case 'admin': return 'Administrador';
    case 'jefe': return 'Jefe de Ventas';
    case 'vendedor': return 'Vendedor';
    default: return rol;
  }
}

// Rol color
export function getRolColor(rol: string): string {
  switch (rol) {
    case 'admin': return 'bg-viv-rose text-gray-800';
    case 'jefe': return 'bg-viv-peach text-gray-800';
    case 'vendedor': return 'bg-viv-sage text-gray-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

// Truncar texto
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

// Obtener nombre del mes
export function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month];
}

// Obtener nombre del día
export function getDayName(day: number): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[day];
}

// Formatear tiempo relativo (hace X minutos/horas/días)
export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24) return `Hace ${diffHour}h`;
  if (diffDay === 1) return 'Ayer';
  if (diffDay < 7) return `Hace ${diffDay} días`;
  return formatDate(dateStr);
}
