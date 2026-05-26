import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { TaskRecord, TaskPlatform, TaskType } from "@/lib/types";

/* ── GET /api/admin/tasks ─────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const snap  = await adminDb.collection("tasks").orderBy("createdAt", "desc").get();
  const tasks = snap.docs.map((d) => d.data() as TaskRecord);
  return NextResponse.json(tasks);
}

/* ── POST /api/admin/tasks ────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const body = await req.json() as {
    platform:    TaskPlatform;
    taskType:    TaskType;
    targetUrl:   string;
    description: string;
  };

  // Basic validation
  if (!body.platform || !body.taskType || !body.targetUrl || !body.description) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Validate targetUrl is a real URL
  try { new URL(body.targetUrl); } catch {
    return NextResponse.json({ error: "targetUrl must be a valid URL." }, { status: 400 });
  }

  const ref = adminDb.collection("tasks").doc();

  const task: Omit<TaskRecord, "createdAt" | "updatedAt"> & {
    createdAt: unknown; updatedAt: unknown;
  } = {
    id:            ref.id,
    platform:      body.platform,
    taskType:      body.taskType,
    targetUrl:     body.targetUrl,
    description:   body.description,
    activeInCycle: false,
    cycleCount:    0,
    cycleIds:      [],
    createdBy:     result.admin.uid,
    createdAt:     FieldValue.serverTimestamp(),
    updatedAt:     FieldValue.serverTimestamp(),
  };

  await ref.set(task);
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
