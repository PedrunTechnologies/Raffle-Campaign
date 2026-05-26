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
import { getUserProfile, type UserProfile } from "@/lib/user";

/* ── types ────────────────────────────────────────────────────────────── */

interface AuthContextValue {
  /** Firebase Auth user object — null while loading or signed out */
  user:        User | null;
  /** Firestore profile — null while loading or not yet created */
  profile:     UserProfile | null;
  /** True during the initial auth state resolution */
  loading:     boolean;
  /** Reload the Firestore profile (call after linking a social) */
  refreshProfile: () => Promise<void>;
  /** Sign out and redirect to /login */
  logout:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── provider ────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User) => {
    try {
      const p = await getUserProfile(u.uid);
      setProfile(p);
      
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    await signOut(auth);
    // Hard redirect so all in-memory state is cleared
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── hook ─────────────────────────────────────────────────────────────── */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
