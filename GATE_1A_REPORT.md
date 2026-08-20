# GATE 1A REPORT — REAL DOCUMENT GAUNTLET

## Decision

### **GATE 1A PARTIAL — SPECIFIC GAPS REMAIN**

اختُبرت الآن صورة عربية حقيقية وPDF عربي جديد من المستخدم دون نسخ المحتوى إلى GitHub أو السجلات. الصورة نجحت في إنتاج OCR عربي قابل للقياس، لكن تشغيل OCR مرتين لم يكن متطابقًا؛ لذلك صُنفت OCR **PARTIAL / NON-DETERMINISTIC**. الـPDF الجديد metadata يذكر 18 صفحة ولا توجد خطوط مضمّنة، بينما extraction أعاد 315 وحدة بلا محارف عربية وبنى صفحة واحدة فقط؛ لذلك صُنّف **FAIL للاستخراج وOCR وLocation**. بقي PDF-SCAN-001 السابق Regression بنفس فشله. أُنشئ Manifest metadata-only وسُجلت النتائج دون ادعاء PASS غير مدعوم. لا تزال عينة DOCX وPDF عربي نصي مستقل مطلوبة.

## A — Samples Available

العينات الحقيقية المتاحة الآن هي صورة WebP عربية وPDF عربي جديد، إضافة إلى PDF-SCAN-001 السابق. الصورة حجمها 140,186 بايت، ونتج OCR بطول 58 وحدة مع 49 محرفًا عربيًا و2 علامات ترقيم، لكن النص بين التشغيلين اختلف. الـPDF الجديد حجمه 2,273,692 بايت، وmetadata يذكر 18 صفحة ولا توجد خطوط مضمّنة؛ extraction أعاد 315 وحدة بلا محارف عربية و63 رقمًا، وبنى Canonical من صفحة واحدة. وُجد أيضًا ملف `/home/ubuntu/audit_source_ar.txt`، لكنه يحمل بنية اختبارية صريحة، لذلك صُنّف **EXCLUDED — SYNTHETIC TEST SHEET**.

تم إنشاء `GATE_1A_CORPUS_MANIFEST.md` ويحتوي على metadata فقط، دون نسخ نصوص أو صور إلى GitHub.

## B — Samples Missing

| Type | Status | Reason |
|---|---|---|
| PDF عربي نصي | **BLOCKED — REAL SAMPLE REQUIRED** | لم تتوفر عينة مستقلة ذات طبقة نص عربية موثوقة |
| PDF عربي مصوّر/Scanned السابق | **FAIL** | PDF-SCAN-001: extraction غير عربي وفقد الصفحات، وOCR غير منفذ |
| PDF عربي مصوّر/Scanned الجديد | **FAIL** | 18 صفحة metadata، extraction بلا محارف عربية، Canonical صفحة واحدة، وOCR غير منفذ |
| DOCX عربي | **BLOCKED — REAL SAMPLE REQUIRED** | لا توجد عينة حقيقية متاحة |
| Image عربي | **PARTIAL / NON-DETERMINISTIC** | OCR أنتج 49 محرفًا عربيًا، لكن التشغيلين اختلفا في النص والبنية وEvidence IDs |

## C — Ingestion

**PARTIAL.** نجحت قراءة الصورة وPDF الجديد وحساب metadata. مسار OCR للصورة اشتغل فعليًا، بينما PDF الجديد قُرئ كملف لكن Canonical الناتج صفحة واحدة مقابل 18 صفحة metadata؛ DOCX وPDF عربي نصي مستقل ما زالا BLOCKED.

## D — Extraction

**FAIL على PDF-SCAN-001 وPDF الجديد.** الـPDF الجديد أعاد 315 وحدة بلا محارف عربية، مع Canonical من صفحة واحدة مقابل 18 صفحة metadata. أُجري extraction مرتين وكان ثابتًا، لكنه ثابت على نتيجة غير صالحة عربيًا. فشل PDF التالف باستثناء parser واضح بدل إنتاج Evidence وهمي.

