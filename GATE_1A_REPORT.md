# GATE 1A REPORT — REAL DOCUMENT GAUNTLET

## Decision

### **GATE 1A PARTIAL — SPECIFIC GAPS REMAIN**

تم اختبار عينة PDF عربية حقيقية مرفقة من المستخدم دون نسخها إلى GitHub أو حفظ نصها. العينة حجمها 9,498,045 بايت، وmetadata يذكر 15 صفحة ولا توجد خطوط مضمّنة. أظهر PDF text extraction ناتجًا قصيرًا من 261 وحدة نصية، لكن عدد المحارف العربية كان صفرًا، وبنى الكود Canonical من صفحة واحدة و15 Evidence فقط؛ لذلك لا يمكن اعتبار الناتج تمثيلًا صالحًا لمحتوى الامتحان. أُنشئ Manifest metadata-only، واختُبرت الثبات وإعادة البناء الداخلية، وسُجلت الفجوة بدل تمرير النص وكأنه صحيح. ما زالت عينات DOCX والصورة وPDF عربي نصي مستقل مطلوبة.

## A — Samples Available

العينة المتاحة فعليًا هي PDF المرفق: 15 صفحة، 9,498,045 بايت، SHA-256 موثق في Manifest فقط، ولا توجد خطوط مضمّنة حسب metadata. وُجد أيضًا ملف `/home/ubuntu/audit_source_ar.txt`، لكنه يحمل بنية وعبارات اختبارية صريحة مثل «ملاحظة الاختبار» و«جدول الاختبار»، لذلك صُنّف **EXCLUDED — SYNTHETIC TEST SHEET** ولم يُستخدم لإثبات Gate 1A.

تم إنشاء `GATE_1A_CORPUS_MANIFEST.md` ويحتوي على metadata فقط، دون نسخ نصوص أو صور إلى GitHub.

## B — Samples Missing

| Type | Status | Reason |
|---|---|---|
| PDF عربي نصي | **BLOCKED — REAL SAMPLE REQUIRED** | لم تتوفر عينة مستقلة ذات طبقة نص عربية موثوقة |
| PDF عربي مصوّر/Scanned | **FAIL** | العينة موجودة لكن extraction أعاد 261 وحدة بلا محارف عربية، وOCR لم يُشغّل |
| DOCX عربي | **BLOCKED — REAL SAMPLE REQUIRED** | لا توجد عينة حقيقية متاحة |
| Image عربي | **BLOCKED — REAL SAMPLE REQUIRED** | لا توجد عينة حقيقية متاحة |

## C — Ingestion

**PARTIAL.** نجحت قراءة ملف PDF المرفق وحساب metadata، لكن تمثيل parser الناتج احتوى صفحة واحدة فقط مقابل 15 صفحة فعلية؛ DOCX والصورة وPDF النصي المستقل ما زالت BLOCKED.

## D — Extraction

**FAIL على العينة المرفقة.** أُجري extraction فعلي مرتين، وأعاد 261 وحدة نصية بلا محارف عربية، مع Canonical من صفحة واحدة فقط. metadata الفعلي يذكر 15 صفحة ولا توجد خطوط مضمّنة. أُجري فحص سلبي على PDF تالف وفشل باستثناء parser واضح بدل إنتاج Evidence وهمي.

## E — OCR

**FAIL على PDF المرفق.** العينة تبدو PDF مصوّرًا/بدون خطوط مضمّنة، لكن مسار upload الحالي لم يشغّل OCR لـPDF؛ لذلك لم ينتج نصًا عربيًا موثوقًا. صورة عربية مستقلة ما زالت BLOCKED.

## F — Canonical Representation

**PARTIAL.** النموذج Canonical اشتغل فعليًا على ناتج PDF، وأنتج Document/Page/Block/Evidence، لكن page count الناتج كان 1 بدل 15 والنص لم يحوِ محارف عربية؛ لذلك التمثيل قابل للتتبع داخليًا لكنه غير صالح كتمثيل للمصدر الحقيقي حتى يمر PDF المصوّر عبر OCR.

## G — Location Model

