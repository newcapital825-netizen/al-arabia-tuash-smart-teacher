# Storage Provider Decision

## مشروع المعلم الذكي الصغير

**المالك:** أحمد صلاح — **العلامة:** العربية تُعاش

**نطاق القرار:** اختيار مزود تخزين واحد لملفات الطلاب وملفات التحليل المرتبطة بها، بحيث يحقق تخزينًا خاصًا، وصولًا من الخادم فقط، حذفًا فعليًا من Backend، Lifecycle للاحتفاظ، عزل المستخدمين، وإمكانية التحقق من الحذف. هذا القرار لا ينفذ Migration ولا ينشئ حسابًا أو Bucket أو credentials ولا يغير الكود.

## القرار المختصر

### RECOMMENDED PROVIDER: Cloudflare R2

أوصي بـ **Cloudflare R2** لهذا المشروع تحديدًا، بدرجة ثقة **MEDIUM**. السبب ليس الشهرة أو افتراض الرخص، بل ملاءمته المباشرة للبنية الحالية: واجهة S3-compatible مناسبة لخادم Express/tRPC، Presigned URLs موثقة لعمليات GET وPUT وHEAD وDELETE، Lifecycle قابل للضبط، ودعم multipart عبر واجهة S3 مع تنظيف تلقائي للرفع غير المكتمل. هذه العناصر تغطي معيار القبول المطلوب بعد إعداد الحساب واختبار التنفيذ الفعلي.[1] [2]

درجة الثقة ليست HIGH لأن الحساب الفعلي، المنطقة/endpoint، سياسة الفوترة، صلاحيات token، وحالة إعداد bucket غير متاحة في بيئة المشروع. كما أن R2 يذكر أن Lifecycle يحذف الكائنات عادةً خلال 24 ساعة من قيمة الانتهاء، وليس عند لحظة زمنية دقيقة؛ لذلك سيظل حذف Backend الفوري هو المسار الأساسي، وتبقى Lifecycle شبكة أمان للاحتفاظ والتنظيف.[2]

## المقارنة الخاصة بالمشروع