## E — OCR

**PARTIAL للصورة، FAIL للـPDF.** OCR الصورة أنتج مؤشرات عربية: 49 محرفًا عربيًا و2 علامات ترقيم، لكن التشغيلين غير متطابقين؛ textStable وstructureStable وevidenceStable كلها `false`. PDF-SCAN-001 وPDF الجديد لم يشغّلا OCR، ولذلك لم ينتجا نصًا عربيًا موثوقًا.

## F — Canonical Representation

**PARTIAL.** Canonical اشتغل على OCR الصورة وعلى extraction الـPDF. الصورة أنتجت صفحة واحدة و4 Evidence، وكل عينات Evidence أعادت بناء نفسها داخليًا، لكن اختلاف OCR جعل البنية غير مستقرة. PDF الجديد أنتج صفحة واحدة و18 Evidence رغم أن metadata يذكر 18 صفحة؛ لذا لا يمثل المصدر متعدد الصفحات حتى يُنفذ OCR/page segmentation.

## G — Location Model

**FAIL على PDF-SCAN-001 وPDF الجديد؛ PARTIAL للصورة.** كلا الـPDFين أنتجا locations من `page: 1` فقط رغم metadata متعدد الصفحات. الصورة لديها `text-range` بلا page/box coordinates؛ location داخلي قابل لإعادة البناء لكنه ليس موضعًا بصريًا دقيقًا داخل الصورة.

## H — Evidence IDs

**PARTIAL.** Evidence IDs الصورة أعيد بناؤها داخليًا، لكن IDs اختلفت بين تشغيلَي OCR بسبب اختلاف النص. Evidence IDs للـPDF الجديد ثابتة بين تشغيلين لكنها مبنية على extraction غير عربي وصفحة واحدة فقط؛ لذلك لا تثبت أدلة المصدر الكامل.

## I — Evidence Reconstruction

**PARTIAL.** أُعيد بناء عينات البداية والمنتصف والنهاية للصورة والـPDF الجديد داخليًا. الصورة أعادت reconstruction داخل كل تشغيل، لكن اختلاف OCR بين التشغيلين يمنع ثبات الدليل عبر الزمن. PDF أعاد reconstruction داخليًا، لكن لا يمكن ربطه بصفحات المصدر 2–18.

## J — Deterministic Stability

**FAIL للصورة من ناحية repeatability؛ PARTIAL للـPDF.** OCR الصورة غير deterministic: textStable وstructureStable وEvidence stability = `false`. PDF الجديد كان stable في النص والبنية وEvidence IDs، لكنه stable على ناتج ناقص وغير عربي ولا يطابق page count.

## K — Error Handling

**PARTIAL.** نُفذت اختبارات سلبية مستقلة للمدخلات التالية:

| Input | Result |
|---|---|
| Empty text | فشل آمن بعد الإصلاح: `NO_EXTRACTABLE_TEXT` |
| Corrupted PDF | فشل آمن باستثناء parser (`InvalidPDFException`) |
| Unsupported MIME | فشل آمن بعد الإصلاح: `UNSUPPORTED_MIME_TYPE` |
| Low-quality image bytes | لا يمكن إثبات OCR من bytes غير صالحة؛ مسار OCR الحقيقي يحتاج صورة فعلية |
| PDF بلا نص قابل للاستخراج | مذكور كفجوة اختبار واقعية؛ لا يُمرر كنص صالح |

أضيفت حماية تمنع fallback باسم الملف أو النص الفارغ من الدخول إلى التلخيص. لم تُجرَ تغييرات معمارية كبيرة.

## L — Privacy During Test

