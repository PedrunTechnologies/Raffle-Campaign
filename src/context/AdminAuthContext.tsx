"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AdminRecord } from "@/lib/types";

interface AdminAuthContextValue {
  user:     User | null;
  admin:    AdminRecord | null;
  loading:  boolean;
  logout:   () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [admin,   setAdmin]   = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async (u: User) => {
    try {
      const res  = await fetch(`/api/admin/me`, {
        headers: { Authorization: `Bearer ${await u.getIdToken()}` },
      });
      console.log(res)
      if (res.ok) {
        const data = await res.json() as AdminRecord;
        setAdmin(data);
      } else {
        // Signed into Firebase but not in /admins — force sign-out
        await signOut(auth);
        console.error("Admin fetch failed", await res.text());
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log(u);
      setUser(u);
      if (u) {
        await loadAdmin(u);
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadAdmin]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/auth/session", { method: "DELETE", credentials: "include" });
    await signOut(auth);
    window.location.href = "/admin/login";
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, admin, loading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
