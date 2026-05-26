"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader, FormField } from "@/components/admin/AdminUI";

import { adminGet, adminPatch, adminDelete, AdminFetchError } from "@/lib/admin-fetch";
import type { VendorRecord, RedemptionRecord } from "@/lib/types";




type ModalType = "suspend" | "activate" | "approve" | "delete" | null;

const STATUS_BADGE: Record<string, { variant: "ok" | "pending" | "danger"; label: string }> = {
  active: { variant: "ok", label: "Active" },
  pending: { variant: "pending", label: "Onboarding" },
  suspended: { variant: "danger", label: "Suspended" },
};

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}


const BUSINESS_TYPES: Record<string, string> = {
  "restaurant_full": "Restaurant (full service)",
  "restaurant_qsr": "Quick service restaurant (QSR)",
  "food_stall": "Food stall / kiosk",
  "cloud_kitchen": "Cloud / ghost kitchen",
  "cafe_bakery": "Café / bakery",
  "catering": "Catering service",
  "other": "Other",
};


const CUISINE_OPTIONS: Record<string, string> = {
  "nigerian": "Nigerian",
  "continental": "Continental",
  "chinese": "Chinese",
  "indian": "Indian",
  "middle_eastern": "Middle Eastern",
  "mixed": "Mixed / fusion",
  "other": "Other",
}







