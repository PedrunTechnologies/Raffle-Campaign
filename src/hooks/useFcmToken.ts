/**
 * hooks/useFcmToken.ts
 *
 * Call this hook AFTER the auth user is confirmed — pass the Firebase User
 * object so the token save never races against auth loading.
 *
 * Handles:
 *  - SW registration at /firebase-messaging-sw.js (scope /)
 *  - FCM token retrieval and save to backend (idempotent arrayUnion)
 *  - Foreground message display (app open) via onMessage
 *  - Background message display handled by the SW itself
 */

"use client";

import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import type { User } from "firebase/auth";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

interface Options {
  /** Authenticated Firebase user — hook is a no-op if null */
  user:          User | null;
  /** API endpoint that accepts POST { token: string } */
  tokenEndpoint: string;
}

export function useFcmToken({ user, tokenEndpoint }: Options) {
  useEffect(() => {
    if (!user) return; // wait until auth is resolved
    let cancelled = false;

    async function register() {
      try {
        if (typeof window === "undefined")       return;
        if (!("serviceWorker" in navigator))     return;
        if (!("Notification" in window))         return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const messaging = await getFirebaseMessaging();
        if (!messaging || cancelled) return;

        /* Register SW — scope must be "/" so it can intercept all push events.
           The SW is served by an API route that bakes in the Firebase config. */
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );

        /* Use the registration we just got — don't rely on .ready which may
           resolve with a different SW that controls the page. */
        const token = await getToken(messaging, {
          vapidKey:                  VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token || cancelled) return;

        /* Persist token to Firestore via the API */
        const idToken = await user?.getIdToken();
        await fetch(tokenEndpoint, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });

        /* Foreground message handler — app is open, SW won't show the
           notification automatically so we do it here via the Notifications API. */
        const unsubscribe = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {};
          if (!title) return;
          if (Notification.permission === "granted") {
            new Notification(title, {
              body:  body  ?? "",
              icon:  "/icon.png",
              badge: "/icon.png",
              data:  payload.data,
            });
          }
        });

        return unsubscribe;
      } catch (err) {
        console.warn("[useFcmToken] registration failed:", err);
      }
    }

    const cleanupPromise = register();

    return () => {
      cancelled = true;
      // Call the onMessage unsubscribe if it resolved
      cleanupPromise.then((unsub) => unsub?.());
    };
  }, [user, tokenEndpoint]); // re-run if user changes (e.g. login/logout)
}

