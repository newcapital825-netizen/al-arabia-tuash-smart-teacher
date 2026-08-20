# Architecture Decision Record — Educational AI Product v2

## القرار والنطاق

هذا المستند يحوّل «المعلم الذكي الصغير» من أداة رفع وتلخيص إلى **Educational AI Product** عربي قابل للتدقيق والبيع تدريجيًا. لا يقرر هذا المستند بدء Migration إلى R2 أو ربط بوابة دفع أو تنفيذ تحسينات UI. إنما يحدد **البنية المستهدفة، حدود المكونات، الأدلة المطلوبة، والمخاطر** قبل أي تنفيذ.

المالك والحقوق التجارية يظلان كما هما: **أحمد صلاح — العربية تُعاش**. تظل الخصوصية شرط إطلاق مانعًا، وتظل الإجابة مقيدة بمحتوى الملف المرفوع في الجلسة. لا يجوز للمحرك استخدام المعرفة العامة لسد فجوة الدليل، ولا يجوز عرض إجابة بلا موضع استشهاد قابل للتحقق أو قرار امتناع صريح.

## الوضع الحالي والهدف المستهدف

الوضع الحالي يثبت بعض اللبنات المهمة: واجهة عربية RTL، ترخيص وربط حساب/جهاز، استخراج/OCR عربي حي، إجابة من المصدر مع رفض خارج المصدر، استخدامًا محدودًا، وسجل اختبارات ناجحًا. لكنه لا يثبت بعد محرك استرجاع هرميًا لكتاب طويل، ولا Benchmark ذهبيًا، ولا حذفًا فعليًا من R2، ولا تحقق دفع تجاريًا عبر Webhook.

الهدف المستهدف هو خط معالجة يحافظ على البنية الأصلية للوثيقة، ويسترجع أدلة متعددة من مستويات مختلفة، ويمرر الإجابة عبر Validator مستقل قبل عرضها:

> `Ingestion → OCR/Parsing → Structure Preservation → Mapping → Indexing → Hybrid Retrieval → Evidence Set → Verification → Reasoning → Abstention/Answer → Citation`

## مبادئ غير قابلة للتفاوض

| المبدأ | القرار المعماري |
|---|---|
| المصدر أولًا | كل إجابة أو امتناع يعتمد على محتوى الملف الحالي فقط. لا Web search ولا معرفة عامة داخل مسار الإجابة. |
| الدليل قبل الادعاء | لا تُعرض إجابة إلا مع Evidence IDs وموضع أصلي ونتيجة Validator ناجحة. |
| الامتناع الآمن | عند عدم بلوغ Evidence Threshold يظهر رد ثابت مثل: «لم أجد في الملف المرفوع نصًا كافيًا يثبت هذه الإجابة.» |
| الخصوصية | محتوى الملفات لا يدخل لوحة المالك أو analytics أو logs. التخزين خاص، والقراءة عبر Backend أو روابط قصيرة العمر. |
| قابلية التدقيق | كل خطوة تسجل metadata تشغيلية غير حساسة ونسخة pipeline/model/config، لا النص الخام. |
| قابلية الرجوع | كل تغيير تخزين أو دفع أو فهرسة خلف adapter/versioned interface، مع عدم حذف القديم قبل reconciliation. |
| لا إطلاق مبكر | لا Pilot تجاري قبل إغلاق Gate 1 وGate 2 ثم جلسة Gate 3. |

## المكونات ومسؤولياتها

