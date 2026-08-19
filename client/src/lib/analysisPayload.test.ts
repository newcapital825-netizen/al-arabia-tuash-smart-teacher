import { describe, expect, it } from "vitest";
import { normalizeAnalysisPayload } from "./analysisPayload";

describe("normalizeAnalysisPayload", () => {
  it("preserves the summary and valid citations for resumed documents", () => {
    expect(normalizeAnalysisPayload({ summary: "ملخص المصدر", citations: [{ label: "الفقرة 1", quote: "نص موثق" }, { label: 2, quote: "غير صالح" }] })).toEqual({ summary: "ملخص المصدر", citations: [{ label: "الفقرة 1", quote: "نص موثق" }] });
  });
});
