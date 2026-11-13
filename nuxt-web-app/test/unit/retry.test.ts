import { describe, expect, it } from "vitest";
import { shouldRetry } from "../../app/utils/retry";

describe("shouldRetry", () => {
  it("retries a transient error once", () => {
    expect(shouldRetry(0, new Error("network error"))).toBe(true);
  });

  it("does not retry after the first attempt", () => {
    expect(shouldRetry(1, new Error("network error"))).toBe(false);
  });

  it("does not retry client errors", () => {
    expect(shouldRetry(0, { status: 404 })).toBe(false);
    expect(shouldRetry(0, { response: { status: 422 } })).toBe(false);
  });
});
