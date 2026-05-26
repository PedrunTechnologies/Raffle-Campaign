import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ParticipantRecord } from "@/lib/types";

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // active | flagged | suspended

  let query = adminDb
    .collection("users")
    // .orderBy("createdAt", "desc") as FirebaseFirestore.Query;

  // if (status) query = query.where("status", "==", status);

  const snap = await query.limit(200).get();
  return NextResponse.json(snap.docs.map((d) => d.data() as ParticipantRecord));
}
