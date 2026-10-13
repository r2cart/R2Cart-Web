import { getToken, onMessage } from 'firebase/messaging';
import { messagingPromise, isFirebaseConfigured } from '../config/firebase.js';
import { api } from './httpClient.js';
import { playNotificationSound } from './pushNotification.service.js';

let isListening = false;

export async function requestFcmToken({ role = 'CUSTOMER' } = {}) {
  if (!isFirebaseConfigured) {
    return { success: false, reason: 'unconfigured' };
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const messaging = await messagingPromise;
    if (!messaging) {
      return { success: false, reason: 'messaging_unsupported' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied' };
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (!token) {
      throw new Error('No FCM registration token available');
    }

    // Send token to backend
    const adminToken = localStorage.getItem('grocify-admin-access-token');
    const customerToken = localStorage.getItem('grocify-access-token');
    const authToken = role === 'ADMIN' ? (adminToken || customerToken) : (customerToken || adminToken);

    await api.post('/notifications/fcm/token', {
      token,
      role,
      platform: 'WEB',
    }, authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {});

    localStorage.setItem('r2cart_fcm_token', token);
    console.log('[FCM] Token registered successfully for role:', role);

    // Setup foreground message listener once
    if (!isListening) {
      isListening = true;
      onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground notification received:', payload);
        playNotificationSound();

        const title = payload.notification?.title || payload.data?.title || 'R2Cart Update';
        const body = payload.notification?.body || payload.data?.body || '';

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
            });
          } catch {}
        }
      });
    }

    return { success: true, token };
  } catch (err) {
    console.warn('[FCM] Error requesting token:', err.message);
    return { success: false, error: err.message };
  }
}
