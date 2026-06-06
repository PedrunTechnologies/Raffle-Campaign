/**
 * participantFetch — unified fetch wrapper for all participant API calls.
 *
 * Reads the pedrun_token HttpOnly cookie automatically via credentials:"include".
 * If the server returns 401 TOKEN_EXPIRED, refreshes the Firebase ID token,
 * updates the cookie via POST /api/auth/session, then retries once.
 */

import { auth } from "@/lib/firebase";

export class ParticipantFetchError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ParticipantFetchError";
  }
}

interface FetchOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function clearParticipantSession(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
  } catch {
    // best-effort — proceed to redirect even if this fails
  } finally {
    //  window.location.replace("/login");
    window.location.href = "/login";
  }
}

async function refreshSession(): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    // Wait for Firebase to hydrate from storage before giving up
    await new Promise<void>((resolve, reject) => {
      const { onAuthStateChanged } = require("firebase/auth");
      const unsub = onAuthStateChanged(auth, (u: typeof user) => {
        unsub();
        resolve();
        // if (u) resolve();
        // // let's logout after this
        // else reject(new ParticipantFetchError(401, "Session expired. Please log in again."));
      });
    });
  }

  const freshUser = auth.currentUser;

  if (!freshUser) {
    // window.location.href = "/login";
    await clearParticipantSession();
    throw new ParticipantFetchError(401, "Session expired.");
  }

  const token = await freshUser.getIdToken(true);

  const res = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });

  if (!res.ok) {
    // window.location.href = "/login";
    throw new ParticipantFetchError(401, "Failed to refresh session.");
  }
}

async function participantFetch<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  opts?: FetchOptions,
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...opts?.headers,
  };
  // const { logout } = useAuth();

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: opts?.signal,
  });

  let data: unknown;
  if (res.headers.get("content-type")?.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data &&
        typeof (data as Record<string, unknown>).error === "string"
        ? (data as { error: string }).error
        : `Request failed with status ${res.status}`;

    if (res.status === 401 && message === "TOKEN_EXPIRED" && !retried) {
      await refreshSession();
      return participantFetch<T>(method, url, body, opts, true);
    }
    if (
      res.status === 401 &&
      (message === "Invalid token" || message === "Unauthorized")
    ) {
      await clearParticipantSession();
      window.location.href = "/login";
    }

    throw new ParticipantFetchError(res.status, message);
  }

  return data as T;
}

export const participantGet = <T = unknown>(url: string, opts?: FetchOptions) =>
  participantFetch<T>("GET", url, undefined, opts);

export const participantPost = <T = unknown>(url: string, body: unknown, opts?: FetchOptions) =>
  participantFetch<T>("POST", url, body, opts);

export const participantPatch = <T = unknown>(url: string, body: unknown, opts?: FetchOptions) =>
  participantFetch<T>("PATCH", url, body, opts);

export const participantDelete = <T = unknown>(url: string, opts?: FetchOptions) =>
  participantFetch<T>("DELETE", url, undefined, opts);


