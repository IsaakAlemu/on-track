export type Completion = {
  completedAt: string; // when a unit was ticked, e.g. "2026-11-14T10:00:00Z"
};
export type Goal = {
  name: string;
  createdAt: string;
  totalUnits: number;
  deadline?: string;
  completions: Completion[];
};