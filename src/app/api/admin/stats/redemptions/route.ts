import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { RedemptionRecord } from "@/lib/types";


export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { searchParams } = req.nextUrl;
  const vendorId = searchParams.get("vendorId");

  const snap = await adminDb
    .collection("redemptions")
    .where("vendorId", "==", vendorId)
    .orderBy("redeemedAt", "desc")
    .limit(100)
    .get();

  return NextResponse.json(snap.docs.map((d) => d.data() as RedemptionRecord));
}

