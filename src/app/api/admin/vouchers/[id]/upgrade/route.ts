import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { VoucherRecord, CycleRecord, VendorOptIn } from "@/lib/types";


export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { vendorId } = await req.json() as { vendorId?: string };

  const voucherSnap = await adminDb.collection("vouchers").doc(params.code).get();
  if (!voucherSnap.exists) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  const voucher = voucherSnap.data() as VoucherRecord;

  // Only discount vouchers that haven't been redeemed/expired can be upgraded
  if (voucher.type !== "discount") {
    return NextResponse.json({ error: "Only discount vouchers can be upgraded." }, { status: 409 });
  }
  if (!["won", "issued", "eligible"].includes(voucher.status)) {
    return NextResponse.json(
      { error: `Cannot upgrade a voucher with status "${voucher.status}".` },
      { status: 409 }
    );
  }

  // Load the cycle to calculate leftover free slots
  const cycleSnap = await adminDb.collection("cycles").doc(voucher.cycleId).get();
  if (!cycleSnap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }
  const cycle = cycleSnap.data() as CycleRecord;

  // Total free slots across all vendor opt-ins in this cycle
  const totalFreeSlots = (cycle.vendorOptIns ?? []).reduce(
    (sum: number, v: VendorOptIn) => sum + (v.freeVouchers ?? 0),
    0
  );

  // How many free vouchers have already been issued in this cycle
  const issuedFreeSnap = await adminDb
    .collection("vouchers")
    .where("cycleId", "==", voucher.cycleId)
    .where("type", "==", "free")
    .get();
  const issuedFreeCount = issuedFreeSnap.size;

  const leftover = totalFreeSlots - issuedFreeCount;

  if (leftover <= 0) {
    return NextResponse.json(
      { error: "No leftover free vouchers available for this cycle." },
      { status: 409 }
    );
  }

  // Determine the vendor for the upgraded voucher.
  // If the caller specifies a vendorId, validate it's in the cycle's opt-ins.
  // Otherwise keep the existing vendor (or pick the first opt-in with free slots).
  let targetVendorId   = voucher.vendorId;
  let targetVendorName = voucher.vendorName ?? null;

  if (vendorId) {
    const optIn = (cycle.vendorOptIns ?? []).find((v: VendorOptIn) => v.vendorId === vendorId);
    if (!optIn) {
      return NextResponse.json({ error: "Vendor not found in this cycle's opt-ins." }, { status: 400 });
    }
    targetVendorId   = vendorId;
    targetVendorName = optIn.vendorName;
  } else if (!targetVendorId) {
    // Fall back to the first opt-in vendor that still has free headroom
    for (const optIn of cycle.vendorOptIns ?? []) {
      const vendorFreeIssued = issuedFreeSnap.docs.filter(
        (d) => (d.data() as VoucherRecord).vendorId === optIn.vendorId
      ).length;
      if (vendorFreeIssued < (optIn.freeVouchers ?? 0)) {
        targetVendorId   = optIn.vendorId;
        targetVendorName = optIn.vendorName;
        break;
      }
    }
  }

  // Upgrade the voucher
  await voucherSnap.ref.update({
    type:        "free",
    discountPct: null,
    vendorId:    targetVendorId,
    vendorName:  targetVendorName,
    upgradedAt:  FieldValue.serverTimestamp(),
    upgradedBy:  result.admin.uid,
  });

  return NextResponse.json({
    ok:          true,
    code:        voucher.code,
    vendorId:    targetVendorId,
    vendorName:  targetVendorName,
    leftoversAfterUpgrade: leftover - 1,
  });
}

