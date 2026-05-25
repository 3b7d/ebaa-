"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

type ConfirmSubmitProps = {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  trigger: ReactNode;
  hiddenFields: Record<string, string>;
  destructive?: boolean;
};

export function ConfirmSubmit({
  action,
  title,
  description,
  confirmLabel,
  trigger,
  hiddenFields,
  destructive
}: ConfirmSubmitProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={action}>
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <DialogFooter>
            <Button type="submit" variant={destructive ? "destructive" : "default"}>
              {confirmLabel}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