| المعيار | AWS S3 | Cloudflare R2 | Google Cloud Storage |
|---|---|---|---|
| Private objects ومنع Public access | متاح عبر إعدادات bucket policy وIAM؛ يجب تعطيل public access افتراضيًا | متاح عبر bucket خاص وAPI token؛ لا نستخدم public bucket أو custom-domain public access | متاح عبر IAM وإعدادات bucket؛ لا نستخدم public access |
| Server-side access | SDK/API ناضج جدًا، مع IAM roles أو credentials | S3-compatible SDK عبر endpoint R2، وcredentials للخادم فقط | SDK/API رسمي، غالبًا عبر service account للخادم |
| Presigned upload/download | موثق لـ PUT وGET وHEAD؛ الصلاحيات تابعة للـ IAM signer، والروابط bearer tokens [1] | موثق لـ PUT وGET وHEAD وDELETE، بانتهاء من ثانية إلى 7 أيام [2] | Signed URLs للقراءة والكتابة والحذف المحدود؛ Google توصي بأن ينفذ الخادم عمليات الحذف مباشرة بدل تمرير رابط حذف للمستخدم [3] |
| Delete Object من Backend | نعم عبر DeleteObject؛ يجب التعامل مع Versioning وdelete markers عند تفعيله [4] | نعم عبر S3-compatible DeleteObject، ويمكن التحقق بـ HEAD/GetMetadata [2] | نعم عبر `storage.objects.delete`؛ Versioning وsoft delete يحتاجان إعدادًا صريحًا [5] |
| Lifecycle / TTL | متاح لقواعد انتهاء الكائنات وقواعد AbortIncompleteMultipartUpload [6] | متاح؛ يمكن الحذف حسب العمر أو prefix، وإيقاف multipart غير المكتمل، لكن الإزالة عادة خلال 24 ساعة من expiration [2] | متاح؛ Delete وAbortIncompleteMultipartUpload؛ قد تستغرق تغييرات القواعد حتى 24 ساعة، والـ soft delete الافتراضي يحتفظ بالكائن المحذوف 7 أيام [7] |
| Verifiable deletion | نعم عبر HEAD/GetObject بعد DeleteObject، لكن يجب اختبار versioning وreplication إن فُعّلا | نعم عبر DeleteObject ثم HEAD/Get؛ ينبغي عدم تفعيل نسخة بديلة أو الاحتفاظ غير المقصود | نعم عبر GET/metadata بعد الحذف، لكن يجب تعطيل soft delete أو إدارة generation/versions كي يطابق ذلك معنى الحذف الدائم [5] [7] |
| User isolation | قوي عبر prefix/key design وIAM، لكن إعداد السياسات أكثر تفصيلًا | مناسب عبر مفاتيح namespaced وفحص ملكية الوثيقة في Backend؛ لا يمنح العميل credential دائمًا | قوي عبر IAM وservice account، مع تعقيد إضافي في generation وsoft delete |
| SDK/API والتكامل | ممتاز، لكنه يضيف إعدادات AWS IAM وbucket policies إلى المشروع | **الأبسط للمشروع الحالي** لأن endpoint S3-compatible ويمكن تغليف helper الحالي خلف adapter | جيد، لكنه يضيف نموذج Google service account وsigned URL مختلفًا عن S3 |
| Multipart / resumable | Multipart رسمي، parts مستقلة وإعادة محاولة واستكمال؛ مناسب للملفات الكبيرة والشبكات غير المستقرة [8] | S3-compatible multipart متاح؛ Presigned HTML-form POST غير مدعوم، لذا نستخدم PUT أو multipart API، لا HTML POST [2] | Resumable uploads عبر session URI؛ الخادم يبدأ الجلسة ويرسل URI للعميل، مع ضرورة حمايته كرمز bearer [3] |
| الملفات الكبيرة | قوي جدًا؛ AWS توصي multipart تقريبًا من 100 MB فأعلى [8] | مناسب عبر multipart S3 API، مع ضرورة ضبط abort للرفع غير المكتمل | مناسب عبر resumable upload، لكن مسار التنفيذ يختلف عن S3 |
| إدارة الأخطاء | أدوات ومراقبة ناضجة؛ يجب تنفيذ retries وidempotency | مسار S3 موحد نسبيًا؛ يجب التعامل مع 403 وSignatureDoesNotMatch وtimeouts، وإلغاء multipart | أخطاء IAM وgeneration وsoft-delete تحتاج معالجة دقيقة |
| حذف الملف والتحليل المرتبط | ممكن بعمليتي DeleteObject منفصلتين مع reconciliation | ممكن بعمليتي DeleteObject منفصلتين مع سجل حالة idempotent | ممكن، مع حذف الأصل وJSON التحليل ومعالجة generations/soft delete |
| Vendor lock-in | أعلى نسبيًا بسبب IAM وسياسات AWS وتفاصيل S3 | أقل من حيث واجهة التخزين لأن S3-compatible، لكن يظل endpoint وtoken وLifecycle خاصين بالمزود | متوسط إلى مرتفع بسبب IAM/service accounts وميزات GCS الخاصة |
| سهولة النقل مستقبلًا | مصدر قوي لكنه يتطلب تصدير سياسات ومفاتيح وتحققًا | الأفضل نسبيًا للمشروع الحالي بسبب S3 API؛ نحتفظ بالمفاتيح والـ metadata المجردة | ممكن عبر SDK، لكنه يحتاج تحويل signed URLs وmetadata وgeneration semantics |
| التكلفة الحالية | **ACCOUNT-LEVEL VERIFICATION REQUIRED** | **ACCOUNT-LEVEL VERIFICATION REQUIRED** | **ACCOUNT-LEVEL VERIFICATION REQUIRED** |
| الحساب الخارجي والدفع | مطلوبان عادةً، والتحقق من البطاقة والخطة على حساب المالك | مطلوبان للتحقق من توافر R2 وAPI tokens والفوترة | مطلوبان للتحقق من مشروع GCP والفوترة والخدمة |

## Privacy Assessment

يجب إنشاء bucket خاص بالكامل، ومنع أي Public Access، وعدم استخدام custom domain عام للملفات. لا تُرسل credentials إلى المتصفح. المتصفح يحصل فقط على رابط قصير العمر أو يرفع عبر مسار يقرره Backend بعد فحص الترخيص والحساب وdevice binding. يجب أن تكون مفاتيح التخزين namespaced بمعرّف مستخدم عشوائي، لا باسم الطالب أو البريد أو النص الأصلي.

العزل بين User A وUser B لا يأتي من التخزين وحده. قبل إصدار رابط أو تنفيذ Delete، يجب أن يتحقق Backend من أن الوثيقة تخص المستخدم الحالي، وأن license/device binding صحيحان، وأن مفتاح الكائن المأخوذ من قاعدة البيانات لا من input غير موثوق يقدمه العميل.

## Proof of Deletion

مع R2 يمكن تنفيذ المسار التالي من Backend بعد توافر الحساب والاعتمادات:

