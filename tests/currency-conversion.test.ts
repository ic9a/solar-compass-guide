import { describe, expect, it } from "vitest";
import {
  convertOfferPriceToLei,
  convertWithExchangeRate,
  parseBnrEurRate,
} from "@/lib/currency.server";

const fixture = `<?xml version="1.0"?><DataSet><Cube date="2026-07-29"><Rate currency="USD">4.10</Rate><Rate currency="EUR">5.0712</Rate></Cube></DataSet>`;

describe("offer currency conversion", () => {
  it("parses the dated EUR quote from a fixed BNR fixture", () => {
    expect(parseBnrEurRate(fixture)).toEqual({ rate: 5.0712, date: "2026-07-29" });
  });

  it("converts using an explicit quote and preserves auditable metadata", () => {
    expect(convertWithExchangeRate(10_000, "EUR", 5.0712, "2026-07-29", "BNR")).toEqual({
      amountLei: 50_712,
      metadata: {
        original_amount: 10_000,
        original_currency: "EUR",
        exchange_rate: 5.0712,
        exchange_rate_date: "2026-07-29",
        exchange_rate_source: "BNR",
        exchange_rate_basis: "1 EUR = quoted RON",
      },
    });
  });

  it("uses deterministic identity conversion for RON", async () => {
    const result = await convertOfferPriceToLei(30_000, "RON", fetch, new Date("2026-07-30T12:00:00Z"));
    expect(result.amountLei).toBe(30_000);
    expect(result.metadata?.exchange_rate).toBe(1);
    expect(result.metadata?.exchange_rate_source).toBe("identity");
  });

  it("does not invent a rate when BNR is unavailable", async () => {
    const unavailableFetch = async () => new Response("down", { status: 503 });
    const result = await convertOfferPriceToLei(10_000, "EUR", unavailableFetch as typeof fetch);
    expect(result.amountLei).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.unavailableReason).toMatch(/nu este disponibil/i);
  });
});
