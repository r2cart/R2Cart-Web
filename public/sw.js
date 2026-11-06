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

  const orderId = data.data?.orderId || data.orderId;
  const orderNumber = data.data?.orderNumber || data.orderNumber;
  const tag = data.tag || (orderId ? `order-${orderId}` : (orderNumber ? `order-${orderNumber}` : 'r2cart-order-alert'));

  const options = {
    body: data.body || 'A new order has been received.',
    icon: iconUrl,
    badge: badgeUrl,
    data: data.data || { url: data.url || '/admin/orders' },
    tag: tag, // Stable tag prevents spam stacking & updates existing alert cleanly
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    vibrate: [500, 150, 500, 150, 500, 200, 400],
    actions: [
      { action: 'open', title: '👁 View Order' },
      { action: 'close', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    (async () => {
      // 1. Show high-priority OS notification (Android Heads-Up banner / Windows Toast)
      await self.registration.showNotification(title, options);

      // 2. Notify any currently open browser windows/tabs for in-app heads-up pop-up & sound
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({
          type: 'R2CART_PUSH_RECEIVED',
          payload: {
            ...data,
            title,
            body: options.body,
            url: options.data.url,
            tag,
            orderId,
            orderNumber,
            total: data.data?.total || data.total,
            customerName: data.data?.customerName || data.customerName,
            itemsCount: data.data?.itemsCount || data.itemsCount,
            time: data.data?.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          },
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
