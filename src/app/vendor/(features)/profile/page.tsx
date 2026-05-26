"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import { PageHeader } from "@/components/vendor/VendorUI";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { useEffect, useState } from "react";
import { vendorPatch, VendorFetchError } from "@/lib/vendor-fetch";

const BUSINESS_TYPES = [
  { value: "restaurant_full", label: "Restaurant (full service)" },
  { value: "restaurant_qsr",  label: "Quick service restaurant (QSR)" },
  { value: "food_stall",      label: "Food stall / kiosk" },
  { value: "cloud_kitchen",   label: "Cloud / ghost kitchen" },
  { value: "cafe_bakery",     label: "Café / bakery" },
  { value: "catering",        label: "Catering service" },
  { value: "other",           label: "Other" },
];

const DINE_IN_OPTIONS = [
  { value: "yes", label: "Yes — dine-in available" },
  { value: "no",  label: "No — takeaway / delivery only" },
];

const CUISINE_OPTIONS = [
  { value: "nigerian",       label: "Nigerian" },
  { value: "continental",    label: "Continental" },
  { value: "chinese",        label: "Chinese" },
  { value: "indian",         label: "Indian" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "mixed",          label: "Mixed / fusion" },
  { value: "other",          label: "Other" },
];

function SectionPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-6 py-4">
        <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function SocialInput({ prefix, placeholder, value, onChange }: {
  prefix: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-[var(--line)] bg-white focus-within:border-[var(--blue)] focus-within:ring-4 focus-within:ring-[rgba(30,91,255,.10)] transition-all">
      <span className="flex items-center border-r border-[var(--line)] bg-[var(--grey-50)] px-3 text-sm text-[var(--mute)] whitespace-nowrap">
        {prefix}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white px-3 py-4 text-sm outline-none"
      />
    </div>
  );
}


