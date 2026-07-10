import { Suspense } from "react"
import { QueueBoard } from "./queue-board"

export default function QueuePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading task queue...</p>}>
      <QueueBoard />
    </Suspense>
  )
}