| المكوّن | المسؤولية | المدخلات | المخرجات | ما لا يفعله |
|---|---|---|---|---|
| Document Ingestion | التحقق من النوع والحجم والامتداد، إنشاء `documentId`، وحفظ metadata | ملف، user/device/license | سجل وثيقة وحالة معالجة | لا يفسر المحتوى ولا يثق باسم الملف |
| Private Storage Adapter | رفع وقراءة وحذف الأصل والتحليل والملفات المؤقتة | bytes، private key | key، signed access، delete status | لا يقرر ملكية الوثيقة؛ ذلك مسؤولية Backend |
| OCR/Parsing | استخراج نص عربي من PDF/DOCX/TXT والصور، مع OCR للصفحات | bytes، mime، page image | blocks، tokens، confidence، page refs | لا يصدر إجابة نهائية |
| Structure Preservation | حفظ ترتيب الصفحات والعناوين والفقرات والجداول والصور والأسئلة | parsed blocks | document tree | لا يعيد كتابة النص أو يختصره |
| Hierarchical Parser | بناء `book → unit → lesson → page → paragraph → sentence → table/image/question` | document tree | nodes وparent/child edges | لا يفترض بنية غير موجودة؛ unknown structure تُوسم صراحة |
| Mapping Layer | ربط كل chunk بموقعه الأصلي، الصفحة، الإحداثيات عند توفرها، والاقتباس | nodes، parser output | stable Evidence IDs | لا يخترع page number |
| Semantic Index | فهرسة embeddings أو تمثيل دلالي للـchunks، مع نسخة نموذج وفهرس | chunks، model version | vector index refs | لا يقرر صحة الإجابة |
| Lexical Index | بحث كلمات/مصطلحات/مرادفات حرفية مع دعم العربية والتطبيع الموثق | normalized text | keyword hits | لا يستبدل الدليل الدلالي |
| Hybrid Retrieval | دمج lexical + semantic + hierarchical signals، ثم reranking | question، document tree، indexes | ranked Evidence Set | لا يجيب مباشرة من أول hit |
| Evidence Verifier | التحقق من وجود النص، تطابق المعنى، الموضع، عدم الاختلاق، وعدم خروج المعلومة | candidate answer، evidence set | verified/failed/abstain + reasons | لا يضيف معلومة من خارج الملف |
| Answer Composer | صياغة عربية محافظة على معنى المصدر مع استشهادات | verified evidence | answer + citations + confidence | لا يتجاوز Validator ولا يرفع الثقة يدويًا |
| Abstention Policy | تطبيق الحد الأدنى للأدلة وقواعد التعارض/النقص | verification result | fixed abstention response | لا يحول النقص إلى تخمين |
| Usage Credits | خصم رصيد من Backend حسب العملية وقواعد idempotency | user plan، operation | ledger entry، remaining balance | لا يخصم من الواجهة ولا يربط الدفع مباشرة بالعرض |
| Payment Abstraction | توحيد order/provider/webhook/verified payment/plan activation | payment order، provider events | verified transaction | لا يفعّل خطة من redirect أو screenshot فقط |
| Quality Dashboard | عرض معدلات تشغيلية مجمعة للمالك | counters، statuses، timings | metrics without content | لا يعرض النص أو الصور أو أسئلة الطلاب |

## تدفق البيانات المقترح

### Ingestion and indexing

بعد تحقق الترخيص والجهاز والرصيد، ينشئ Backend وثيقة بحالة `UPLOADING`. تُحفظ bytes في تخزين خاص خلف adapter، ثم تعالج worker pipeline الصفحة أو الملف كاملًا. ينتج parser عقدًا هرمية وEvidence IDs ثابتة، ثم تُفهرس chunks دلاليًا وحرفيًا مع metadata: `documentId`, `nodeId`, `page`, `section`, `paragraph`, `charRange`, `contentHash`, `ocrConfidence`, `parserVersion`, و`indexVersion`.

لا تُحفظ الإجابة أو النص الكامل في قاعدة البيانات التشغيلية. يمكن تخزين metadata وreferences إلى storage الخاص، بينما تُحفظ artifacts الحساسة في التخزين الخاص بسياسة احتفاظ معروفة. يجب أن يستطيع النظام إعادة بناء الفهرس أو إبطال نسخة قديمة عند تغيير parser/model دون فقد المصدر.

### Question answering

يُحلل السؤال إلى intent وentities وقيود موضعية دون استخدام معرفة خارجية. ينفذ النظام بحثًا حرفيًا، وبحثًا دلاليًا، وبحثًا هرميًا داخل العناوين والوحدات والدروس والصفحات، ثم يدمج النتائج ويعيد ترتيبها. إذا احتاج السؤال الربط بين موضعين، يجب أن يحتوي Evidence Set على الموضعين وأن يسجل علاقة الربط بدل اختيار أقرب chunk فقط.

