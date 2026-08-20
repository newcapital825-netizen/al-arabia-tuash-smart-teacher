# GATE 1 REPORT — Trusted Data Foundation

## القرار التنفيذي

### **GATE 1 PARTIAL — SPECIFIC GAPS REMAIN**

تم تنفيذ طبقة أولية حقيقية للتمثيل القانوني داخل المشروع، تشمل حفظ النص الأصلي، نسخة normalized منفصلة، بنية Document/Evidence/Page، معرّفات Evidence deterministic، ومواقع صادقة لا تخترع رقم صفحة للملفات التي لا توفر ترقيمًا أصليًا. نجحت فحوص TypeScript و33 اختبارًا آليًا.

لكن Gate 1 لا يُعلن Passed بعد؛ لأن عينات PDF عربي نصي، PDF عربي مصور، DOCX عربي، وصورة عربية غير موجودة في بيئة الاختبار الحالية. كما لم يُنفذ اختبار OCR حي جديد لهذه الجولة، ولم تُثبت إعادة بناء الأدلة من artifacts فعلية لكل نوع ملف. وفق القاعدة المعلنة، تُصنف هذه العناصر **BLOCKED — REAL SAMPLE REQUIRED** بدل اعتبارها PASS بالاعتماد على Mock أو fixtures اصطناعية.

## A — Ingestion

| Test | Result | Evidence |
|---|---|---|
| TXT عربي داخل canonical pipeline | PASS — AUTOMATED | `extractSource` يحول النص إلى CanonicalDocument، ويحفظ `originalText` و`normalizedText` ويولد Evidence IDs. تغطيه `server/canonical.test.ts`. |
| PDF عربي نصي حقيقي | BLOCKED — REAL SAMPLE REQUIRED | لا توجد عينة PDF محلية في بيئة الاختبار الحالية؛ لم يُستخدم Mock. |
| PDF عربي مصور حقيقي | BLOCKED — REAL SAMPLE REQUIRED | لا توجد عينة صورة/PDF مصور، واختبار OCR الميداني غير متاح في هذه الجولة. |
| DOCX عربي حقيقي | BLOCKED — REAL SAMPLE REQUIRED | لا توجد عينة DOCX محلية؛ لم يُعتبر مسار Mammoth PASS ميدانيًا. |
| صورة عربية حقيقية | BLOCKED — REAL SAMPLE REQUIRED | لا توجد عينة صورة محلية؛ لم يُعتبر مسار Gemini Vision/OCR PASS جديدًا. |
| File validation and supported MIME path | PASS — BASELINE | مسار `documents.upload` الحالي يرفض الصيغ غير المدعومة والحجم الكبير، وتغطيه اختبارات tRPC السابقة. |
| حفظ الأصل قبل المعالجة | PASS — CODE REVIEW | `CanonicalDocument.originalText` يبقى منفصلًا عن `normalizedText`، ولا تُستبدل النسخة الأصلية بالتطبيع. |

## B — Structure

### هل أصبح لدينا Document → Page → Section → Block → Evidence؟

**PARTIAL.** أصبح لدينا تمثيل تنفيذي لـ `Document → Page → Block → Evidence`، مع `documentHash` و`evidenceId` وموضع لكل block. لم تُنفذ بعد طبقة Section/lesson hierarchy مستقلة؛ لذلك لا أصف البنية بأنها Hierarchical Educational Parsing كاملة.

| العنصر | الحالة | دليل التنفيذ |
|---|---|---|
| Document | PASS | `CanonicalDocument` يحمل `documentHash`, `mimeType`, original/normalized text. |
| Page | PASS/PARTIAL | PDF يستخدم form-feed إن توفر لإسناد page number؛ الأنواع الأخرى تسجل صفحة غير مرقمة. يلزم اختبار PDF فعلي. |
| Section | PARTIAL | غير ممثل كعقد section مستقل بعد؛ لا يبدأ Gate 2 بهذه الفجوة. |
| Block | PASS | تقسيم محافظ إلى blocks مع offsets أصلية. |
| Evidence | PASS — AUTOMATED | كل block يحمل deterministic `evidenceId` و`originalText` و`location`. |

## C — Location Mapping

### **PARTIAL**

في PDF، يستخدم النموذج page boundaries التي يعيدها النص المستخرج عندما تظهر كـ form-feed، ويخزن `page`, `startOffset`, و`endOffset`. في TXT وDOCX لا يُخترع رقم صفحة؛ يستخدم النموذج `text-range` أو `docx-paragraph` مع offsets وlabel صريح مثل «مستند بلا ترقيم صفحات أصلي».

هذا يحقق مبدأ الموقع الصادق على مستوى canonical model، لكنه لا يثبت بعد أن مكتبة PDF الحالية تعيد page boundaries صحيحة في ملفات عربية حقيقية، ولا يثبت mapping لإحداثيات الصورة أو الجداول. هذه الاختبارات تتطلب عينات حقيقية.

## D — OCR

### **PARTIAL**

تم إبقاء OCR العربي الحالي في مسار التطبيق، وربط ناتجه بـCanonical Representation بدل citations نصية اصطناعية فقط. كما بقي الأصل والنص المطبع منفصلين داخل artifact التحليل الخاص. لكن لا توجد عينة صورة عربية أو PDF مصور محلية في هذه الجولة، لذلك لا أرفع النتيجة إلى PASS ولا أدعي تحقق OCR حي جديد.

