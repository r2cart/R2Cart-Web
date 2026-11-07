// R2Cart Background Web Push & Notification Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications (even when website/browser tab is closed or minimized)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: '🚨 R2Cart Alert', body: event.data.text() };
    }
  }

  const notif = data.notification || {};
  const dataObj = data.data || {};
  const isCancelled =
    data.type === 'ADMIN_ORDER_CANCELLED' ||
    dataObj.type === 'ADMIN_ORDER_CANCELLED' ||
    Boolean(data.isCancelled) ||
    Boolean(dataObj.isCancelled) ||
    String(data.tag || '').startsWith('order-cancel-');

  const defaultTitle = isCancelled
    ? '❌ Order Cancelled · R2Cart'
    : '🚨 New Order Alert · R2Cart';
  const title = data.title || notif.title || defaultTitle;

  const iconUrl = new URL(data.icon || notif.icon || '/r2cart-logo.png', self.location.origin).href;
  const badgeUrl = new URL(data.badge || notif.badge || '/r2cart-logo.png', self.location.origin).href;

  const orderId = dataObj.orderId || data.orderId;
  const orderNumber = dataObj.orderNumber || data.orderNumber;
  const tag =
    data.tag ||
    notif.tag ||
    (orderId
      ? isCancelled
        ? `order-cancel-${orderId}`
        : `order-${orderId}`
      : orderNumber
      ? isCancelled
        ? `order-cancel-${orderNumber}`
        : `order-${orderNumber}`
      : isCancelled
      ? 'r2cart-cancel-alert'
      : 'r2cart-order-alert');

  const defaultBody = isCancelled
    ? 'A customer has cancelled an order. Stock restored.'
    : 'A new order has been received on R2Cart.';
  const body = data.body || notif.body || defaultBody;
  const targetUrl = dataObj.url || data.url || notif.click_action || '/admin/orders';

  const fullPayload = {
    ...data,
    ...dataObj,
    isCancelled,
    orderId,
    orderNumber,
    total: dataObj.total || data.total,
    customerName: dataObj.customerName || dataObj.cancelledByName || data.customerName,
    reason: dataObj.reason || data.reason,
    url: targetUrl,
  };

  const options = {
    body,
    icon: iconUrl,
    badge: badgeUrl,
    data: fullPayload,
    tag: tag,
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    vibrate: isCancelled
      ? [300, 100, 300, 100, 600]
      : [500, 150, 500, 150, 500, 200, 400],
    actions: [
      { action: 'open', title: isCancelled ? '👁 View Cancelled' : '👁 View Order' },
      { action: 'close', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    (async () => {
      // 1. Show high-priority OS notification (Mobile Notification Tray / Windows Action Center)
      try {
        await self.registration.showNotification(title, options);
      } catch (err) {
        // Fallback for mobile browsers that throw on actions or vibrate
        try {
          await self.registration.showNotification(title, {
            body: options.body,
            icon: options.icon,
            badge: options.badge,
            data: options.data,
            tag: options.tag,
            renotify: true,
          });
        } catch (innerErr) {
          console.error('[SW] Notification fallback error:', innerErr);
        }
      }

      // 2. Notify any currently open browser windows/tabs for in-app heads-up pop-up & sound
      try {
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
          client.postMessage({
            type: 'R2CART_PUSH_RECEIVED',
            payload: {
              ...fullPayload,
              title,
              body,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            },
          });
        }
      } catch (e) {
        console.warn('[SW] Client postMessage warning:', e);
      }
    })()
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const notifData = event.notification.data || {};
  const urlToOpen = notifData.url || (notifData.orderId ? `/admin/orders/${notifData.orderId}` : '/admin/orders');

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
