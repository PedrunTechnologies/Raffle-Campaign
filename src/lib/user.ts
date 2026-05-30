import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";




/* ── types ────────────────────────────────────────────────────────────── */

export type SocialPlatform = "instagram" | "facebook";

export interface SocialLink {
  platform: SocialPlatform;
  /** The username/handle — no leading @, no fb/ prefix */
  handle:   string;
  linkedAt: Timestamp;
}

export interface UserProfile {
  uid:          string;
  displayName:  string;
  name:  string;
  email:        string;
  phone:        string | null;
  photoURL:     string | null;
  role:         "participant";
  socials:      Partial<Record<SocialPlatform, SocialLink>>;
  fcmTokens:    string[];       // FCM device tokens for push notifications
  createdAt:    Timestamp;
  updatedAt:    Timestamp;
}


/* ── helpers ─────────────────────────────────────────────────────────── */

const userRef = (uid: string) => doc(db, "users", uid);

/**
 * Called immediately after Firebase Auth creates / signs in a user.
 * Uses setDoc with merge:true so repeat logins never overwrite existing data.
 */
// export async function createOrMergeUserProfile(params: {
//   uid:         string;
//   displayName: string;
//   email:       string;
//   phone?:      string | null;
//   photoURL?:   string | null;
// }) {
//   const ref = userRef(params.uid);
//   const snap = await getDoc(ref);

//   if (!snap.exists()) {
//     // First time — write full profile
//     await setDoc(ref, {
//       uid:         params.uid,
//       displayName: params.displayName,
//       email:       params.email,
//       phone:       params.phone   ?? null,
//       photoURL:    params.photoURL ?? null,
//       role:        "participant",
//       socials:     {},
//       createdAt:   serverTimestamp(),
//       updatedAt:   serverTimestamp(),
//     } satisfies Omit<UserProfile, "createdAt" | "updatedAt"> & {
//       createdAt: unknown; updatedAt: unknown;
//     });
//   } else {
//     // Subsequent logins — only update mutable fields
//     await updateDoc(ref, {
//       displayName: params.displayName,
//       photoURL:    params.photoURL ?? null,
//       updatedAt:   serverTimestamp(),
//     });
//   }
// }


export async function createOrMergeUserProfile(params: {
  uid:          string;
  displayName:  string;
  email:        string;
  phone?:       string | null;
  photoURL?:    string | null;
}) {
  const ref = userRef(params.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         params.uid,
      displayName: params.displayName,
      email:       params.email,
      phone:       params.phone   ?? null,
      photoURL:    params.photoURL ?? null,
      role:        "participant",
      socials:     {},
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      displayName: params.displayName,
      photoURL:    params.photoURL ?? null,
      updatedAt:   serverTimestamp(),
    });
  }
}







/** Fetch the full profile (returns null if not yet created) */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** Persist a social link returned by the OAuth callback */
export async function saveSocialLink(
  uid:      string,
  platform: SocialPlatform,
  handle:   string,
  accessToken: string
) {
  await updateDoc(userRef(uid), {
    [`socials.${platform}`]: {
      platform,
      handle,
      // accessToken, // store server-side; never expose raw token to the browser after save
      linkedAt: serverTimestamp(),
    } satisfies Omit<SocialLink, "linkedAt"> & { linkedAt: unknown },
    updatedAt: serverTimestamp(),
  });
}

/** Remove a social link */
export async function removeSocialLink(uid: string, platform: SocialPlatform) {
  const { deleteField } = await import("firebase/firestore");
  await updateDoc(userRef(uid), {
    [`socials.${platform}`]: deleteField(),
    updatedAt:               serverTimestamp(),
  });
}

