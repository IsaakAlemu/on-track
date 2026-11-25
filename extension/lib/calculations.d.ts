import type { Goal } from "./types";
export declare function unitsLeft(goal: Goal): number;
export declare function percentDone(goal: Goal): number;
export declare function unitsPerDay(goal: Goal, now: Date): number;
export declare function hoursLeft(goal: Goal, now: Date): number;
export declare function projectedFinishDate(goal: Goal, now: Date): Date | null;
export declare function isOnTrack(goal: Goal, now: Date): boolean;
//# sourceMappingURL=calculations.d.ts.map