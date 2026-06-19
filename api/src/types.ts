export type JobType = "cx" | "data-labeling";
export type Priority = "low" | "normal" | "high" | "urgent";

export interface Job {
  id: string;
  clientName: string;
  title: string;
  type: JobType;
  priority: Priority;
  status: "draft" | "queued" | "in_progress" | "qa" | "complete";
  taskCount: number;
  createdAt: string;
}

export interface Task {
  id: string;
  jobId: string;
  title: string;
  priority: Priority;
  status: "queued" | "assigned" | "in_review" | "approved" | "correction_needed" | "escalated";
  assignedAgentId?: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  skills: string[];
  availability: "available" | "busy" | "offline";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  entityType: "job" | "task" | "agent";
  entityId: string;
  summary: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
