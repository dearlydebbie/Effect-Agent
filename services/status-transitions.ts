import type { JobStatus } from "../types/domain";

export const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  IDEA: ["APPROVED", "ARCHIVED"], APPROVED: ["WAITING", "PREPARING", "ARCHIVED"],
  WAITING: ["PREPARING", "FAILED", "ARCHIVED"],
  PREPARING: ["BUILDING", "FAILED", "ARCHIVED"], BUILDING: ["TESTING", "FAILED"],
  TESTING: ["NEEDS_REVIEW", "BUILDING", "FAILED"], NEEDS_REVIEW: ["READY", "BUILDING", "ARCHIVED"],
  READY: ["PUBLISHED", "BUILDING", "ARCHIVED"], PUBLISHED: ["ARCHIVED"], ARCHIVED: [],
  FAILED: ["PREPARING", "BUILDING", "ARCHIVED"],
};

export function canTransition(from: JobStatus, to: JobStatus) { return allowedTransitions[from].includes(to); }
