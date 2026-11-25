const STORAGE_KEY = "pages";

async function renderPages() {
  const list = document.getElementById("pages");
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const pages = data[STORAGE_KEY] || {};

  const entries = Object.entries(pages).sort(([, a], [, b]) => {
    return (Date.parse(b.lastVisited) || 0) - (Date.parse(a.lastVisited) || 0);
  });

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No saved pages yet.";
    list.appendChild(empty);
    return;
  }

  for (const [url, entry] of entries) {
    const item = document.createElement("li");

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = entry.title || url;

    const meta = document.createElement("div");
    meta.className = "meta";
    const minutes = ((entry.secondsSpent || 0) / 60).toFixed(1);
    meta.textContent = `${entry.maxScrollPercent ?? 0}% scrolled · ${minutes} min spent`;

    item.appendChild(title);
    item.appendChild(meta);
    list.appendChild(item);
  }
}

document.addEventListener("DOMContentLoaded", renderPages);
