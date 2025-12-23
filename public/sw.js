console.log("[SW] Registring...");

self.addEventListener("push", (event) => {
  console.log("[SW] Push event received!");

  if (!event.data) {
    console.warn("[SW] No payload");
    return;
  }

  const payload = event.data.json();
  console.log("[SW] Payload:", payload);

  const notification = payload.notification;

  if (!notification) {
    console.warn("[SW] No notification object");
    return;
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || "/icons/icon-192.png",
      badge: notification.badge || "/icons/badge.png",
      data: payload.data || {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.openWindow(url)
  );
});

