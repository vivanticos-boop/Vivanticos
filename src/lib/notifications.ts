// ==========================================
// PUSH NOTIFICATIONS UTILITY - VIVANTICOS
// Manejo de suscripciones push y permisos
// ==========================================

import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Convertir la clave VAPID de base64 a Uint8Array para el PushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Verificar si las notificaciones push son soportadas
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Obtener el estado actual del permiso de notificaciones
export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Solicitar permiso de notificaciones
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('Push notifications no soportadas en este navegador');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Obtener la suscripción push actual
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error obteniendo push subscription:', error);
    return null;
  }
}

// Crear suscripción push y guardarla en Supabase
export async function subscribeToPush(usuarioId: string): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications no soportadas' };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { success: false, error: 'Clave VAPID no configurada' };
  }

  try {
    // 1. Solicitar permiso
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificación denegado' };
    }

    // 2. Obtener el service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Crear la suscripción push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // 4. Guardar la suscripción en Supabase
    const subscriptionData = subscription.toJSON();
    const { error } = await supabase!.from('push_subscriptions').upsert({
      usuario_id: usuarioId,
      endpoint: subscription.endpoint,
      p256dh: subscriptionData.keys?.p256dh || '',
      auth_key: subscriptionData.keys?.auth || '',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'usuario_id,endpoint',
    });

    if (error) {
      console.error('Error guardando push subscription en Supabase:', error);
      return { success: false, error: 'Error guardando la suscripción' };
    }

    return { success: true, subscription };
  } catch (error: any) {
    console.error('Error suscribiendo a push:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// Eliminar suscripción push
export async function unsubscribeFromPush(usuarioId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const subscription = await getPushSubscription();
    if (subscription) {
      // Eliminar del navegador
      await subscription.unsubscribe();

      // Eliminar de Supabase
      await supabase!
        .from('push_subscriptions')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('endpoint', subscription.endpoint);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error desuscribiendo de push:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

// Verificar si el usuario tiene suscripción push activa
export async function isPushSubscribed(usuarioId: string): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) return false;

    // Verificar en Supabase que la suscripción existe
    const { data, error } = await supabase!
      .from('push_subscriptions')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
}

// Mostrar una notificación local (para cuando la app está abierta pero en segundo plano)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions & {
    relacionado_tipo?: string;
    relacionado_id?: string;
  }
): Promise<void> {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      tag: 'vivanticos-notification',
      ...options,
      data: {
        relacionado_tipo: options?.relacionado_tipo,
        relacionado_id: options?.relacionado_id,
      },
    });
  } catch (error) {
    console.error('Error mostrando notificación local:', error);
  }
}
