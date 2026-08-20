import { describe, expect, it } from "vitest";
import { extractSource } from "./extract";

describe("Gate 1A safe failure handling", () => {
  it("rejects unsupported MIME types instead of returning empty evidence", async () => {
    await expect(extractSource(Buffer.from([1, 2, 3]), "application/octet-stream"))
      .rejects.toThrow("UNSUPPORTED_MIME_TYPE");
  });

  it("rejects empty text instead of allowing a filename fallback into analysis", async () => {
    await expect(extractSource(Buffer.alloc(0), "text/plain"))
      .rejects.toThrow("NO_EXTRACTABLE_TEXT");
  });

  it("rejects a PDF with no valid extractable text", async () => {
    await expect(extractSource(Buffer.from("not-a-valid-pdf", "utf8"), "application/pdf"))
      .rejects.toBeTruthy();
  });
});
