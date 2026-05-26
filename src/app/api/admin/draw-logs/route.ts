import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { DrawLogRecord } from "@/lib/types";

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { searchParams } = req.nextUrl;
  const cycleId = searchParams.get("cycleId");

  let query = adminDb
    .collection("drawLogs")
    .orderBy("executedAt", "desc") as FirebaseFirestore.Query;

  if (cycleId) query = query.where("cycleId", "==", cycleId);

  const snap = await query.limit(100).get();
  return NextResponse.json(snap.docs.map((d) => d.data() as DrawLogRecord));
}
