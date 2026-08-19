# P1.6 — Storage Architecture Decision

## Storage Architecture Decision

**القرار: `MIGRATE STORAGE` عند اعتماد مزود يدعم الحذف الفعلي، مع حالة تشغيلية حالية `BLOCKED` حتى يتم التحقق من الحساب والاعتمادات.**

الطبقة الحالية هي تخزين Manus المدمج. دليل المشروع يثبت أن الاعتمادات تُحقن تلقائيًا، وأن الرفع والقراءة الموقعة متاحان عبر `storagePut` و`storageGet` و`storageGetSignedUrl`، لكنه ينص صراحةً على عدم وجود endpoint لحذف الكائن الفعلي والاكتفاء بإسقاط المفتاح من قاعدة البيانات.[1] لذلك لا يمكن اختيار `KEEP CURRENT STORAGE` أو `MODIFY CURRENT STORAGE` لمتطلب الخصوصية الحالي.

لا يُنفذ النقل الآن. القرار هو إعداد Migration Plan مشروطة ثم انتظار موافقة المالك وتوفير حساب التخزين والاعتمادات. لا يبدأ اختبار القبول البشري قبل حل هذا الحاجز وإعادة إثبات دورة الحذف.

## Available Options

| الخيار | Upload | Read | Delete فعلي | Lifecycle/Expiration | Private + Server-side authorization | متاح الآن؟ | القرار |
|---|---:|---:|---:|---:|---:|---|---|
| Manus built-in storage | نعم عبر helper مدمج | نعم عبر signed redirect/URL | **غير متاح في واجهة المشروع** | **غير مثبت/غير قابل للضبط من المشروع** | جزئيًا عبر المسارات الخلفية والروابط الموقعة | نعم | **مرفوض لمتطلب الخصوصية** |
| AWS S3 | نعم عبر SDK/API | نعم عبر SDK/API | نعم عبر `DeleteObject`؛ versioning يحتاج حذف النسخة صراحةً للحذف الدائم [2] | نعم عبر S3 Lifecycle expiration [3] | نعم عبر IAM وbucket policy وserver-side credentials | **ACCOUNT-LEVEL VERIFICATION REQUIRED** | مرشح قوي بعد التحقق |
| Cloudflare R2 | نعم عبر S3-compatible API | نعم عبر API | نعم عبر S3-compatible API، لكن يجب اختبار النسخ/الاحتفاظ في الحساب | نعم عبر Object Lifecycle؛ الوثيقة تذكر أن الحذف عادة خلال 24 ساعة [4] | نعم عبر API token وprivate bucket/server-side access | **ACCOUNT-LEVEL VERIFICATION REQUIRED** | مرشح بعد التحقق |
| Google Cloud Storage | نعم عبر SDK/API | نعم عبر SDK/API | نعم عبر `storage.objects.delete` [5] | متاح عبر سياسات دورة الحياة، مع ضرورة مراجعة soft delete/versioning | نعم عبر IAM وserver-side credentials | **ACCOUNT-LEVEL VERIFICATION REQUIRED** | مرشح بعد التحقق |

### Option A — هل يمكن إصلاح التخزين الحالي؟

لا يوجد في واجهة الطبقة الحالية مسار موثوق للحذف الفعلي. يمكن تحسين الحجب المنطقي، وتقليل السجلات، وإسقاط المراجع، لكن ذلك لا يحقق معيار القبول: `Upload → Private Storage → Use → Delete → Object No Longer Exists`.

### Option B — هل توجد Lifecycle/TTL في الطبقة الحالية؟

لم يُعثر في helper المدمج أو إعدادات المشروع الحالية على Lifecycle أو TTL قابل للضبط أو التحقق. لا يجوز افتراض أن مدة `expiresAt` في قاعدة البيانات تضبط مدة الكائن في التخزين.

### Option C — هل توجد طبقة أخرى متاحة داخل البيئة؟

المشروع يحتوي على حزم SDK عامة للتخزين، لكن ذلك لا يعني وجود bucket أو credentials لخدمة مستقلة. لا توجد في البيئة الحالية بيانات حساب AWS أو R2 أو GCS تثبت الجاهزية. لذلك الحالة هي **ACCOUNT-LEVEL VERIFICATION REQUIRED**، وليس «متاحًا».

### Option D — هل نحتاج مزودًا خارجيًا؟

