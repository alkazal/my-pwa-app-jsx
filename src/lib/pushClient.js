import { supabase } from "./supabase";

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC;

export async function subscribeUserToPush() {
  if (!("serviceWorker" in navigator)) return;
  if (!("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
  });

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { endpoint, keys } = subscription.toJSON();
  
  await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    subscription: subscription.toJSON(),
  });

  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
