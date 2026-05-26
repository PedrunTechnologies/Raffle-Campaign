"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader } from "@/components/admin/AdminUI";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useCallback, useEffect, useState } from "react";
// import { adminGet } from "@/lib/admin-fetch";
// import { ParticipantRecord } from "@/lib/types";

// import { useEffect, useState } from "react";
import { adminGet, AdminFetchError } from "@/lib/admin-fetch";
import { useToast } from "@/components/ui/Toast";
import type { ParticipantRecord } from "@/lib/types";




const PARTICIPANTS = [
  { id: "adaeze", name: "Adaeze Okonkwo", phone: "+234 813 472 9018", socials: "Ig · Fb · X", tasks: "3/3", cycles: "1", status: "active" as const },
  { id: "emeka", name: "Emeka Nwosu", phone: "+234 802 311 4422", socials: "Ig", tasks: "3/3", cycles: "0", status: "active" as const },
  { id: "fatima", name: "Fatima Al-Hassan", phone: "+234 906 588 3301", socials: "Ig · X", tasks: "2/3", cycles: "1", status: "in progress" as const },
  { id: "chidi", name: "Chidi Eze", phone: "+234 815 029 1177", socials: "X", tasks: "3/3", cycles: "0", status: "in progress" as const },
  { id: "ngozi", name: "Ngozi Adeleke", phone: "+234 701 493 0055", socials: "Ig", tasks: "1/3", cycles: "2", status: "in progress" as const },
  { id: "bello", name: "Bello Usman", phone: "+234 818 234 6600", socials: "Ig · X", tasks: "3/3", cycles: "3", status: "flagged" as const },
];

const STATUS_LABEL: Record<any, any> = {
  active: "ok", "in progress": "pending", flagged: "danger",
};





const STATUS_BADGE: Record<string, { variant: "ok" | "pending" | "danger" | "info"; label: string }> = {
  active: { variant: "ok", label: "Active" },
  flagged: { variant: "danger", label: "Flagged" },
  suspended: { variant: "danger", label: "Suspended" },
};




export default function ParticipantsPage() {





  const { user } = useAdminAuth();


  const { toast } = useToast();
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");



  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startedCycles = await adminGet<ParticipantRecord[]>("/api/admin/participants");

      setParticipants(startedCycles);

    } catch (err) {
      console.error("[tasks] loadData:", err);
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



      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: String(participants.length) },
          { label: "Active", value: "76" },
          { label: "In progress", value: "6" },
          { label: "Flagged", value: "2" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              {s.label}
            </p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>



      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: String(participants.length) },
          { label: "Active", value: String(active) },
          { label: "Flagged", value: String(flagged) },
          { label: "Suspended", value: String(suspended) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">{s.label}</p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>



      <Panel title="Participant list" right="" noPadding>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--ink-soft)]">
            Loading data...
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--blue)]">{error}</div>
        ) : participants.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="mb-2 text-sm font-semibold text-[var(--ink)]">No participants yet</p>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              Invite participants to participate in the raffle campaign.
            </p>
          </div>
        ) : (
          <Table headers={["Name", "Phone", "Socials", "Date Joined", "Cycles", "Status", ""]}>
            {participants.map((p) => (
              <Tr key={p.uid}>
                <Td>
                  <Link
                    href={`/admin/participants/${p.uid}`}
                    className="font-medium text-[var(--ink)] transition-colors hover:text-[var(--blue)]"
                  >
                    {p.name}
                  </Link>
                </Td>
                <Td mono className="text-[var(--ink-soft)]">{p.phone}</Td>
                {/* <Td className="text-[var(--ink-soft)]">{p.socials}</Td> */}
                <Td className="text-[var(--ink-soft)]">--</Td>
                <Td mono>{p.createdAt?.toDate().toLocaleString()}</Td>
                {/* <Td mono className={p.cycles === "—" ? "text-[var(--mute)]" : ""}>
                {p.cycles}
              </Td> */}
                <Td mono className={"text-[var(--mute)]"}>
                  -
                </Td>
                <Td>
                  <Badge variant={STATUS_LABEL[p.status]}>{p.status}</Badge>
                </Td>
                <Td>
                  <Link
                    href={`/admin/participants/${p.uid}`}
                    className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                  >
                    ›
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
        )}


        <Table headers={["Name", "Phone", "Socials", "Tasks", "Cycles", "Status", ""]}>
          {PARTICIPANTS.map((p) => (
            <Tr key={p.id}>
              <Td>
                <Link
                  href={`/admin/participants/${p.id}`}
                  className="font-medium text-[var(--ink)] transition-colors hover:text-[var(--blue)]"
                >
                  {p.name}
                </Link>
              </Td>
              <Td mono className="text-[var(--ink-soft)]">{p.phone}</Td>
              <Td className="text-[var(--ink-soft)]">{p.socials}</Td>
              <Td mono>{p.tasks}</Td>
              <Td mono className={p.cycles === "—" ? "text-[var(--mute)]" : ""}>
                {p.cycles}
              </Td>
              <Td>
                {/* <Badge variant={STATUS_LABEL[p.status]}>{p.status}</Badge> */}
                {/* <Badge variant={STATUS_LABEL["active"]}>{p.status}</Badge> */}
                <Badge variant={STATUS_LABEL[p.status]}>{p.status}</Badge>
              </Td>
              <Td>
                <Link
                  href={`/admin/participants/${p.id}`}
                  className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                >
                  ›
                </Link>
              </Td>
            </Tr>
          ))}
        </Table>
      </Panel>





      <Panel title="Participant list" noPadding>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--ink-soft)]">Loading…</div>
        ) : participants.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-[var(--ink-soft)]">No participants yet.</div>
        ) : (
          <Table headers={["Name", "Email", "Phone", "Socials", "Status", ""]}>
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
                      {p.displayName}
                    </Link>
                  </Td>
                  <Td className="text-[var(--ink-soft)]">{p.email}</Td>
                  <Td mono className="text-[var(--ink-soft)]">{p.phone ?? "—"}</Td>
                  <Td className="text-[var(--ink-soft)] text-xs">{handles || "—"}</Td>
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
