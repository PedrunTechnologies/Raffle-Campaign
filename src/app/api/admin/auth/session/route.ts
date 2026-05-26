import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COOKIE = "pedrun_admin_token";
const MAX_AGE = 60 * 60 * 24; // 24-hour admin sessions

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json() as { idToken: string };

    // 1. Verify the token is a genuine Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    console.log(decoded);

    // 2. Ensure email exists
    const email = decoded.email;

    if (!email) {
      return NextResponse.json(
        { error: "No email associated with this account." },
        { status: 401 }
      );
    }

    // 3. Check Firestore admins collection
    // const snap = await adminDb
    //   .collection("admins")
    //   .where("email", "==", email)
    //   .limit(1)
    //   .get();

    // if (snap.empty) {
    //   return NextResponse.json(
    //     { error: "Access denied. This account is not an admin." },
    //     { status: 403 }
    //   );
    // }

    const snap = await adminDb.doc(`admins/${email}`).get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Access denied. This account is not an admin." },
        { status: 403 }
      );
    }


    // 4. Set the session cookie
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });


    return res;
  } catch (err) {
    console.error("[admin/session POST]", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}


export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}

