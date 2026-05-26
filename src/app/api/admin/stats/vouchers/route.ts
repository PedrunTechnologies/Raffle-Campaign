import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { VoucherRecord } from "@/lib/types";
import { requireAdmin } from "@/lib/require-admin";


export async function GET(req: NextRequest) {
    const result = await requireAdmin(req);
    if ("error" in result) return result.error;


    const { searchParams } = req.nextUrl;
    const cycleId = searchParams.get("cycleId");

    let query = adminDb.collection("vouchers")
        // .where("cycleId", "==", cycleId);
        .orderBy("issuedAt", "desc") as FirebaseFirestore.Query;

    if (cycleId) query = query.where("cycleId", "==", cycleId);

    // const snap     = await query.limit(50).get();
    const snap = await query.get();
    const vouchers = snap.docs.map((d) => d.data() as VoucherRecord);

    return NextResponse.json(vouchers);
}

