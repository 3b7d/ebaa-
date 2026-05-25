import { notFound } from "next/navigation";
import { Building2, CheckCircle2, Send, Sparkles } from "lucide-react";
import { submitQrInterestAction } from "@/app/qr/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hasSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

type QrPageProps = {
  params: { branchId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function param(searchParams: QrPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function QrRegistrationPage({ params, searchParams }: QrPageProps) {
  if (!hasSupabaseServiceEnv()) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-6" dir="rtl">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
          <Card className="border-destructive/20">
            <CardHeader>
              <h1 className="text-xl font-bold">تعذر تحميل نموذج التسجيل</h1>
              <p className="text-sm text-muted-foreground">
                إعدادات خدمة التسجيل غير مكتملة، يرجى المحاولة لاحقًا.
              </p>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  const supabase = createServiceClient();
  const [{ data: branch }, { data: categories }] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, city")
      .eq("id", params.branchId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("interest_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
  ]);

  if (!branch) notFound();

  const success = param(searchParams, "success") === "1";
  const error = param(searchParams, "error");

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 px-4 py-6" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Card className="overflow-hidden border-primary/10 shadow-lg">
          <CardHeader className="space-y-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">سجل اهتمامك</h1>
                <p className="mt-1 text-sm text-primary-foreground/85">
                  اترك بياناتك وسيقوم فريق المبيعات بالتواصل معك
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm">
              <Building2 className="h-4 w-4" />
              {branch.name} - {branch.city}
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {success ? (
              <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>تم تسجيل اهتمامك بنجاح</AlertTitle>
                <AlertDescription>سيتواصل معك فريق المبيعات قريبًا</AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert className="mb-5 border-destructive/40 text-destructive">
                <AlertTitle>تعذر إرسال الطلب</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form action={submitQrInterestAction} className="space-y-4">
              <input type="hidden" name="branch_id" value={branch.id} />
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم</Label>
                <Input id="full_name" name="full_name" autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0500000000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input id="city" name="city" autoComplete="address-level2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_category_id">القسم المهتم به</Label>
                <Select id="interest_category_id" name="interest_category_id" required>
                  <option value="">اختر القسم المهتم به</option>
                  {(categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <input name="has_measurements" type="checkbox" className="h-4 w-4 rounded border-input" />
                هل لديك مخطط أو مقاسات؟
              </label>
              <div className="space-y-2">
                <Label htmlFor="preferred_contact_time">وقت التواصل المناسب</Label>
                <Input id="preferred_contact_time" name="preferred_contact_time" placeholder="مثال: بعد العصر" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" name="notes" rows={4} />
              </div>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4" />
                إرسال الطلب
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
