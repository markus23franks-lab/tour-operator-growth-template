const workspaceData = {
  priorities: [
    { id: "mobile-cta", title: "Fix the hidden mobile booking button", description: "31% more mobile visitors abandon before checkout.", impact: "+$5,700", time: "12 min" },
    { id: "reviews", title: "Respond to 2 unanswered reviews", description: "Protect trust while review momentum is increasing.", impact: "+$820", time: "8 min" },
    { id: "recovery", title: "Enable abandoned-booking recovery", description: "Reconnect with guests who started but did not finish.", impact: "+$4,600", time: "25 min" }
  ],
  opportunities: [
    { id: "mobile-cta", title: "Mobile booking CTA", action: "Fix booking friction", impact: "$5,700", confidence: "94% confidence", copy: "Your main booking button falls below the first mobile screen on two high-traffic tour pages. Moving it above the fold and making it persistent should recover more completed bookings." },
    { id: "reviews", title: "Review request timing", action: "Optimize follow-up", impact: "$4,020", confidence: "89% confidence", copy: "Your review request currently arrives the next day. Similar operators see stronger completion when the request arrives 30–60 minutes after the tour." },
    { id: "recovery", title: "Abandoned bookings", action: "Activate recovery", impact: "$8,700", confidence: "91% confidence", copy: "Visitors who begin checkout but leave are not receiving any follow-up. A simple text and email sequence could recover a meaningful share." }
  ],
  activity: [
    { operator: "REVIEW OPERATOR", title: "Analyzed 642 reviews", body: "Found six guide names customers mention repeatedly." },
    { operator: "WEBSITE OPERATOR", title: "Completed mobile scan", body: "Detected booking friction on two tour pages." },
    { operator: "SEO OPERATOR", title: "Found 18 ranking opportunities", body: "Three high-intent terms are within striking distance." },
    { operator: "BUSINESS MEMORY", title: "Learned your busy season", body: "Peak demand begins around May 15." }
  ]
};

const storageKey = "growthOperatorWorkspaceStateV1";
let state = loadState();

document.addEventListener("DOMContentLoaded", () => {
  setDate();
  renderPriorities();
  renderOpportunities();
  renderActivity();
  renderMemory();
  bindWorkspace();
});

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || { completed: [], memory: "Peak season begins May 15. You prefer simple fixes before adding new software." };
  } catch (error) {
    return { completed: [], memory: "Peak season begins May 15. You prefer simple fixes before adding new software." };
  }
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn("Growth Operator could not save workspace state.", error);
  }
}

function setDate() {
  const el = document.getElementById("workspace-date");
  el.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
}

function renderPriorities() {
  const list = document.getElementById("priority-list");
  list.innerHTML = workspaceData.priorities.map(item => {
    const complete = state.completed.includes(item.id);
    return `<article class="go-priority ${complete ? "complete" : ""}">
      <button class="go-priority-check" type="button" data-toggle-priority="${item.id}" aria-label="${complete ? "Mark incomplete" : "Mark complete"}">${complete ? "✓" : ""}</button>
      <div><h3>${item.title}</h3><p>${item.description}</p></div>
      <div class="go-priority-impact"><strong>${item.impact}</strong><small>${item.time}</small></div>
    </article>`;
  }).join("");
  document.getElementById("priority-progress").textContent = `${state.completed.length} of ${workspaceData.priorities.length} complete`;
  document.querySelectorAll("[data-toggle-priority]").forEach(button => button.addEventListener("click", () => togglePriority(button.dataset.togglePriority)));
}

function togglePriority(id) {
  state.completed = state.completed.includes(id) ? state.completed.filter(item => item !== id) : [...state.completed, id];
  saveState();
  renderPriorities();
  showToast(state.completed.includes(id) ? "Priority completed. Business progress saved." : "Priority returned to today's list.");
}

function renderOpportunities() {
  document.getElementById("opportunity-list").innerHTML = workspaceData.opportunities.map(item => `<button class="go-opportunity" type="button" data-opportunity="${item.id}"><div><b>${item.title}</b><span>${item.action} · ${item.confidence}</span></div><strong>${item.impact}</strong></button>`).join("");
  document.querySelectorAll("[data-opportunity]").forEach(button => button.addEventListener("click", () => openOpportunity(button.dataset.opportunity)));
}

