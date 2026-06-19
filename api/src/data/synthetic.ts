import type { Agent, AuditEvent, Job, JobType, Priority, Task } from "../types";

let jobCounter = 2000;
let auditCounter = 7000;

export const jobs: Job[] = [
  {
    id: "JOB-1001",
    clientName: "Northwind Care",
    title: "Support chat tagging wave",
    type: "cx",
    priority: "high",
    status: "in_progress",
    taskCount: 180,
    createdAt: "2026-06-14T08:00:00.000Z",
  },
  {
    id: "JOB-1002",
    clientName: "Atlas Vision",
    title: "Product image labeling batch",
    type: "data-labeling",
    priority: "urgent",
    status: "qa",
    taskCount: 420,
    createdAt: "2026-06-13T10:15:00.000Z",
  },
];

export const agents: Agent[] = [
  { id: "AG-001", name: "Ari Patel", skills: ["chat support", "sentiment tagging"], availability: "available" },
  { id: "AG-002", name: "Mina Alvarez", skills: ["image labeling", "taxonomy QA"], availability: "available" },
  { id: "AG-003", name: "Jordan Kim", skills: ["case triage", "escalation handling"], availability: "busy" },
];

export const tasks: Task[] = [
  {
    id: "TASK-2001",
    jobId: "JOB-1001",
    title: "Label chat for refund request",
    priority: "high",
    status: "assigned",
    assignedAgentId: "AG-001",
    createdAt: "2026-06-16T09:30:00.000Z",
  },
  {
    id: "TASK-2002",
    jobId: "JOB-1002",
    title: "Taxonomy reconciliation pass",
    priority: "normal",
    status: "queued",
    createdAt: "2026-06-16T09:45:00.000Z",
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "AUD-5001",
    timestamp: "2026-06-16T12:12:00.000Z",
    eventType: "payout.queued",
    entityType: "task",
    entityId: "TASK-2001",
    summary: "Queued worker payout for task TASK-2001",
  },
  {
    id: "AUD-5002",
    timestamp: "2026-06-16T10:10:00.000Z",
    eventType: "task.assigned",
    entityType: "task",
    entityId: "TASK-2001",
    summary: "Assigned task TASK-2001 to AG-001",
  },
];

export function createSyntheticJob(input: {
  clientName: string;
  title: string;
  type: JobType;
  priority: Priority;
  taskCount: number;
}) {
  jobCounter += 1;
  const job: Job = {
    id: `JOB-${jobCounter}`,
    clientName: input.clientName,
    title: input.title,
    type: input.type,
    priority: input.priority,
    status: "draft",
    taskCount: input.taskCount,
    createdAt: new Date().toISOString(),
  };

  jobs.unshift(job);
  appendAudit({
    eventType: "job.created",
    entityType: "job",
    entityId: job.id,
    summary: `Created synthetic job ${job.id}`,
  });

  return job;
}

export function assignTask(taskId: string, agentId: string) {
  return updateTaskAssignment(taskId, agentId);
}

export function updateTaskAssignment(taskId: string, agentId: string | null) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return undefined;

  const previousAgentId = task.assignedAgentId;

  if (agentId === null) {
    task.assignedAgentId = undefined;
    task.status = "queued";

    appendAudit({
      eventType: "task.unassigned",
      entityType: "task",
      entityId: task.id,
      summary: `Unassigned ${task.id}${previousAgentId ? ` from ${previousAgentId}` : ""}`,
    });

    return task;
  }

  task.assignedAgentId = agentId;
  task.status = "assigned";

  if (previousAgentId && previousAgentId !== agentId) {
    appendAudit({
      eventType: "task.reassigned",
      entityType: "task",
      entityId: task.id,
      summary: `Reassigned ${task.id} from ${previousAgentId} to ${agentId}`,
    });

    return task;
  }

  appendAudit({
    eventType: "task.assigned",
    entityType: "task",
    entityId: task.id,
    summary: `Assigned ${task.id} to ${agentId}`,
  });

  return task;
}

function appendAudit(input: Omit<AuditEvent, "id" | "timestamp">) {
  auditCounter += 1;
  auditEvents.unshift({
    id: `AUD-${auditCounter}`,
    timestamp: new Date().toISOString(),
    ...input,
  });
}
