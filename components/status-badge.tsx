import { Badge } from "@/components/ui/badge";
import {
  customerStatusBadge,
  customerStatusLabels,
  followUpStatusBadge,
  followUpStatusLabels,
  isCustomerStatus,
  isFollowUpStatus,
  isPurchaseProbability,
  purchaseProbabilityLabels
} from "@/constants/statuses";

export function CustomerStatusBadge({ status }: { status: string | null | undefined }) {
  if (!isCustomerStatus(status)) return <Badge variant="outline">غير محدد</Badge>;
  return <Badge variant={customerStatusBadge[status]}>{customerStatusLabels[status]}</Badge>;
}

export function PurchaseProbabilityBadge({ probability }: { probability: string | null | undefined }) {
  if (!isPurchaseProbability(probability)) return <Badge variant="outline">غير محدد</Badge>;
  const variant = probability === "very_high" || probability === "high" ? "success" : probability === "medium" ? "warning" : "secondary";
  return <Badge variant={variant}>{purchaseProbabilityLabels[probability]}</Badge>;
}

export function FollowUpStatusBadge({ status }: { status: string | null | undefined }) {
  if (!isFollowUpStatus(status)) return <Badge variant="outline">غير محدد</Badge>;
  return <Badge variant={followUpStatusBadge[status]}>{followUpStatusLabels[status]}</Badge>;
}
