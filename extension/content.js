const STORAGE_KEY = "pages";

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

  const data = await chrome.storage.local.get(STORAGE_KEY);
  const pages = data[STORAGE_KEY] || {};
  const existing = pages[url] || {};
  const secondsToAdd = document.visibilityState === "visible" ? 5 : 0;

  pages[url] = {
    title: document.title,
    maxScrollPercent: Math.max(existing.maxScrollPercent ?? 0, scrollPercent),
    secondsSpent: (existing.secondsSpent ?? 0) + secondsToAdd,
    lastVisited: new Date().toISOString(),
  };

  await chrome.storage.local.set({ [STORAGE_KEY]: pages });
}, 5000);
