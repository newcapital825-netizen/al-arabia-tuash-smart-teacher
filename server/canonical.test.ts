import { describe, expect, it } from "vitest";
import { buildCanonicalDocument, normalizeArabicText, reconstructEvidence } from "./canonical";

describe("Gate 1 canonical document representation", () => {
  it("keeps original Arabic text while normalizing only Unicode and spacing", () => {
    const original = "إِنَّ الطالبَ  يقرأ.\n\nوالدرسُ واضح!";
    const document = buildCanonicalDocument(original, "text/plain");
    expect(document.originalText).toBe(original);
    expect(document.normalizedText).toContain(normalizeArabicText("إِنَّ الطالبَ يقرأ."));
    expect(document.normalizedText).toContain(normalizeArabicText("والدرسُ واضح!"));
    expect(normalizeArabicText(original)).toContain(normalizeArabicText("إِنَّ"));
  });

  it("creates deterministic, traceable evidence IDs and reconstructs source text", () => {
    const input = "الدرس الأول\n\nتعريف مهم.";
    const first = buildCanonicalDocument(input, "text/plain");
    const second = buildCanonicalDocument(input, "text/plain");
    expect(first.evidences.map((item) => item.evidenceId)).toEqual(second.evidences.map((item) => item.evidenceId));
    const evidence = first.evidences[1];
    expect(evidence.location.kind).toBe("text-range");
    expect(evidence.location.page).toBeUndefined();
    expect(reconstructEvidence(first, evidence.evidenceId)?.originalText).toBe("تعريف مهم.");
  });

  it("maps PDF form-feed pages without inventing pages for plain text", () => {
    const pdf = buildCanonicalDocument("صفحة أولى\fصفحة ثانية", "application/pdf");
    expect(pdf.pages.map((page) => page.pageNumber)).toEqual([1, 2]);
    expect(pdf.evidences[1].location.label).toContain("صفحة 2");

    const txt = buildCanonicalDocument("نص بلا ترقيم", "text/plain");
    expect(txt.pages[0].pageNumber).toBeUndefined();
    expect(txt.pages[0].label).toContain("بلا ترقيم صفحات");
  });

  it("keeps malformed/empty input as an explicit empty representation", () => {
    const empty = buildCanonicalDocument("", "text/plain");
    expect(empty.originalText).toBe("");
    expect(empty.evidences).toHaveLength(0);
    expect(empty.pages).toHaveLength(1);
  });
});
