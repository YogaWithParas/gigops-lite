import { NextResponse } from "next/server"
import { gigWorkers, tasks } from "@/lib/gig-data"
import { pickBestWorker } from "@/lib/gig-ops"

export async function GET() {
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const task = tasks.find((item) => item.id === body.taskId) ?? tasks[0]
  const best = task ? pickBestWorker(task, gigWorkers) : undefined

  return NextResponse.json(
    {
      ok: true,
      taskId: task?.id,
      assignedWorkerId: best?.worker.id ?? null,
      score: best?.total ?? 0,
      rationale: best?.rationale ?? "No assignable worker found",
    },
    { status: 201 },
  )
}