// R2Cart Background Web Push & Notification Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications (even when website/browser tab is closed)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: '🚨 New Order Alert · R2Cart', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 New Order Alert · R2Cart';
  const iconUrl = new URL(data.icon || '/r2cart-logo.png', self.location.origin).href;
  const badgeUrl = new URL(data.badge || '/r2cart-logo.png', self.location.origin).href;

  const options = {
    body: data.body || 'A new order has been received.',
    icon: iconUrl,
    badge: badgeUrl,
    data: data.data || { url: data.url || '/admin/orders' },
    tag: data.tag || `r2cart-order-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 300],
    actions: [
      { action: 'open', title: '👁 View Order' },
      { action: 'close', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    (async () => {
      // Show native OS notification (Windows Action Center & Desktop Toast popup)
      await self.registration.showNotification(title, options);

      // Notify any currently open browser windows/tabs for in-app banner update
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({
          type: 'R2CART_PUSH_RECEIVED',
          payload: { ...data, title, body: options.body, url: options.data.url },
        });
      }
    })()
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/admin/orders';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          try {
            await client.navigate(urlToOpen);
          } catch {
            // ignore if navigation fails
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })()
  );
});
