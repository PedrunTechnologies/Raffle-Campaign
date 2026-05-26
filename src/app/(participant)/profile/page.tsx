// import AuthNavbar from "@/components/participant/AuthNavbar";
// import Button from "@/components/ui/Button";
// import Link from "next/link";

// type HistoryStatus = "won" | "discount_used" | "discount_active" | "expired";

// interface VoucherHistoryItem {
//   id:     string;
//   cycle:  string;
//   date:   string;
//   label:  string;
//   status: HistoryStatus;
// }

// const HISTORY: VoucherHistoryItem[] = [
//   { id: "PR-9X4K-A28T", cycle: "#214", date: "11 May", label: "30% discount · active",  status: "discount_active" },
//   { id: "PR-7L2M-B91Q", cycle: "#213", date: "10 May", label: "30% discount · used",    status: "discount_used"   },
//   { id: "PR-4J7C-T55K", cycle: "#212", date: "09 May", label: "Voucher expired",        status: "expired"         },
//   { id: "PR-2K8N-X14V", cycle: "#211", date: "08 May", label: "Voucher expired",        status: "expired"         },
//   { id: "PR-8H3W-Y22P", cycle: "#208", date: "05 May", label: "Free meal · delivered", status: "won"             },
//   { id: "PR-1H6V-D02R", cycle: "#206", date: "03 May", label: "15% discount · used",   status: "discount_used"   },
// ];

// const TASK_HISTORY = [
//   { cycle: "#214", date: "11 May", tasks: "3/3", icon: "✅" },
//   { cycle: "#213", date: "10 May", tasks: "3/3", icon: "✅" },
//   { cycle: "#212", date: "09 May", tasks: "2/3", icon: "⚠️" },
//   { cycle: "#208", date: "05 May", tasks: "3/3", icon: "✅" },
// ];

// function statusBadge(status: HistoryStatus) {
//   const map: Record<HistoryStatus, { label: string; cls: string }> = {
//     won:             { label: "Won",          cls: "bg-[var(--lime)] text-[var(--lime-ink)]" },
//     discount_used:   { label: "Redeemed",     cls: "bg-[var(--grey-100)] text-[var(--ink-soft)]" },
//     discount_active: { label: "Active",       cls: "bg-[var(--forest)]/10 text-[var(--forest)]" },
//     expired:         { label: "Expired",      cls: "bg-[var(--blue)]/10 text-[var(--blue)]" },
//   };
//   const { label, cls } = map[status];
//   return (
//     <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${cls}`}>
//       {label}
//     </span>
//   );
// }

// function statusEmoji(status: HistoryStatus) {
//   if (status === "won") return "🏆";
//   if (status === "expired") return "🎟️";
//   return "🎟️";
// }

// export default function ProfilePage() {
//   return (
//     <>
//       <AuthNavbar userName="Adaeze" />

//       <main className="min-h-screen px-6 py-12 md:py-16">
//         <div className="mx-auto max-w-2xl">

//           {/* ── Profile header ── */}
//           <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
//             <div className="flex items-center gap-4">
//               {/* Avatar */}
//               <div
//                 className="
//                   flex h-16 w-16 items-center justify-center
//                   rounded-full
//                   text-2xl font-bold text-white
//                 "
//                 style={{
//                   background:
//                     "radial-gradient(at 30% 30%, var(--blue), var(--ink))",
//                 }}
//               >
//                 A
//               </div>
//               <div>
//                 <h1
//                   className="text-2xl font-medium tracking-tight"
//                   style={{ fontFamily: "var(--font-display)" }}
//                 >
//                   Adaeze Okonkwo
//                 </h1>
//                 <p className="text-sm text-[var(--ink-soft)]">
//                   +234 813 472 9018
//                 </p>
//               </div>
//             </div>
//             <Button variant="ghost">Edit profile</Button>
//           </div>

//           {/* ── Linked socials ── */}
//           <section className="mb-8">
//             <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//               Linked accounts
//             </h2>
//             <div className="flex flex-wrap gap-2">
//               {[
//                 { id: "ig", label: "@adaeze.o", color: "linear-gradient(135deg,#FEDA77,#F58529,#DD2A7B,#8134AF)" },
//                 { id: "fb", label: "@adaeze.okonkwo", color: "#1877F2" },
//               ].map((s) => (
//                 <div
//                   key={s.id}
//                   className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5"
//                 >
//                   <div
//                     className="h-6 w-6 rounded-lg text-center text-[10px] font-bold leading-6 text-white"
//                     style={{ background: s.color }}
//                   >
//                     {s.id === "ig" ? "Ig" : "Fb"}
//                   </div>
//                   <span className="text-sm font-medium text-[var(--ink)]">{s.label}</span>
//                   <span className="text-xs text-[var(--forest)]">✓</span>
//                 </div>
//               ))}
//               <Link
//                 href="/link-socials"
//                 className="
//                   flex items-center gap-2 rounded-2xl border border-dashed
//                   border-[var(--grey-200)] px-4 py-2.5
//                   text-sm text-[var(--mute)] transition-colors
//                   hover:border-[var(--blue)] hover:text-[var(--blue)]
//                 "
//               >
//                 + Add account
//               </Link>
//             </div>
//           </section>

