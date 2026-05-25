"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Alert className="border-destructive/30 bg-destructive/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>حدث خطأ غير متوقع</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>تعذر تحميل البيانات. يرجى المحاولة مرة أخرى أو التواصل مع مسؤول النظام.</p>
        <Button type="button" variant="outline" onClick={reset}>
          إعادة المحاولة
        </Button>
      </AlertDescription>
    </Alert>
  );
}
