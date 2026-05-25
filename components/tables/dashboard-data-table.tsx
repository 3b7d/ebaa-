import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DashboardDataTableProps = {
  title: string;
  description: string;
  headers: string[];
  rows: Array<Array<ReactNode>>;
  emptyIcon: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DashboardDataTable({
  title,
  description,
  headers,
  rows,
  emptyIcon,
  emptyTitle = "لا توجد بيانات ضمن الفترة المحددة",
  emptyDescription = "ستظهر البيانات هنا عند توفرها في النظام."
}: DashboardDataTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        )}
      </CardContent>
    </Card>
  );
}
