import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { VisitForm } from "@/components/forms/visit-form";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NewVisitPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function param(searchParams: NewVisitPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewVisitPage({ searchParams }: NewVisitPageProps) {
  const context = await requireUser();
  const supabase = createClient();
  const customerId = param(searchParams, "customer_id");
  const error = param(searchParams, "error");

  const [branchesResult, employeesResult, sourcesResult, categoriesResult, customerResult] = await Promise.all([
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name, branch_id").eq("is_active", true).order("full_name"),
    supabase.from("lead_sources").select("id, name").eq("is_active", true).order("name"),
    supabase.from("interest_categories").select("id, name").eq("is_active", true).order("name"),
    customerId
      ? supabase
          .from("customers")
          .select("id, full_name, phone, city, district, source_id, branch_id, assigned_employee_id, current_status, purchase_probability")
          .eq("id", customerId)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  return (
    <div>
      <PageHeader
        title="تسجيل زيارة جديدة"
        description="أضف بيانات العميل والزيارة والمتابعة القادمة بسرعة ووضوح"
        actions={
          <Button asChild variant="outline">
            <Link href="/visits">
              <ArrowRight className="h-4 w-4" />
              الرجوع إلى الزيارات
            </Link>
          </Button>
        }
      />

      {error ? (
        <Alert className="mb-5 border-destructive/40 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تعذر تسجيل الزيارة</AlertTitle>
          <AlertDescription>تعذر تسجيل الزيارة، يرجى المحاولة مرة أخرى.</AlertDescription>
        </Alert>
      ) : null}

      <VisitForm
        branches={branchesResult.data ?? []}
        employees={employeesResult.data ?? []}
        sources={sourcesResult.data ?? []}
        categories={categoriesResult.data ?? []}
        defaultBranchId={context.profile.branch_id}
        defaultEmployeeId={context.userId}
        initialCustomer={customerResult.data}
      />
    </div>
  );
}
