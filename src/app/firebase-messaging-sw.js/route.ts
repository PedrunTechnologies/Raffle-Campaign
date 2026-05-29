// /**
//  * app/firebase-messaging-sw.js/route.ts
//  *
//  * Serves the Firebase messaging service worker as a dynamic response so that
//  * Firebase config env vars (which are not available inside a static file in
//  * /public) can be injected at request time.
//  *
//  * The browser fetches this at /firebase-messaging-sw.js — same URL Firebase
//  * Messaging expects by default.
//  */

// import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

// export function GET() {
//   const config = {
//     apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
//     authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
//     projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
//     storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
//     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
//     appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
//   };

//   const swScript = /* js */`
// importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
// importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// firebase.initializeApp(${JSON.stringify(config)});

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   const { title, body } = payload.notification ?? {};
//   const data            = payload.data          ?? {};
//   if (!title) return;

//   self.registration.showNotification(title, {
//     body:    body ?? "",
//     icon:    "/icon.png",
//     badge:   "/icon.png",
//     data:    { url: data.url ?? "/" },
//     vibrate: [200, 100, 200],
//   });
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
//   const url = event.notification.data?.url ?? "/";

//   event.waitUntil(
//     clients
//       .matchAll({ type: "window", includeUncontrolled: true })
//       .then((clientList) => {
//         for (const client of clientList) {
//           if (client.url.includes(self.location.origin) && "focus" in client) {
//             client.focus();
//             client.navigate(url);
//             return;
//           }
//         }
//         if (clients.openWindow) return clients.openWindow(url);
//       })
//   );
// });
// `;

//   return new NextResponse(swScript, {
//     headers: {
//       "Content-Type":  "application/javascript",
//       // SW must not be cached aggressively — 1 hour max, revalidated each time
//       "Cache-Control": "public, max-age=3600, must-revalidate",
//       // Required: SW scope must cover the root
//       "Service-Worker-Allowed": "/",
//     },
//   });
// }


/**
 * app/firebase-messaging-sw.js/route.ts
 *
 * Serves the Firebase messaging service worker as a dynamic response so that
 * Firebase config env vars (which are not available inside a static file in
 * /public) can be injected at request time.
 *
 * The browser fetches this at /firebase-messaging-sw.js — same URL Firebase
 * Messaging expects by default.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
  };

  const swScript = /* js */`
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

console.log("[FCM SW] loaded");
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const data            = payload.data          ?? {};
  if (!title) return;

  self.registration.showNotification(title, {
    body:    body ?? "",
    icon:    "/icon.png",
    badge:   "/icon.png",
    data:    { url: data.url ?? "/" },
    vibrate: [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
`;

  return new NextResponse(swScript, {
    headers: {
      "Content-Type":  "application/javascript",
      // SW must not be cached aggressively — 1 hour max, revalidated each time
      "Cache-Control": "public, max-age=3600, must-revalidate",
      // Required: SW scope must cover the root
      "Service-Worker-Allowed": "/",
    },
  });
}

