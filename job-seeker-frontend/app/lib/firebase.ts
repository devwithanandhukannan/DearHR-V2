import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getMessaging, getToken, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDV_sTRvzW2niB-pFH7SQSGFQK32OgVVzk",
  authDomain: "interview-platform-6c2d5.firebaseapp.com",
  projectId: "interview-platform-6c2d5",
  storageBucket: "interview-platform-6c2d5.firebasestorage.app",
  messagingSenderId: "481624099070",
  appId: "1:481624099070:web:aa692fb59e47551d2f7daf",
  measurementId: "G-VC2JZW9LC0"
};

// 1. Initialize Firebase safely (prevents duplicate app initialization errors during hot-reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Browser-only initializations (prevents Node.js server-side crashes)
export const analytics: Analytics | null = typeof window !== "undefined" ? getAnalytics(app) : null;
export const messaging: Messaging | null = typeof window !== "undefined" ? getMessaging(app) : null;

/**
 * Requests push permission and retrieves the FCM registration token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !messaging || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied.");
      return null;
    }

    // Register your service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    // Fetch the token using your public VAPID key
    const currentToken = await getToken(messaging, {
      vapidKey: "BA3Ue91cqFkFrfPUJ_QlVp653Dj8k5JgJrqwysusX3eEhSIR4xK2OMWsPdBxxO8SpW8F3r25v2op19DGp2vp4u8",
      serviceWorkerRegistration: registration,
    });
    
    return currentToken;
  } catch (error) {
    console.error("Error generating FCM Token:", error);
    return null;
  }
};