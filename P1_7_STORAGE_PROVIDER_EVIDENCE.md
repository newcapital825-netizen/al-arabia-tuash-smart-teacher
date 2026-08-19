# P1.7 Storage Provider Evidence Notes

## AWS S3

- Presigned URLs can grant time-limited GET, PUT, and HEAD access without exposing AWS credentials to the client. The URL capabilities are bounded by the permissions of the IAM principal that generated it, and AWS treats the URL as a bearer token.
- Multipart upload supports independent parts, retrying failed parts without restarting the whole object, and pause/resume. AWS recommends multipart for objects around 100 MB or larger. Incomplete uploads must be completed or aborted; a lifecycle rule can abort incomplete multipart uploads.
- Official references: [AWS presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html), [AWS multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html), [AWS abort incomplete multipart lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html), [AWS DeleteObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html), [AWS lifecycle management](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html).

## Cloudflare R2

- R2 presigned URLs support GET, HEAD, PUT, and DELETE for a single object. The documented expiry range is 1 second to 7 days, and the implementation uses an S3-compatible SDK with an R2 endpoint.
- R2 does not support HTML-form POST multipart uploads through presigned URLs, but supports S3-compatible multipart APIs. R2 documentation states incomplete multipart uploads have a default seven-day abort lifecycle and can be configured with custom lifecycle rules.
- R2 lifecycle rules can delete objects by age/prefix and can abort incomplete multipart uploads. R2 states objects are typically removed within 24 hours of the expiration value, so TTL is not an exact deletion timestamp.
- Official references: [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/), [R2 upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/), [R2 API tokens](https://developers.cloudflare.com/r2/api/tokens/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

## Google Cloud Storage

- Signed URLs provide time-limited read, write, or delete access to a resource. The URL is a bearer token; the service account or signer must have sufficient permission. Google recommends direct server-side operations for actions such as delete where a signed URL is unnecessary.
- Resumable uploads use a session URI after initiation. The session URI acts as an authentication token and must be protected with HTTPS. The server can initiate the resumable upload and return the session URI to the client.
- Cloud Storage Object Lifecycle Management supports Delete and AbortIncompleteMultipartUpload. Changes to lifecycle configuration can take up to 24 hours to take effect. By default, deleted objects are soft-deleted for seven days; disabling soft delete makes deletion permanent and irreversible. Object Versioning can retain noncurrent generations and requires explicit handling.
- Delete requires `storage.objects.delete`; the documented predefined role for API/CLI object deletion is `roles/storage.objectUser`, while console deletion uses Storage Admin or a combination of Viewer and Storage Object User.
- Official references: [GCS signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls), [GCS lifecycle](https://docs.cloud.google.com/storage/docs/lifecycle), [GCS delete objects](https://docs.cloud.google.com/storage/docs/deleting-objects), [GCS resumable uploads](https://docs.cloud.google.com/storage/docs/resumable-uploads).

## Project-specific observations

- The current project uses a full-stack React/Express/tRPC backend and already stores metadata separately from file bytes. All three candidates can be wrapped behind a server-side adapter without exposing credentials in the browser.
- The privacy requirement is stronger than merely deleting a database reference. The acceptance criterion is `Upload → Read → Delete → Verify Not Found`, plus controlled lifecycle expiry and user isolation.
- Prices, quotas, egress, and account billing cannot be asserted from the project environment. The final report must label these as `ACCOUNT-LEVEL VERIFICATION REQUIRED` unless a current provider account is supplied by the owner through the platform's secure secret/configuration flow.