//           {/* ── Active voucher ── */}
//           <section className="mb-8">
//             <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//               Active
//             </h2>
//             <Link href="/voucher-detail">
//               <div className="relative overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white transition-all hover:brightness-110">
//                 <div className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//                 <div className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--bg)]" />

//                 <div className="mb-4 flex items-start justify-between">
//                   <div>
//                     <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--lime)]">
//                       Today&apos;s voucher
//                     </p>
//                     <p className="font-mono text-xl font-semibold tracking-wider">PR-9X4K-A28T</p>
//                   </div>
//                   <span className="rounded-lg bg-[var(--lime)] px-2.5 py-1 text-[11px] font-bold text-[var(--lime-ink)]">
//                     30% off
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between border-t border-white/10 pt-4">
//                   <p className="text-xs text-white/60">Cycle #214 · 11 May 2026</p>
//                   <p className="text-xs text-white/60">Valid until Sun 17 May →</p>
//                 </div>
//               </div>
//             </Link>
//           </section>

//           {/* ── Two-column history ── */}
//           <div className="grid gap-6 md:grid-cols-2">

//             {/* Voucher history */}
//             <section>
//               <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//                 Voucher history
//               </h2>
//               <div className="flex flex-col gap-2.5">
//                 {HISTORY.map((item) => (
//                   <Link
//                     key={item.id}
//                     href="/voucher-detail"
//                     className="
//                       flex items-center gap-3
//                       rounded-2xl border border-[var(--line)]
//                       bg-white px-4 py-3.5
//                       transition-all hover:border-[var(--grey-200)] hover:shadow-sm
//                     "
//                   >
//                     <span className="text-xl">{statusEmoji(item.status)}</span>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-semibold text-[var(--ink)]">
//                         Cycle {item.cycle} · {item.date}
//                       </p>
//                       <p className="text-xs text-[var(--ink-soft)]">{item.label}</p>
//                     </div>
//                     {statusBadge(item.status)}
//                   </Link>
//                 ))}
//               </div>
//             </section>

//             {/* Task history */}
//             <section>
//               <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//                 Task history
//               </h2>
//               <div className="flex flex-col gap-2.5">
//                 {TASK_HISTORY.map((item) => (
//                   <div
//                     key={item.cycle}
//                     className="
//                       flex items-center gap-3
//                       rounded-2xl border border-[var(--line)]
//                       bg-white px-4 py-3.5
//                     "
//                   >
//                     <span className="text-xl">{item.icon}</span>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-semibold text-[var(--ink)]">
//                         Cycle {item.cycle} · {item.date}
//                       </p>
//                       <p className="text-xs text-[var(--ink-soft)]">
//                         {item.tasks} tasks completed
//                       </p>
//                     </div>
//                     <span
//                       className={`
//                         rounded-lg px-2.5 py-1 text-xs font-semibold
//                         ${item.tasks === "3/3"
//                           ? "bg-[var(--forest)]/10 text-[var(--forest)]"
//                           : "bg-[var(--blue)]/10 text-[var(--blue)]"
//                         }
//                       `}
//                     >
//                       {item.tasks === "3/3" ? "All done" : "Partial"}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               {/* Sign out */}
//               <div className="mt-6 border-t border-[var(--line)] pt-6">
//                 <Button variant="ghost" fullWidth>
//                   Sign out
//                 </Button>
//               </div>
//             </section>

//           </div>
//         </div>
//       </main>
//     </>
//   );
// }


"use client";

import AuthNavbar from "@/components/participant/AuthNavbar";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { participantGet, ParticipantFetchError } from "@/lib/participant-fetch";
import type { VoucherRecord } from "@/lib/types";

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook:  "Facebook",
  x:         "X",
};

const PLATFORM_PREFIX: Record<string, string> = {
  instagram: "@",
  facebook:  "fb/",
  x:         "@",
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: "linear-gradient(135deg,#FEDA77,#F58529,#DD2A7B,#8134AF)",
  facebook:  "#1877F2",
  x:         "#000",
};

