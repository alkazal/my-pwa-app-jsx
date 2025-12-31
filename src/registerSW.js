export async function registerServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  // 1️⃣ Register PWA SW
  //await navigator.serviceWorker.register("/sw.js");



  console.log("Service Workers registered");
}