نعم، ما لم يوفّر مالك المنصة API حذف وLifecycle رسميين للطبقة المدمجة. المزود الخارجي ليس مطلوبًا لمظهر احترافي، بل لأن معيار الخصوصية يتطلب Delete فعليًا يمكن استدعاؤه من Backend والتحقق منه.

## Recommended Option

التوصية المشروطة هي **AWS S3 أو Cloudflare R2 أو Google Cloud Storage بعد تحقق الحساب**، مع تفضيل المزود الذي يستطيع المالك إثبات توافره واعتماداته وسياسة Lifecycle لديه. لا أختار مزودًا واحدًا نهائيًا دون معرفة الحساب والميزانية والمنطقة ومتطلبات الاحتفاظ.

يجب أن تكون الملفات private، ويُنشئ الخادم signed URLs قصيرة العمر بعد فحص `userId` و`deviceFingerprint` وملكية الوثيقة. يجب تعطيل الوصول العام، وعدم وضع مفاتيح الخدمة في المتصفح، وتسجيل metadata غير الحساسة فقط. يجب أن يحذف مسار Backend الملف الأصلي وJSON التحليل معًا، ثم يتحقق من عدم وجودهما عبر `HEAD`/`GetMetadata` أو نتيجة API مماثلة.

## Privacy Impact

مع التخزين الحالي، يبقى **PRIVACY BLOCKER** قائمًا لأن إسقاط المرجع من قاعدة البيانات لا يثبت اختفاء البايتات. مع مزود قابل للحذف، يمكن تحقيق العزل والتحكم الخلفي ودورة الاحتفاظ، لكن يجب اختبار versioning وsoft delete وreplication ونسخ backup؛ فالحذف المنطقي لا يساوي دائمًا حذفًا دائمًا في كل إعداد.

لا يجوز نشر المنتج التجاري قبل إثبات عدم وجود نسخة أخرى من الملف أو JSON التحليل في bucket، النسخ، multipart uploads غير المكتملة، أو السجلات. كما يجب أن تظل سجلات الخادم خالية من body وbase64 والنصوص والتوكنات.

## Cost / Account Requirements

| المتطلب | الحالة |
|---|---|
| اسم الخدمة | AWS S3 أو Cloudflare R2 أو Google Cloud Storage |
| متاحة ضمن البيئة الحالية | غير مثبتة؛ المتاح حاليًا هو Manus built-in storage فقط |
| حساب خارجي | مطلوب للمزود المختار |
| API credentials | مطلوبة للخادم فقط، ولا تُكشف للمتصفح |
| التكلفة | **ACCOUNT-LEVEL VERIFICATION REQUIRED**؛ لا أقدّم سعرًا أو حدًا غير موثق لحساب المالك |
| حدود التخزين/الطلبات | تعتمد على المزود والخطة والحساب؛ **ACCOUNT-LEVEL VERIFICATION REQUIRED** |
| Delete فعلي | موثق في AWS/R2/GCS، غير متاح في helper الحالي |
| Lifecycle | موثق في AWS/R2، ويحتاج تحققًا وإعدادًا لحساب GCS؛ غير مثبت في helper الحالي |
| Server-side | نعم للمزودين الخارجيين، بشرط حفظ الاعتمادات في الخادم |
| أثر البنية | إضافة adapter للتخزين، secrets، bucket policy، migrations، اختبار حذف، وخطة ترحيل |

## Migration Plan

لا تُنفذ الخطة الآن. عند الموافقة واختيار المزود، تتغير البنية في سبع مراحل.

