// ==========================================
// HOOK: PUSH NOTIFICATIONS - VIVANTICOS
// Maneja permisos, suscripciones, estado
// y verificación periódica de notificaciones
// ==========================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isPushSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
} from '@/lib/notifications';
import { useAppStore } from '@/stores/app-store';
import { useEntregasStore } from '@/stores/entregas-store';
import { useCotizacionesStore } from '@/stores/cotizaciones-store';

interface PushNotificationState {
  isSupported: boolean;
  permissionStatus: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

// Intervalo de verificación de notificaciones: cada 5 minutos
const CHECK_INTERVAL = 5 * 60 * 1000;

export function usePushNotifications() {
  const currentUser = useAppStore(s => s.currentUser);
  const isLoggedIn = useAppStore(s => s.isLoggedIn);
  const generateNotificaciones = useAppStore(s => s.generateNotificaciones);
  const loadNotificacionesFromSupabase = useAppStore(s => s.loadNotificacionesFromSupabase);
  const entregas = useEntregasStore(s => s.entregas);
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones);

  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permissionStatus: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verificar estado inicial
  const checkStatus = useCallback(async () => {
    if (!currentUser?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const supported = isPushSupported();
    const permission = getNotificationPermissionStatus();
    let subscribed = false;

    if (supported && permission === 'granted') {
      subscribed = await isPushSubscribed(currentUser.id);
    }

    setState({
      isSupported: supported,
      permissionStatus: permission,
      isSubscribed: subscribed,
      isLoading: false,
      error: null,
    });
  }, [currentUser?.id]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Verificación periódica de notificaciones (cada 5 minutos cuando la app está abierta)
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    const checkNotifications = async () => {
      try {
        // 1. Regenerar notificaciones basadas en datos actuales
        if (entregas.length > 0 || cotizaciones.length > 0) {
          generateNotificaciones(entregas, cotizaciones);
        }

        // 2. Recargar notificaciones desde Supabase
        await loadNotificacionesFromSupabase(currentUser.id);

        // 3. Llamar al endpoint de verificación (envía push si hay nuevas)
        await fetch('/api/notifications/check');
      } catch (e) {
        console.error('Error in periodic notification check:', e);
      }
    };

    // Verificar inmediatamente
    checkNotifications();

    // Luego cada 5 minutos
    checkIntervalRef.current = setInterval(checkNotifications, CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isLoggedIn, currentUser?.id, entregas, cotizaciones, generateNotificaciones, loadNotificacionesFromSupabase]);

  // Solicitar permiso y suscribirse
  const subscribe = useCallback(async () => {
    if (!currentUser?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await subscribeToPush(currentUser.id);

    if (result.success) {
      setState(prev => ({
        ...prev,
        permissionStatus: 'granted',
        isSubscribed: true,
        isLoading: false,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Error al suscribirse',
      }));
    }

    return result;
  }, [currentUser?.id]);

  // Desuscribirse
  const unsubscribe = useCallback(async () => {
    if (!currentUser?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await unsubscribeFromPush(currentUser.id);

    if (result.success) {
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Error al desuscribirse',
      }));
    }

    return result;
  }, [currentUser?.id]);

  // Toggle suscripción
  const toggleSubscription = useCallback(async () => {
    if (state.isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [state.isSubscribed, subscribe, unsubscribe]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    toggleSubscription,
    refreshStatus: checkStatus,
  };
}
