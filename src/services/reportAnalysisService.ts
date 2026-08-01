// Report analysis service. Returns the example report today; will read
// real offer analyses once the backend is connected.

import type { OfferReport } from "@/types/report";
import { SEED_REPORT } from "@/data/seedReportData";

export function getExampleReport(): OfferReport {
  return SEED_REPORT;
}
