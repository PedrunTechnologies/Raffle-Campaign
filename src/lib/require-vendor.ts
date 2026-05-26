import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { VendorRecord } from "@/lib/types";

/**
 * Call at the top of every vendor API route.
 * Reads the pedrun_vendor_token cookie, verifies with Admin SDK,
 * then loads the vendor doc from /vendors where uid == decoded.uid.
 */
export async function requireVendor(
  req: NextRequest,
): Promise<{ vendor: VendorRecord } | { error: NextResponse }> {
  const cookie = req.cookies.get("pedrun_vendor_token")?.value;
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  const token  = cookie ?? bearer;

  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
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

  // Find vendor doc by uid field
  const snap = await adminDb
    .collection("vendors")
    .where("uid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) {
    return { error: NextResponse.json({ error: "Vendor account not found." }, { status: 403 }) };
  }

  const vendor = snap.docs[0].data() as VendorRecord;

  if (vendor.status === "suspended") {
    return { error: NextResponse.json({ error: "Account suspended. Contact support." }, { status: 403 }) };
  }

  return { vendor };
}
