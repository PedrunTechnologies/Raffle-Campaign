import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { AdminRecord } from "@/lib/types";

/**
 * Call at the top of every admin API route handler.
 * Returns the verified AdminRecord or a 401/403 NextResponse to return early.
 */

export async function requireAdmin(
  req: NextRequest
): Promise<{ admin: AdminRecord } | { error: NextResponse }> {

  const cookie = req.cookies.get("pedrun_admin_token")?.value;
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");

  // const token = cookie ?? bearer;
  const token = bearer ?? cookie;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    const email = decoded.email;

    if (!email) {
      return {
        error: NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        ),
      };
    }

    const snap = await adminDb.doc(`admins/${email}`).get();

    if (!snap.exists) {
      return {
        error: NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        ),
      };
    }

    const admin: AdminRecord = {
      uid: decoded.uid,
      email,
      displayName: decoded.name ?? "",
      role: "ops",
    };

    return { admin };

  } catch (err: any) {

    // IMPORTANT: detect expired token separately
    if (err.code === "auth/id-token-expired") {
      return {
        error: NextResponse.json(
          { error: "TOKEN_EXPIRED" },
          { status: 401 }
        ),
      };
    }

    return {
      error: NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      ),
    };
  }
}

