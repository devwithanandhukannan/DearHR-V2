"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { messaging, requestNotificationPermission } from "../lib/firebase"; 
import { onMessage } from "firebase/messaging";
import api from "../lib/axios";
import { useGlassToast } from "../components/GlassToastContainer";

const FcmContext = createContext<{
  fcmToken: string | null;
  permissionStatus: NotificationPermission | null;
}>({
  fcmToken: null,
  permissionStatus: null,
});

export const FcmProvider = ({ children }: { children: React.ReactNode }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const { showToast } = useGlassToast(); // ⚡ Access your native workspace toast pipeline

  useEffect(() => {
    const initializeFcm = async () => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      
      setPermissionStatus(Notification.permission);

      const token = await requestNotificationPermission();
      if (token) {
        console.log("FCM Token Successfully Registered:", token);
        setFcmToken(token);
        setPermissionStatus(Notification.permission);
        
        try {
          await api.post("/jobseeker/notification/token", {
            token
          });
          console.log("FCM Token successfully synced to your database record ✅");
        } catch (error) {
          console.error("Failed to send FCM token to backend database context:", error);
        }
      }
    };

    initializeFcm();
  }, []);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Live Push Message Received in Frontend! 📩", payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || "Application Alert";
      const notificationBody = payload.notification?.body || payload.data?.body || "New update received.";

      // ⚡ Fire off your consistent design system toast
      showToast(notificationTitle, notificationBody, "info");
    });

    return () => unsubscribe();
  }, [fcmToken, showToast]);

  return (
    <FcmContext.Provider value={{ fcmToken, permissionStatus }}>
      {children}
    </FcmContext.Provider>
  );
};

export const useFcm = () => useContext(FcmContext);