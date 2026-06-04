"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader, FormField } from "@/components/admin/AdminUI";
import { useEffect, useState } from "react";
import { adminGet, adminPatch, adminDelete, AdminFetchError } from "@/lib/admin-fetch";
import { useToast } from "@/components/ui/Toast";
import { useParams, useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import type { ParticipantRecord, VoucherRecord } from "@/lib/types";



type ModalType = "flag" | "unflag" | "disqualify" | "delete" | null;


/* ── mock data — in prod, fetch by params.id ── */
const PARTICIPANT = {
  id: "adaeze",
  name: "Adaeze Okonkwo",
  phone: "+234 813 472 9018",
  dob: "14 March 1996",
  joinedDate: "09 January 2026",
  totalCycles: 18,
  status: "ok" as "ok" | "pending" | "danger",
  socials: [
    { platform: "Instagram", handle: "@adaeze.o", linked: "09 Jan 2026", verified: true },
    { platform: "Facebook", handle: "Adaeze Okonkwo", linked: "09 Jan 2026", verified: true },
    { platform: "X", handle: "@adaeze_o", linked: "12 Jan 2026", verified: true },
  ],
};

const TASKS = [
  { id: "follow", title: "Follow @pedrun on Instagram", status: "done" as const, verifiedAt: "11 May · 09:11", method: "API" },
  { id: "share", title: "Share post to story", status: "done" as const, verifiedAt: "11 May · 09:24", method: "API" },
  { id: "tag", title: "Tag 2 friends in comments", status: "done" as const, verifiedAt: "11 May · 09:31", method: "API" },
];

const TASK_STATUS_LABEL: Record<string, string> = { done: "Verified", pending: "Pending", failed: "Failed" };
const TASK_STATUS_VARIANT: Record<string, "ok" | "pending" | "danger"> = {
  done: "ok", pending: "pending", failed: "danger",
};

const VOUCHER_HISTORY = [
  { cycle: "#214", date: "11 May", code: "PR-9X4K-A28T", result: "Discount 30%", status: "Redeemed" as const },
  { cycle: "#213", date: "10 May", code: "PR-7L2M-B91Q", result: "Discount 30%", status: "Redeemed" as const },
  { cycle: "#212", date: "09 May", code: "PR-4J7C-T55K", result: "Expired", status: "Expired" as const },
  { cycle: "#208", date: "05 May", code: "PR-8H3W-Y22P", result: "Free meal · won", status: "Won" as const },
];





function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", x: "X",
};

