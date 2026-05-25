"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrLinkActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copyLink}>
        <Copy className="h-4 w-4" />
        {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
      </Button>
      <Button asChild size="sm">
        <Link href={url} target="_blank">
          <ExternalLink className="h-4 w-4" />
          عرض النموذج
        </Link>
      </Button>
    </div>
  );
}