يمرر Answer Composer الأدلة المرشحة إلى Validator مستقل. لا يُسمح بالعرض إلا إذا تحققت شروط الحد الأدنى: وجود اقتباس فعلي، تطابق موضعي، تغطية كافية لكل claim، وعدم وجود claim غير مدعوم. عند التعارض أو غموض OCR أو نقص الدليل، تكون النتيجة **ABSTAIN** لا إجابة احتمالية.

### Citation contract

كل claim في الإجابة يحمل `claimId` وواحدًا أو أكثر من `evidenceId`. يحتوي الاستشهاد على الصفحة أو عنوان القسم أو الفقرة أو إحداثيات الصورة عند توفرها، واقتباس قصير لا يكشف أكثر مما يحتاجه الطالب. يجب أن يستطيع Validator إعادة فتح المصدر الخاص والتحقق من `contentHash` وموضع النص.

## Retrieval Design

### Hierarchical Educational Retrieval

لا يُعامل الكتاب الطويل كمجموعة chunks مسطحة. يُخزن كل chunk ضمن مساره البنيوي، وتدخل إشارات المسار في الترتيب: تطابق عنوان الوحدة، قرب الدرس، رقم الصفحة، علاقة السؤال/الجواب، وتتابع الفقرات. عند السؤال المقارن، يبحث النظام عن تعريف كل طرف ثم أدلة الفروق والعلاقة، لا عن فقرة واحدة تشبه صياغة السؤال.

### Hybrid ranking

الترتيب المقترح يجمع أربع عائلات من الإشارات: lexical matching للمصطلحات، semantic similarity للمعنى، hierarchy proximity للبنية، وevidence quality للـOCR والموضع والاكتمال. يجب حفظ نسخة معادلة الترتيب وعتباتها حتى تكون نتائج Benchmark قابلة للمقارنة. لا يجوز استخدام score واحد بوصفه «حقيقة»؛ فهو إشارة ترتيب يحتاج إلى Validator.

## Evidence Threshold and Abstention

يُحدد threshold في إعداد versioned لا داخل prompt فقط. مثال السياسة المستهدفة: كل claim يحتاج evidence واحدًا مباشرًا قويًا، أو أكثر من دليل متسق للادعاءات المركبة؛ أي تعارض غير محلول يفرض الامتناع؛ وأي استشهاد لا يمكن فتحه أو مطابقته يفرض الامتناع. القيم الرقمية النهائية لا تعتمد قبل Benchmark على بيانات عربية ممثلة.

صيغة الامتناع الموحدة هي:

> **لم أجد في الملف المرفوع نصًا كافيًا يثبت هذه الإجابة. راجع معلّمك أو مصدرًا آخر معتمدًا.**

يمكن إضافة جملة تعليمية قصيرة، لكن لا يجوز أن تتحول إلى تفسير خارج المصدر أو أن تخفف وضوح الامتناع.

## Golden Dataset and Benchmark

يُبنى Golden Dataset من ملف أو كتب عربية مرخصة للاختبار، ولا تُستخدم ملفات طلاب حقيقية دون موافقة ونزع هوية مناسب. يتكون الإصدار الأول من 100 سؤال موزعة كما يلي:

| الفئة | العدد | معيار التقييم |
|---|---:|---|
| استرجاع مباشر | 20 | العثور على Evidence صحيح واستشهاد موضعي |
| فهم | 20 | حفظ المعنى وعدم إضافة معلومة خارجية |
| ربط بين موضعين | 20 | جمع الأدلة الصحيحة من موضعين أو أكثر |
| تحليل مقيد بالمصدر | 15 | تحليل يستند إلى claims قابلة للتحقق |
| أسئلة متعددة المواضع داخل الكتاب | 10 | استرجاع هرمي وإعادة ترتيب ناجحة |
| إجابة غير موجودة | 5 | Abstention صحيح لا تخمين |
| أسئلة مضللة | 5 | رفض الفرضية أو تصحيحها من المصدر فقط |
| Prompt Injection | 5 | بقاء تعليمات المصدر وعدم الخروج عنه |
| **الإجمالي** | **100** | — |

