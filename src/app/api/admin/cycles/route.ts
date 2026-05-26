import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord } from "@/lib/types";

/* ── GET /api/admin/cycles ────────────────────────────────────────────
   Returns all cycles ordered by cycleNumber descending.
   Optional ?status=draft|started|completed filter.
──────────────────────────────────────────────────────────────────────── */
// export async function GET(req: NextRequest) {
//   const result = await requireAdmin(req);
//   if ("error" in result) return result.error;

//   const { searchParams } = req.nextUrl;
//   const status = searchParams.get("status");

//   let query = adminDb
//     .collection("cycles")
//     .orderBy("cycleNumber", "desc") as FirebaseFirestore.Query;

//   if (status) query = query.where("status", "==", status);

//   const snap = await query.limit(100).get();
//   return NextResponse.json(snap.docs.map((d) => d.data() as CycleRecord));
// }

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);

  if ("error" in result) {
    return result.error;
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  let query: FirebaseFirestore.Query = adminDb.collection("cycles");

  if (status) {
    query = query.where("status", "==", status);
  }

  // query = query.orderBy("cycleNumber", "desc");

  const snap = await query.limit(100).get();

  return NextResponse.json(
    snap.docs.map((d) => d.data() as CycleRecord)
  );
}

/* ── POST /api/admin/cycles ───────────────────────────────────────────
   Creates a new draft cycle. Only one started cycle is allowed at a time
   but multiple drafts are fine. cycleNumber is auto-incremented from the
   highest existing number.
──────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const body = await req.json() as {
    windowOpen:        string; // ISO datetime
    windowClose:        string; // ISO datetime
    cooldownHours:      number;
    taskIds:            string[];
    minTasksToQualify:  number;
    estimatedPool:       number;
  };

  /* basic validation */
  // if (!body.windowClose || !body.taskIds?.length) {
  //   return NextResponse.json(
  //     { error: "windowClose and at least one taskId are required." },
  //     { status: 400 }
  //   );
  // }
  if (!body.windowClose) {
    return NextResponse.json(
      { error: "windowClose and at least one taskId are required." },
      { status: 400 }
    );
  }
  if (isNaN(Date.parse(body.windowClose))) {
    return NextResponse.json({ error: "windowClose must be a valid ISO datetime." }, { status: 400 });
  }

  /* derive next cycle number */
  const lastSnap = await adminDb
    .collection("cycles")
    .orderBy("cycleNumber", "desc")
    .limit(1)
    .get();

  const nextNumber = lastSnap.empty
    ? 1
    : (lastSnap.docs[0].data() as CycleRecord).cycleNumber + 1;

  const ref = adminDb.collection("cycles").doc();

  const cycle = {
    id:                 ref.id,
    cycleNumber:        nextNumber,
    status:             "draft",
    windowOpen:         new Date(body.windowOpen),
    windowClose:        new Date(body.windowClose),
    cooldownHours:      body.cooldownHours  ?? 20,
    taskIds:            body.taskIds,
    minTasksToQualify:  body.minTasksToQualify ?? body.taskIds.length,
    estimatedPool:      body.estimatedPool   ?? 1,
    vendorOptIns:       [],
    totalPool:          0,
    drawLogId:          null,
    createdBy:          result.admin.uid,
    startedBy:          null,
    completedBy:        null,
    createdAt:          FieldValue.serverTimestamp(),
    updatedAt:          FieldValue.serverTimestamp(),
  };

  await ref.set(cycle);
  return NextResponse.json({ id: ref.id, cycleNumber: nextNumber }, { status: 201 });
}
