import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getReportsData, normalizeReportFilters, reportRowsForExport } from "@/services/reports";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toDelimited(sections: Record<string, Array<Array<unknown>>>, delimiter: "," | "\t") {
  const lines: string[] = [];
  for (const [section, rows] of Object.entries(sections)) {
    lines.push(section);
    for (const row of rows) {
      lines.push(row.map(csvEscape).join(delimiter));
    }
    lines.push("");
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

export async function GET(request: Request) {
  const { profile } = await requireUser();
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const format = raw.format === "excel" ? "excel" : "csv";
  const filters = normalizeReportFilters(raw, profile);
  const data = await getReportsData(profile, filters);
  const rows = reportRowsForExport(data);
  const body = toDelimited(rows, format === "excel" ? "\t" : ",");
  const fileName = format === "excel" ? "ebaa-visits-report.xls" : "ebaa-visits-report.csv";
  const contentType = format === "excel" ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8";

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
