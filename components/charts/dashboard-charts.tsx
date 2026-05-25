"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const chartColors = ["#0f9f7a", "#f59e0b", "#38bdf8", "#6366f1", "#22c55e", "#ef4444", "#64748b", "#a855f7"];

export type ChartPoint = {
  name: string;
  value: number;
};

export type TrendPoint = {
  name: string;
  value: number;
};

type ChartShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function ChartShell({ title, description, children }: ChartShellProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-80">{children}</CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      لا توجد بيانات ضمن الفترة المحددة
    </div>
  );
}

export function DashboardBarChart({
  title,
  description,
  data,
  barName = "العدد"
}: {
  title: string;
  description: string;
  data: ChartPoint[];
  barName?: string;
}) {
  return (
    <ChartShell title={title} description={description}>
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
            <Tooltip formatter={(value) => [value, barName]} />
            <Bar dataKey="value" name={barName} fill="#0f9f7a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </ChartShell>
  );
}

export function DashboardPieChart({
  title,
  description,
  data
}: {
  title: string;
  description: string;
  data: ChartPoint[];
}) {
  return (
    <ChartShell title={title} description={description}>
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, "العدد"]} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </ChartShell>
  );
}

export function DashboardLineChart({
  title,
  description,
  data
}: {
  title: string;
  description: string;
  data: TrendPoint[];
}) {
  return (
    <ChartShell title={title} description={description}>
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
            <Tooltip formatter={(value) => [value, "زيارة"]} />
            <Line type="monotone" dataKey="value" stroke="#0f9f7a" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </ChartShell>
  );
}
