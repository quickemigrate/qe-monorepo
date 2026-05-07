// Firebase Cloud Messaging service worker
// Config injected at runtime via clients.matchAll postMessage from main thread
// to avoid hardcoding env vars in static file.

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

let messagingInstance = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !messagingInstance) {
    try {
      firebase.initializeApp(event.data.config);
      messagingInstance = firebase.messaging();

      messagingInstance.onBackgroundMessage((payload) => {
        const title = payload?.notification?.title || 'Quick Emigrate';
        const options = {
          body: payload?.notification?.body || '',
          icon: '/logo-favicon.png',
          badge: '/logo-favicon.png',
          data: payload?.data || {},
          tag: payload?.data?.tag || 'qe-default',
        };
        self.registration.showNotification(title, options);
      });
    } catch (err) {
      console.error('[FCM SW] init error', err);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/cliente/inicio';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(targetUrl) && 'focus' in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
