export type AnalysisCitation = { label: string; quote: string };
export type AnalysisPayload = { summary: string; citations: AnalysisCitation[] };

export function normalizeAnalysisPayload(payload: unknown): AnalysisPayload {
  const value = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const citations = Array.isArray(value.citations)
    ? value.citations.filter((item): item is AnalysisCitation => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Record<string, unknown>;
        return typeof candidate.label === "string" && typeof candidate.quote === "string";
      })
    : [];
  return { summary: typeof value.summary === "string" ? value.summary : "", citations };
}
