// ==========================================
// API: SEND PUSH NOTIFICATIONS - VIVANTICOS
// Envía notificaciones push a los usuarios
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configurar web-push con las claves VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:soporte@vivanticos.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Cliente Supabase con service_role para bypass RLS
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Enviar una notificación push a una suscripción específica
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'VAPID keys not configured' };
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_key,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error?.message);

    // Si la suscripción ya no es válida (410 Gone), eliminarla
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
      return { success: false, error: 'Subscription expired, removed' };
    }

    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// POST /api/notifications/send — Enviar notificación push a usuarios específicos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario_ids, titulo, mensaje, tipo, relacionado_id, relacionado_tipo } = body;

    if (!usuario_ids || !Array.isArray(usuario_ids) || !titulo || !mensaje) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: usuario_ids, titulo, mensaje' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Obtener todas las suscripciones push de los usuarios indicados
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key, usuario_id')
      .in('usuario_id', usuario_ids);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Error fetching subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No hay suscripciones push para estos usuarios',
      });
    }

    // Guardar la notificación en la tabla notificaciones
    const notificacionesToInsert = usuario_ids.map(uid => ({
      usuario_id: uid,
      tipo: tipo || 'info',
      titulo,
      mensaje,
      leida: false,
      relacionado_id: relacionado_id || null,
    }));

    const { error: insertError } = await supabase
      .from('notificaciones')
      .insert(notificacionesToInsert);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
    }

    // Enviar push a todas las suscripciones
    const payload = {
      title: titulo,
      body: mensaje,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `vivanticos-${tipo || 'notification'}-${Date.now()}`,
      data: {
        tipo,
        relacionado_id,
        relacionado_tipo,
      },
    };

    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
    });
  } catch (error: any) {
    console.error('Error in send notification endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
