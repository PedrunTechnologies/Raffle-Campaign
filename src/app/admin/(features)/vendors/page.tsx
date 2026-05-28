"use client";


import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
// import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Panel, Badge, Table, Tr, Td, PageHeader, KpiTile } from "@/components/admin/AdminUI";
import { VendorRecord } from "@/lib/types";
import { adminGet, AdminFetchError } from "@/lib/admin-fetch";




const STATUS_BADGE: Record<string, { variant: "ok" | "pending" | "danger" | "info"; label: string }> = {
  active: { variant: "ok", label: "Active" },
  pending: { variant: "pending", label: "Onboarding" },
  suspended: { variant: "danger", label: "Suspended" },
};


const BUSINESS_TYPES: Record<string, string> = {
  "restaurant_full": "Restaurant (full service)",
  "restaurant_qsr": "Quick service restaurant (QSR)",
  "food_stall": "Food stall / kiosk",
  "cloud_kitchen": "Cloud / ghost kitchen",
  "cafe_bakery": "Café / bakery",
  "catering": "Catering service",
  "other": "Other",
};

export default function VendorsPage() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);


  // useEffect(() => {
  //   adminGet<VendorRecord[]>("/api/admin/vendors")
  //     .then((data) => { setVendors(data); setLoading(false); })
  //     .catch((err) => {
  //       toast(err instanceof AdminFetchError ? err.message : "Failed to load vendors.", "error");
  //       setLoading(false);
  //     });
  // }, []);



  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startedCycles = await adminGet<VendorRecord[]>("/api/admin/vendors");

      setVendors(startedCycles);

    } catch (err) {
      console.error("[vendors] loadData:", err);
      toast(err instanceof AdminFetchError ? err.message : "Failed to load vendors.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);


  const active = vendors.filter((v) => v.status === "active").length;
  const pending = vendors.filter((v) => v.status === "pending").length;
  const suspended = vendors.filter((v) => v.status === "suspended").length;



  return (
    <>
      <PageHeader
        title={<>Manage <em className="italic text-[var(--blue)]">vendors</em></>}
        sub="All vendors. Click a row to view details and take action."
      >
        {/* <Button>Invite vendor</Button> */}
      </PageHeader>


      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: String(vendors.length) },
          { label: "Active", value: String(active) },
          { label: "Onboarding", value: String(pending) },
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


      <Panel title="All vendors" noPadding>
        {(!loading && vendors.length === 0) ? (
          <div className="px-5 py-14 text-center">
            <p className="mb-1 text-sm font-semibold text-[var(--ink)]">No vendors yet</p>
            <p className="text-sm text-[var(--ink-soft)]">Approved vendors appear here after applying.</p>
          </div>
        ) : (
          <Table loading={loading} headers={["Vendor", "Location", "Business type", "Cycles", "Status", ""]}>
            {vendors.map((v) => {
              const sb = STATUS_BADGE[v.status] ?? { variant: "info" as const, label: v.status };
              return (
                <Tr key={v.id}>
                  <Td>
                    <Link
                      href={`/admin/vendors/${v.id}`}
                      className="font-medium text-[var(--ink)] hover:text-[var(--blue)] transition-colors"
                    >
                      {v.name}
                    </Link>
                  </Td>
                  <Td className="text-[var(--ink-soft)]">
                    {v.address?.split(",")[0] ?? "—"}
                  </Td>
                  <Td className="text-[var(--ink-soft)]">{v.businessType ? BUSINESS_TYPES[v.businessType] : "—"}</Td>
                  <Td mono>{v.cycles?.length || 0}</Td>
                  <Td><Badge variant={sb.variant}>{sb.label}</Badge></Td>
                  <Td>
                    <Link
                      href={`/admin/vendors/${v.id}`}
                      className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                    >›</Link>
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


