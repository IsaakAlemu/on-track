import { Goal } from "./types";

export function unitsLeft(goal: Goal): number {
  const completed = goal.completions.length;

  return Math.max(0, goal.totalUnits - completed);
}

export function percentDone(goal: Goal): number {
  if (goal.totalUnits === 0) {
    return 0;
  }

  const completed = goal.completions.length;

  return Math.min(100, (completed / goal.totalUnits) * 100);
}