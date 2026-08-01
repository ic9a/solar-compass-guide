export type ReportAccessInput = {
  requesterId: string | null;
  ownerId: string;
  paymentStatus?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
};

export type ReportAccessDecision =
  | { authorized: true }
  | { authorized: false; reason: "anonymous" | "not_found" | "unpaid" | "refunded" };

export function evaluatePaidReportAccess(input: ReportAccessInput): ReportAccessDecision {
  if (!input.requesterId) return { authorized: false, reason: "anonymous" };
  if (input.requesterId !== input.ownerId) return { authorized: false, reason: "not_found" };
  if (input.paymentStatus === "refunded") {
    return { authorized: false, reason: "refunded" };
  }
  if (!input.paidAt || !["paid", "refunded_partial"].includes(input.paymentStatus ?? "")) {
    return { authorized: false, reason: "unpaid" };
  }
  return { authorized: true };
}
