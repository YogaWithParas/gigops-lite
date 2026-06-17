import { NextResponse } from "next/server"
import { gigWorkers } from "@/lib/gig-data"

export async function GET() {
  return NextResponse.json({ agents: gigWorkers })
}