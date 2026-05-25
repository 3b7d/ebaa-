"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle>حدث خطأ غير متوقع</CardTitle>
          <CardDescription>تعذر تحميل الصفحة. يرجى إعادة المحاولة.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={reset}>
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
