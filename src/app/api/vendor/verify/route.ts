import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireVendor } from "@/lib/require-vendor";
import { FieldValue } from "firebase-admin/firestore";
import type { VoucherRecord } from "@/lib/types";

// GET — look up a voucher code without redeeming it
export async function GET(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Voucher code is required." }, { status: 400 });
  }

  const snap = await adminDb.collection("vouchers").doc(code).get();
  if (!snap.exists) {
    return NextResponse.json({ state: "unknown" });
  }

  const voucher = snap.data() as VoucherRecord;
  const now     = new Date();
  const expiry  = new Date((voucher.expiresAt as unknown as { _seconds: number })._seconds * 1000);

  if (voucher.status === "redeemed") {
    return NextResponse.json({ state: "redeemed", voucher });
  }
  if (voucher.status === "expired" || expiry < now) {
    return NextResponse.json({ state: "expired", voucher });
  }
  if (voucher.status !== "eligible") {
    return NextResponse.json({ state: "unknown" });
  }

  return NextResponse.json({ state: "valid", voucher });
}

// POST — mark a valid voucher as redeemed
export async function POST(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;

  const { code } = await req.json() as { code: string };
  const upperCode = code?.toUpperCase();

  if (!upperCode) {
    return NextResponse.json({ error: "Voucher code is required." }, { status: 400 });
  }

  const ref  = adminDb.collection("vouchers").doc(upperCode);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  const voucher = snap.data() as VoucherRecord;
  const now     = new Date();
  const expiry  = new Date((voucher.expiresAt as unknown as { _seconds: number })._seconds * 1000);

  if (voucher.status === "redeemed") {
    return NextResponse.json({ error: "This voucher has already been redeemed." }, { status: 409 });
  }
  if (voucher.status === "expired" || expiry < now) {
    return NextResponse.json({ error: "This voucher has expired." }, { status: 409 });
  }
  if (voucher.status !== "eligible") {
    return NextResponse.json({ error: "This voucher is not valid for redemption." }, { status: 409 });
  }

  // Write redemption record + update voucher atomically
  const redemptionRef = adminDb.collection("redemptions").doc();
  const batch = adminDb.batch();

  batch.update(ref, {
    status:     "redeemed",
    vendorId:   result.vendor.id,
    redeemedAt: FieldValue.serverTimestamp(),
    updatedAt:  FieldValue.serverTimestamp(),
  });

  batch.set(redemptionRef, {
    id:            redemptionRef.id,
    voucherCode:   upperCode,
    cycleId:       voucher.cycleId,
    vendorId:      result.vendor.id,
    participantId: voucher.participantId,
    type:          voucher.type,
    discountPct:   voucher.discountPct,
    redeemedAt:    FieldValue.serverTimestamp(),
    redeemedBy:    result.vendor.uid,
  });

  await batch.commit();

  return NextResponse.json({ ok: true, code: upperCode, type: voucher.type });
}
