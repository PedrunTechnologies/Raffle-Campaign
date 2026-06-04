
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ── helpers ─────────────────────────────────────────────────────────── */

/**
 * After any successful sign-in, write the profile to Firestore and
 * set a session cookie so middleware can gate routes server-side.
 */
// async function finalizeAuth(cred: UserCredential) {
async function finalizeAuth(
  cred: UserCredential,
  extra?: {
    phone?: string;
    type?: string;
  }
) {
  const { user } = cred;

  // For sign-ins (not sign-ups), verify the user exists in the "users" collection.
  if (extra?.type !== "signup") {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) {
      // Sign the user out of Firebase Auth so they're not left in a half-authed state.
      await signOut(auth);
      throw Object.assign(new Error("Account not found."), {
        code: "auth/user-not-in-users-collection",
      });
    }
  }

  const idToken = await user.getIdToken(true);

  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      ...extra,
    }),
  });

  return user;
}

/* ── email / password ─────────────────────────────────────────────────── */

export async function signUpWithEmail(params: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const cred = await createUserWithEmailAndPassword(
    auth,
    params.email,
    params.password
  );

  // Attach display name to Firebase Auth profile
  await updateProfile(cred.user, { displayName: params.name });

  // await finalizeAuth(cred);

  await finalizeAuth(cred, {
    phone: params.phone,
    type: "signup",
  });

  return { uid: cred.user.uid };
}

export async function signInWithEmail(params: {
  email: string;
  password: string;
}) {
  const cred = await signInWithEmailAndPassword(
    auth,
    params.email,
    params.password
  );
  await finalizeAuth(cred);
  return { uid: cred.user.uid };
}

/* ── Google OAuth ─────────────────────────────────────────────────────── */

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  const cred = await signInWithPopup(auth, provider);
  await finalizeAuth(cred);
  return { uid: cred.user.uid };
}


