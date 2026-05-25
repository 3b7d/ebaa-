import { redirect } from "next/navigation";
import { ListChecks, Plus } from "lucide-react";
import {
  createInterestCategoryAction,
  setInterestCategoryActiveAction,
  updateInterestCategoryAction
} from "@/app/(dashboard)/settings/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { PageHeader } from "@/components/page-header";
import { SettingsToast } from "@/components/settings-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { formatSaudiDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = { searchParams?: Record<string, string | string[] | undefined> };

function param(searchParams: PageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function InterestCategoriesSettingsPage({ searchParams }: PageProps) {
  const { profile } = await requireUser();
  if (profile.role === "sales_employee") redirect("/dashboard");
  const canEdit = profile.role === "admin";
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("interest_categories")
    .select("id, name, description, is_active, updated_at")
    .order("name");

  return (
    <div>
      <SettingsToast success={param(searchParams, "success")} error={param(searchParams, "error")} />
      <PageHeader
        title="إدارة الأقسام"
        description="إدارة أقسام الاهتمام المستخدمة في الزيارات ونموذج QR."
        actions={
          canEdit ? (
            <Dialog>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />إضافة قسم</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة قسم</DialogTitle></DialogHeader>
                <CategoryForm action={createInterestCategoryAction} />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم القسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description ?? "غير محدد"}</TableCell>
                  <TableCell><Badge variant={category.is_active ? "success" : "outline"}>{category.is_active ? "نشط" : "غير نشط"}</Badge></TableCell>
                  <TableCell>{formatSaudiDateTime(category.updated_at)}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><ListChecks className="h-4 w-4" />تعديل قسم</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل قسم</DialogTitle></DialogHeader>
                            <CategoryForm action={updateInterestCategoryAction} category={category} />
                          </DialogContent>
                        </Dialog>
                        <ConfirmSubmit
                          action={setInterestCategoryActiveAction}
                          title={category.is_active ? "تعطيل قسم" : "تفعيل قسم"}
                          description="لن يتم حذف القسم أو الزيارات المرتبطة به. سيتم تغيير الحالة فقط."
                          confirmLabel={category.is_active ? "تعطيل قسم" : "تفعيل قسم"}
                          destructive={category.is_active}
                          hiddenFields={{ id: category.id, is_active: String(!category.is_active) }}
                          trigger={<Button variant="ghost" size="sm">{category.is_active ? "تعطيل قسم" : "تفعيل"}</Button>}
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">عرض فقط</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryForm({
  action,
  category
}: {
  action: (formData: FormData) => void | Promise<void>;
  category?: { id: string; name: string; description: string | null };
}) {
  return (
    <form action={action} className="space-y-4">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="name">اسم القسم</Label>
        <Input id="name" name="name" defaultValue={category?.name ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea id="description" name="description" defaultValue={category?.description ?? ""} rows={3} />
      </div>
      <div className="flex justify-end">
        <Button type="submit">{category ? "حفظ التعديلات" : "إضافة قسم"}</Button>
      </div>
    </form>
  );
}