المقاييس المطلوبة هي Retrieval Recall@k وEvidence Precision وCitation Accuracy وAnswer Faithfulness وAbstention Precision/Recall وOCR Character/Word Accuracy وLatency وCost per operation. يجب أن تُحفظ نتائج كل نسخة pipeline/model في تقرير قابل للمقارنة، ولا تُعلن «دقة» واحدة دون تعريف dataset وthreshold.

## Usage Credits and Unit Economics

يفصل النظام بين الخطة والرصيد ودفتر العمليات. كل عملية تنشئ ledger entry idempotent: `operationId`, `userId`, `documentId` عند الحاجة، `operationType`, `creditsDebited`, `status`, وtimestamp. لا يُخصم الرصيد مرتين عند retry، ولا يُعاد الرصيد إلا عبر compensation موثق عند فشل العملية.

العمليات المقترحة هي تحليل ملف، OCR إضافي، وسؤال. القيم `X` و`1` و`300` أمثلة تصميمية وليست أسعارًا أو التزامات نهائية. قبل التسعير التجاري يجب قياس تكلفة OCR وLLM وembeddings وretrieval وstorage وbandwidth ورسوم الدفع والدعم، ثم حساب:

> `Revenue per plan > AI cost + infrastructure + payment fees + support + target margin`

لا تُستخدم بيانات أسعار غير متاحة من الحسابات الفعلية لصنع قرار تجاري نهائي.

## Payment Abstraction Layer

يُبنى الدفع خلف واجهة provider قابلة للاستبدال:

> `Subscription → Payment Order → Payment Provider → Webhook → Verified Payment → Activate Plan → Add Credits`

الواجهة لا تفعّل الخطة من صفحة redirect أو لقطة شاشة أو قيمة مرسلة من العميل. Webhook يحتاج signature verification وidempotency وevent replay handling، مع ربط payment order بحساب المستخدم وخطة واضحة. يحتفظ النظام بسجل transaction metadata فقط، دون تخزين بيانات البطاقة.

بالنسبة لمصر، يُدرس Gateway موحد مثل Fawry Accept أو مزود مكافئ، لكن لا يُحسم الاختيار من صفحة تسويق. قبل القرار يجب التحقق من API، webhooks، settlement، الرسوم، onboarding، طرق الدفع المتاحة لحساب المالك، ومتطلبات التاجر. Vodafone Cash وEtisalat Cash لا يُربطان مباشرة قبل معرفة مسار gateway التجاري المتاح؛ المعمارية تستوعبهما كوسائل داخل provider لا كفروع متناثرة في الكود.

## Storage and Privacy Gate

يبقى R2 مرشح التخزين المستهدف، لا تخزينًا مثبتًا. Gate 1 يتطلب Bucket خاصًا، server-side credentials، Upload، Private Read، Delete، Verify Not Found، Lifecycle، وعزل User A عن User B. يجب أن يشمل الحذف الأصل وJSON التحليل والملفات المؤقتة، وألا يعتبر حذف DB دليلًا.

البيانات القديمة لا تُنقل أو تُحذف عشوائيًا. قبل cutover يجب عمل inventory للمفاتيح والوثائق، وإثبات قدرة المزود القديم على التعامل معها أو إبقاء المسار القديم للقراءة المصرح بها. أي عجز عن إثبات الحذف يبقي **PRIVACY BLOCKER — DO NOT PUBLISH**.

## Owner Quality Dashboard

تعرض لوحة المالك مؤشرات مجمعة فقط: Retrieval success rate، Citation verification rate، Abstention rate، OCR failure rate، upload failure rate، average analysis time، AI error rate، payment success rate، usage، وfailed operations. يجب أن ترتبط كل metric بنطاق زمني ونسخة pipeline/model، وأن تُراجع صلاحياتها عبر `adminProcedure`.

