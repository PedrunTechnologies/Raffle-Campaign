
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

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


  // Mint a short-lived ID token and store it in a cookie so
  // the Edge middleware can read it without hitting Firestore.
  // const idToken = await user.getIdToken();
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