| جانب OCR | Result | Evidence |
|---|---|---|
| Arabic OCR integration path | PASS — BASELINE | المسار السابق يستدعي Gemini Vision للصور مع تعليمات استخراج عربي من الصورة فقط. |
| Original vs normalized text | PASS — AUTOMATED | اختبارات canonical تتحقق من بقاء الأصل والتطبيع المنفصل. |
| OCR accuracy on Arabic real sample | BLOCKED — REAL SAMPLE REQUIRED | لا توجد عينة حقيقية محلية. |
| OCR uncertainty handling | PARTIAL | الفشل يمر إلى حالة تحليل فاشلة ولا يتحول تلقائيًا إلى إجابة، لكن threshold مستقل لـOCR confidence يحتاج عينة وقرارًا لاحقًا. |

## E — Evidence Reconstruction

### **PASS — AUTOMATED / PARTIAL REAL-WORLD EVIDENCE**

تولد `buildCanonicalDocument` IDs حتمية من نوع `ev_{documentHash}_{blockIndex}_{blockDigest}`. تعيد `reconstructEvidence(document, evidenceId)` الـoriginalText والموقع نفسه من التمثيل القانوني. اختبارات Gate 1 تثبت أن إعادة البناء تعيد النص الأصلي، وأن نفس المدخل يولد IDs متطابقة، وأن PDF form-feed ينتج page labels مختلفة.

الجزء المتبقي هو إعادة الاختبار على artifacts حقيقية من PDF/DOCX/OCR، ثم حفظ evidence artifact في التخزين الخاص وربطه بمسار citation في المنتج. لا يجوز اعتبار هذا الجزء مثبتًا من اختبار strings وحده.

## F — Error Handling

### **PARTIAL**

التمثيل الفارغ لا يخترع دليلًا؛ المدخل الفارغ ينتج `evidences = []`. مسارات الرفع الحالية تتعامل مع فشل التخزين والتحليل وتوسم الوثيقة فاشلة وتعيد الرصيد وفق التصميم السابق، كما تمنع الإجابة عند غياب source صالح.

أما حالات PDF التالف، PDF غير القابل للاستخراج، الصورة غير الواضحة، وOCR غير الموثوق فلم تُختبر بعينات فعلية في هذه الجولة. لذلك تبقى **BLOCKED — REAL SAMPLE REQUIRED** لهذه الحالات، ويجب أن تؤدي لاحقًا إلى `documentStatus=failed` أو Abstention لا إلى fallback يذكر اسم الملف كأنه محتوى.

## G — Privacy

### **PARTIAL — PRIVACY BLOCKER REMAINS**

لم تُضف طبقة logging لمحتوى الملفات، ولم يُحفظ canonical artifact في قاعدة البيانات؛ يُحفظ ضمن JSON التحليل في التخزين الخاص الحالي. اختبارات الخصوصية السابقة ونجاح 33 اختبارًا يدعمان عدم تسجيل content في المسارات المغطاة.

لكن التخزين الحالي لا يزال Manus built-in storage دون Delete API مثبت، وR2 Migration لم تُنفذ بسبب **ACCOUNT SETUP REQUIRED**. لذلك يستمر الحكم الصريح:

> **PRIVACY BLOCKER — DO NOT PUBLISH**

## H — Remaining Gaps

| الفجوة | الحالة المطلوبة قبل الإغلاق |
|---|---|
| عينات PDF/DOCX/صورة عربية حقيقية | توفير عينات اختبار مرخصة أو غير شخصية وتشغيل المسار الفعلي دون Mock. |
| PDF page mapping | إثبات page numbers وoffsets من PDF عربي نصي ومصور فعليًا. |
| Section hierarchy | إضافة Section nodes فقط بعد تثبيت extraction/location، لا بدء RAG الآن. |
| OCR confidence | حفظ/اختبار confidence ورفض النتائج غير الموثوقة. |
| Evidence artifact persistence | حفظ canonical/evidence artifact في التخزين الخاص وربطه بالوثيقة دون DB content. |
| Evidence reconstruction من storage | إثبات `Evidence ID → Original Location → Original Text` بعد استرجاع artifact الخاص. |
| Error fixtures الواقعية | تشغيل ملف تالف وفارغ وصورة غير واضحة وPDF غير قابل للاستخراج. |
| R2 Delete/Lifecycle | إغلاق Gate 1 Privacy عبر R2 Upload → Read → Delete → Verify Not Found → Lifecycle وعزل المستخدمين. |
| اختبارات الموبايل والمتصفح | مؤجلة إلى Gate 3، وليست جزءًا من Gate 1 الحالي. |

## I — Gate Decision

### **GATE 1 PARTIAL — SPECIFIC GAPS REMAIN**

تم تثبيت نواة Trusted Data Foundation واختبارها آليًا، لكن لا يبدأ Gate 2، ولا Hybrid Retrieval، ولا Embeddings، ولا Vector Search، ولا Payment، ولا Usage Credits، ولا Pilot، ولا UI redesign. تبقى الخطوة التالية محصورة في توفير عينات حقيقية مرخصة واستكمال إثبات mapping/OCR/reconstruction، بالتوازي مع إغلاق R2 Privacy Gate وفق تقرير P1.8 السابق.

## Test Summary

| Check | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm test` | PASS — 9 files, 33 tests |
| New Gate 1 canonical tests | PASS — 4 tests |
| PDF/DOCX/image real samples | BLOCKED — REAL SAMPLE REQUIRED |
| RAG / embeddings / payment / UI redesign | NOT STARTED BY DESIGN |
| Privacy publication gate | BLOCKED |
