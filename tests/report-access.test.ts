import { describe, expect, it } from "vitest";
import { evaluatePaidReportAccess } from "@/lib/report-access";

const ownerId = "owner";
const paid = { paymentStatus: "paid", paidAt: "2026-07-30T10:00:00Z" };

describe("paid report access policy", () => {
  it.each([
    ["anonymous", { requesterId: null, ownerId, ...paid }, "anonymous"],
    ["other user", { requesterId: "attacker", ownerId, ...paid }, "not_found"],
    ["unpaid owner", { requesterId: ownerId, ownerId }, "unpaid"],
    ["pending owner", { requesterId: ownerId, ownerId, paymentStatus: "pending" }, "unpaid"],
    ["refunded owner", { requesterId: ownerId, ownerId, paymentStatus: "refunded", paidAt: paid.paidAt }, "refunded"],
  ])("rejects %s", (_label, input, reason) => {
    expect(evaluatePaidReportAccess(input)).toEqual({ authorized: false, reason });
  });

  it("allows the authenticated owner with a settled payment", () => {
    expect(evaluatePaidReportAccess({ requesterId: ownerId, ownerId, ...paid })).toEqual({ authorized: true });
  });

  it("allows the owner after a partial refund while the payment remains settled", () => {
    expect(evaluatePaidReportAccess({
      requesterId: ownerId,
      ownerId,
      paymentStatus: "refunded_partial",
      paidAt: paid.paidAt,
      refundedAt: "2026-07-30T12:00:00Z",
    })).toEqual({ authorized: true });
  });
});
