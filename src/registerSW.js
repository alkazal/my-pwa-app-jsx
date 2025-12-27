export async function registerServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  // 1️⃣ Register PWA SW
  await navigator.serviceWorker.register("/sw.js");

  // 2️⃣ Register Firebase Messaging SW
  await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  console.log("Service Workers registered");
}
