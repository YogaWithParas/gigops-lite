import { NextResponse } from "next/server"
import { jobs } from "@/lib/gig-data"

export async function GET() {
  return NextResponse.json({ jobs })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json(
    {
      ok: true,
      message: "Mock job accepted",
      submitted: body,
      nextStatus: "draft",
    },
    { status: 201 },
  )
}