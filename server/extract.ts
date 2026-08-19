export type ExtractedSource = { text: string; citations: Array<{ label: string; quote: string }> };

export async function extractSource(bytes: Buffer, mimeType: string): Promise<ExtractedSource> {
  if (mimeType === "text/plain") {
    const text = bytes.toString("utf8");
    return { text, citations: makeCitations(text) };
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: bytes });
    return { text: result.value, citations: makeCitations(result.value) };
  }
  if (mimeType === "application/pdf") {
    const mod = await import("pdf-parse");
    const PDFParse = (mod as any).PDFParse;
    if (!PDFParse) throw new Error("PDF parser unavailable");
    const parser = new PDFParse({ data: bytes });
    const result = await parser.getText();
    const text = String(result?.text ?? "");
    await parser.destroy?.();
    return { text, citations: makeCitations(text) };
  }
  return { text: "", citations: [] };
}

export function makeCitations(text: string) {
  return text.split(/\n+/).map((line, index) => line.trim()).filter(Boolean).slice(0, 400).map((quote, index) => ({ label: `الفقرة ${index + 1}`, quote: quote.slice(0, 220) }));
}
