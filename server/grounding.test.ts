import { describe, expect, it } from "vitest";
import { OUT_OF_SCOPE } from "./routers";

describe("grounded answer policy", () => {
  it("uses the exact refusal text when the source does not contain an answer", () => {
    expect(OUT_OF_SCOPE).toBe("هذا السؤال غير موجود ضمن محتوى الملف المرفوع. راجع معلّمك أو مصدرًا آخر معتمدًا.");
    expect(OUT_OF_SCOPE).not.toContain("على الأرجح");
    expect(OUT_OF_SCOPE).not.toContain("بشكل عام");
  });
});
