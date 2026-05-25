import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>الصفحة غير موجودة</CardTitle>
          <CardDescription>تعذر العثور على الصفحة المطلوبة أو أن الرابط غير صحيح.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">العودة إلى لوحة التحكم</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
