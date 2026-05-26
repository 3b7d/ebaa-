import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUpLeft, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardPanel({ title, description, children, className, contentClassName }: PanelProps) {
  return (
    <section className={cn("rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className={cn("space-y-3", contentClassName)}>{children}</div>
    </section>
  );
}

export function DashboardHero({
  userName,
  actions
}: {
  userName?: string | null;
  actions: { href: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card p-6 shadow-lg shadow-violet-500/5">
      <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative space-y-5">
        <div>
          {userName ? <p className="mb-2 text-sm text-muted-foreground">مرحبًا، {userName}</p> : null}
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">نظرة عامة على زيارات العملاء والمتابعات وأداء الفروع</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-violet-400/60 hover:text-violet-300"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function DashboardKpiCard({
  title,
  value,
  helper,
  icon: Icon,
  chip,
  tone = "violet",
  href
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  chip?: string;
  tone?: "violet" | "green" | "amber" | "rose";
  href?: string;
}) {
  const toneMap = {
    violet: "bg-violet-500/15 text-violet-300",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    rose: "bg-rose-500/15 text-rose-300"
  };

  const content = (
    <article className="rounded-2xl border border-border/60 bg-card/75 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        {chip ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{chip}</span> : null}
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{helper}</p>
        {href ? <span className="text-xs font-medium text-primary">عرض التفاصيل</span> : null}
      </div>
    </article>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="group block cursor-pointer rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="transition group-hover:border-primary/30">{content}</div>
    </Link>
  );
}

export function StatusChip({ text, tone = "slate" }: { text: string; tone?: "green" | "amber" | "rose" | "violet" | "slate" }) {
  const cls = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    slate: "bg-muted text-muted-foreground border-border"
  };

  return <span className={cn("rounded-full border px-2.5 py-1 text-xs", cls[tone])}>{text}</span>;
}

export function ListRow({
  title,
  subtitle,
  meta,
  chip,
  actionHref
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  chip?: React.ReactNode;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/50 p-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
          <Circle className="h-3 w-3 fill-current" />
        </span>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
        {chip}
        {actionHref ? (
          <Link href={actionHref} className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">
            عرض المتابعة
            <ArrowUpLeft className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardEmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center text-sm text-muted-foreground">{text}</div>;
}
