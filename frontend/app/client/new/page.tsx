"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePersona } from "@/lib/persona-context"
import type { JobType, Priority } from "@/lib/types"

const jobTypeOptions: JobType[] = ["cx", "data-labeling"]
const priorityOptions: Priority[] = ["low", "normal", "high", "urgent"]

function formatJobType(type: JobType) {
  return type === "cx" ? "CX" : "Data labeling"
}

export default function RequestJobPage() {
  const { clientName } = usePersona()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<JobType>("cx")
  const [priority, setPriority] = useState<Priority>("normal")
  const [taskCount, setTaskCount] = useState(50)
  const [dueDate, setDueDate] = useState("")
  const [requiredSkills, setRequiredSkills] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <PageHeader
        title="Request a Job"
        description="Submit a new batch request. This is a synthetic form — it doesn't reach the ops queue yet in this prototype."
      >
        <Button asChild variant="outline">
          <Link href="/client">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to my jobs
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardContent className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit} data-tour="request-job-form">
            <div className="space-y-2">
              <Label>Client</Label>
              <p className="text-sm text-foreground">{clientName || "No client selected"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-title">Job title</Label>
              <Input id="request-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="request-type">Work type</Label>
                <select
                  aria-label="Work type"
                  id="request-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as JobType)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {jobTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatJobType(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-priority">Priority</Label>
                <select
                  aria-label="Priority"
                  id="request-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as Priority)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="request-task-count">Approx. task volume</Label>
                <Input
                  id="request-task-count"
                  type="number"
                  min={1}
                  value={taskCount}
                  onChange={(event) => setTaskCount(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-due-date">Needed by</Label>
                <Input id="request-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-skills">Required skills (comma-separated)</Label>
              <Input
                id="request-skills"
                value={requiredSkills}
                onChange={(event) => setRequiredSkills(event.target.value)}
                placeholder="chat support, sentiment tagging"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-notes">Notes for the ops team</Label>
              <Textarea id="request-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
            </div>

            <Button type="submit" className="w-full">
              Submit request
            </Button>

            {submitted ? (
              <p role="status" className="text-sm text-muted-foreground">
                Request captured locally for this demo. Job intake isn't wired to a backend in this prototype, so it
                doesn't reach the ops queue yet.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </>
  )
}
