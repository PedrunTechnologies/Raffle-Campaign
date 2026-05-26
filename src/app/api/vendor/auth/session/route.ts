import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COOKIE  = "pedrun_vendor_token";
const MAX_AGE = 60 * 60 * 24; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json() as { idToken: string };
    const decoded     = await adminAuth.verifyIdToken(idToken);

    // Check the user has a vendor doc
    const snap = await adminDb
      .collection("vendors")
      .where("uid", "==", decoded.uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "No vendor account found for this login." },
        { status: 403 }
      );
    }

    const vendor = snap.docs[0].data();
    if (vendor.status === "suspended") {
      return NextResponse.json(
        { error: "This account has been suspended. Contact support." },
        { status: 403 }
      );
    }

    // if (vendor.status === "pending") {
    //   return NextResponse.json(
    //     { error: "Your application is still under review. We'll email you once approved." },
    //     { status: 403 }
    //   );
    // }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, idToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   MAX_AGE,
      path:     "/",
    });
    return res;
  } catch (err) {
    console.error("[vendor/session POST]", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