export default function ProfilePage() {
  const { profile, logout } = useAuth();

  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    participantGet<VoucherRecord[]>("/api/participant/voucher")
      .then((data) => { setVouchers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!profile) {
    return (
      <>
        <AuthNavbar />
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
        </main>
      </>
    );
  }

  const initial     = profile.name?.[0]?.toUpperCase() ?? "U";
  const socials     = Object.entries(profile.socials ?? {});
  const freeCount   = vouchers.filter((v) => v.type === "free").length;
  const discCount   = vouchers.filter((v) => v.type === "discount").length;

  return (
    <>
      <AuthNavbar userName={profile?.name?.split(" ")[0]} />

      <main className="min-h-screen px-6 py-12 md:py-16">
        <div className="mx-auto max-w-2xl">

          {/* ── Profile header ── */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ background: "radial-gradient(at 30% 30%, var(--blue), var(--ink))" }}
              >
                {initial}
              </div>
              <div>
                <h1
                  className="text-2xl font-medium tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {profile.name}
                </h1>
                <p className="text-sm text-[var(--ink-soft)]">{profile.email}</p>
                {profile.phone && (
                  <p className="text-xs text-[var(--mute)]">{profile.phone}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" onClick={logout}>Sign out</Button>
          </div>

          {/* ── Stats ── */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Total vouchers",    value: String(vouchers.length) },
              { label: "Free meals",        value: String(freeCount)       },
              { label: "Discounts",         value: String(discCount)       },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  {s.label}
                </p>
                <p
                  className="text-3xl font-light tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {loading ? "—" : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Linked socials ── */}
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Linked accounts
              </h2>
              <Link
                href="/link-socials"
                className="text-xs font-medium text-[var(--blue)] underline underline-offset-2"
              >
                {socials.length ? "Manage" : "Add accounts"}
              </Link>
            </div>

            {socials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--grey-200)] px-5 py-4 text-sm text-[var(--ink-soft)]">
                No social accounts linked yet.{" "}
                <Link href="/link-socials" className="font-medium text-[var(--blue)] underline underline-offset-2">
                  Add one
                </Link>{" "}
                to participate in tasks.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {socials.map(([id, link]) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5"
                  >
                    <div
                      className="h-6 w-6 rounded-lg text-center text-[10px] font-bold leading-6 text-white"
                      style={{ background: PLATFORM_COLOR[id] ?? "#666" }}
                    >
                      {id === "instagram" ? "Ig" : id === "facebook" ? "Fb" : "X"}
                    </div>
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {PLATFORM_PREFIX[id]}{link?.handle}
                    </span>
                    <span className="text-xs text-[var(--forest)]">✓</span>
                  </div>
                ))}
                <Link
                  href="/link-socials"
                  className="
                    flex items-center gap-1 rounded-2xl border border-dashed
                    border-[var(--grey-200)] px-4 py-2.5
                    text-sm text-[var(--mute)]
                    hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors
                  "
                >
                  + Add
                </Link>
              </div>
            )}
          </section>

          {/* ── Voucher history ── */}
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              Voucher history
            </h2>

            {loading ? (
              <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
            ) : vouchers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--grey-200)] px-5 py-6 text-center">
                <p className="text-sm text-[var(--ink-soft)]">
                  No vouchers yet — complete tasks during an active cycle to get one.
                </p>
                <Link href="/" className="mt-3 inline-block text-sm font-medium text-[var(--blue)] underline underline-offset-2">
                  Go to home
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {vouchers.map((v) => (
                  <Link
                    key={v.code}
                    href={"/voucher-detail?code=" + v.code}
                    className="
                      flex items-center gap-3 rounded-2xl
                      border border-[var(--line)] bg-white px-4 py-3.5
                      transition-all hover:border-[var(--grey-200)] hover:shadow-sm
                    "
                  >
                    <span className="text-xl">
                      {v.type === "free" ? "🎉" : "🎟️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-[var(--ink)]">
                        {v.code}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {!!v.type ? (v.type === "free" ? "Free meal" : `${v.discountPct}% discount`) : 'Pending'}
                        {" · "}
                        {fmtTs(v.issuedAt as unknown as { _seconds: number })}
                      </p>
                    </div>
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background:
                          v.status === "redeemed" ? "var(--grey-100)"
                          : v.type   === "free"     ? "var(--lime)"
                          : "var(--grey-100)",
                        color:
                          v.status === "redeemed" ? "var(--ink-soft)"
                          : v.type   === "free"     ? "var(--lime-ink)"
                          : "var(--ink-soft)",
                      }}
                    >
                      {v.status === "redeemed"
                        ? "Redeemed"
                        : !!v.type ? (v.type === "free"
                        ? "Free meal"
                        : `${v.discountPct}% off`) : 'Pending'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  );
}