function renderActivity() {
  document.getElementById("activity-feed").innerHTML = workspaceData.activity.map(item => `<article class="go-activity-item"><small>${item.operator}</small><h3>${item.title}</h3><p>${item.body}</p></article>`).join("");
}

function renderMemory() {
  const memoryText = document.getElementById("memory-text");
  if (memoryText) memoryText.textContent = state.memory;
}

function bindWorkspace() {
  document.getElementById("start-priority").addEventListener("click", () => openOpportunity("mobile-cta"));
  document.getElementById("explain-priority").addEventListener("click", () => addOperatorMessage("I chose the mobile booking CTA first because it combines the highest confidence, the fastest implementation, and immediate revenue impact. Review work matters too, but this fix can be completed today."));
  document.getElementById("operator-form").addEventListener("submit", handleConversation);
  document.getElementById("notification-button").addEventListener("click", () => showToast("3 updates: two new reviews and one competitor alert."));
  document.getElementById("add-memory").addEventListener("click", addMemory);
  document.querySelectorAll("[data-health]").forEach(button => button.addEventListener("click", () => addOperatorMessage(`${button.dataset.health} is ready for a deeper analysis. The next release will connect this signal to its dedicated operator.`)));
  document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", closeModal));
  document.getElementById("modal-primary").addEventListener("click", () => {
    closeModal();
    addOperatorMessage("Great. I saved this as your active priority. The workspace will keep this decision visible while we complete the guided fix.");
    showToast("Guided fix started.");
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
}

function handleConversation(event) {
  event.preventDefault();
  const input = document.getElementById("operator-input");
  const message = input.value.trim();
  if (!message) return;
  appendMessage(message, "user");
  input.value = "";
  window.setTimeout(() => addOperatorMessage(buildReply(message)), 450);
}

function buildReply(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes("review")) return "Your reputation is strong at 4.9 stars, but review velocity trails the fastest local competitor. I would automate requests 30–60 minutes after each tour.";
  if (normalized.includes("website") || normalized.includes("booking")) return "The biggest website issue is mobile booking visibility. Two high-traffic pages make visitors scroll before they see the primary action.";
  if (normalized.includes("revenue") || normalized.includes("money")) return "I currently see $18,420 in recoverable annual revenue across mobile conversion, review timing, and abandoned-booking recovery.";
  if (normalized.includes("today") || normalized.includes("next")) return "Start with the mobile booking CTA. It takes about 12 minutes and has the clearest immediate upside. Then respond to the two unanswered reviews.";
  return "I saved that context. Based on today's signals, I would still protect your attention by finishing the mobile booking fix before opening another initiative.";
}

function appendMessage(text, role) {
  const conversation = document.getElementById("conversation");
  const wrapper = document.createElement("div");
  wrapper.className = `go-message ${role}`;
  wrapper.innerHTML = `<span class="go-message-avatar">${role === "user" ? "MF" : "GO"}</span><div><small>${role === "user" ? "YOU" : "GROWTH OPERATOR"}</small><p></p></div>`;
  wrapper.querySelector("p").textContent = text;
  conversation.appendChild(wrapper);
  conversation.scrollTop = conversation.scrollHeight;
}

function addOperatorMessage(text) { appendMessage(text, "operator"); }

function openOpportunity(id) {
  const item = workspaceData.opportunities.find(opportunity => opportunity.id === id);
  if (!item) return;
  document.getElementById("modal-eyebrow").textContent = "RECOMMENDED ACTION";
  document.getElementById("modal-title").textContent = item.title;
  document.getElementById("modal-copy").textContent = item.copy;
  document.getElementById("modal-details").innerHTML = `<div><span>ESTIMATED IMPACT</span><strong>${item.impact}/year</strong></div><div><span>AI CONFIDENCE</span><strong>${item.confidence}</strong></div><div><span>OWNER TIME</span><strong>${id === "mobile-cta" ? "12 min" : id === "reviews" ? "8 min" : "25 min"}</strong></div>`;
  const modal = document.getElementById("workspace-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("workspace-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function addMemory() {
  const note = window.prompt("What should Growth Operator remember?", "");
  if (!note || !note.trim()) return;
  state.memory = `${state.memory} ${note.trim()}`;
  saveState();
  renderMemory();
  showToast("Business Memory updated.");
}

function showToast(message) {
  document.querySelectorAll(".go-toast").forEach(toast => toast.remove());
  const toast = document.createElement("div");
  toast.className = "go-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2800);
}