/**
 * vendorFetch — unified fetch wrapper for all vendor portal API calls.
 * Sends the pedrun_vendor_token HttpOnly cookie automatically via
 * credentials:"include". No page ever needs to call getIdToken() manually.
*/

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";



export class VendorFetchError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "VendorFetchError";
  }
}



interface FetchOptions {
  /** Additional headers merged on top of the defaults */
  headers?: Record<string, string>;
  /** Pass AbortController.signal to cancel in-flight requests */
  signal?: AbortSignal;
}


function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    // If already resolved, return immediately
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    // Otherwise wait for Firebase to hydrate from persistence
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

async function refreshVendorSession(): Promise<void> {
  const user = await getCurrentUser(); // ← await instead of sync access

  if (!user) {
    // No user in Firebase at all — redirect to login
    window.location.href = "/vendor/login";
    throw new VendorFetchError(401, "Session expired. Please log in again.");
  }

  const token = await user.getIdToken(true);

  const res = await fetch("/api/vendor/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) {
    // window.location.href = "/vendor/login";
    throw new VendorFetchError(401, "Failed to refresh session. Please log in again.");
  }
}



async function vendorFetch<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown;
  if (res.headers.get("content-type")?.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }


  if (!res.ok) {

    const message =
      typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as Record<string, unknown>).error === "string"
        ? (data as { error: string }).error
        : `Request failed with status ${res.status}`;

    // Detect expired Firebase token
    if (
      res.status === 401 &&
      (message === "TOKEN_EXPIRED" || message === "Invalid or expired token") &&
      !retried
    ) {

      // Refresh Firebase token + HttpOnly cookie
      await refreshVendorSession();

      // Retry original request ONCE
      return vendorFetch<T>(
        method,
        url,
        body,
        // opts,
        true,
      );
    }

    throw new VendorFetchError(res.status, message);
  }

  return data as T;
}


export const vendorGet = <T = unknown>(url: string) =>
  vendorFetch<T>("GET", url);

export const vendorPost = <T = unknown>(url: string, body: unknown) =>
  vendorFetch<T>("POST", url, body);

export const vendorPatch = <T = unknown>(url: string, body: unknown) =>
  vendorFetch<T>("PATCH", url, body);

export const vendorDelete = <T = unknown>(url: string) =>
  vendorFetch<T>("DELETE", url);
