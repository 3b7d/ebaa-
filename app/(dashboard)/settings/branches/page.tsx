import { redirect } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import {
  createBranchAction,
  setBranchActiveAction,
  updateBranchAction
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
import { requireUser } from "@/lib/auth";
import { formatSaudiDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = { searchParams?: Record<string, string | string[] | undefined> };

function param(searchParams: PageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function BranchesSettingsPage({ searchParams }: PageProps) {
  const { profile } = await requireUser();
  if (profile.role === "sales_employee") redirect("/dashboard");

  const canEdit = profile.role === "admin";
  const supabase = createClient();
  const query = supabase
    .from("branches")
    .select("id, name, city, region, manager_name, is_active, updated_at")
    .order("name");
  const { data: branches } =
    profile.role === "branch_supervisor" && profile.branch_id
      ? await query.eq("id", profile.branch_id)
      : await query;

  return (
    <div>
      <SettingsToast success={param(searchParams, "success")} error={param(searchParams, "error")} />
      <PageHeader
        title="إدارة الفروع"
        description="عرض وإدارة بيانات الفروع النشطة وغير النشطة."
        actions={
          canEdit ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" />إضافة فرع</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة فرع</DialogTitle></DialogHeader>
                <BranchForm action={createBranchAction} />
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
                <TableHead>اسم الفرع</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>المنطقة</TableHead>
                <TableHead>مدير الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(branches ?? []).map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.city}</TableCell>
                  <TableCell>{branch.region ?? "غير محدد"}</TableCell>
                  <TableCell>{branch.manager_name ?? "غير محدد"}</TableCell>
                  <TableCell><Badge variant={branch.is_active ? "success" : "outline"}>{branch.is_active ? "نشط" : "غير نشط"}</Badge></TableCell>
                  <TableCell>{formatSaudiDateTime(branch.updated_at)}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Building2 className="h-4 w-4" />تعديل فرع</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل فرع</DialogTitle></DialogHeader>
                            <BranchForm action={updateBranchAction} branch={branch} />
                          </DialogContent>
                        </Dialog>
                        <ConfirmSubmit
                          action={setBranchActiveAction}
                          title={branch.is_active ? "تعطيل فرع" : "تفعيل فرع"}
                          description="لن يتم حذف الفرع أو السجلات المرتبطة به. سيتم تغيير حالته فقط."
                          confirmLabel={branch.is_active ? "تعطيل فرع" : "تفعيل فرع"}
                          destructive={branch.is_active}
                          hiddenFields={{ id: branch.id, is_active: String(!branch.is_active) }}
                          trigger={<Button variant="ghost" size="sm">{branch.is_active ? "تعطيل فرع" : "تفعيل"}</Button>}
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

function BranchForm({
  action,
  branch
}: {
  action: (formData: FormData) => void | Promise<void>;
  branch?: { id: string; name: string; city: string; region: string | null; manager_name: string | null };
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {branch ? <input type="hidden" name="id" value={branch.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="name">اسم الفرع</Label>
        <Input id="name" name="name" defaultValue={branch?.name ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">المدينة</Label>
        <Input id="city" name="city" defaultValue={branch?.city ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="region">المنطقة</Label>
        <Input id="region" name="region" defaultValue={branch?.region ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="manager_name">مدير الفرع</Label>
        <Input id="manager_name" name="manager_name" defaultValue={branch?.manager_name ?? ""} />
      </div>
      <div className="flex justify-end md:col-span-2">
        <Button type="submit">{branch ? "حفظ التعديلات" : "إضافة فرع"}</Button>
      </div>
    </form>
  );
}
