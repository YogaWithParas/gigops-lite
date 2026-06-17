import { NextResponse } from "next/server"
import { auditEvents } from "@/lib/gig-data"

export async function GET() {
  return NextResponse.json({ audit: auditEvents })
}
