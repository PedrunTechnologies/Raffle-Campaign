"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import { FormField, Badge } from "@/components/vendor/VendorUI";
import { auth } from "@/lib/firebase";





/* NOTE: The actual Firestore write happens in POST /api/vendor/apply
   (a server action / API route) so we never expose the Admin SDK to the browser. */

const BUSINESS_TYPES = [
  { value: "", label: "Select a business type…" },
  { value: "restaurant_full", label: "Restaurant (full service)" },
  { value: "restaurant_qsr", label: "Quick service restaurant (QSR)" },
  { value: "food_stall", label: "Food stall / kiosk" },
  { value: "cloud_kitchen", label: "Cloud / ghost kitchen" },
  { value: "cafe_bakery", label: "Café / bakery" },
  { value: "catering", label: "Catering service" },
  { value: "other", label: "Other" },
];

const DINE_IN_OPTIONS = [
  { value: "yes", label: "Yes — dine-in available" },
  { value: "no", label: "No — takeaway / delivery only" },
];

const CUISINE_OPTIONS = [
  { value: "", label: "Select a cuisine…" },
  { value: "nigerian", label: "Nigerian" },
  { value: "continental", label: "Continental" },
  { value: "chinese", label: "Chinese" },
  { value: "indian", label: "Indian" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "mixed", label: "Mixed / fusion" },
  { value: "other", label: "Other" },
];

function SectionPanel({ step, title, children }: {
  step: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-6 py-4">
        <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
          {step} · {title}
        </h3>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </div>
  );
}


function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}






export default function ApplyPage() {
  const router = useRouter();

  /* business */
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [address, setAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [dineIn, setDineIn] = useState("yes");

  /* contact */
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* socials */
  const [igHandle, setIgHandle] = useState("");
  const [fbHandle, setFbHandle] = useState("");
  // const [xHandle, setXHandle] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");





  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setError("");
    setSubmitting(true);

    try {
      // 1. Create the vendor account
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, businessType, cuisine, address,
          operatingHours, dineIn,
          contactName, contactRole, phone, email, password,
          socials: {
            ...(igHandle ? { instagram: igHandle } : {}),
            ...(fbHandle ? { facebook: fbHandle } : {}),
          },
        }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Submission failed."); return; }

      // 2. Sign in with Firebase using the credentials just submitted
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      // 3. Exchange for a session cookie
      const sessionRes = await fetch("/api/vendor/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const sessionData = await sessionRes.json() as { error?: string };
      if (!sessionRes.ok) { setError(sessionData.error ?? "Login failed."); return; }

      // 4. Redirect to the vendor dashboard
      router.push("/vendor/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo width="30" height="30" />
            <span className="text-sm font-bold">Pedrun Vendors</span>
          </div>
          <Link href="/vendor/login">
            <Button variant="ghost">Sign in instead</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 md:px-6 md:py-14">
        <div className="mb-8">
          <h1
            className="mb-2 text-3xl font-medium tracking-tight md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Apply to become a{" "}
            <em className="italic text-[var(--blue)]">Pedrun vendor</em>
          </h1>
          <p className="text-[var(--ink-soft)]">
            All fields except the social media fields are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1 · Business details */}
          <SectionPanel step="1" title="Business details">
            <Row>
              <Input
                label="Registered business name"
                placeholder="Mama Cass Kitchen Ltd"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <SelectField
                label="Business type"
                options={BUSINESS_TYPES}
                value={businessType}
                onChange={setBusinessType}
              />
            </Row>
            <Row>
              <Input
                label="Kitchen / store address"
                placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <SelectField
                label="Cuisine / category"
                options={CUISINE_OPTIONS}
                value={cuisine}
                onChange={setCuisine}
              />
            </Row>
            <Row>
              <Input
                label="Operating hours"
                placeholder="Mon–Sat · 09:00 – 22:00 · Sun · 12:00 – 22:00"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
              // hint="Separate day ranges with · e.g. Mon–Fri · 08:00–20:00"
              />
              <SelectField
                label="Dine-in available?"
                options={DINE_IN_OPTIONS}
                value={dineIn}
                onChange={setDineIn}
              />
            </Row>
          </SectionPanel>

          {/* 2 · Contact + login */}
          <SectionPanel step="2" title="Contact &amp; login details">
            <Row>
              <Input
                label="Primary contact name"
                placeholder="Cassandra Okeke"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <Input
                label="Role / title"
                placeholder="Owner / Manager"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </Row>
            <Row>
              <Input
                label="Phone number"
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="Email address"
                type="email"
                placeholder="orders@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Row>
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters — used to log in to the vendor portal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </SectionPanel>

          {/* 3 · Social media */}
          <SectionPanel step="3" title="Social media (optional)">
            <p className="text-sm text-[var(--ink-soft)]">
              Add your handles so participants can follow you as part of campaign tasks.
            </p>
            <Row>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Instagram
                </label>
                <div className="flex overflow-hidden rounded-2xl border border-[var(--line)] bg-white focus-within:border-[var(--blue)] focus-within:ring-4 focus-within:ring-[rgba(30,91,255,.10)] transition-all">
                  <span className="flex items-center border-r border-[var(--line)] bg-[var(--grey-50)] px-3 text-sm text-[var(--mute)]">@</span>
                  <input
                    type="text"
                    placeholder="mamacasskitchen"
                    value={igHandle}
                    onChange={(e) => setIgHandle(e.target.value)}
                    className="flex-1 bg-white px-3 py-4 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Facebook
                </label>
                <div className="flex overflow-hidden rounded-2xl border border-[var(--line)] bg-white focus-within:border-[var(--blue)] focus-within:ring-4 focus-within:ring-[rgba(30,91,255,.10)] transition-all">
                  <span className="flex items-center border-r border-[var(--line)] bg-[var(--grey-50)] px-3 text-sm text-[var(--mute)]">fb/</span>
                  <input
                    type="text"
                    placeholder="mamacasskitchen"
                    value={fbHandle}
                    onChange={(e) => setFbHandle(e.target.value)}
                    className="flex-1 bg-white px-3 py-4 text-sm outline-none"
                  />
                </div>
              </div>
            </Row>
            {/* <Row>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  X (Twitter)
                </label>
                <div className="flex overflow-hidden rounded-2xl border border-[var(--line)] bg-white focus-within:border-[var(--blue)] focus-within:ring-4 focus-within:ring-[rgba(30,91,255,.10)] transition-all">
                  <span className="flex items-center border-r border-[var(--line)] bg-[var(--grey-50)] px-3 text-sm text-[var(--mute)]">@</span>
                  <input
                    type="text"
                    placeholder="mamacasskitchen"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    className="flex-1 bg-white px-3 py-4 text-sm outline-none"
                  />
                </div>
              </div>
            </Row> */}
          </SectionPanel>

          {/* Agreement */}
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--blue)]"
              />
              <span className="text-sm leading-relaxed text-[var(--ink-soft)]">
                I confirm the information above is accurate and I agree to the{" "}
                <a className="cursor-pointer text-[var(--blue)] underline underline-offset-2">
                  Pedrun Vendor Terms
                </a>.
              </span>
            </label>

            {error && (
              <div className="mt-4 rounded-xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-4 py-3 text-sm text-[var(--blue)]">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/vendor/login">
                <Button variant="ghost">Back to login</Button>
              </Link>
              <Button type="submit" disabled={!agreed || submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}


