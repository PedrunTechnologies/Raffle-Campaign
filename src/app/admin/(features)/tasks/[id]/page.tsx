"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { Panel, Badge, PageHeader, FormField } from "@/components/admin/AdminUI";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useParams, useRouter } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineExternalLink } from "react-icons/hi";
import SelectField from "@/components/ui/SelectField";
import type { TaskRecord } from "@/lib/types";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook",  label: "Facebook"  },
  { value: "x",         label: "X (Twitter)" },
  { value: "tiktok",    label: "TikTok"    },
];

const TYPE_OPTIONS = [
  { value: "follow",           label: "Follow"          },
  { value: "share",            label: "Share"           },
  { value: "like",             label: "Like"            },
  { value: "comment",          label: "Comment"         },
  { value: "like_and_comment", label: "Like & Comment"  },
  { value: "repost",           label: "Repost"          },
  { value: "tag_friends",      label: "Tag Friends"     },
  { value: "story_share",      label: "Story Share"     },
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", x: "X", tiktok: "TikTok",
};

const TYPE_LABELS: Record<string, string> = {
  follow: "Follow", share: "Share", like: "Like", comment: "Comment",
  like_and_comment: "Like & Comment", repost: "Repost",
  tag_friends: "Tag Friends", story_share: "Story Share",
};

type Mode = "view" | "edit";

export default function TaskDetailPage() {
  const { user }   = useAdminAuth();
  const params     = useParams();
  const router     = useRouter();
  const id         = params.id as string;

  const [task,        setTask]        = useState<TaskRecord | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [mode,        setMode]        = useState<Mode>("view");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [error,       setError]       = useState("");

  // Edit fields
  const [platform,    setPlatform]    = useState("");
  const [taskType,    setTaskType]    = useState("");
  const [targetUrl,   setTargetUrl]   = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch(`/api/admin/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json() as Promise<TaskRecord>)
        .then((data) => {
          setTask(data);
          setPlatform(data.platform);
          setTaskType(data.taskType);
          setTargetUrl(data.targetUrl);
          setDescription(data.description);
          setLoading(false);
        })
        .catch(() => { setError("Failed to load task."); setLoading(false); })
    );
  }, [user, id]);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const token = await user!.getIdToken();
      const res   = await fetch(`/api/admin/tasks/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ platform, taskType, targetUrl, description }),
      });
      if (!res.ok) { const d = await res.json() as {error?:string}; throw new Error(d.error); }
      setTask((t) => t ? { ...t, platform: platform as TaskRecord["platform"], taskType: taskType as TaskRecord["taskType"], targetUrl, description } : t);
      setMode("view");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true); setError("");
    try {
      const token = await user!.getIdToken();
      const res   = await fetch(`/api/admin/tasks/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json() as {error?:string}; throw new Error(d.error); }
      router.push("/admin/tasks");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to delete.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading task…</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--blue)]">{error || "Task not found."}</p>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/admin/tasks"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <HiOutlineArrowLeft size={15} />
        All tasks
      </Link>

      <PageHeader
        title={<>{PLATFORM_LABELS[task.platform]} · {TYPE_LABELS[task.taskType]}</>}
        sub={`Created ${task.createdAt ? new Date((task.createdAt as unknown as { _seconds: number })._seconds * 1000).toLocaleDateString() : "—"} · ${task.cycleCount} cycle${task.cycleCount !== 1 ? "s" : ""}`}
      >
        {mode === "view" ? (
          <>
            <Button variant="ghost" onClick={() => setMode("edit")}>Edit</Button>
            <Button variant="ghost" onClick={() => setConfirmDel(true)}>Delete</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setMode("view")}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </>
        )}
      </PageHeader>

      {/* Status strip */}
      <div className="mb-6 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm">
          <span className="font-medium text-[var(--ink)]">Platform</span>
          <Badge variant="info">{PLATFORM_LABELS[task.platform]}</Badge>
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm">
          <span className="font-medium text-[var(--ink)]">Type</span>
          <Badge variant="info">{TYPE_LABELS[task.taskType]}</Badge>
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm">
          <span className="font-medium text-[var(--ink)]">Active cycle</span>
          {task.activeInCycle
            ? <Badge variant="ok">Yes — live now</Badge>
            : <Badge variant="info">No</Badge>
          }
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm">
          <span className="font-medium text-[var(--ink)]">Total cycles</span>
          <span className="font-mono text-sm font-semibold">{task.cycleCount}</span>
        </span>
      </div>

      <div className="max-w-2xl space-y-5">

        {mode === "view" ? (
          <Panel title="Task details">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Platform"  value={PLATFORM_LABELS[task.platform]} />
                <FormField label="Task type" value={TYPE_LABELS[task.taskType]}     />
              </div>
              <FormField label="Description" value={task.description} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Target URL
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] px-3.5 py-3">
                  <span className="flex-1 truncate font-mono text-xs text-[var(--ink)]">
                    {task.targetUrl}
                  </span>
                  <a
                    href={task.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[var(--blue)] hover:opacity-75"
                  >
                    <HiOutlineExternalLink size={15} />
                  </a>
                </div>
              </div>
            </div>
          </Panel>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="border-b border-[var(--line)] px-6 py-4">
              <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
                Edit task
              </h3>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField label="Platform"  options={PLATFORM_OPTIONS} value={platform}  onChange={setPlatform} />
                <SelectField label="Task type" options={TYPE_OPTIONS}     value={taskType}  onChange={setTaskType} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Target URL
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] px-4 py-4 text-sm outline-none focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(30,91,255,.10)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[var(--line)] px-4 py-4 text-sm outline-none focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(30,91,255,.10)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cycle usage */}
        <Panel title="Cycle history" right={`${task.cycleCount} total`}>
          {task.cycleIds?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.cycleIds.map((cid) => (
                <span
                  key={cid}
                  className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--ink-soft)]"
                >
                  {cid}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">
              This task hasn&apos;t been used in any cycle yet.
            </p>
          )}
        </Panel>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4 text-sm text-[var(--blue)]">
            {error}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDel(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>
              Delete this task?
            </h3>
            <p className="mb-5 text-sm text-[var(--ink-soft)]">
              {task.activeInCycle
                ? "This task is in the active cycle and cannot be deleted. Remove it from the cycle first."
                : "This task will be permanently removed. Cycle history references will remain."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDel(false)}
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium hover:bg-[var(--grey-100)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={task.activeInCycle || deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
