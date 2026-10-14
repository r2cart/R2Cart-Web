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
      data = { title: 'R2Cart Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'R2Cart Update';
  const options = {
    body: data.body || '',
    icon: data.icon || '/r2cart-logo.png',
    badge: data.badge || '/r2cart-logo.png',
    data: data.data || { url: data.url || '/' },
    tag: data.tag || `r2cart-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [250, 100, 250, 100, 250],
  };

  event.waitUntil(
    (async () => {
      // Show native OS notification
      await self.registration.showNotification(title, options);

      // Notify any currently open browser windows/tabs
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({
          type: 'R2CART_PUSH_RECEIVED',
          payload: data,
        });
      }
    })()
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

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
