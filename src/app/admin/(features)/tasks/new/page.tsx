"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { PageHeader } from "@/components/admin/AdminUI";
import SelectField from "@/components/ui/SelectField";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { HiOutlineArrowLeft, HiOutlineExternalLink } from "react-icons/hi";

/* ── Options ──────────────────────────────────────────────────────── */

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X (Twitter)" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
];

const TASK_TYPE_OPTIONS = [
  { value: "follow", label: "Follow" },
  { value: "share", label: "Share" },
  { value: "like", label: "Like" },
  { value: "comment", label: "Comment" },
  { value: "like_and_comment", label: "Like & Comment" },
  { value: "repost", label: "Repost" },
  { value: "tag_friends", label: "Tag Friends" },
  { value: "story_share", label: "Story Share" },
  { value: "join_group", label: "Join Group" },
];

/* URL type: follow tasks target a profile; engagement tasks target a post */
const PROFILE_TASKS = new Set(["follow"]);

function urlHint(taskType: string, platform: string): string {
  if (PROFILE_TASKS.has(taskType)) {
    const examples: Record<string, string> = {
      instagram: "https://www.instagram.com/pedrun_deliveries/",
      facebook: "https://www.facebook.com/pedrun_deliveries",
      x: "https://x.com/pedrun_deliveries",
      tiktok: "https://www.tiktok.com/@pedrun_deliveries",
    };
    return `Profile URL — e.g. ${examples[platform] ?? "https://…"}`;
  }
  return "Post URL — link to the specific post participants must engage with.";
}

function descriptionTemplate(taskType: string, platform: string, url: string): string {
  const p = PLATFORM_OPTIONS.find((o) => o.value === platform)?.label ?? platform;
  const handle = url ? ` (@${url.split("/").filter(Boolean).pop()})` : "";
  switch (taskType) {
    case "follow": return `Follow us on ${p}${handle}`;
    case "share": return `Share today's campaign post on ${p}`;
    case "like": return `Like our post on ${p}`;
    case "comment": return `Leave a comment on our ${p} post`;
    case "like_and_comment": return `Like and comment on our ${p} post`;
    case "join_group": return `Join our ${p} group`;
    case "repost": return `Repost our post on ${p}`;
    case "tag_friends": return `Tag 2 friends in the comments on ${p}`;
    case "story_share": return `Share the post to your ${p} story`;
    default: return "";
  }
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function NewTaskPage() {
  const { user } = useAdminAuth();
  const router = useRouter();

  const [platform, setPlatform] = useState("instagram");
  const [taskType, setTaskType] = useState("follow");
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [urlError, setUrlError] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  // Auto-fill description when platform/type changes (only if currently matches template)
  function handlePlatformChange(v: string) {
    setPlatform(v);
    const tpl = descriptionTemplate(taskType, v, targetUrl);
    if (!description || description === descriptionTemplate(taskType, platform, targetUrl)) {
      setDescription(tpl);
    }
  }

  function handleTypeChange(v: string) {
    setTaskType(v);
    const tpl = descriptionTemplate(v, platform, targetUrl);
    if (!description || description === descriptionTemplate(taskType, platform, targetUrl)) {
      setDescription(tpl);
    }
  }

  function validateUrl(val: string) {
    if (!val) { setUrlError("URL is required."); return false; }
    try { new URL(val); setUrlError(""); return true; }
    catch { setUrlError("Must be a valid URL including https://"); return false; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateUrl(targetUrl)) return;
    setServerError("");
    setSaving(true);

    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, taskType, targetUrl, description }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setServerError(data.error ?? "Failed to create task.");
        return;
      }

      router.push("/admin/tasks");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
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
        title={<>New <em className="italic text-[var(--blue)]">task</em></>}
        sub="Tasks are assigned to cycles and auto-verified against the platform API."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">

        {/* Platform + type row */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-6 py-4">
            <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
              Task definition
            </h3>
          </div>
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Platform"
                options={PLATFORM_OPTIONS}
                value={platform}
                onChange={handlePlatformChange}
              />
              <SelectField
                label="Task type"
                options={TASK_TYPE_OPTIONS}
                value={taskType}
                onChange={handleTypeChange}
              />
            </div>

            {/* Target URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                {PROFILE_TASKS.has(taskType) ? "Profile URL" : "Post URL"}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => { setTargetUrl(e.target.value); validateUrl(e.target.value); }}
                  onBlur={(e) => validateUrl(e.target.value)}
                  placeholder="https://…"
                  required
                  className={`
                    w-full rounded-2xl border px-4 py-4 pr-12 text-sm outline-none transition-all
                    placeholder:text-[var(--grey-300)]
                    focus:ring-4 focus:ring-[rgba(30,91,255,.10)]
                    ${urlError
                      ? "border-[var(--blue)] focus:border-[var(--blue)]"
                      : "border-[var(--line)] focus:border-[var(--blue)]"
                    }
                  `}
                />
                {targetUrl && !urlError && (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    title="Preview URL"
                  >
                    <HiOutlineExternalLink size={16} />
                  </a>
                )}
              </div>
              {urlError
                ? <p className="text-xs text-[var(--blue)]">{urlError}</p>
                : <p className="text-xs text-[var(--ink-soft)]">{urlHint(taskType, platform)}</p>
              }
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Description
                <span className="ml-2 font-normal normal-case tracking-normal text-[var(--mute)]">
                  shown to participants
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Follow us on Instagram (@pedrun_deliveries)"
                className="
                  w-full resize-none rounded-2xl border border-[var(--line)]
                  px-4 py-4 text-sm outline-none transition-all
                  placeholder:text-[var(--grey-300)]
                  focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(30,91,255,.10)]
                "
              />
              <p className="text-xs text-[var(--ink-soft)]">
                Auto-filled based on platform and type — edit freely.
              </p>
            </div>
          </div>
        </div>

        {/* Verification note */}
        <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
          <p className="text-xs text-[var(--ink-soft)]">
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--blue)] text-[10px] font-bold text-white">
              i
            </span>
            <strong className="text-[var(--ink)]">Verification:</strong>{" "}
            Follow tasks are verified via the platform&apos;s API by checking if the participant&apos;s linked handle follows the target profile. Post engagement tasks check likes, comments, reposts, or shares against the post URL. The system retries verification for up to 30 minutes after the participant marks the task done.
          </p>
        </div>

        {serverError && (
          <div className="rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4 text-sm text-[var(--blue)]">
            {serverError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/tasks">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create task"}
          </Button>
        </div>
      </form>
    </>
  );
}
