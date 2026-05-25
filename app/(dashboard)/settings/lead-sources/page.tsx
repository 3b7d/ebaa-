import { redirect } from "next/navigation";
import { Plus, Settings } from "lucide-react";
import {
  createLeadSourceAction,
  setLeadSourceActiveAction,
  updateLeadSourceAction
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

export default async function LeadSourcesSettingsPage({ searchParams }: PageProps) {
  const { profile } = await requireUser();
  if (profile.role === "sales_employee") redirect("/dashboard");
  const canEdit = profile.role === "admin";
  const supabase = createClient();
  const { data: sources } = await supabase
    .from("lead_sources")
    .select("id, name, description, is_active, updated_at")
    .order("name");

  return (
    <div>
      <SettingsToast success={param(searchParams, "success")} error={param(searchParams, "error")} />
      <PageHeader
        title="إدارة مصادر العملاء"
        description="إدارة مصادر تسجيل العملاء والزيارات التسويقية."
        actions={
          canEdit ? (
            <Dialog>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" />إضافة مصدر</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة مصدر</DialogTitle></DialogHeader>
                <SourceForm action={createLeadSourceAction} />
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
                <TableHead>اسم المصدر</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sources ?? []).map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>{source.description ?? "غير محدد"}</TableCell>
                  <TableCell><Badge variant={source.is_active ? "success" : "outline"}>{source.is_active ? "نشط" : "غير نشط"}</Badge></TableCell>
                  <TableCell>{formatSaudiDateTime(source.updated_at)}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Settings className="h-4 w-4" />تعديل مصدر</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل مصدر</DialogTitle></DialogHeader>
                            <SourceForm action={updateLeadSourceAction} source={source} />
                          </DialogContent>
                        </Dialog>
                        <ConfirmSubmit
                          action={setLeadSourceActiveAction}
                          title={source.is_active ? "تعطيل مصدر" : "تفعيل مصدر"}
                          description="لن يتم حذف المصدر أو العملاء المرتبطين به. سيتم تغيير الحالة فقط."
                          confirmLabel={source.is_active ? "تعطيل مصدر" : "تفعيل مصدر"}
                          destructive={source.is_active}
                          hiddenFields={{ id: source.id, is_active: String(!source.is_active) }}
                          trigger={<Button variant="ghost" size="sm">{source.is_active ? "تعطيل مصدر" : "تفعيل"}</Button>}
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

function SourceForm({
  action,
  source
}: {
  action: (formData: FormData) => void | Promise<void>;
  source?: { id: string; name: string; description: string | null };
}) {
  return (
    <form action={action} className="space-y-4">
      {source ? <input type="hidden" name="id" value={source.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="name">اسم المصدر</Label>
        <Input id="name" name="name" defaultValue={source?.name ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea id="description" name="description" defaultValue={source?.description ?? ""} rows={3} />
      </div>
      <div className="flex justify-end">
        <Button type="submit">{source ? "حفظ التعديلات" : "إضافة مصدر"}</Button>
      </div>
    </form>
  );
}
