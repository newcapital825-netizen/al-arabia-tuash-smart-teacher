import { createHash } from "node:crypto";

export type SourceLocation = {
  kind: "pdf-page" | "text-range" | "docx-paragraph" | "image";
  page?: number;
  paragraph?: number;
  startOffset?: number;
  endOffset?: number;
  label: string;
};

export type CanonicalEvidence = {
  evidenceId: string;
  blockIndex: number;
  originalText: string;
  normalizedText: string;
  location: SourceLocation;
};

export type CanonicalPage = {
  pageNumber?: number;
  label: string;
  evidenceIds: string[];
};

export type CanonicalDocument = {
  documentHash: string;
  mimeType: string;
  originalText: string;
  normalizedText: string;
  evidences: CanonicalEvidence[];
  pages: CanonicalPage[];
};

/**
 * Conservative Arabic normalization: it only normalizes Unicode form and whitespace.
 * It never removes hamza, tashkeel, punctuation, or sentence boundaries.
 */
export function normalizeArabicText(value: string): string {
  return value.normalize("NFC").replace(/[ \t]+/g, " ").replace(/\r\n?/g, "\n").trim();
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 16);
}

function pageParts(text: string, mimeType: string): Array<{ text: string; page?: number }> {
  if (mimeType === "application/pdf") {
    return text.split("\f").map((part, index) => ({ text: part, page: index + 1 }));
  }
  return [{ text }];
}

function splitBlocks(pageText: string): string[] {
  return pageText
    .split(/\n\s*\n|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildCanonicalDocument(text: string, mimeType: string): CanonicalDocument {
  const originalText = text;
  const normalizedText = normalizeArabicText(text);
  const documentHash = digest(`${mimeType}\n${originalText}`);
  const evidences: CanonicalEvidence[] = [];
  const pages: CanonicalPage[] = [];
  let globalOffset = 0;
  let blockIndex = 0;

  for (const part of pageParts(originalText, mimeType)) {
    const pageEvidenceIds: string[] = [];
    const blocks = splitBlocks(part.text);
    for (const block of blocks) {
      const startOffset = originalText.indexOf(block, globalOffset);
      const safeStart = startOffset >= 0 ? startOffset : globalOffset;
      const endOffset = safeStart + block.length;
      const location: SourceLocation = part.page
        ? {
            kind: "pdf-page",
            page: part.page,
            startOffset: safeStart,
            endOffset,
            label: `صفحة ${part.page}، موضع ${safeStart}-${endOffset}`,
          }
        : {
            kind: mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "docx-paragraph" : "text-range",
            paragraph: blockIndex + 1,
            startOffset: safeStart,
            endOffset,
            label: `موضع نصي ${safeStart}-${endOffset}`,
          };
      const evidenceId = `ev_${documentHash}_${String(blockIndex + 1).padStart(4, "0")}_${digest(`${safeStart}:${block}`)}`;
      evidences.push({
        evidenceId,
        blockIndex,
        originalText: block,
        normalizedText: normalizeArabicText(block),
        location,
      });
      pageEvidenceIds.push(evidenceId);
      blockIndex += 1;
      globalOffset = endOffset;
    }
    pages.push({ pageNumber: part.page, label: part.page ? `صفحة ${part.page}` : "مستند بلا ترقيم صفحات أصلي", evidenceIds: pageEvidenceIds });
  }

  return { documentHash, mimeType, originalText, normalizedText, evidences, pages };
}

export function citationsFromCanonical(document: CanonicalDocument) {
  return document.evidences.map((evidence) => ({
    label: evidence.location.label,
    quote: evidence.originalText.slice(0, 220),
    evidenceId: evidence.evidenceId,
    location: evidence.location,
  }));
}

export function reconstructEvidence(document: CanonicalDocument, evidenceId: string): CanonicalEvidence | null {
  return document.evidences.find((evidence) => evidence.evidenceId === evidenceId) ?? null;
}
