import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { VendorRecord } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string;
      businessType: string;
      cuisine: string;
      address: string;
      operatingHours: string;
      dineIn: "yes" | "no";
      contactName: string;
      contactRole: string;
      phone: string;
      email: string;
      password: string;
      socials: { instagram?: string; facebook?: string; x?: string };
    };

    /* ── Validate required fields ── */
    const required = ["name", "email", "password", "contactName", "phone"] as const;
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
      }
    }
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    /* ── Check for duplicate email ── */
    try {
      await adminAuth.getUserByEmail(body.email);
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    } catch {
      // getUserByEmail throws if not found — that's what we want
    }

    /* ── Create Firebase Auth user ── */
    const userRecord = await adminAuth.createUser({
      email: body.email,
      password: body.password,
      displayName: body.contactName,
    });

    /* ── Create vendor Firestore doc ── */
    const vendorRef = adminDb.collection("vendors").doc();

    const vendor: Omit<VendorRecord, "createdAt" | "updatedAt"> & {
      createdAt: unknown; updatedAt: unknown;
    } = {
      id: vendorRef.id,
      uid: userRecord.uid,
      name: body.name.trim(),
      businessType: body.businessType,
      cuisine: body.cuisine,
      address: body.address.trim(),
      operatingHours: body.operatingHours.trim(),
      dineIn: body.dineIn,
      contactName: body.contactName.trim(),
      contactRole: body.contactRole?.trim() ?? "",
      phone: body.phone.trim(),
      email: body.email.toLowerCase().trim(),
      socials: body.socials ?? {},
      status: "active",      // admin must approve before they can log in
      cycleCount: 0,
      cycles: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await vendorRef.set(vendor);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[vendor/apply]", err);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}
