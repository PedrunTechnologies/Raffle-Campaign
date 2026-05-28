"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
// import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader, KpiTile } from "@/components/admin/AdminUI";
import { useToast } from "@/components/ui/Toast";
// import { useAdminAuth } from "@/context/AdminAuthContext";

import { adminGet, AdminFetchError } from "@/lib/admin-fetch";
import type { ParticipantRecord } from "@/lib/types";



function fmtTs(ts: { seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}


const STATUS_BADGE: Record<string, { variant: "ok" | "pending" | "danger" | "info"; label: string }> = {
  active: { variant: "ok", label: "Active" },
  flagged: { variant: "danger", label: "Flagged" },
  suspended: { variant: "danger", label: "Suspended" },
};




export default function ParticipantsPage() {

  // const { user } = useAdminAuth();

  const { toast } = useToast();
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");



  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startedCycles = await adminGet<ParticipantRecord[]>("/api/admin/participants");

      setParticipants(startedCycles);

    } catch (err) {
      console.error("[tasks] loadData:", err);
      toast(err instanceof AdminFetchError ? err.message : "Failed to load participants.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);




  // useEffect(() => {
  //   adminGet<ParticipantRecord[]>("/api/admin/participants")
  //     .then((data) => { setParticipants(data); setLoading(false); })
  //     .catch((err) => {
  //       toast(err instanceof AdminFetchError ? err.message : "Failed to load participants.", "error");
  //       setLoading(false);
  //     });
  // }, [toast]);

  const active = participants.filter((p) => p.status === "active").length;
  const flagged = participants.filter((p) => p.status === "flagged").length;
  const suspended = participants.filter((p) => p.status === "suspended").length;



  return (
    <>
      <PageHeader
        title={<>Participants <em className="italic text-[var(--blue)]">today</em></>}
        sub="All registered participants. Click a row to view details."
      >
        {/* <Button variant="ghost">Filter</Button>
        <Button onClick={() => {
          const csv = [
            ["Name", "Email", "Phone", "Status", "Socials"].join(","),
            ...participants.map((p) => [
              p.displayName, p.email, p.phone ?? "",
              p.status,
              Object.values(p.socials ?? {}).map((s) => s?.handle).join(" | "),
            ].join(","))
          ].join("\n");
          const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
          Object.assign(document.createElement("a"), { href: url, download: "participants.csv" }).click();
        }}>
          Export CSV
        </Button> */}
      </PageHeader>


      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: String(participants.length) },
          { label: "Active", value: String(active) },
          { label: "Flagged", value: String(flagged) },
          { label: "Suspended", value: String(suspended) },
        ].map((s) => (
          <KpiTile
            key={s.label}
            label={s.label}
            value={loading ? "—" : s.value}
            detail=""
          />
        ))}
      </div>

      <Panel title="Participant list" noPadding>
        {(!loading && participants.length === 0) ? (
          <div className="px-5 py-14 text-center text-sm text-[var(--ink-soft)]">No participants yet.</div>
        ) : (
          // <Table loading={loading} headers={["Name", "Email", "Phone", "Socials", "Status", ""]}>
          <Table loading={loading} headers={["Name", "Email", "Phone", "Socials", "Date Joined", "Status", ""]}>
            {participants.map((p) => {
              const sb = STATUS_BADGE[p.status] ?? { variant: "info" as const, label: p.status };
              const handles = Object.values(p.socials ?? {})
                .map((s) => `@${s?.handle}`)
                .join(", ");
              return (
                <Tr key={p.uid}>
                  <Td>
                    <Link
                      href={`/admin/participants/${p.uid}`}
                      className="font-medium text-[var(--ink)] hover:text-[var(--blue)] transition-colors"
                    >
                      {p.name}
                    </Link>
                  </Td>
                  <Td className="text-[var(--ink-soft)]">{p.email}</Td>
                  <Td mono className="text-[var(--ink-soft)]">{p.phone ?? "—"}</Td>
                  <Td className="text-[var(--ink-soft)] text-xs">{handles || "—"}</Td>
                  <Td mono>{!!p.createdAt ? fmtTs(p.createdAt) : '-'}</Td>
                  <Td><Badge variant={sb.variant}>{sb.label}</Badge></Td>
                  <Td>
                    <Link href={`/admin/participants/${p.uid}`} className="text-[var(--ink-soft)] hover:text-[var(--ink)]">›</Link>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Panel>
    </>
  );
}
