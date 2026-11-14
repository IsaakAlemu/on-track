import { describe, it, expect } from "vitest";
import { Goal } from "./types";
import { unitsLeft, percentDone, isOnTrack } from "./calculations";

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    name: "Test goal",
    createdAt: "2026-11-01T00:00:00Z",
    totalUnits: 10,
    completions: [],
    ...overrides,
  };
}

function completions(count: number, completedAt: string) {
  return Array.from({ length: count }, () => ({ completedAt }));
}

describe("unitsLeft", () => {
  it("returns total units when nothing is done", () => {
    expect(unitsLeft(makeGoal())).toBe(10);
  });

  it("never goes below 0 when there are more completions than total units", () => {
    const goal = makeGoal({
      totalUnits: 10,
      completions: completions(12, "2026-11-05T00:00:00Z"),
    });
    expect(unitsLeft(goal)).toBe(0);
  });
});

describe("percentDone", () => {
  it("returns 0 when total units is 0", () => {
    expect(percentDone(makeGoal({ totalUnits: 0 }))).toBe(0);
  });

  it("returns 50 when half the units are done", () => {
    const goal = makeGoal({
      totalUnits: 10,
      completions: completions(5, "2026-11-05T00:00:00Z"),
    });
    expect(percentDone(goal)).toBe(50);
  });
});

describe("isOnTrack", () => {
  it("returns true for a finished goal after the deadline has passed", () => {
    const goal = makeGoal({
      totalUnits: 3,
      deadline: "2026-11-10T00:00:00Z",
      completions: completions(3, "2026-11-05T00:00:00Z"),
    });
    const now = new Date("2026-11-20T00:00:00Z");
    expect(isOnTrack(goal, now)).toBe(true);
  });

  it("returns true when the projected finish is before the deadline", () => {
    // 5 units in 10 days = 0.5/day, 5 left = 10 more days, finish Nov 21
    const goal = makeGoal({
      deadline: "2026-12-01T00:00:00Z",
      completions: completions(5, "2026-11-05T00:00:00Z"),
    });
    const now = new Date("2026-11-11T00:00:00Z");
    expect(isOnTrack(goal, now)).toBe(true);
  });

  it("returns false when the projected finish is after the deadline", () => {
    // 2 units in 10 days = 0.2/day, 8 left = 40 more days, finish Dec 21
    const goal = makeGoal({
      deadline: "2026-11-20T00:00:00Z",
      completions: completions(2, "2026-11-05T00:00:00Z"),
    });
    const now = new Date("2026-11-11T00:00:00Z");
    expect(isOnTrack(goal, now)).toBe(false);
  });
});