> `PUT/UPLOAD → HEAD/GET → DELETE → HEAD/GET returns not found`

يجب تنفيذ ذلك على الملف الأصلي وعلى JSON التحليل كلٌّ على حدة، ثم تخزين حالة الحذف غير الحساسة في قاعدة البيانات. نجاح حذف مرجع قاعدة البيانات لا يُعد دليلًا. الدليل المقبول هو نتيجة Delete API، ثم نتيجة فحص وجود لاحق تفيد عدم وجود الكائن، مع فحص عدم وجود نسخة أو multipart upload متروك.

مسار Lifecycle مختلف عن الحذف الفوري:

> `Object Created → Lifecycle rule applies → Object removed → provider metadata confirms absence`

في R2 يجب اعتبار الإزالة خلال 24 ساعة نافذة تشغيلية متوقعة، لا وعدًا بتوقيت دقيق. لذلك لا نستخدم Lifecycle بدل حذف Backend عند انتهاء جلسة أو طلب حذف طالب؛ نستخدمه كحماية احتياطية للملفات المنسية والرفع غير المكتمل.[2]

## Cost and Account Verification

لا توجد في بيئة المشروع بيانات حساب R2 أو AWS أو GCP، ولذلك لا أقدّم أرقامًا غير قابلة للإثبات. لكل المزودين، تبقى التكلفة والحدود والضرائب والفوترة وegress وquotas في حالة **ACCOUNT-LEVEL VERIFICATION REQUIRED**. لا يُتخذ القرار التجاري النهائي بشأن السعر قبل مراجعة حساب المالك وخطة الدفع الفعلية.

## What the Owner Must Provide Later

عند اعتماد Migration فقط، يحتاج المالك إلى حساب Cloudflare يدعم R2، وإنشاء bucket خاص، والحصول على Account ID وR2 API token أو Access Key ID وSecret Access Key مخصصين للخادم. يجب أن تكون الصلاحيات أقل ما يلزم: قراءة وكتابة وحذف للكائنات داخل bucket المشروع، وإدارة Lifecycle فقط إذا كان إعداد القواعد سيتم عبر API من Backend أو أداة إدارة منفصلة. لا نحتاج إلى إعطاء صلاحيات حساب Cloudflare الكامل.

لا ترسل كلمات المرور أو Access Keys أو Secret Keys في المحادثة، ولا تضعها في Frontend أو Git أو ملفات عامة. تُدار الأسرار لاحقًا عبر إدارة أسرار المشروع. لا يُطلب من المالك إدخال أي مفتاح الآن لأن الملف المرفق منع ذلك صراحةً.

## Migration Plan — R2 Only, Not Executed

### 1. Create bucket

إنشاء bucket جديد مخصص للمشروع، باسم غير دال على أسماء الطلاب، في حساب Cloudflare المملوك لأحمد صلاح. تسجيل account/endpoint/bucket metadata في إعدادات الخادم فقط.

### 2. Private access

ترك bucket خاصًا، وعدم إنشاء public bucket أو ربط custom domain عام. ضبط CORS فقط للنطاق المنشور وبالطرق والرؤوس المطلوبة عند استخدام presigned PUT أو multipart. لا تُفعل مشاركة عامة.

### 3. Lifecycle

إنشاء قاعدتين: قاعدة لحذف الملف الأصلي وملف التحليل بعد مدة الاحتفاظ المعتمدة، وقاعدة لإيقاف multipart uploads غير المكتملة بعد مدة قصيرة مناسبة. لأن R2 يذكر أن التنفيذ عادة خلال 24 ساعة، يظل مسار الحذف الفوري من Backend إلزاميًا، وتبقى Lifecycle للتنظيف الاحتياطي.[2]

### 4. Backend credentials

إنشاء API token محدود إلى bucket المشروع، ثم إدخاله في أسرار الخادم فقط. استخدام adapter مستقل بدل نشر نداءات R2 في الواجهة. عدم منح العميل token أو Access Key/Secret.

### 5. Upload path

استبدال `storagePut` الحالي خلف adapter باسم مثل `privateStorage.putObject`. يبدأ Backend الطلب بعد license/device/usage checks، ويولد key عشوائيًا. للملفات العادية يستخدم PUT أو server-side upload؛ للملفات الكبيرة يستخدم multipart S3 API مع retry لكل part، وAbort عند الفشل.

### 6. Read/access path

يُبقي `documents.access` فحص المستخدم والوثيقة والترخيص والجهاز في Backend، ثم يصدر Presigned GET قصير العمر عند الحاجة. لا يُرجع URL دائمًا ولا يضع object في public URL. يجب ألا يظهر نص الملف أو JSON التحليل في لوحة المالك.

