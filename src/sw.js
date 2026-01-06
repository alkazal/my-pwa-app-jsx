// src/sw.js
import { precacheAndRoute } from 'workbox-precaching';

// This is required for Vite PWA to inject the manifest
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  let data = { title: 'New Message', body: 'Default message body' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Fallback if the data isn't valid JSON
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png', // Ensure these paths are correct!
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  // Crucial: event.waitUntil keeps the SW alive until the promise resolves
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Opens your app when the notification is clicked
  );
});