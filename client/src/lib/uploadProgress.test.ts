import { describe, expect, it } from "vitest";
import { advanceUploadProgress, uploadProgressAfterFailure } from "./uploadProgress";

describe("upload progress", () => {
  it("advances beyond the former 55% stall", () => {
    let progress = 55;
    progress = advanceUploadProgress(progress);
    expect(progress).toBe(56);
    expect(advanceUploadProgress(91)).toBe(92);
    expect(advanceUploadProgress(92)).toBe(92);
  });
  it("resets after a failed upload", () => {
    expect(uploadProgressAfterFailure()).toBe(0);
  });
});
