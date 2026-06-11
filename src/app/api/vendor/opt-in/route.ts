import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireVendor } from "@/lib/require-vendor";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord, DiscountTier } from "@/lib/types";

interface OptInPayload {
  freeVouchers: number;
  freeMealAmount: number;
  freeDineIn: "yes" | "no";
  freeDineUntil: string;
  discountTiers: DiscountTier[];
}

export async function POST(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;

  const body = await req.json() as OptInPayload;

  const freeVouchers = Number(body.freeVouchers) || 0;
  const discountTiers = body.discountTiers ?? [];
  const freeMealAmount = body.freeMealAmount ?? 0;
  const freeDineIn = body.freeDineIn ?? false;
  const freeDineUntil = body.freeDineUntil ?? null;
  const totalVouchers = freeVouchers + discountTiers.reduce((s: number, t: DiscountTier) => s + (Number(t.quantity) || 0), 0);

  if (totalVouchers === 0) {
    return NextResponse.json(
      { error: "You must declare at least one voucher." },
      { status: 400 }
    );
  }

  // Find the active (started) cycle
  const cycleSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (cycleSnap.empty) {
    return NextResponse.json(
      { error: "No active cycle is open for opt-in right now." },
      { status: 409 }
    );
  }

  const cycleDoc = cycleSnap.docs[0];



  const cycle = cycleDoc.data() as CycleRecord;

  // // Check if vendor already opted in
  // const existingIdx = (cycle.vendorOptIns ?? []).findIndex(
  //   (v) => v.vendorId === result.vendor.id
  // );

  // const optIn = {
  //   vendorId: result.vendor.id,
  //   vendorName: result.vendor.name,
  //   freeVouchers,
  //   discountTiers,
  // };

  // let updatedOptIns = [...(cycle.vendorOptIns ?? [])];
  // if (existingIdx >= 0) {
  //   updatedOptIns[existingIdx] = optIn; // update existing entry
  // } else {
  //   updatedOptIns.push(optIn);           // new entry
  // }

  // const totalPool = updatedOptIns.reduce((s, v) => {
  //   const discTotal = v.discountTiers.reduce(
  //     (ds: number, t: DiscountTier) => ds + (Number(t.quantity) || 0), 0
  //   );
  //   return s + v.freeVouchers + discTotal;
  // }, 0);

  // await cycleDoc.ref.update({
  //   vendorOptIns: updatedOptIns,
  //   totalPool,
  //   updatedAt: FieldValue.serverTimestamp(),
  // });



  await adminDb.runTransaction(async (tx) => {
    const freshCycleSnap = await tx.get(cycleDoc.ref);
    const cycle = freshCycleSnap.data() as CycleRecord;

    const existingIdx = (cycle.vendorOptIns ?? []).findIndex(
      (v) => v.vendorId === result.vendor.id
    );

    const optIn = {
      vendorId: result.vendor.id,
      vendorName: result.vendor.name,
      freeVouchers,
      discountTiers,
      freeMealAmount,
      freeDineIn,
      freeDineUntil,
    };

    let updatedOptIns = [...(cycle.vendorOptIns ?? [])];

    if (existingIdx >= 0) {
      updatedOptIns[existingIdx] = optIn;
    } else {
      updatedOptIns.push(optIn);
    }

    const totalPool = updatedOptIns.reduce((s, v) => {
      const discTotal = v.discountTiers.reduce(
        (ds: number, t: DiscountTier) =>
          ds + (Number(t.quantity) || 0),
        0
      );

      return s + v.freeVouchers + discTotal;
    }, 0);

    // Update cycle
    tx.update(cycleDoc.ref, {
      vendorOptIns: updatedOptIns,
      totalPool,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Add cycle ID to vendor
    const vendorRef = adminDb.collection("vendors").doc(result.vendor.id);

    tx.set(
      vendorRef,
      {
        cycles: FieldValue.arrayUnion(cycle.id),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });


  return NextResponse.json({ ok: true, totalVouchers, cycleId: cycle.id });
}


// GET — check if vendor has already opted in to the active cycle
export async function GET(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;

  const cycleSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (cycleSnap.empty) {
    return NextResponse.json({ active: false, optedIn: false });
  }

  const cycle = cycleSnap.docs[0].data() as CycleRecord;
  const optIn = (cycle.vendorOptIns ?? []).find(
    (v) => v.vendorId === result.vendor.id
  ) ?? null;

  return NextResponse.json({
    active: true,
    cycleId: cycle.id,
    cycleNumber: cycle.cycleNumber,
    windowClose: cycle.windowClose,
    estimatedPool: cycle.estimatedPool,
    totalPool: cycle.totalPool,
    vendorCount: cycle.vendorOptIns.length,
    // windowClose: cycle.windowClose,
    optedIn: !!optIn,
    optIn,
  });
}



