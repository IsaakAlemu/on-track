const PAGES_KEY = "pages";
const GOAL_KEY = "goal";

setInterval(async () => {
  const url = window.location.href;
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent =
    scrollableHeight > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((window.scrollY / scrollableHeight) * 100))
        )
      : 0;

  const data = await chrome.storage.local.get(PAGES_KEY);
  const pages = data[PAGES_KEY] || {};
  const existing = pages[url] || {};
  const secondsToAdd = document.visibilityState === "visible" ? 5 : 0;

  const entry = {
    title: document.title,
    maxScrollPercent: Math.max(existing.maxScrollPercent ?? 0, scrollPercent),
    secondsSpent: (existing.secondsSpent ?? 0) + secondsToAdd,
    lastVisited: new Date().toISOString(),
  };

  pages[url] = entry;
  await chrome.storage.local.set({ [PAGES_KEY]: pages });

  const goalData = await chrome.storage.local.get(GOAL_KEY);
  const goal = goalData[GOAL_KEY];
  if (!goal) {
    return;
  }

  const trackedUrls = goal.trackedUrls || [];
  const countedUrls = goal.countedUrls || [];

  if (
    trackedUrls.includes(url) &&
    !countedUrls.includes(url) &&
    entry.maxScrollPercent >= 90 &&
    entry.secondsSpent >= 30
  ) {
    const freshData = await chrome.storage.local.get(GOAL_KEY);
    const freshGoal = freshData[GOAL_KEY];
    if (!freshGoal) {
      return;
    }

    const freshTracked = freshGoal.trackedUrls || [];
    const freshCounted = freshGoal.countedUrls || [];
    if (!freshTracked.includes(url) || freshCounted.includes(url)) {
      return;
    }

    const updatedGoal = {
      ...freshGoal,
      completions: [
        ...(freshGoal.completions || []),
        { completedAt: new Date().toISOString() },
      ],
      trackedUrls: freshTracked,
      countedUrls: [...freshCounted, url],
    };

    await chrome.storage.local.set({ [GOAL_KEY]: updatedGoal });
  }
}, 5000);