export default function VendorProfilePage() {
  const { vendor } = useVendorAuth();

  /* form state — pre-filled from vendor context */
  const [name,           setName]           = useState("");
  const [businessType,   setBusinessType]   = useState("restaurant_full");
  const [cuisine,        setCuisine]        = useState("nigerian");
  const [address,        setAddress]        = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [dineIn,         setDineIn]         = useState("yes");
  const [contactName,    setContactName]    = useState("");
  const [contactRole,    setContactRole]    = useState("");
  const [phone,          setPhone]          = useState("");
  const [email,          setEmail]          = useState("");
  const [igHandle,       setIgHandle]       = useState("");
  const [fbHandle,       setFbHandle]       = useState("");
  const [xHandle,        setXHandle]        = useState("");

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");


  /* populate form once vendor loads */
  useEffect(() => {
    if (!vendor) return;
    setName(vendor.name ?? "");
    setBusinessType(vendor.businessType ?? "restaurant_full");
    setCuisine(vendor.cuisine ?? "nigerian");
    setAddress(vendor.address ?? "");
    setOperatingHours(vendor.operatingHours ?? "");
    setDineIn(vendor.dineIn ?? "yes");
    setContactName(vendor.contactName ?? "");
    setContactRole(vendor.contactRole ?? "");
    setPhone(vendor.phone ?? "");
    setEmail(vendor.email ?? "");
    setIgHandle(vendor.socials?.instagram ?? "");
    setFbHandle(vendor.socials?.facebook  ?? "");
    setXHandle(vendor.socials?.x          ?? "");
  }, [vendor]);

  async function handleSave() {
    setSaving(true); setSaved(false); setError("");
    try {
      await vendorPatch("/api/vendor/profile", {
        name, businessType, cuisine, address, operatingHours, dineIn,
        contactName, contactRole, phone, email,
        socials: {
          ...(igHandle ? { instagram: igHandle } : {}),
          ...(fbHandle ? { facebook:  fbHandle } : {}),
          ...(xHandle  ? { x:         xHandle  } : {}),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof VendorFetchError ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const initial = vendor?.name?.[0]?.toUpperCase() ?? "V";

  return (
    <>
      <PageHeader
        title={<>Business <em className="italic text-[var(--blue)]">profile</em></>}
        sub="Update your business details. Changes take effect from the next cycle."
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
        </Button>
      </PageHeader>

      {/* Identity card */}
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-[var(--line)] bg-white p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
          style={{ background: "radial-gradient(at 30% 30%, var(--blue), var(--ink))" }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-[var(--ink)]">{vendor?.name ?? "—"}</p>
          <p className="text-sm text-[var(--ink-soft)]">
            {vendor?.address?.split(",")[0] ?? ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            vendor?.status === "active"
              ? "bg-[var(--forest)]/10 text-[var(--forest)]"
              : "bg-[var(--grey-100)] text-[var(--ink-soft)]"
          }`}>
            {vendor?.status === "active" ? "✓ Active" : vendor?.status ?? "—"}
          </span>
          <span className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">
            {vendor?.cycles?.length ?? 0} cycles
          </span>
        </div>
      </div>

      {/* Vendor identity card */}
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-[var(--line)] bg-white p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
          style={{
            background: "radial-gradient(at 30% 30%, var(--blue), var(--ink))",
          }}
        >
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-[var(--ink)]">
            Mama Cass Kitchen
          </p>
          <p className="text-sm text-[var(--ink-soft)]">
            Lekki Phase 1 · Active since Jan 2024
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-[var(--forest)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--forest)]">
            ✓ Verified
          </span>
          <span className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">
            42 cycles
          </span>
          <span className="rounded-lg bg-[var(--grey-100)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">
            312 redemptions
          </span>
        </div>
      </div>




      {error && (
        <div className="mb-5 max-w-3xl rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4 text-sm text-[var(--blue)]">
          {error}
        </div>
      )}

      <div className="max-w-3xl space-y-5">

        {/* Business details */}
        <SectionPanel title="Business details">
          <Row>
            <Input label="Registered business name" value={name} onChange={(e) => setName(e.target.value)} />
            <SelectField label="Business type" options={BUSINESS_TYPES} value={businessType} onChange={setBusinessType} />
          </Row>
          <Row>
            <Input label="Kitchen / store address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <SelectField label="Cuisine / category" options={CUISINE_OPTIONS} value={cuisine} onChange={setCuisine} />
          </Row>
          <Row>
            <Input
              label="Operating hours"
              placeholder="Mon–Sat · 09:00 – 22:00 · Sun · 12:00 – 22:00"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
            />
            <SelectField label="Dine-in available?" options={DINE_IN_OPTIONS} value={dineIn} onChange={setDineIn} />
          </Row>
        </SectionPanel>

        {/* Contact */}
        <SectionPanel title="Contact details">
          <Row>
            <Input label="Primary contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Input label="Role / title" value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
          </Row>
          <Row>
            <Input label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Row>
        </SectionPanel>

        {/* Social media */}
        <SectionPanel title="Social media">
          <p className="text-sm text-[var(--ink-soft)]">
            Your handles appear on campaign tasks so participants can find and follow you.
          </p>
          <Row>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">Instagram</label>
              <SocialInput prefix="@" placeholder="mamacasskitchen" value={igHandle} onChange={setIgHandle} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">Facebook</label>
              <SocialInput prefix="fb/" placeholder="mamacasskitchen" value={fbHandle} onChange={setFbHandle} />
            </div>
          </Row>
          <Row>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">X (Twitter)</label>
              <SocialInput prefix="@" placeholder="mamacasskitchen" value={xHandle} onChange={setXHandle} />
            </div>
          </Row>
        </SectionPanel>

        {/* Danger */}
        <SectionPanel title="Account">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Deactivate vendor account</p>
              <p className="text-xs text-[var(--ink-soft)]">
                You won't appear in future cycles. Redemption history is retained.
              </p>
            </div>
            <Button variant="ghost">Request deactivation</Button>
          </div>
        </SectionPanel>

      </div>
    </>
  );
}