export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [acting, setActing] = useState(false);



  useEffect(() => {
    Promise.all([
      adminGet<VendorRecord>(`/api/admin/vendors/${id}`),
      adminGet<RedemptionRecord[]>(`/api/admin/stats/redemptions?vendorId=${id}`).catch(() => []),
    ])
      .then(([v, r]) => { setVendor(v); setRedemptions(r); setLoading(false); })
      .catch((err) => {
        toast(err instanceof AdminFetchError ? err.message : "Failed to load vendor.", "error");
        setLoading(false);
      });
  }, [id]);

  async function handleAction() {
    if (!vendor || !modal) return;
    setActing(true);
    try {
      if (modal === "delete") {
        await adminDelete(`/api/admin/vendors/${vendor.id}`);
        toast("Vendor deleted.", "success");
        router.push("/admin/vendors");
        return;
      }
      const statusMap: Record<string, string> = {
        suspend: "suspended",
        activate: "active",
        approve: "active",
      };
      await adminPatch(`/api/admin/vendors/${vendor.id}`, { status: statusMap[modal] });
      setVendor((v) => v ? { ...v, status: statusMap[modal] as VendorRecord["status"] } : v);
      toast(
        modal === "suspend" ? "Vendor suspended."
          : modal === "approve" ? "Vendor approved."
            : "Vendor reactivated.",
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
      <p className="text-sm text-[var(--ink-soft)]">Loading vendor…</p>
    </div>
  );

  if (!vendor) return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <p className="text-sm text-[var(--blue)]">Vendor not found.</p>
      <Link href="/admin/vendors"><Button variant="ghost">← All vendors</Button></Link>
    </div>
  );

  const sb = STATUS_BADGE[vendor.status] ?? { variant: "info" as const, label: vendor.status };

  return (
    <>
      <Link href="/admin/vendors" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]">
        <HiOutlineArrowLeft size={15} /> All vendors
      </Link>

      <PageHeader title={<>{vendor.name}</>} sub={`${vendor.address} · joined ${fmtTs(vendor.createdAt as unknown as { _seconds: number })}`}>
        {vendor.status === "pending" && <Button onClick={() => { setConfirmed(false); setModal("approve"); }}>Approve vendor</Button>}
        {vendor.status === "active" && <Button variant="ghost" onClick={() => { setConfirmed(false); setModal("suspend"); }}>Suspend</Button>}
        {vendor.status === "suspended" && <Button onClick={() => { setConfirmed(false); setModal("activate"); }}>Reactivate</Button>}
        <Button variant="ghost" onClick={() => { setConfirmed(false); setModal("delete"); }}>Delete</Button>
      </PageHeader>



      {/* Identity + stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:col-span-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: "radial-gradient(at 30% 30%, var(--blue), var(--ink))" }}>
            {vendor.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{vendor.name}</p>
            <Badge variant={sb.variant}>{sb.label}</Badge>
          </div>
        </div>
        {[
          { label: "Cycles", value: String(vendor.cycles?.length) },
          { label: "Redemptions", value: String(redemptions.length) },
          { label: "Dine-in", value: vendor.dineIn === "yes" ? "Yes" : "No" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">{s.label}</p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Business details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Business type" value={vendor.businessType ? BUSINESS_TYPES[vendor.businessType] : "—"} />
              <FormField label="Cuisine" value={vendor.cuisine ? CUISINE_OPTIONS[vendor.cuisine] : "—"} />
            </div>
            <FormField label="Address" value={vendor.address} />
            <FormField label="Operating hours" value={vendor.operatingHours} />
            <FormField label="Dine-in" value={vendor.dineIn === "yes" ? "Yes" : "No"} />
            {(vendor.socials?.instagram || vendor.socials?.facebook || vendor.socials?.x) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">Socials</label>
                <div className="flex flex-wrap gap-2">
                  {vendor.socials.instagram && <span className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 text-xs font-medium">Ig: @{vendor.socials.instagram}</span>}
                  {vendor.socials.facebook && <span className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 text-xs font-medium">Fb: {vendor.socials.facebook}</span>}
                  {vendor.socials.x && <span className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 text-xs font-medium">X: @{vendor.socials.x}</span>}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Contact">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact" value={vendor.contactName} />
              <FormField label="Role" value={vendor.contactRole} />
            </div>
            <FormField label="Phone" value={vendor.phone} />
            <FormField label="Email" value={vendor.email} />
          </div>
        </Panel>
      </div>

      {/* Redemptions */}
      {redemptions.length > 0 && (
        <div className="mt-5">
          <Panel title="Recent redemptions" noPadding>
            <Table headers={["Code", "Type", "Redeemed at"]}>
              {redemptions.slice(0, 10).map((r) => (
                <Tr key={r.id}>
                  <Td mono>{r.voucherCode}</Td>
                  <Td>
                    <Badge variant={r.type === "free" ? "lime" : "info"}>
                      {r.type === "free" ? "Free meal" : `${r.discountPct}% off`}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--ink-soft)]">
                    {fmtTs(r.redeemedAt as unknown as { _seconds: number })}
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
              {modal === "suspend" && "Suspend this vendor?"}
              {modal === "activate" && "Reactivate this vendor?"}
              {modal === "approve" && "Approve this vendor?"}
              {modal === "delete" && "Delete this account?"}
            </h3>
            <p className="mb-5 text-sm text-[var(--ink-soft)]">
              {modal === "suspend" && `${vendor.name} will be hidden from future cycles until reactivated.`}
              {modal === "activate" && `${vendor.name} will be marked as active and can participate in upcoming cycles.`}
              {modal === "approve" && `${vendor.name} will be approved and can log in to the vendor portal.`}
              {modal === "delete" && `This will permanently remove ${vendor.name}. This cannot be undone.`}
            </p>
            {modal === "delete" && (
              <label className="mb-5 flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--blue)]" />
                <span className="text-sm text-[var(--ink-soft)]">I understand this is permanent.</span>
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium hover:bg-[var(--grey-100)] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={acting || (modal === "delete" && !confirmed)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 ${modal === "delete" ? "bg-red-600 hover:bg-red-700" : modal === "suspend" ? "bg-[var(--ink)] hover:bg-[var(--ink-soft)]" : "bg-[var(--blue)] hover:bg-[var(--blue-dark)]"}`}
              >
                {acting ? "Please wait…"
                  : modal === "suspend" ? "Suspend"
                    : modal === "activate" ? "Reactivate"
                      : modal === "approve" ? "Approve"
                        : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

