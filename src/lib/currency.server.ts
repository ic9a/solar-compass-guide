export type SupportedOfferCurrency = "RON" | "EUR";

export type ExchangeRateMetadata = {
  original_amount: number;
  original_currency: SupportedOfferCurrency;
  exchange_rate: number;
  exchange_rate_date: string;
  exchange_rate_source: "identity" | "BNR";
  exchange_rate_basis: "1 RON = 1 RON" | "1 EUR = quoted RON";
};

export type CurrencyConversion = {
  amountLei: number | null;
  metadata: ExchangeRateMetadata | null;
  unavailableReason?: string;
};

const BNR_URL = "https://www.bnr.ro/nbrfxrates.xml";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { quote: ExchangeRateMetadata; expiresAt: number }>();

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseBnrEurRate(xml: string): { rate: number; date: string } | null {
  const date = xml.match(/<Cube\s+date=["']([^"']+)["']/i)?.[1];
  const rateText = xml.match(/<Rate\s+currency=["']EUR["'][^>]*>([^<]+)<\/Rate>/i)?.[1];
  const rate = Number(rateText?.trim().replace(",", "."));
  if (!date || !Number.isFinite(rate) || rate <= 0) return null;
  return { rate, date };
}

export function convertWithExchangeRate(
  amount: number,
  currency: SupportedOfferCurrency,
  rate: number,
  rateDate: string,
  source: "identity" | "BNR",
): CurrencyConversion {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return { amountLei: null, metadata: null, unavailableReason: "Suma sau cursul este invalid." };
  }
  return {
    amountLei: roundMoney(amount * rate),
    metadata: {
      original_amount: amount,
      original_currency: currency,
      exchange_rate: rate,
      exchange_rate_date: rateDate,
      exchange_rate_source: source,
      exchange_rate_basis: currency === "RON" ? "1 RON = 1 RON" : "1 EUR = quoted RON",
    },
  };
}

export async function convertOfferPriceToLei(
  amount: number | null | undefined,
  currency: string | null | undefined,
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<CurrencyConversion> {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return { amountLei: null, metadata: null, unavailableReason: "Prețul original nu este disponibil." };
  }
  const normalized = currency?.trim().toUpperCase();
  if (normalized === "RON" || normalized === "LEI") {
    return convertWithExchangeRate(amount, "RON", 1, now.toISOString().slice(0, 10), "identity");
  }
  if (normalized !== "EUR") {
    return { amountLei: null, metadata: null, unavailableReason: "Moneda ofertei nu este acceptată pentru conversie." };
  }

  const cached = cache.get("EUR");
  if (cached && cached.expiresAt > now.getTime()) {
    return convertWithExchangeRate(amount, "EUR", cached.quote.exchange_rate, cached.quote.exchange_rate_date, "BNR");
  }

  try {
    const response = await fetcher(BNR_URL, { headers: { accept: "application/xml,text/xml" } });
    if (!response.ok) throw new Error(`BNR HTTP ${response.status}`);
    const parsed = parseBnrEurRate(await response.text());
    if (!parsed) throw new Error("Răspuns BNR invalid");
    const quote = convertWithExchangeRate(1, "EUR", parsed.rate, parsed.date, "BNR").metadata!;
    cache.set("EUR", { quote, expiresAt: now.getTime() + CACHE_TTL_MS });
    return convertWithExchangeRate(amount, "EUR", parsed.rate, parsed.date, "BNR");
  } catch {
    return {
      amountLei: null,
      metadata: null,
      unavailableReason: "Cursul oficial BNR nu este disponibil; prețul nu a fost convertit.",
    };
  }
}
