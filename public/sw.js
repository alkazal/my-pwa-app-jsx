self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let data = {};

  try {
    data = event.data.json();
  } catch {
    data = { title: "Notification", body: event.data.text() };
  }

  const title = data.title || "Notification";
  const body = data.body || "";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "public/pwa-192x192.png",
      badge: "public/pwa-192x192.png",
      data: { url }, // 👈 IMPORTANT
    })
  );
});


// ===============================
// HANDLE CLICK
// ===============================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(targetUrl);
          client.focus();
          return;
        }
      }

      // If no open tab → open new
      return clients.openWindow(targetUrl);
    })
  );
});
