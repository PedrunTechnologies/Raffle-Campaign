"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader } from "@/components/admin/AdminUI";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { TaskRecord } from "@/lib/types";
import { adminGet } from "@/lib/admin-fetch";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook:  "Facebook",
  x:         "X",
  tiktok:    "TikTok",
};

const TYPE_LABELS: Record<string, string> = {
  follow:           "Follow",
  share:            "Share",
  like:             "Like",
  comment:          "Comment",
  like_and_comment: "Like & Comment",
  repost:           "Repost",
  tag_friends:      "Tag Friends",
  story_share:      "Story Share",
};

export default function TasksPage() {
  const { user } = useAdminAuth();
  const [tasks,   setTasks]   = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // useEffect(() => {
  //   if (!user) return;
  //   user.getIdToken().then((token) =>
  //     fetch("/api/admin/tasks", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //       .then((r) => r.json() as Promise<TaskRecord[]>)
  //       .then((data) => { setTasks(data); setLoading(false); })
  //       .catch(() => { setError("Failed to load tasks."); setLoading(false); })
  //   );
  // }, [user]);


    const loadData = useCallback(async () => {
      setLoading(true);
      try {
        const startedCycles = await adminGet<TaskRecord[]>("/api/admin/tasks");
  
        setTasks(startedCycles);
  
      } catch (err) {
        console.error("[tasks] loadData:", err);
      } finally {
        setLoading(false);
      }
    }, [user]);
  
    useEffect(() => { loadData(); }, [loadData]);


  return (
    <>
      <PageHeader
        title={<>Manage <em className="italic text-[var(--blue)]">tasks</em></>}
        sub="Tasks are assigned to cycles. Each task is auto-verified against the platform."
      >
        <Link href="/admin/tasks/new">
          <Button>+ New task</Button>
        </Link>
      </PageHeader>

      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total tasks",        value: String(tasks.length) },
          { label: "Active in cycle",    value: String(tasks.filter((t) => t.activeInCycle).length) },
          { label: "Platforms covered",  value: String(new Set(tasks.map((t) => t.platform)).size) },
          { label: "Avg cycle usage",    value: tasks.length ? String(Math.round(tasks.reduce((s, t) => s + t.cycleCount, 0) / tasks.length)) : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              {s.label}
            </p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      <Panel title="All tasks" noPadding>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--ink-soft)]">Loading tasks…</div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--blue)]">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="mb-2 text-sm font-semibold text-[var(--ink)]">No tasks yet</p>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">Create your first task to get started.</p>
            <Link href="/admin/tasks/new"><Button>+ New task</Button></Link>
          </div>
        ) : (
          <Table headers={["Platform", "Type", "Description", "Target URL", "Cycles", "Active", ""]}>
            {tasks.map((task) => (
              <Tr key={task.id}>
                <Td>
                  <span className="font-medium">{PLATFORM_LABELS[task.platform] ?? task.platform}</span>
                </Td>
                <Td>{TYPE_LABELS[task.taskType] ?? task.taskType}</Td>
                <Td className="max-w-[200px] truncate text-[var(--ink-soft)]">
                  {task.description}
                </Td>
                <Td>
                  <a
                    href={task.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[var(--blue)] hover:underline"
                  >
                    {new URL(task.targetUrl).hostname}…
                  </a>
                </Td>
                <Td mono>{task.cycleCount}</Td>
                <Td>
                  {task.activeInCycle
                    ? <Badge variant="ok">Live</Badge>
                    : <Badge variant="info">—</Badge>
                  }
                </Td>
                <Td>
                  <Link
                    href={`/admin/tasks/${task.id}`}
                    className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                  >
                    ›
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
