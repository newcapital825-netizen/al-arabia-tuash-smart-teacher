import { buildCanonicalDocument, citationsFromCanonical, type CanonicalDocument, type SourceLocation } from "./canonical";

export type SourceCitation = {
  label: string;
  quote: string;
  evidenceId?: string;
  location?: SourceLocation;
};

export type ExtractedSource = {
  text: string;
  normalizedText: string;
  citations: SourceCitation[];
  canonical: CanonicalDocument;
};

export async function extractSource(bytes: Buffer, mimeType: string): Promise<ExtractedSource> {
  let text = "";
  if (mimeType === "text/plain") {
    text = bytes.toString("utf8");
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: bytes });
    text = result.value;
  } else if (mimeType === "application/pdf") {
    const mod = await import("pdf-parse");
    const PDFParse = (mod as any).PDFParse;
    if (!PDFParse) throw new Error("PDF parser unavailable");
    const parser = new PDFParse({ data: bytes });
    const result = await parser.getText();
    text = String(result?.text ?? "");
    await parser.destroy?.();
  }
  const canonical = buildCanonicalDocument(text, mimeType);
  return {
    text: canonical.originalText,
    normalizedText: canonical.normalizedText,
    citations: citationsFromCanonical(canonical),
    canonical,
  };
}

/** Compatibility helper for OCR results that already provide text. */
export function makeCitations(text: string, mimeType = "text/plain") {
  return citationsFromCanonical(buildCanonicalDocument(text, mimeType));
}
