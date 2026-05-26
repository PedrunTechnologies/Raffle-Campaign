import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";


export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);

  if ("error" in result) {
    return result.error;
  }

  const { searchParams } = req.nextUrl;
  const cycleId = searchParams.get("cycleId");

  let query: FirebaseFirestore.Query = adminDb.collection("taskSubmissions");

  if (cycleId) {
    query = query.where("cycleId", "==", cycleId);
  }

  const snap = await query.limit(1000).get();


  type TaskSubmission = {
  id: string;
  cycleId: string;
  participantId: string;
  taskId: string;
  verified: boolean;
  submittedAt: FirebaseFirestore.Timestamp;
};

const submissions: TaskSubmission[] = snap.docs.map((d) => ({
  id: d.id,
  ...(d.data() as Omit<TaskSubmission, "id">),
}));

const participantIds = new Set(
  submissions.map((submission) => submission.participantId)
);


  return NextResponse.json({
    submissions,
    participantCount: participantIds.size,
  });
}