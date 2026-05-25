import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UserCog } from "lucide-react";
import {
  createUserAction,
  setUserActiveAction,
  updateUserAction
} from "@/app/(dashboard)/settings/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { PageHeader } from "@/components/page-header";
import { SettingsToast } from "@/components/settings-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels } from "@/constants/statuses";
import { formatSaudiDateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/database.types";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const roles: AppRole[] = ["sales_employee", "branch_supervisor", "general_manager", "admin"];

function param(searchParams: PageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function UsersSettingsPage({ searchParams }: PageProps) {
  const { profile } = await requireUser();
  if (profile.role !== "admin" && profile.role !== "general_manager") redirect("/settings");

  const canEdit = profile.role === "admin";
  const supabase = createClient();
  const [{ data: users }, { data: branches }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, branch_id, is_active, updated_at, branches(name)")
      .order("updated_at", { ascending: false }),
    supabase.from("branches").select("id, name").eq("is_active", true).order("name")
  ]);

  return (
    <div>
      <SettingsToast success={param(searchParams, "success")} error={param(searchParams, "error")} />
      <PageHeader
        title="إدارة المستخدمين"
        description="إدارة حسابات المستخدمين والأدوار والفروع المرتبطة بهم."
        actions={
          canEdit ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" />إضافة مستخدم</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة مستخدم</DialogTitle></DialogHeader>
                <UserForm action={createUserAction} branches={branches ?? []} />
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
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>رقم الجوال</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone ?? "غير محدد"}</TableCell>
                  <TableCell>{roleLabels[user.role]}</TableCell>
                  <TableCell>{(user.branches as { name?: string } | null)?.name ?? "غير محدد"}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "success" : "outline"}>{user.is_active ? "نشط" : "غير نشط"}</Badge>
                  </TableCell>
                  <TableCell>{formatSaudiDateTime(user.updated_at)}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><UserCog className="h-4 w-4" />تعديل مستخدم</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>تعديل مستخدم</DialogTitle></DialogHeader>
                            <UserForm action={updateUserAction} branches={branches ?? []} user={user} />
                          </DialogContent>
                        </Dialog>
                        <ConfirmSubmit
                          action={setUserActiveAction}
                          title={user.is_active ? "تعطيل المستخدم" : "تفعيل المستخدم"}
                          description="سيتم تحديث حالة المستخدم بدون حذف أي بيانات مرتبطة به."
                          confirmLabel={user.is_active ? "تعطيل" : "تفعيل"}
                          destructive={user.is_active}
                          hiddenFields={{ user_id: user.id, is_active: String(!user.is_active) }}
                          trigger={<Button variant="ghost" size="sm">{user.is_active ? "تعطيل" : "تفعيل"}</Button>}
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

type UserFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  branches: Array<{ id: string; name: string }>;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: AppRole;
    branch_id: string | null;
  };
};

function UserForm({ action, branches, user }: UserFormProps) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {user ? <input type="hidden" name="user_id" value={user.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="full_name">الاسم</Label>
        <Input id="full_name" name="full_name" defaultValue={user?.full_name ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" defaultValue={user?.email ?? ""} required />
      </div>
      {!user ? (
        <div className="space-y-2">
          <Label htmlFor="password">كلمة مرور مؤقتة</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="phone">رقم الجوال</Label>
        <Input id="phone" name="phone" defaultValue={user?.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">الدور</Label>
        <Select id="role" name="role" defaultValue={user?.role ?? "sales_employee"}>
          {roles.map((role) => (
            <option key={role} value={role}>{roleLabels[role]}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="branch_id">الفرع</Label>
        <Select id="branch_id" name="branch_id" defaultValue={user?.branch_id ?? ""}>
          <option value="">بدون فرع</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end md:col-span-2">
        <Button type="submit">{user ? "حفظ التعديلات" : "إضافة مستخدم"}</Button>
      </div>
    </form>
  );
}
