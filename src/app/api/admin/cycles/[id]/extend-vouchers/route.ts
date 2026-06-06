import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { CycleRecord, VoucherRecord } from "@/lib/types";

const EXTEND_HOURS = 72;
const EXTEND_MS    = EXTEND_HOURS * 60 * 60 * 1000;

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const cycleSnap = await adminDb.doc(`cycles/${id}`).get();
  if (!cycleSnap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const cycle = cycleSnap.data() as CycleRecord;

  if (cycle.status === "draft") {
    return NextResponse.json(
      { error: "Cycle hasn't started yet — no vouchers to extend." },
      { status: 409 }
    );
  }

  // Fetch all active vouchers for this cycle (exclude redeemed, expired, no_prize)
  const vouchersSnap = await adminDb
    .collection("vouchers")
    .where("cycleId", "==", id)
    .where("status", "in", ["issued", "eligible", "won"])
    .get();

  if (vouchersSnap.empty) {
    return NextResponse.json(
      { error: "No active vouchers found for this cycle." },
      { status: 409 }
    );
  }

  // Firestore batch limit is 500 — use BulkWriter for safety on large cycles
  const writer = adminDb.bulkWriter();

  let updatedCount = 0;

  for (const doc of vouchersSnap.docs) {
    const voucher = doc.data() as VoucherRecord;

    // expiresAt is a Firestore Timestamp
    const currentExpiry = (voucher.expiresAt as unknown as Timestamp).toMillis();
    const newExpiry     = new Date(currentExpiry + EXTEND_MS);

    writer.update(doc.ref, {
      expiresAt:  newExpiry,
      updatedAt:  FieldValue.serverTimestamp(),
    });

    updatedCount++;
  }

  // Also bump cooldownHours on the cycle doc so the record reflects the change
  writer.update(cycleSnap.ref, {
    cooldownHours: (cycle.cooldownHours ?? 0) + EXTEND_HOURS,
    updatedAt:     FieldValue.serverTimestamp(),
  });

  await writer.close();

  return NextResponse.json({
    ok:           true,
    extendedBy:   EXTEND_HOURS,
    updatedCount,
  });
}

