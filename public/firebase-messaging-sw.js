// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parse config from URL search params if present, or fallback
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || '',
  authDomain: urlParams.get('authDomain') || '',
  projectId: urlParams.get('projectId') || '',
  storageBucket: urlParams.get('storageBucket') || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '',
  appId: urlParams.get('appId') || '',
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
    const title = payload.notification?.title || payload.data?.title || '🚨 New Order Alert · R2Cart';
    const orderId = payload.data?.orderId || '';
    const orderNumber = payload.data?.orderNumber || '';
    const tag = payload.data?.tag || (orderId ? `order-${orderId}` : (orderNumber ? `order-${orderNumber}` : 'r2cart-fcm-alert'));

    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'A new order has been received.',
      icon: '/r2cart-logo.png',
      badge: '/r2cart-logo.png',
      data: payload.data || {},
      requireInteraction: true,
      renotify: true,
      silent: false,
      timestamp: Date.now(),
      vibrate: [500, 150, 500, 150, 500, 200, 400],
      tag: tag,
      actions: [
        { action: 'open', title: '👁 View Order' },
        { action: 'close', title: '✕ Dismiss' }
      ]
    };

    self.registration.showNotification(title, notificationOptions);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.navigate(urlToOpen).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
