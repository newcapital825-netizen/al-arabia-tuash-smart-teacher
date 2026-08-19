export function advanceUploadProgress(current: number) {
  if (current < 55) return Math.min(55, current + 1);
  if (current < 92) return current + 1;
  return 92;
}

export function uploadProgressAfterFailure() {
  return 0;
}
