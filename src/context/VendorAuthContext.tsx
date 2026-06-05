"use client";

import {
  createContext, useContext, useEffect,
  useState, useCallback, type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { VendorRecord } from "@/lib/types";

interface VendorAuthContextValue {
  user: User | null;
  vendor: VendorRecord | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const VendorAuthContext = createContext<VendorAuthContextValue | null>(null);

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [loading, setLoading] = useState(true);


  const loadVendor = useCallback(async (_u: User) => {
    try {
      // Use credentials:"include" so the HttpOnly cookie is sent automatically.
      // Never pass a Bearer token here — the cookie and the context must stay
      // in sync with the same auth mechanism used by vendorFetch everywhere else.
      const res = await fetch("/api/vendor/me", { credentials: "include" });

      if (res.ok) {
        setVendor(await res.json() as VendorRecord);
      } else if (res.status === 401 || res.status === 403) {
        // The cookie is missing, invalid, or this user has no vendor doc.
        // Only sign out of Firebase on a definitive auth rejection —
        // NOT on transient errors (500, network) to avoid breaking the session.
        await signOut(auth);
        setVendor(null);
      }
      // For any other status (500, network error etc.) we leave vendor as null
      // and let individual pages handle the empty state — no signOut.
    } catch {
      // Network error — leave vendor null, don't sign out
      setVendor(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      // if (u) await loadVendor(u);
      // else setVendor(null);
      if (u) {
        await loadVendor(u);
      } else {
        setVendor(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadVendor]);


  const logout = useCallback(async () => {
    await fetch("/api/vendor/auth/session", { method: "DELETE", credentials: "include" });
    await signOut(auth);
    window.location.href = "/vendor/login";
  }, []);

  return (
    <VendorAuthContext.Provider value={{ user, vendor, loading, logout }}>
      {children}
    </VendorAuthContext.Provider>
  );
}


export function useVendorAuth() {
  const ctx = useContext(VendorAuthContext);
  if (!ctx) throw new Error("useVendorAuth must be used inside <VendorAuthProvider>");
  return ctx;
}



