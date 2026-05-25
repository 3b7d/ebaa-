"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsToast({ success, error }: { success?: string; error?: string }) {
  const message = success || error;
  if (!message) return null;
  const Icon = success ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={cn(
        "fixed left-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-lg border bg-card p-4 text-sm shadow-lg",
        success ? "border-emerald-200 text-emerald-800 dark:border-emerald-900 dark:text-emerald-200" : "border-destructive/40 text-destructive"
      )}
      role="status"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{success ? "تمت العملية بنجاح" : "تعذر تنفيذ العملية"}</p>
        <p className="mt-1 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
