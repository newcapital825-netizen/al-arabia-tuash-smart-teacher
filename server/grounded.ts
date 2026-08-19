export const FIXED_OUT_OF_SCOPE = "هذا السؤال غير موجود ضمن محتوى الملف المرفوع. راجع معلّمك أو مصدرًا آخر معتمدًا.";

export function validateGroundedAnswer(answer: string, citations: Array<{ label: string; quote: string }>) {
  const cleaned = answer.trim();
  if (!cleaned || cleaned.includes(FIXED_OUT_OF_SCOPE)) return FIXED_OUT_OF_SCOPE;
  const match = cleaned.match(/\[\s*(?:الموضع:\s*)?الفقرة\s+(\d+)\s*\]/);
  if (!match) return FIXED_OUT_OF_SCOPE;
  const index = Number(match[1]) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= citations.length) return FIXED_OUT_OF_SCOPE;
  const quote = citations[index]?.quote?.trim();
  if (!quote || !cleaned.includes(quote.slice(0, Math.min(24, quote.length)))) return FIXED_OUT_OF_SCOPE;
  return cleaned;
}
