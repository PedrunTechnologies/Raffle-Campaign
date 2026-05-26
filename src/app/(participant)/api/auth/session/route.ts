import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COOKIE_NAME = "pedrun_token";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

/** POST /api/auth/session — verify ID token and set session cookie */


export async function POST(req: NextRequest) {
  try {
    // const { idToken } = await req.json() as { idToken: string };

    const {
      idToken,
      phone,
      type
    } = await req.json() as {
      idToken: string;
      phone?: string;
      type?: string;
    };

    const decoded = await adminAuth.verifyIdToken(idToken);

    // Create/update Firestore profile securely on server
    // await adminDb.collection("users").doc(decoded.uid).set(
    //   {
    //     uid: decoded.uid,
    //     email: decoded.email,
    //     name: decoded.name,

    //     phone,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   { merge: true }
    // );

    const userData: Record<string, any> = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      updatedAt: new Date(),
    };

    // Only add these during signup
    if (type === "signup") {
      userData.phone = phone;
      userData.createdAt = new Date();
    }

    await adminDb.collection("users").doc(decoded.uid).set(
      userData,
      { merge: true }
    );

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[session] token verification failed:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

/** DELETE /api/auth/session — clear the cookie on logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
