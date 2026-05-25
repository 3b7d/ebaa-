import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed bg-card/60 p-8 text-center shadow-sm",
        className
      )}
    >
      <div className="mb-3 rounded-full bg-secondary p-3 text-muted-foreground ring-1 ring-border/70">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
