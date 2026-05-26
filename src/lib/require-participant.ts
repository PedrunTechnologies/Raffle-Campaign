import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function requireParticipant(
  req: NextRequest,
): Promise<{ uid: string } | { error: NextResponse }> {
  const cookie = req.cookies.get("pedrun_token")?.value;
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "");
  const token  = cookie ?? bearer;

  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/id-token-expired") {
      return { error: NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 401 }) };
    }
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
}