**FAIL على العينة المرفقة.** Evidence locations الداخلية تحمل `page: 1` فقط، بينما PDF metadata يذكر 15 صفحة. هذا تعارض مباشر يمنع اعتبار Location Mapping صالحًا للمصدر. أنواع المواقع الأخرى ما زالت غير مختبرة على DOCX وصورة حقيقية.

## H — Evidence IDs

**PARTIAL.** Evidence IDs كانت deterministic وثابتة في التشغيلين، وأعيد بناء عينات البداية والمنتصف والنهاية داخليًا بنجاح. لكنها مبنية على extraction ناقص من صفحة واحدة، لذلك لا تثبت أدلة المصدر الحقيقي متعدد الصفحات.

## I — Evidence Reconstruction

**PARTIAL.** أُعيد بناء ثلاثة Evidence IDs من البداية والمنتصف والنهاية للـCanonical الناتج، وكلها أعادت نفس ID داخليًا. لكن لا يمكن ربطها بصفحات المصدر 2–15 لأن parser لم يبنِ تلك الصفحات؛ لذلك لم يثبت reconstruction الكامل للمصدر.

## J — Deterministic Stability

**PASS داخليًا / PARTIAL على Gate 1A.** تشغيل PDF مرتين أعاد نفس document hash والبنية وEvidence IDs. لكن الاستقرار يثبت تكرار النتيجة الناقصة نفسها، ولا يعالج فشل OCR أو تعارض page count.

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

الفجوات المحددة هي: إضافة مسار OCR فعلي لـPDF المصوّر قبل Canonical؛ إصلاح page segmentation بحيث يطابق 15 صفحة فعلية؛ توفير PDF عربي نصي مستقل وDOCX عربي وصورة عربية؛ إعادة تشغيل reconstruction على صفحات متعددة بعد OCR؛ والتحقق من OCR العربي على الهمزات والتشكيل والأرقام والاتجاه RTL. لا يُعتبر PDF الحالي PASS؛ تصنيفه FAIL للاستخراج وOCR وLocation، مع ثبات داخلي فقط.

## Gate 1A Scorecard

| Capability | PDF Text | PDF Scanned | DOCX | Image |
|---|---|---|---|---|
| Ingestion | BLOCKED | PASS | BLOCKED | BLOCKED |
| Extraction | BLOCKED | FAIL | BLOCKED | BLOCKED |
| OCR | BLOCKED | FAIL | BLOCKED | BLOCKED |
| Canonical Structure | PARTIAL | PARTIAL | BLOCKED | BLOCKED |
| Location Mapping | PARTIAL | FAIL | BLOCKED | BLOCKED |
| Evidence IDs | PARTIAL | PARTIAL | BLOCKED | BLOCKED |
| Reconstruction | BLOCKED | PARTIAL | BLOCKED | BLOCKED |
| Stability | PARTIAL | PARTIAL | BLOCKED | BLOCKED |
| Error Handling | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

`PARTIAL` هنا تعني أن البنية أو اختبارًا سلبيًا تحقق، لا أن النوع اجتاز اختبار عينة حقيقية.

## Changes Made

| File | Change | Reason |
|---|---|---|
| `server/extract.ts` | رفض MIME غير المدعوم والنص المستخرج الفارغ | منع إنشاء نتيجة فارغة تمر إلى التحليل |
| `server/routers.ts` | رفض OCR الفارغ قبل التلخيص | منع تمرير نتيجة OCR غير موثوقة |
| `server/extract.gate1a.test.ts` | ثلاث اختبارات فشل آمن | تحويل فشل حقيقي إلى Regression tests دون محتوى مستخدم |
| `GATE_1A_CORPUS_MANIFEST.md` | metadata-only corpus record | توثيق العينات المتاحة والمحجوبة دون محتوى |
| `GATE_1A_REPORT.md` | هذا التقرير | توثيق Gate 1A والقرار والفجوات ونتيجة PDF الحقيقي |

## Hard Stop

بعد هذا التقرير لا يبدأ Gate 1B أو R2 migration أو Gate 2 أو RAG أو Embeddings أو Vector Search أو Payment أو Credits أو Pilot أو UI redesign أو Production deployment. الهدف الوحيد المتبقي لـGate 1A هو توفير عينات عربية حقيقية آمنة ثم إعادة تشغيل الاختبار على الفرع المخصص دون Push إلى `main`.
