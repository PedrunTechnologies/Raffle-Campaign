
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

  let cred: UserCredential;

  try {
    cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    await updateProfile(cred.user, { displayName: params.name });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;

    console.log(code);

    if (code !== "auth/email-already-in-use") throw err;

    // Auth account already exists — sign in to get the uid and check Firestore
    let existingCred: UserCredential;
    try {
      existingCred = await signInWithEmailAndPassword(auth, params.email, params.password);
    } catch {
      // Wrong password or some other auth error — surface the original duplicate error
      throw err;
    }

    const uid = existingCred.user.uid;

    const [userSnap, vendorSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      // vendors collection uses a separate doc id, query by uid field
      (async () => {
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        const q = query(collection(db, "vendors"), where("uid", "==", uid), limit(1));
        return getDocs(q);
      })(),
    ]);

    if (!userSnap.exists() && vendorSnap.empty) {
      // Orphaned auth account — no Firestore doc in either collection.
      // Recover by writing the users doc and continuing as normal.
      await updateProfile(existingCred.user, { displayName: params.name });
      await finalizeAuth(existingCred, { phone: params.phone, type: "signup" });
      return { uid };
    }

    if (!vendorSnap.empty) {
      // Belongs to a vendor account
      await signOut(auth);
      throw Object.assign(new Error("Email used by vendor."), {
        code: "auth/email-used-by-vendor",
      });
    }

    // Exists in users — genuine duplicate, sign out and surface the error
    await signOut(auth);
    throw err;
  }

  await finalizeAuth(cred, { phone: params.phone, type: "signup" });
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


