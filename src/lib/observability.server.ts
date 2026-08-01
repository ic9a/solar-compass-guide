export type SafeLogStatus = "started" | "success" | "failure" | "denied" | "fallback";

export interface SafeLogEvent {
  operation: string;
  status: SafeLogStatus;
  route?: string;
  correlationId?: string;
  durationMs?: number;
  category?: string;
  provider?: string;
  fallbackUsed?: boolean;
  assumptionsVersion?: string;
}

const TOKEN_LIKE = /(bearer\s+|access[_-]?token|signedurl|sb_secret_|whsec_|sk_(?:live|test)_)/i;

export function safeCorrelationId(value?: string | null): string {
  if (value && /^[a-zA-Z0-9_-]{8,80}$/.test(value)) return value;
  return crypto.randomUUID();
}

export function logEvent(event: SafeLogEvent): void {
  const payload = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "production",
    ...event,
    durationMs:
      typeof event.durationMs === "number" ? Math.max(0, Math.round(event.durationMs)) : undefined,
  };
  const serialized = JSON.stringify(payload);
  if (TOKEN_LIKE.test(serialized)) {
    console.error(
      JSON.stringify({
        timestamp: payload.timestamp,
        environment: payload.environment,
        operation: "safe_logging",
        status: "failure",
        category: "SENSITIVE_LOG_FIELD_BLOCKED",
      }),
    );
    return;
  }
  console.log(serialized);
}

export function safeErrorCategory(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/unauthorized|forbidden|nu îți aparține|acces interzis/i.test(error.message))
      return "ACCESS_DENIED";
    if (/timeout|abort/i.test(error.message)) return "PROVIDER_TIMEOUT";
    if (/rate|prea multe/i.test(error.message)) return "RATE_LIMITED";
    if (/valid|format|fișier|document/i.test(error.message)) return "VALIDATION_FAILED";
  }
  return fallback;
}