| المرحلة | ما سيتغير |
|---|---|
| 1. Adapter | إنشاء واجهة موحدة `putPrivate`, `getSigned`, `deleteObject`, `objectExists` واستبدال الاستدعاء المباشر للـ helper داخل مسارات الرفع والوصول والتنظيف. |
| 2. Secrets | إضافة اسم bucket والمنطقة/endpoint ومفاتيح server-side عبر إدارة الأسرار، مع منع أي credential في العميل. |
| 3. Database | إضافة `storageProvider`, `storageKey`, `analysisKey`, `retentionExpiresAt`, و`deleteStatus` أو ما يعادلها، مع إبقاء `userId` و`deviceBinding` و`documentStatus`. لا تُحذف الجداول القديمة قبل التحقق. |
| 4. Authorization | فحص ملكية المستخدم والجهاز على كل `getSigned` و`delete`; رفض أي طلب لا يطابق `userId` وlicense/device binding. |
| 5. Dual-write/Backfill | إيقاف رفع العملاء أو تشغيل نافذة ترحيل قصيرة؛ رفع كائنات جديدة إلى المزود الجديد، ثم نقل الملفات القديمة إن كانت ما تزال ضمن مدة الاحتفاظ. كل كائن يُوسم بمزود ومفتاحه. |
| 6. Cleanup | تنفيذ حذف Backend للأصل وJSON التحليل، ثم `objectExists` للتأكد من الغياب. التعامل مع failures عبر retry/idempotency وسجل حالة غير حساس. إعداد Lifecycle احتياطي على bucket. |
| 7. Cutover/Rollback | بعد نجاح الاختبارات، جعل المزود الجديد هو المصدر الوحيد. للعودة، يُعاد تفعيل adapter القديم للقراءة فقط خلال نافذة محددة، مع منع إنشاء نسخ جديدة مزدوجة. لا تُحذف البيانات القديمة حتى يكتمل إثبات النقل والحذف. |

### الجداول والمسارات المتأثرة

الجداول المتأثرة هي `documents` وحقول التخزين/الاحتفاظ في `licenses` عند الحاجة. المسارات المتأثرة هي `documents.upload` و`documents.access` و`owner.cleanupExpired` ومسارات الاستعادة ولوحة المالك. يجب أن تبقى صلاحيات كل مسار خلف `protectedProcedure` أو `adminProcedure`، وأن يتحقق الخادم من ملكية الوثيقة لا من قيمة يرسلها المتصفح فقط.

### منع بقاء الملفات القديمة

يجب إنشاء inventory بالمفاتيح الحالية، مطابقة كل مفتاح بسجل وثيقة، نقل الكائنات غير المنتهية فقط، ثم تنفيذ reconciliation يكتشف orphan keys. بعد cutover، تُقفل الكتابة إلى الطبقة القديمة وتُحذف كائناتها عبر API الرسمي أو Lifecycle بعد نجاح التحقق. لا يُعتبر حذف سجل قاعدة البيانات دليلًا كافيًا.

### اختبار Delete بعد التنفيذ

يُنشأ مستخدم اختبار وملف اختبار، ثم يُثبت وجود الأصل وJSON التحليل في التخزين، وتُجرى عملية Delete من Backend، ثم تُنفذ محاولة `HEAD/Get` للتأكد من 404 أو النتيجة الرسمية «غير موجود». يُكرر الاختبار مع مستخدم مختلف، ومع device مختلف، ومع versioning/soft delete إن كان مفعّلًا. تُفحص سجلات التطبيق والطلبات للتأكد من عدم وجود محتوى الملف أو base64.

### خطة الرجوع

إذا فشل النقل أو الحذف، يتوقف cutover وتبقى الطبقة القديمة للقراءة المصرح بها فقط، مع إيقاف رفع ملفات جديدة مؤقتًا. لا تُحذف النسخة القديمة قبل إثبات النسخة الجديدة. تُراجع نتائج reconciliation وتُعاد مفاتيح routing إلى adapter السابق، ثم تُعالج الكائنات المنقولة وفق سجل حالة idempotent. لا يجوز rollback بإعادة فتح روابط عامة.

## Evidence Required After Implementation

لا يُغلق Privacy Blocker إلا بعد تسليم دليل يثبت الدورة الكاملة: `Upload → Private Storage → Use → Delete → Object No Longer Exists`. يجب أن يتضمن الدليل أرقامًا/معرّفات كائنات غير حساسة، نتيجة وجود قبل الحذف، نتيجة Delete من Backend، نتيجة غياب بعد الحذف، حذف JSON التحليل، غياب النسخ أو multipart المتروكة، وغياب المحتوى من Logs. كما يجب توثيق إعداد Lifecycle الفعلي، صلاحيات IAM، اختبار عزل المستخدم A عن B، واختبار device binding.

## References

[1]: file:///home/ubuntu/skills/webdev-file-storage/SKILL.md "Manus WebDev File Storage Skill"
[2]: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html "Amazon S3 DeleteObject API"
[3]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html "Amazon S3 Object Lifecycle Management"
[4]: https://developers.cloudflare.com/r2/buckets/object-lifecycles/ "Cloudflare R2 Object Lifecycles"
[5]: https://docs.cloud.google.com/storage/docs/deleting-objects "Google Cloud Storage Delete Objects"
