importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDV_sTRvzW2niB-pFH7SQSGFQK32OgVVzk",
  projectId: "interview-platform-6c2d5",
  messagingSenderId: "481624099070",
  appId: "1:481624099070:web:aa692fb59e47551d2f7daf"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  // Fallback to payload.data if payload.notification is missing
  const title = payload.notification?.title || payload.data?.title || 'Application Alert';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New update received.',
    icon: "/window.svg", // Ensure this exists in your public/ directory
  };

  self.registration.showNotification(title, options);
});