export default function ParticipantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const uid = params.id as string;

  const [participant, setParticipant] = useState<ParticipantRecord | null>(null);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [acting, setActing] = useState(false);





  const [status, setStatus] = useState<"ok" | "pending" | "danger">(PARTICIPANT.status);



  const PARTICIPANT_STATUS_LABEL: Record<string, string> = {
    ok: "Qualified", pending: "In progress", danger: "Flagged",
  };

  function handleConfirm() {
    if (modal === "flag") setStatus("danger");
    if (modal === "unflag") setStatus("ok");
    if (modal === "disqualify") setStatus("danger");
    setModal(null);
  }




  useEffect(() => {
    Promise.all([
      adminGet<ParticipantRecord>(`/api/admin/participants/${uid}`),
      adminGet<VoucherRecord[]>(`/api/admin/vouchers?participantId=${uid}`).catch(() => []),
    ])
      .then(([p, v]) => { setParticipant(p); setVouchers(v); setLoading(false); })
      .catch((err) => {
        toast(err instanceof AdminFetchError ? err.message : "Failed to load participant.", "error");
        setLoading(false);
      });
  }, [uid, toast]);

  async function handleAction() {
    if (!participant || !modal) return;
    setActing(true);
    try {
      if (modal === "delete") {
        await adminDelete(`/api/admin/participants/${uid}`);
        toast("Participant account deleted.", "success");
        router.push("/admin/participants");
        return;
      }
      const statusMap: Record<string, string> = {
        flag: "flagged",
        unflag: "active",
        disqualify: "flagged",
      };
      await adminPatch(`/api/admin/participants/${uid}`, { status: statusMap[modal] });
      setParticipant((p) => p ? { ...p, status: statusMap[modal] as ParticipantRecord["status"] } : p);
      toast(
        modal === "flag" ? "Participant flagged for review."
          : modal === "unflag" ? "Flag removed."
            : "Participant disqualified from current cycle.",
        "success"
      );
      setModal(null);
    } catch (err) {
      toast(err instanceof AdminFetchError ? err.message : "Action failed.", "error");
    } finally {
      setActing(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-[var(--ink-soft)]">Loading participant…</p>
    </div>
  );

  if (!participant) return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <p className="text-sm text-[var(--blue)]">Participant not found.</p>
      <Link href="/admin/participants"><Button variant="ghost">← All participants</Button></Link>
    </div>
  );

  const isFlagged = participant.status === "flagged";
  const socials = Object.entries(participant.socials ?? {});

  return (
    <>
      <Link href="/admin/participants" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]">
        <HiOutlineArrowLeft size={15} /> All participants
      </Link>

      <PageHeader
        title={<>{participant.name}</>}
        sub={`${participant.email} · joined ${fmtTs(participant.createdAt as unknown as { _seconds: number })}`}
      >
        {!isFlagged
          ? <Button variant="ghost" onClick={() => { setConfirmed(false); setModal("flag"); }}>Flag</Button>
          : <Button onClick={() => { setConfirmed(false); setModal("unflag"); }}>Remove flag</Button>
        }
        <Button variant="ghost" onClick={() => { setConfirmed(false); setModal("disqualify"); }}>Disqualify</Button>
        <Button variant="ghost" onClick={() => { setConfirmed(false); setModal("delete"); }}>Delete account</Button>
      </PageHeader>

      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:col-span-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: "radial-gradient(at 30% 30%, var(--blue), var(--ink))" }}>
            {participant?.name?.[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{participant.name}</p>
            <Badge variant={participant.status === "active" ? "ok" : "danger"}>
              {participant?.status?.charAt(0)?.toUpperCase() + participant?.status?.slice(1)}
            </Badge>
          </div>
        </div>
        {[
          { label: "Socials linked", value: String(socials.length) },
          { label: "Vouchers", value: String(vouchers.length) },
          { label: "Free meals", value: String(vouchers.filter((v) => v.type === "free").length) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">{s.label}</p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:col-span-1">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: "radial-gradient(at 30% 30%, var(--blue), var(--ink))" }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{PARTICIPANT.name}</p>
            <Badge variant={status}>{PARTICIPANT_STATUS_LABEL[status]}</Badge>
          </div>
        </div>
        {[
          { label: "Total cycles", value: String(PARTICIPANT.totalCycles) },
          { label: "Socials linked", value: String(PARTICIPANT.socials.length) },
          { label: "Tasks this cycle", value: `${TASKS.filter(t => t.status === "done").length}/${TASKS.length}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              {s.label}
            </p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div> */}



      <div className="grid gap-5 lg:grid-cols-2">
        {/* Personal details */}
        <Panel title="Personal details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name" value={participant.name} />
              <FormField label="Phone" value={participant.phone ?? "—"} />
            </div>
            <FormField label="Email" value={participant.email} />
            <FormField label="Joined" value={fmtTs(participant.createdAt as unknown as { _seconds: number })} />
          </div>
        </Panel>

        {/* Linked socials */}
        <Panel title="Linked social handles">
          {socials.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">No handles linked.</p>
          ) : (
            <div className="space-y-3">
              {socials.map(([id, link]) => (
                <div key={id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--grey-50)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {PLATFORM_LABELS[id] ?? id}
                      <span className="ml-2 font-normal text-[var(--ink-soft)]">
                        @{link?.handle}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--mute)]">
                      Linked {fmtTs(link?.linkedAt as unknown as { _seconds: number })}
                    </p>
                  </div>
                  <Badge variant="ok">✓ Saved</Badge>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Voucher history */}
      {vouchers.length > 0 && (
        <div className="mt-5">
          <Panel title="Voucher history" noPadding>
            <Table headers={["Code", "Type", "Status", "Issued"]}>
              {vouchers.map((v) => (
                <Tr key={v.code}>
                  <Td mono>{v.code}</Td>
                  <Td>
                    <Badge variant={v.type === "free" ? "lime" : "info"}>
                      {v.type === "free" ? "Free meal" : `${v.discountPct}% off`}
                    </Badge>
                  </Td>
                  <Td className="capitalize text-[var(--ink-soft)]">{v.status}</Td>
                  <Td className="whitespace-nowrap text-[var(--ink-soft)]">
                    {fmtTs(v.issuedAt as unknown as { _seconds: number })}
                  </Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>
              {modal === "flag" && "Flag this participant?"}
              {modal === "unflag" && "Remove flag?"}
              {modal === "disqualify" && "Disqualify from current cycle?"}
              {modal === "delete" && "Delete this account?"}
            </h3>
            <p className="mb-5 text-sm text-[var(--ink-soft)]">
              {modal === "flag" && `${participant.displayName} will be marked for review. They can still participate unless disqualified.`}
              {modal === "unflag" && `The flag will be removed and status returned to active.`}
              {modal === "disqualify" && `${participant.displayName}'s voucher for the current cycle will be invalidated.`}
              {modal === "delete" && `This permanently removes ${participant.displayName}'s account and all associated data.`}
            </p>
            {(modal === "disqualify" || modal === "delete") && (
              <label className="mb-5 flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--blue)]" />
                <span className="text-sm text-[var(--ink-soft)]">I understand this cannot be reversed.</span>
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium hover:bg-[var(--grey-100)] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={acting || ((modal === "disqualify" || modal === "delete") && !confirmed)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 ${modal === "delete" || modal === "disqualify" ? "bg-red-600 hover:bg-red-700"
                    : modal === "flag" ? "bg-[var(--ink)] hover:bg-[var(--ink-soft)]"
                      : "bg-[var(--blue)] hover:bg-[var(--blue-dark)]"
                  }`}
              >
                {acting ? "Please wait…"
                  : modal === "flag" ? "Flag participant"
                    : modal === "unflag" ? "Remove flag"
                      : modal === "disqualify" ? "Disqualify"
                        : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Task audit — this cycle */}
      {/* <div className="mt-5">
        <Panel title="Task audit — cycle #214" right="All auto-verified via API" noPadding>
          <Table headers={["Task", "Status", "Verified at", "Method"]}>
            {TASKS.map((t) => (
              <Tr key={t.id}>
                <Td>{t.title}</Td>
                <Td>
                  <Badge variant={TASK_STATUS_VARIANT[t.status]}>
                    {TASK_STATUS_LABEL[t.status]}
                  </Badge>
                </Td>
                <Td className="text-[var(--ink-soft)]">{t.verifiedAt}</Td>
                <Td>
                  <span className="rounded-md bg-[var(--grey-100)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-soft)]">
                    {t.method}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div> */}

      {/* Voucher history */}
      {/* {<div className="mt-5">
        <Panel title="Voucher history" noPadding>
          <Table headers={["Cycle", "Date", "Code", "Result", "Status"]}>
            {VOUCHER_HISTORY.map((v) => (
              <Tr key={v.code}>
                <Td mono className="text-[var(--ink-soft)]">{v.cycle}</Td>
                <Td className="text-[var(--ink-soft)]">{v.date}</Td>
                <Td mono>{v.code}</Td>
                <Td>{v.result}</Td>
                <Td>
                  <Badge variant={v.status === "Won" ? "lime" : v.status === "Redeemed" ? "ok" : v.status === "Expired" ? "info" : "info"}>{v.status}</Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div> */}

      {/* ── Confirmation modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
            <h3
              className="mb-2 text-lg font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {modal === "flag" && "Flag this participant?"}
              {modal === "unflag" && "Remove flag?"}
              {modal === "disqualify" && "Disqualify from cycle #214?"}
              {modal === "delete" && "Delete this account?"}
            </h3>
            <p className="mb-5 text-sm text-[var(--ink-soft)]">
              {modal === "flag" && `${PARTICIPANT.name} will be marked as flagged for review. They can still complete the current cycle unless you also disqualify them.`}
              {modal === "unflag" && `The flag on ${PARTICIPANT.name} will be removed. Their status will return to Qualified.`}
              {modal === "disqualify" && `${PARTICIPANT.name}'s voucher for cycle #214 will be invalidated. This cannot be reversed.`}
              {modal === "delete" && `This will permanently remove ${PARTICIPANT.name}'s account and all history. This cannot be undone.`}
            </p>

            {(modal === "disqualify" || modal === "delete") && (
              <label className="mb-5 flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--blue)]"
                />
                <span className="text-sm text-[var(--ink-soft)]">
                  I understand this action{modal === "delete" ? " is permanent" : " cannot be reversed"}.
                </span>
              </label>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--grey-100)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={(modal === "disqualify" || modal === "delete") && !confirmed}
                className={`
                  flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40
                  ${modal === "delete" || modal === "disqualify"
                    ? "bg-red-600 hover:bg-red-700"
                    : modal === "flag"
                      ? "bg-[var(--ink)] hover:bg-[var(--ink-soft)]"
                      : "bg-[var(--blue)] hover:bg-[var(--blue-dark)]"
                  }
                `}
              >
                {modal === "flag" && "Flag participant"}
                {modal === "unflag" && "Remove flag"}
                {modal === "disqualify" && "Disqualify"}
                {modal === "delete" && "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}




