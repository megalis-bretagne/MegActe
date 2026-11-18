import { describe, expect, it, vi } from "vitest";
import { dateToISO, formatDateOnly, isWithinDays } from "../../app/utils/date";

describe("date utilities", () => {
  it("converts a Date to an ISO calendar date", () => {
    expect(dateToISO(new Date("2026-11-10T15:30:00.000Z"))).toBe("2026-11-10");
  });

  it("returns a French date without a time", () => {
    expect(formatDateOnly("2026-11-10T15:30:00.000Z")).toMatch(/^10\/11\/2026$/);
  });

  it("checks whether a date is within the requested number of days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T12:00:00.000Z"));

    expect(isWithinDays("2026-11-09T12:00:00.000Z", 1)).toBe(true);
    expect(isWithinDays("2026-11-08T11:59:59.000Z", 1)).toBe(false);
    expect(isWithinDays("2026-11-11T12:00:00.000Z", 1)).toBe(false);

    vi.useRealTimers();
  });
});
