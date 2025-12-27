import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import { supabase } from "./supabase";

export async function enablePushNotifications() {
  // 1️⃣ Ask permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  // 2️⃣ Get FCM token
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  if (!token) {
    throw new Error("Failed to get FCM token");
  }

  // 3️⃣ Save to Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not logged in");

  await supabase.from("push_subscriptions").upsert({
    user_id: session.user.id,
    fcm_token: token,
    platform: "web",
  });

  return token;
}
