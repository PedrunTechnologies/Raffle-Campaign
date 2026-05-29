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



  const loadVendor = useCallback(async (u: User) => {
    try {
      const res = await fetch("/api/vendor/me", { headers: { Authorization: `Bearer ${await u.getIdToken()}` }, });


      if (res.ok) {
        setVendor(await res.json() as VendorRecord);
      } else {
        // Signed in to Firebase but not a vendor — sign out
        await signOut(auth);
        setVendor(null);
      }
    } catch {
      setVendor(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log(u);
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
