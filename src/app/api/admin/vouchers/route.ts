import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { VoucherRecord, ParticipantRecord, VendorRecord } from "@/lib/types";

export interface VoucherRow {
  code:             string;
  codeMasked:       string;
  cycleId:          string;
  type:             "free" | "discount" | null;
  discountPct:      number | null;
  status:           VoucherRecord["status"];
  issuedAt:         { _seconds: number } | null;
  expiresAt:        { _seconds: number } | null;
  redeemedAt:       { _seconds: number } | null;
  participantId:    string;
  participantName:  string;
  participantEmail: string;
  participantPhone: string | null;
  vendorId:         string | null;
  vendorName:       string | null;
}

function maskCode(code: string): string {
  // Show first 4 chars, mask the rest except last 3: ABCD-****-XYZ
  if (code.length <= 7) return code.slice(0, 2) + "****";
  return code.slice(0, 4) + "-****-" + code.slice(-3);
}

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status");
  const cycleFilter  = searchParams.get("cycleId");

  let query: FirebaseFirestore.Query = adminDb.collection("vouchers");
  if (statusFilter) query = query.where("status",  "==", statusFilter);
  if (cycleFilter)  query = query.where("cycleId", "==", cycleFilter);

  const snap = await query.orderBy("issuedAt", "desc").limit(300).get();
  const vouchers = snap.docs.map((d) => d.data() as VoucherRecord);

  if (vouchers.length === 0) return NextResponse.json([]);

  // Batch-fetch participants and vendors in parallel
  const participantIds = [...new Set(vouchers.map((v) => v.participantId).filter(Boolean))];
  const vendorIds      = [...new Set(vouchers.map((v) => v.vendorId).filter((id): id is string => !!id))];

  const [participantSnaps, vendorSnaps] = await Promise.all([
    participantIds.length
      ? adminDb.getAll(...participantIds.map((id) => adminDb.collection("users").doc(id)))
      : Promise.resolve([]),
    vendorIds.length
      ? adminDb.getAll(...vendorIds.map((id) => adminDb.collection("vendors").doc(id)))
      : Promise.resolve([]),
  ]);

  const participants = new Map<string, ParticipantRecord>();
  participantSnaps.forEach((d) => { if (d.exists) participants.set(d.id, d.data() as ParticipantRecord); });

  const vendors = new Map<string, VendorRecord>();
  vendorSnaps.forEach((d) => { if (d.exists) vendors.set(d.id, d.data() as VendorRecord); });

  const rows: VoucherRow[] = vouchers.map((v) => {
    const p = participants.get(v.participantId);
    const vendor = v.vendorId ? vendors.get(v.vendorId) : undefined;
    return {
      code:             v.code,
      codeMasked:       maskCode(v.code),
      cycleId:          v.cycleId,
      type:             v.type,
      discountPct:      v.discountPct,
      status:           v.status,
      issuedAt:         v.issuedAt  ? { _seconds: (v.issuedAt  as any)._seconds }  : null,
      expiresAt:        v.expiresAt ? { _seconds: (v.expiresAt as any)._seconds } : null,
      redeemedAt:       v.redeemedAt ? { _seconds: (v.redeemedAt as any)._seconds } : null,
      participantId:    v.participantId,
      participantName:  p?.name ?? p?.displayName ?? "Unknown",
      participantEmail: p?.email ?? "—",
      participantPhone: p?.phone ?? null,
      vendorId:         v.vendorId ?? null,
      vendorName:       vendor?.name ?? v.vendorName ?? null,
    };
  });

  return NextResponse.json(rows);
}