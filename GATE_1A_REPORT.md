# GATE 1A REPORT — REAL DOCUMENT GAUNTLET

## Decision

### **GATE 1A PARTIAL — SPECIFIC GAPS REMAIN**

اكتملت الآن اختبارات DOCX عربي وPDF عربي إضافي، إلى جانب الصورة وPDFات المصورة السابقة. DOCX-001 نجح في extraction العربي المستقر: 2,233 محرفًا عربيًا، 31 علامة ترقيم، 120 Evidence، وثبات كامل بين تشغيلين. أما PDF-TEXT-001 فـmetadata يذكر 26 صفحة، لكن parser أعاد 459 وحدة بلا محارف عربية وبنى صفحة واحدة؛ لذلك صُنّف **FAIL للاستخراج والـLocation** رغم ثبات النتيجة داخليًا. الصورة تبقى **PARTIAL / NON-DETERMINISTIC**، وPDF-SCAN-001 وPDF-MINISTRY-001 يبقيان **FAIL**. لم يُحفظ أي محتوى في GitHub أو السجلات.

## A — Samples Available

العينات الحقيقية المتاحة الآن هي DOCX عربي، وPDF عربي مستقل، وصورة WebP عربية، إضافة إلى PDF-SCAN-001 وPDF-MINISTRY-001 السابقين. DOCX-001 حجمه 18,919 بايت واحتوى extraction على 2,233 محرفًا عربيًا. PDF-TEXT-001 حجمه 11,882,694 بايت، وmetadata يذكر 26 صفحة ولا توجد خطوط مضمّنة؛ extraction أعاد 459 وحدة بلا محارف عربية وبنى Canonical من صفحة واحدة. الصورة حجمها 140,186 بايت، ونتج OCR بطول 58 وحدة مع 49 محرفًا عربيًا و2 علامات ترقيم، لكن النص بين التشغيلين اختلف. وُجد أيضًا ملف `/home/ubuntu/audit_source_ar.txt`، لكنه يحمل بنية اختبارية صريحة، لذلك صُنّف **EXCLUDED — SYNTHETIC TEST SHEET**.

تم إنشاء `GATE_1A_CORPUS_MANIFEST.md` ويحتوي على metadata فقط، دون نسخ نصوص أو صور إلى GitHub.

## B — Samples Missing

| Type | Status | Reason |
|---|---|---|
| PDF عربي نصي | **FAIL** | 26 صفحة metadata، extraction بلا محارف عربية وبنى صفحة واحدة فقط |
| PDF عربي مصوّر/Scanned السابق | **FAIL** | PDF-SCAN-001: extraction غير عربي وفقد الصفحات، وOCR غير منفذ |
| PDF عربي مصوّر/Scanned الجديد | **FAIL** | 18 صفحة metadata، extraction بلا محارف عربية، Canonical صفحة واحدة، وOCR غير منفذ |
| DOCX عربي | **PASS / STABLE** | 2,233 محرفًا عربيًا، 120 Evidence، وثبات كامل بين تشغيلين |
| Image عربي | **PARTIAL / NON-DETERMINISTIC** | OCR أنتج 49 محرفًا عربيًا، لكن التشغيلين اختلفا في النص والبنية وEvidence IDs |

## C — Ingestion

**PARTIAL.** نجحت قراءة DOCX والصورة وPDFات الاختبار. DOCX-001 قابل للاستخراج العربي المستقر، بينما PDF-TEXT-001 وPDFات المصورة قُرئت كملفات لكن Canonical لم يمثل الصفحات الفعلية. لا توجد عينة DOCX إضافية مطلوبة لهذا الحد الأدنى.

## D — Extraction

**PASS / STABLE لـDOCX-001، FAIL للـPDFات.** DOCX extraction أعاد 2,233 محرفًا عربيًا و120 Evidence وثباتًا كاملًا بين تشغيلين. PDF-TEXT-001 أعاد 459 وحدة بلا عربية مقابل 26 صفحة metadata، وPDF-MINISTRY-001 أعاد 315 وحدة بلا عربية مقابل 18 صفحة؛ النتائج ثابتة لكنها غير صالحة كمصدر عربي.

## E — OCR

**PARTIAL للصورة، FAIL للـPDF.** OCR الصورة أنتج مؤشرات عربية: 49 محرفًا عربيًا و2 علامات ترقيم، لكن التشغيلين غير متطابقين؛ textStable وstructureStable وevidenceStable كلها `false`. PDF-SCAN-001 وPDF الجديد لم يشغّلا OCR، ولذلك لم ينتجا نصًا عربيًا موثوقًا.

## F — Canonical Representation

**PASS / STABLE لـDOCX-001، PARTIAL للصورة، FAIL وظيفيًا للـPDFات.** DOCX بنى 120 Evidence منطقية قابلة لإعادة البناء. الصورة أنتجت 4 Evidence داخلية لكن بنيتها تغيرت بين OCR تشغيلين. PDF-TEXT-001 بنى 26 Evidence في صفحة واحدة مقابل 26 صفحة metadata، وPDF-MINISTRY-001 بنى 18 Evidence في صفحة واحدة مقابل 18 صفحة؛ لذلك لا يمثلان المصدر متعدد الصفحات.

## G — Location Model