**PASS for the executed test procedure.** لم تُسجل نصوص مستندات حقيقية أو صور أو Base64 أو مفاتيح أو Tokens. لم تُرفع أي عينة إلى GitHub. يحتوي Manifest على metadata وحالة الاختبار فقط، مع hash اختياري للورقة التجريبية المستبعدة.

## M — Tests

| Stage | Result |
|---|---|
| Before Gate 1A defensive fix | 33 tests passed |
| After Gate 1A defensive fix | **36 tests passed across 10 files** |
| New regression tests | 3 negative safe-failure tests in `server/extract.gate1a.test.ts` |

## N — Build

**PASS.** `pnpm build` نجح بعد الإصلاح، مع تحذير غير مانع يتعلق بحجم JavaScript chunk.

## O — TypeScript

**PASS.** `pnpm check` نجح بعد الإصلاح.

## P — Commits

لا يوجد Commit أو Push لهذه التعديلات الجديدة في Gate 1A حتى لحظة إعداد هذا التقرير. التعديلات موجودة على الفرع:

`feature/gate-1a-real-document-validation`

آخر Baseline منشور سابقًا على `main` هو `2fe5544`، ولم يُعدل `main`.

## Q — Remaining Gaps

الفجوات المحددة هي: إضافة PDF type detection مع OCR fallback؛ إصلاح page segmentation ليطابق 15 و18 صفحة فعلية؛ معالجة عدم حتمية OCR للصورة؛ توفير DOCX عربي وPDF عربي نصي مستقل؛ وإضافة location بصري للصورة إن كان مطلوبًا. لا يُعتبر أي PDF حالي PASS، ولا تُعتبر الصورة PASS بسبب عدم الثبات.

## Gate 1A Scorecard

| Capability | PDF Text | PDF Scanned | DOCX | Image |
|---|---|---|---|---|
| Ingestion | BLOCKED | FAIL/PARTIAL | BLOCKED | PASS |
| Extraction | BLOCKED | FAIL | BLOCKED | PARTIAL via OCR |
| OCR | BLOCKED | FAIL | BLOCKED | PARTIAL |
| Canonical Structure | PARTIAL | PARTIAL | BLOCKED | PARTIAL |
| Location Mapping | PARTIAL | FAIL | BLOCKED | PARTIAL |
| Evidence IDs | PARTIAL | PARTIAL | BLOCKED | PARTIAL |
| Reconstruction | BLOCKED | PARTIAL | BLOCKED | PARTIAL |
| Stability | PARTIAL | PARTIAL | BLOCKED | FAIL |
| Error Handling | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

`PARTIAL` هنا تعني أن البنية أو اختبارًا سلبيًا تحقق، لا أن النوع اجتاز اختبار عينة حقيقية.

## Changes Made

| File | Change | Reason |
|---|---|---|
| `server/extract.ts` | رفض MIME غير المدعوم والنص المستخرج الفارغ | منع إنشاء نتيجة فارغة تمر إلى التحليل |
| `server/routers.ts` | رفض OCR الفارغ قبل التلخيص | منع تمرير نتيجة OCR غير موثوقة |
| `server/extract.gate1a.test.ts` | ثلاث اختبارات فشل آمن | تحويل فشل حقيقي إلى Regression tests دون محتوى مستخدم |
| `GATE_1A_CORPUS_MANIFEST.md` | metadata-only corpus record | توثيق العينات المتاحة والمحجوبة دون محتوى |
| `GATE_1A_REPORT.md` | هذا التقرير | توثيق Gate 1A والقرار والفجوات ونتائج الصورة وPDF الوزارة |

## Hard Stop

بعد هذا التقرير لا يبدأ Gate 1B أو R2 migration أو Gate 2 أو RAG أو Embeddings أو Vector Search أو Payment أو Credits أو Pilot أو UI redesign أو Production deployment. الهدف الوحيد المتبقي لـGate 1A هو توفير عينات عربية حقيقية آمنة ثم إعادة تشغيل الاختبار على الفرع المخصص دون Push إلى `main`.
