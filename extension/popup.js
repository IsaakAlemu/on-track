import {
  unitsLeft,
  percentDone,
  unitsPerDay,
  hoursLeft,
  projectedFinishDate,
  isOnTrack,
} from "./lib/calculations.js";

const PAGES_KEY = "pages";
const GOAL_KEY = "goal";

function formatHours(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${Number(value.toFixed(1))}h`;
}

function formatDate(date) {
  if (date === null) {
    return "—";
  }
  return date.toLocaleDateString();
}

function renderCreateForm(container) {
  const heading = document.createElement("h2");
  heading.textContent = "Goal";

  const form = document.createElement("form");

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.required = true;
  nameLabel.appendChild(nameInput);

  const unitsLabel = document.createElement("label");
  unitsLabel.textContent = "Total units";
  const unitsInput = document.createElement("input");
  unitsInput.type = "number";
  unitsInput.min = "1";
  unitsInput.step = "1";
  unitsInput.required = true;
  unitsLabel.appendChild(unitsInput);

  const deadlineLabel = document.createElement("label");
  deadlineLabel.textContent = "Deadline (optional)";
  const deadlineInput = document.createElement("input");
  deadlineInput.type = "date";
  deadlineLabel.appendChild(deadlineInput);

  const createBtn = document.createElement("button");
  createBtn.type = "submit";
  createBtn.textContent = "Create";

  form.appendChild(nameLabel);
  form.appendChild(unitsLabel);
  form.appendChild(deadlineLabel);
  form.appendChild(createBtn);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const totalUnits = Number(unitsInput.value);
    if (!name || !Number.isFinite(totalUnits) || totalUnits < 1) {
      return;
    }

    const goal = {
      name,
      createdAt: new Date().toISOString(),
      totalUnits,
      completions: [],
      trackedUrls: [],
      countedUrls: [],
    };

    if (deadlineInput.value) {
      goal.deadline = deadlineInput.value;
    }

    await chrome.storage.local.set({ [GOAL_KEY]: goal });
    await renderGoal();
  });

  container.appendChild(heading);
  container.appendChild(form);
}

function renderGoalDetails(container, goal) {
  const now = new Date();
  const percent = percentDone(goal);
  const left = unitsLeft(goal);
  const rate = unitsPerDay(goal, now);
  const hours = hoursLeft(goal, now);
  const projected = projectedFinishDate(goal, now);
  const onTrack = isOnTrack(goal, now);
  const trackedUrls = goal.trackedUrls || [];

  const header = document.createElement("div");
  header.className = "goal-header";

  const nameEl = document.createElement("div");
  nameEl.className = "goal-name";
  nameEl.textContent = goal.name;

  const statusEl = document.createElement("div");
  statusEl.className = `status ${onTrack ? "on-track" : "late"}`;
  statusEl.textContent = onTrack ? "On track" : "Late";

  header.appendChild(nameEl);
  header.appendChild(statusEl);

  const stats = document.createElement("div");
  stats.className = "stats";

  const items = [
    `Done: ${Math.round(percent)}%`,
    `Units left: ${left}`,
    `Units/day: ${rate.toFixed(1)}`,
    `Hours left: ${formatHours(hours)}`,
    `Projected finish: ${formatDate(projected)}`,
  ];

  for (const text of items) {
    const stat = document.createElement("div");
    stat.textContent = text;
    stats.appendChild(stat);
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  const addUnitBtn = document.createElement("button");
  addUnitBtn.type = "button";
  addUnitBtn.textContent = "+1 unit";
  addUnitBtn.addEventListener("click", async () => {
    const data = await chrome.storage.local.get(GOAL_KEY);
    const currentGoal = data[GOAL_KEY];
    if (!currentGoal) {
      return;
    }
    const updatedGoal = {
      ...currentGoal,
      completions: [
        ...(currentGoal.completions || []),
        { completedAt: new Date().toISOString() },
      ],
      trackedUrls: currentGoal.trackedUrls || [],
      countedUrls: currentGoal.countedUrls || [],
    };
    await chrome.storage.local.set({ [GOAL_KEY]: updatedGoal });
    await renderGoal();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete goal";
  deleteBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove(GOAL_KEY);
    await renderGoal();
  });

  actions.appendChild(addUnitBtn);
  actions.appendChild(deleteBtn);

  const tracking = document.createElement("div");
  tracking.className = "tracking";

  const trackBtn = document.createElement("button");
  trackBtn.type = "button";
  trackBtn.textContent = "Track this page";
  trackBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUrl = tab?.url;
    if (!tabUrl) {
      return;
    }

    const data = await chrome.storage.local.get(GOAL_KEY);
    const currentGoal = data[GOAL_KEY];
    if (!currentGoal) {
      return;
    }

    const currentTracked = currentGoal.trackedUrls || [];
    if (currentTracked.includes(tabUrl)) {
      return;
    }

    const updatedGoal = {
      ...currentGoal,
      trackedUrls: [...currentTracked, tabUrl],
      countedUrls: currentGoal.countedUrls || [],
    };

    await chrome.storage.local.set({ [GOAL_KEY]: updatedGoal });
    await renderGoal();
  });

  const trackedCount = document.createElement("div");
  trackedCount.className = "meta";
  trackedCount.textContent = `Tracked pages: ${trackedUrls.length}`;

  tracking.appendChild(trackBtn);
  tracking.appendChild(trackedCount);

  container.appendChild(header);
  container.appendChild(stats);
  container.appendChild(actions);
  container.appendChild(tracking);
}

async function renderGoal() {
  const container = document.getElementById("goal");
  container.replaceChildren();

  const data = await chrome.storage.local.get(GOAL_KEY);
  const goal = data[GOAL_KEY];

  if (!goal) {
    renderCreateForm(container);
    return;
  }

  renderGoalDetails(container, goal);
}

async function renderPages() {
  const list = document.getElementById("pages");
  list.replaceChildren();

  const data = await chrome.storage.local.get(PAGES_KEY);
  const pages = data[PAGES_KEY] || {};

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

document.addEventListener("DOMContentLoaded", () => {
  renderGoal();
  renderPages();
});
