import { followUpStatusLabels, type FollowUpStatus } from "@/constants/statuses";

export function startOfSaudiDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function getFollowUpDisplayStatus(input: {
  scheduled_at: string;
  completed_at?: string | null;
  status?: string | null;
}): FollowUpStatus {
  if (input.status === "cancelled") return "cancelled";
  if (input.completed_at || input.status === "completed") return "completed";

  const today = startOfSaudiDay();
  const tomorrow = addDays(today, 1);
  const scheduledAt = new Date(input.scheduled_at);

  if (scheduledAt < today) return "overdue";
  if (scheduledAt >= today && scheduledAt < tomorrow) return "due_today";
  return "upcoming";
}

export function getFollowUpDisplayLabel(input: {
  scheduled_at: string;
  completed_at?: string | null;
  status?: string | null;
}) {
  return followUpStatusLabels[getFollowUpDisplayStatus(input)];
}

export function getStoredFollowUpStatus(input: {
  scheduled_at: string;
  completed_at?: string | null;
  status?: string | null;
}) {
  return getFollowUpDisplayStatus(input);
}
