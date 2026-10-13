import { api } from './httpClient.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('Could not get push subscription:', err);
    return null;
  }
}

export async function subscribeToPush({ role = 'CUSTOMER' } = {}) {
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    // 1. Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied', permission };
    }

    // 2. Fetch VAPID public key from backend
    const { publicKey } = await api.get('/notifications/vapid-public-key');
    if (!publicKey) {
      throw new Error('VAPID public key not found on server');
    }

    // 3. Ensure service worker is registered and ready
    await registerServiceWorker();
    const reg = await navigator.serviceWorker.ready;

    // 4. Check for existing subscription or create new
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // 5. Send subscription to backend
    await api.post('/notifications/subscribe', {
      subscription: subscription.toJSON(),
      role,
    });

    localStorage.setItem('r2cart_push_subscribed', 'true');
    return { success: true, subscription };
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return { success: false, error: err.message };
  }
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
      await subscription.unsubscribe();
    }
    localStorage.removeItem('r2cart_push_subscribed');
    return true;
  } catch (err) {
    console.warn('Failed to unsubscribe from push notifications:', err);
    return false;
  }
}

export async function sendTestPush(role = 'CUSTOMER') {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) {
    throw new Error('No active push subscription found on this device');
  }
  return api.post('/notifications/test', {
    subscription: subscription.toJSON(),
    role,
  });
}

// Crisp, pleasant melodic audio chime for incoming order alert
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: 0, dur: 0.18 },    // C5
      { freq: 659.25, time: 0.15, dur: 0.22 }, // E5
      { freq: 783.99, time: 0.32, dur: 0.45 }, // G5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}

// Automatically trigger native browser notification dialog on visit if not yet decided
export async function autoPromptPushPermission(role = 'CUSTOMER') {
  if (!isPushSupported()) return;
  if (Notification.permission === 'default') {
    try {
      await subscribeToPush({ role });
    } catch (err) {
      console.warn('Auto push prompt error:', err);
    }
  } else if (Notification.permission === 'granted') {
    try {
      const sub = await getCurrentPushSubscription();
      if (!sub) {
        await subscribeToPush({ role });
      }
    } catch (err) {
      console.warn('Sync push subscription error:', err);
    }
  }
}
