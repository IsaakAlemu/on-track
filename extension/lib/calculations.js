const MS_PER_DAY = 1000 * 60 * 60 * 24;
export function unitsLeft(goal) {
    const completed = goal.completions.length;
    return Math.max(0, goal.totalUnits - completed);
}
export function percentDone(goal) {
    if (goal.totalUnits === 0) {
        return 0;
    }
    const completed = goal.completions.length;
    return Math.min(100, (completed / goal.totalUnits) * 100);
}
export function unitsPerDay(goal, now) {
    const completed = goal.completions.length;
    const elapsedMs = now.getTime() - new Date(goal.createdAt).getTime();
    const elapsedDays = elapsedMs / MS_PER_DAY;
    const days = Math.max(1, elapsedDays);
    return completed / days;
}
export function hoursLeft(goal, now) {
    const rate = unitsPerDay(goal, now);
    if (rate === 0) {
        return Infinity;
    }
    const left = unitsLeft(goal);
    return (left / rate) * 24;
}
export function projectedFinishDate(goal, now) {
    const rate = unitsPerDay(goal, now);
    if (rate === 0) {
        return null;
    }
    const left = unitsLeft(goal);
    const daysLeft = left / rate;
    return new Date(now.getTime() + daysLeft * MS_PER_DAY);
}
export function isOnTrack(goal, now) {
    if (!goal.deadline) {
        return true;
    }
    if (unitsLeft(goal) === 0) {
        if (goal.completions.length === 0) {
            return true;
        }
        let latestTime = -Infinity;
        for (const completion of goal.completions) {
            const time = new Date(completion.completedAt).getTime();
            if (time > latestTime) {
                latestTime = time;
            }
        }
        return latestTime <= new Date(goal.deadline).getTime();
    }
    const projected = projectedFinishDate(goal, now);
    if (projected === null) {
        return false;
    }
    return projected.getTime() <= new Date(goal.deadline).getTime();
}
//# sourceMappingURL=calculations.js.map