لا تعرض اللوحة filename أو extracted text أو prompt أو answer أو صورة أو object URL أو presigned URL أو بيانات دفع حساسة. يمكن عرض counts وdurations وstatus codes وoperation IDs غير الحساسة، مع retention للسجلات التشغيلية.

## Gates Before Pilot

| البوابة | شرط الخروج | حالة المشروع الحالية |
|---|---|---|
| Gate 1 — Infrastructure & Privacy | R2 private upload/read/delete/verify/lifecycle، عزل، وlogs آمنة | **BLOCKED / PARTIAL**؛ ACCOUNT SETUP REQUIRED |
| Gate 2 — Intelligence Quality | Golden Dataset، retrieval hierarchy، validator، citations، abstention، Benchmark موثق | **NOT STARTED as v2**؛ توجد اختبارات grounding أولية فقط |
| Gate 3 — Field Acceptance | جلسة Teacher/Student على متصفح: license → upload → ask → citation → credits → payment | **BLOCKED**؛ لا تبدأ الآن |
| Gate 4 — Commercial Pilot | عدد صغير من المستخدمين، مراقبة metrics، support وrollback | **NOT STARTED** |

## Principal Risks and Controls

| الخطر | الأثر | التحكم المقترح |
|---|---|---|
| OCR عربي خاطئ | إجابة أو citation غير صحيحة | حفظ OCR confidence، مراجعة page mapping، Abstention عند الغموض، قياس OCR في Golden Dataset |
| Chunking يقطع المعنى | استرجاع خارج السياق | hierarchical nodes، overlap مضبوط، حفظ parent/child، اختبارات الأسئلة الموزعة |
| اختلاق الصفحة أو الاقتباس | فقد الثقة وخرق فلسفة المنتج | Validator يفتح المصدر ويقارن contentHash/position قبل العرض |
| معرفة خارج المصدر | إجابة غير مسموحة | system/policy guard + evidence-only composer + injection tests |
| فشل Lifecycle أو soft delete | بقاء بيانات الطالب | Delete Backend فوري، lifecycle كشبكة أمان، Verify Not Found، اختبار versions/retention |
| تسرب signed URL أو secret | وصول غير مصرح | server-side only، TTL قصير، لا logs، bucket private، authorization قبل الإصدار |
| خصم رصيد خاطئ | خسارة مالية أو شكاوى | ledger idempotency، compensation، transaction status، اختبارات retries |
| Webhook مزيف أو مكرر | تفعيل خطط دون دفع | signature verification، event idempotency، provider status reconciliation |
| تكلفة AI أعلى من السعر | خسارة تجارية | unit economics، cost per operation، limits، monitoring، إيقاف آمن عند نفاد الرصيد |
| Vendor lock-in | صعوبة النقل | adapters، provider-neutral metadata، export/reconciliation، versioned interfaces |
| كشف محتوى في dashboard/logs | خرق الخصوصية | allowlist للحقول، redaction tests، content-free analytics |

## What Must Not Be Implemented Yet

لا يبدأ الآن R2 Migration أو Payment Gateway أو multipart أو تغييرات UI أو Pilot أو اختبار المتصفح الميداني. لا تُطلب مفاتيح عبر المحادثة، ولا تُستخدم بيانات طلاب حقيقية لبناء Golden Dataset، ولا تُعلن الأسعار قبل unit economics وحسابات provider الفعلية.

## Architecture Decision

**اعتماد Architecture v2 كمخطط مستهدف، مع فصل التنفيذ إلى Gates.** يبدأ التنفيذ لاحقًا من Gate 1 بعد إعداد R2 الآمن، ثم Gate 2 بمحرك الاسترجاع والتحقق والBenchmark، ثم جلسة قبول واحدة، ثم Pilot تجاري صغير. لا يُسمح بتجاوز Gate 1 أو Gate 2 بحجة أن الواجهة تعمل.

## References

[1]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ "Cloudflare R2 presigned URLs"
[2]: https://developers.cloudflare.com/r2/buckets/object-lifecycles/ "Cloudflare R2 object lifecycles"
[3]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html "AWS S3 multipart upload reference for the S3-compatible design"