### 7. Delete path

تنفيذ DeleteObject للأصل وملف التحليل المرتبط، مع idempotency وretry محدود. بعد كل Delete، ينفذ Backend HEAD أو GetMetadata ويتوقع Not Found. إذا بقي أحد الكائنين، تسجل حالة cleanup failure دون محتوى الملف ويعاد المحو تلقائيًا وفق سياسة آمنة.

### 8. Existing data

الطبقة الحالية لا تقدم Delete API مثبتًا. لذلك لا يبدأ النقل قبل inventory لمفاتيح Manus الحالية، وتحديد ما إذا كانت ملفات لا تزال ضمن مدة الاحتفاظ. إن تعذر حذف ملف قديم فعليًا من الطبقة القديمة، يبقى Privacy Blocker ولا يُعلن اكتمال Migration. لا تُحذف مراجع قاعدة البيانات كبديل عن حذف البايتات.

### 9. Public access test

باستخدام كائن اختبار، محاولة الوصول إلى endpoint عام دون presigned signature، والتحقق من 403 أو Not Found، ثم استخدام Presigned GET قصير العمر والتحقق من نجاحه قبل الانتهاء وفشله بعد الانتهاء. تُكرر المحاولة من نافذة خاصة غير مسجلة الدخول.

### 10. User A / User B isolation

يُنشأ مستخدمان اختباريان بملفين منفصلين. User A يجب أن يصل إلى ملفه فقط، ويُرفض طلبه لملف User B حتى لو عرف document ID أو object key. User B يجب أن يُرفض من ملف A. يُختبر ذلك في read وdelete وpresigned URL issuance.

### 11. Delete test

رفع الأصل وJSON التحليل، إثبات وجودهما، الحذف من Backend، ثم HEAD/Get لكل كائن والتأكد من Not Found. يُكرر الاختبار مع حذف مكرر، ومع فشل جزئي، ومع device مختلف، ومع رابط قديم بعد الحذف.

### 12. Lifecycle test

على prefix اختبار مستقل، إنشاء كائن قصير العمر، قراءة lifecycle configuration من API، الانتظار أو استخدام مدة اختبار مسموحة، ثم إثبات حذف الكائن. يجب تسجيل أن R2 قد يستغرق عادة حتى 24 ساعة، لذلك لا يُقبل نجاح افتراضي دون دليل زمني من الحساب.[2]

### 13. Logs test

فحص server logs وnetwork logs للتأكد من عدم تسجيل bytes أو base64 أو النص المستخرج أو الأسئلة أو presigned URLs الكاملة أو أسرار التوقيع. يسمح فقط بـ request ID وdocument ID غير الحساس وstatus وtiming وdeleteStatus.

### 14. Rollback plan

قبل cutover، حفظ mapping بين document ID وprovider/key دون حفظ محتوى الملف في DB. أثناء النقل، لا تحذف الأصل القديم حتى ينجح read/delete verification للمزود الجديد. عند فشل R2، إيقاف الرفع الجديد مؤقتًا، وإعادة القراءة المصرح بها عبر adapter القديم خلال نافذة محددة، ثم معالجة الملفات المنقولة وفق reconciliation. لا يُستخدم rollback لإعادة فتح روابط عامة ولا لحذف بيانات دون تحقق.

## Final Gate

حتى بعد اختيار R2، لا يُغلق الحاجز إلا عند تحقق العناصر الخمسة فعليًا: **Private Storage + Server Delete + Lifecycle + User Isolation + Verifiable Deletion**. الحالة الحالية للمشروع تظل **PRIVACY BLOCKER — DO NOT PUBLISH** إلى أن يوافق المالك على المزود، ويوفر الحساب عبر القناة الآمنة، ويُنفذ Migration لاحقًا، ثم ينجح اختبار الحذف الفعلي.

## References

[1]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html "AWS S3 presigned URLs"
[2]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ "Cloudflare R2 presigned URLs"
[3]: https://docs.cloud.google.com/storage/docs/access-control/signed-urls "Google Cloud Storage signed URLs"
[4]: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html "AWS S3 DeleteObject API"
[5]: https://docs.cloud.google.com/storage/docs/deleting-objects "Google Cloud Storage delete objects"
[6]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html "AWS S3 incomplete multipart lifecycle"
[7]: https://docs.cloud.google.com/storage/docs/lifecycle "Google Cloud Storage Object Lifecycle Management"
[8]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html "AWS S3 multipart upload"
