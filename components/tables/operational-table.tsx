import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function DataTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
      {children}
    </div>
  );
}

export function TableToolbar({ children }: { children: React.ReactNode }) {
  return <div className="surface-card mb-5 rounded-2xl border border-border/60 p-4 md:p-5">{children}</div>;
}

export function CustomerCell({ name, subtitle }: { name: string; subtitle?: string | null }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {initials || "--"}
      </div>
      <div>
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{subtitle || "—"}</p>
      </div>
    </div>
  );
}

export function RowActionButtons({ actions }: { actions: { label: string; href: string; variant?: "default" | "outline" | "secondary" }[] }) {
  return (
    <>
      <div className="hidden flex-wrap justify-end gap-2 lg:flex">
        {actions.map((action, idx) => (
          <Button key={action.href} asChild size="sm" variant={action.variant ?? (idx === 0 ? "secondary" : "outline")} className="rounded-full">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ))}
      </div>
      <div className="flex justify-end lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {actions.map((action) => (
              <DropdownMenuItem key={action.href} asChild>
                <Link href={action.href}>{action.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function EmptyTableState(props: React.ComponentProps<typeof EmptyState>) {
  return <EmptyState {...props} className={`m-6 rounded-xl border border-dashed bg-muted/20 p-10 ${props.className ?? ""}`} />;
}
