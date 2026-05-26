import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/require-vendor";

export async function GET(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;
  return NextResponse.json(result.vendor);
}
