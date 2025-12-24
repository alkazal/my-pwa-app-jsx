importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCl0BBB65U7sr4RvIRmXOCvUuVH8REWD1k",
  authDomain: "aduanexpress-6d13b.firebaseapp.com",
  projectId: "aduanexpress-6d13b",
  messagingSenderId: "41531205594",
  appId: "1:41531205594:web:761c8268a37f7a367402e3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log("[FCM] Background message:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/pwa-192x192.png",
    }
  );
});
