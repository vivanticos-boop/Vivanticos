// ==========================================
// HOOK: PUSH NOTIFICATIONS - VIVANTICOS
// Maneja permisos, suscripciones y estado
// ==========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
} from '@/lib/notifications';
import { useAppStore } from '@/stores/app-store';

interface PushNotificationState {
  isSupported: boolean;
  permissionStatus: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const currentUser = useAppStore(s => s.currentUser);
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permissionStatus: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

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