**PASS منطقيًا لـDOCX، FAIL للـPDFات، PARTIAL للصورة.** DOCX locations من نوع `docx-paragraph` ثابتة، لكنها لا تحمل أرقام صفحات مرئية. كلا الـPDFين أنتجا locations من `page: 1` فقط رغم metadata متعدد الصفحات. الصورة لديها `text-range` بلا page/box coordinates.

## H — Evidence IDs

**PASS / STABLE لـDOCX-001، PARTIAL للصورة والـPDFات.** DOCX Evidence IDs ثابتة وقابلة لإعادة البناء. الصورة IDs تختلف بين OCR تشغيلين بسبب اختلاف النص. PDF-TEXT-001 وPDF-MINISTRY-001 ثابتان بين تشغيلين لكنهما مبنيان على extraction غير عربي وصفحة واحدة فقط.

## I — Evidence Reconstruction

**PASS / STABLE لـDOCX-001، PARTIAL للصورة والـPDFات.** أعيد بناء Evidence من بداية ووسط ونهاية DOCX بنجاح وثبات. الصورة أعادت reconstruction داخل كل تشغيل لكن لا تثبت الثبات عبر الزمن. PDF-TEXT-001 وPDF-MINISTRY-001 أعادا reconstruction داخليًا، لكن لا يمكن ربط الأدلة بصفحات المصدر بعد الصفحة الأولى.

## J — Deterministic Stability

**PASS / STABLE لـDOCX-001، FAIL للصورة من ناحية repeatability، PARTIAL للـPDFات.** DOCX النص والبنية وEvidence IDs ثابتة. OCR الصورة غير deterministic. PDF-TEXT-001 وPDF-MINISTRY-001 stable في النص والبنية وEvidence IDs، لكنهما stable على ناتج ناقص وغير عربي ولا يطابق page count.

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

تم حفظ نتائج هذه الجولة على فرع Gate 1A فقط. آخر Commit وPush للفرع هو `65e922f` برسالة `test: record DOCX and text PDF gauntlet results`. التعديلات موجودة على الفرع:

`feature/gate-1a-real-document-validation`

آخر Baseline منشور سابقًا على `main` هو `2fe5544`، ولم يُعدل `main`. لم تُرفع أي ملفات عينة أو نصوص مستخرجة إلى GitHub.

## Q — Remaining Gaps

الفجوات المحددة هي: إضافة PDF type detection مع OCR fallback؛ إصلاح page segmentation ليطابق 15 و18 و26 صفحة فعلية؛ معالجة عدم حتمية OCR للصورة؛ وإضافة location بصري للصورة إن كان مطلوبًا. DOCX-001 هو المسار الوحيد الذي حقق PASS / STABLE في هذه الجولة. لا يُعتبر أي PDF حالي PASS، ولا تُعتبر الصورة PASS بسبب عدم الثبات.

## Gate 1A Scorecard

| Capability | PDF Text | PDF Scanned | DOCX | Image |
|---|---|---|---|---|
| Ingestion | FAIL/PARTIAL | FAIL/PARTIAL | PASS | PASS |
| Extraction | FAIL | FAIL | PASS | PARTIAL via OCR |
| OCR | FAIL/BLOCKED | FAIL | N/A | PARTIAL |
| Canonical Structure | PARTIAL | PARTIAL | PASS | PARTIAL |
| Location Mapping | FAIL | FAIL | PASS logical | PARTIAL |
| Evidence IDs | PARTIAL | PARTIAL | PASS / STABLE | PARTIAL |
| Reconstruction | PARTIAL | PARTIAL | PASS / STABLE | PARTIAL |
| Stability | PARTIAL | PARTIAL | PASS / STABLE | FAIL |
| Error Handling | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

`PARTIAL` هنا تعني أن البنية أو اختبارًا سلبيًا تحقق، لا أن النوع اجتاز اختبار عينة حقيقية.

## Cross-Format Findings

| السؤال | النتيجة المدعومة |
|---|---|
| What works reliably? | استخراج DOCX العربي، التطبيع المحافظ، Canonical paragraphs، Evidence IDs وإعادة البناء الداخلية؛ كلها مستقرة في DOCX-001 عبر تشغيلين. |
| What fails? | PDF extraction العربي والـpage mapping في العينات الثلاث المصوّرة/غير ذات الطبقة النصية؛ كذلك OCR للصورة غير حتمي. |
| What is partially working? | OCR الصورة ينتج نصًا عربيًا قابلًا للقياس لكنه يتغير بين التشغيلات، وCanonical يعمل داخليًا دون موقع بصري للصورة. |
| What is blocked? | إثبات PDF عربي نصي قابل للبحث، DOCX إضافي، وربط Evidence بمواضع صفحات PDF أو إحداثيات الصورة. |
| What architectural weakness is proven? | لا يكتشف المسار الحالي نوع PDF ولا يختار OCR fallback، كما أن page segmentation لا يطابق metadata للملفات المصوّرة. |
| What can be fixed locally? | إبقاء الفشل الآمن، تسجيل metrics، وإضافة اختبارات regression وتحسين رسائل الحالة؛ لا يكفي ذلك لإثبات PDF/OCR. |
| What requires architectural change? | PDF type detection → OCR fallback، page-level OCR mapping، وطبقة location بصرية للصورة، إضافة إلى معالجة حتمية OCR أو قبول عدم الحتمية كحاجز جودة. |


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
