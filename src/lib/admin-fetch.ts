/**
 * adminFetch — unified fetch wrapper for all admin dashboard API calls.
 *
 * Reads the pedrun_admin_token cookie automatically (the browser sends
 * HttpOnly cookies on same-origin requests when credentials:"include" is set),
 * so no page ever needs to call getIdToken() or manually attach Authorization
 * headers after the initial login.
 *
 * Usage:
 *   import { adminGet, adminPost, adminPatch, adminDelete } from "@/lib/admin-fetch";
 *
 *   const tasks  = await adminGet<TaskRecord[]>("/api/admin/tasks");
 *   const result = await adminPost<{ id: string }>("/api/admin/tasks", payload);
 *   await adminPatch(`/api/admin/tasks/${id}`, { description });
 *   await adminDelete(`/api/admin/tasks/${id}`);
 */

import { auth } from "@/lib/firebase";
/* ── types ────────────────────────────────────────────────────────────── */

export class AdminFetchError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "AdminFetchError";
    }
}

interface FetchOptions {
    /** Additional headers merged on top of the defaults */
    headers?: Record<string, string>;
    /** Pass AbortController.signal to cancel in-flight requests */
    signal?: AbortSignal;
}


async function refreshAdminSession(): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No authenticated user");
    }

    // Force Firebase to issue a fresh ID token
    const token = await user.getIdToken(true);


    // Update the HttpOnly cookie on the server
    const res = await fetch("/api/admin/auth/session", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token }),
    });

    if (!res.ok) {
        throw new Error("Failed to refresh admin session");
    }
}

/* ── core ─────────────────────────────────────────────────────────────── */



async function adminFetch<T = unknown>(
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

    const res = await fetch(url, {
        method,
        credentials: "include",   // sends the HttpOnly pedrun_admin_token cookie
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: opts?.signal,
    });

    // Parse JSON regardless — error responses also carry a JSON body
    let data: unknown;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    //   if (!res.ok) {
    //     const message =
    //       typeof data === "object" &&
    //       data !== null &&
    //       "error" in data &&
    //       typeof (data as Record<string, unknown>).error === "string"
    //         ? (data as { error: string }).error
    //         : `Request failed with status ${res.status}`;

    //     throw new AdminFetchError(res.status, message);
    //   }
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
            message === "TOKEN_EXPIRED" &&
            !retried
        ) {

            // Refresh Firebase token + HttpOnly cookie
            await refreshAdminSession();

            // Retry original request ONCE
            return adminFetch<T>(
                method,
                url,
                body,
                opts,
                true,
            );
        }

        throw new AdminFetchError(res.status, message);
    }

    return data as T;
}

/* ── public helpers ───────────────────────────────────────────────────── */

/** GET — fetch a resource */
export function adminGet<T = unknown>(
    url: string,
    opts?: FetchOptions,
): Promise<T> {
    return adminFetch<T>("GET", url, undefined, opts);
}

/** POST — create a resource */
export function adminPost<T = unknown>(
    url: string,
    body: unknown,
    opts?: FetchOptions,
): Promise<T> {
    return adminFetch<T>("POST", url, body, opts);
}

/** PATCH — partial update */
export function adminPatch<T = unknown>(
    url: string,
    body: unknown,
    opts?: FetchOptions,
): Promise<T> {
    return adminFetch<T>("PATCH", url, body, opts);
}

/** DELETE — remove a resource */
export function adminDelete<T = unknown>(
    url: string,
    opts?: FetchOptions,
): Promise<T> {
    return adminFetch<T>("DELETE", url, undefined, opts);
}