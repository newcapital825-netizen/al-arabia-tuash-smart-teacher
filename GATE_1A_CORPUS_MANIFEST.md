# Gate 1A Corpus Manifest

هذا السجل يحتوي على metadata فقط. لم تُنسخ أي عينة حقيقية إلى المشروع أو GitHub، ولم يُحفظ محتوى مستند في هذا الملف.

| Sample ID | Type | Source format | Page count | Extraction mode | OCR required | Status |
|---|---|---|---:|---|---|---|
| PDF-TEXT-001 | PDF عربي نصي | غير متاح محليًا | — | — | لا | BLOCKED — REAL SAMPLE REQUIRED |
| PDF-SCANNED-001 | PDF عربي مصوّر/بدون خطوط مضمّنة | /home/ubuntu/upload/الامتحان_عربي_3ع_الترم_الاول_2027_المتميزون(1).pdf | 15 | PDF text extraction returned 261 code units; OCR not invoked | نعم | TESTED — EXTRACTION FAIL / OCR REQUIRED |
| DOCX-AR-001 | DOCX عربي | غير متاح محليًا | — | — | لا | BLOCKED — REAL SAMPLE REQUIRED |
| IMAGE-AR-001 | صورة عربية | /home/ubuntu/upload/Noro_comforts_Letter_Baa_2K_202607230305.webp | — | Gemini OCR ×2; 49 Arabic codepoints; 2 punctuation marks | نعم | TESTED — OCR PARTIAL / NON-DETERMINISTIC |
| PDF-TEXT-001 | PDF عربي نصي | غير متاح محليًا | — | — | لا | BLOCKED — REAL SAMPLE REQUIRED |
| PDF-MINISTRY-001 | PDF عربي مصوّر/بدون خطوط مضمّنة | /home/ubuntu/upload/موقعكورساتيكتاب_الوزارة_تانية_ثانوي_بكالوريا_النسخة_الأصلية_.pdf | 18 | PDF text extraction returned 315 code units; OCR not invoked | نعم | TESTED — EXTRACTION FAIL / OCR REQUIRED |
| TXT-AR-EXCLUDED-001 | TXT عربي تجريبي | /home/ubuntu/audit_source_ar.txt | — | text extraction | لا | EXCLUDED — SYNTHETIC TEST SHEET, NOT COUNTED AS REAL SAMPLE |

## Privacy Notes

لم يُحفظ نص أي عينة في GitHub أو في سجل الاختبار. العينة النصية المستبعدة لم تُستخدم لإثبات PASS؛ استُبعدت لأنها تحمل مؤشرات واضحة على كونها ورقة اختبار مصطنعة، ولذلك لا يجوز اعتبارها عينة عربية حقيقية وفق قاعدة Gate 1A.

Optional metadata hash for the excluded local test sheet only:

4147cd5924625b8103f92250babcc91e879d62ab6608b3378d48b48a9f37a3dd

