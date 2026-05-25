import { Building2 } from "lucide-react";
import { signInAction } from "@/app/(auth)/login/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--secondary)))] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>إباء للزيارات</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert className="mb-4 border-destructive/30 bg-destructive/5">
              <AlertTitle>تعذر تسجيل الدخول</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="next" value={searchParams.next ?? "/dashboard"} />
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="أدخل البريد الإلكتروني"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              دخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
