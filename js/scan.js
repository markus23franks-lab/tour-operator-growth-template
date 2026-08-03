"use strict";

const assessment = loadAssessment();

const phaseTitle = document.getElementById("phase-title");
const businessContext = document.getElementById("business-context");
const moduleFeed = document.getElementById("module-feed");
const terminal = document.getElementById("terminal");
const progressBar = document.getElementById("master-progress-bar");
const pillarStatus = document.getElementById("pillar-status");
const engineStateLabel = document.getElementById("engine-state-label");
const footerStatus = document.getElementById("footer-status");
const missionReveal = document.getElementById("mission-reveal");
const missionBusinessName = document.getElementById("mission-business-name");
const missionTitle = document.getElementById("mission-title");
const missionReason = document.getElementById("mission-reason");
const missionConfidence = document.getElementById("mission-confidence");

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const businessName = assessment.businessName || "your tour business";
const website = normalizeWebsite(assessment.website || "your website");
const bookingPlatform = assessment.bookingPlatform || "Booking platform not provided";

const seed = createSeed(`${businessName}|${website}|${bookingPlatform}`);
const scores = buildScores(seed);

const modules = [
  {
    icon: "↗",
    label: "WEBSITE",
    title: "Website connected",
    detail: hostnameFromWebsite(website)
  },
  {
    icon: "▣",
    label: "MOBILE EXPERIENCE",
    title: "Booking journey mapped",
    detail: "Preview model prepared"
  },
  {
    icon: "★",
    label: "TRUST SIGNALS",
    title: "Reputation framework loaded",
    detail: "Review connection available"
  },
  {
    icon: "⚙",
    label: "BOOKING SYSTEM",
    title: bookingPlatform === "Booking platform not provided"
      ? "Platform check prepared"
      : `${bookingPlatform} profile noted`,
    detail: "Integration validation pending"
  },
  {
    icon: "◎",
    label: "LOCAL VISIBILITY",
    title: "Discovery model prepared",
    detail: "Live profile connection pending"
  },
  {
    icon: "✦",
    label: "COMPETITOR INTELLIGENCE",
    title: "Benchmark framework loaded",
    detail: "Market set ready for connection"
  }
];

const logLines = [
  `Business profile initialized for ${businessName}.`,
  "Website and customer journey modules online.",
  "Mapping findings to the six Growth Pillars.",
  `Booking environment: ${bookingPlatform}.`,
  "Ranking opportunities by impact, effort, and confidence.",
  "Modeled conversion friction detected in the mobile journey.",
  "Highest-impact preview mission selected.",
  "Command center package ready."
];

const mission = chooseMission(scores);

document.addEventListener("DOMContentLoaded", runExperience);
document.getElementById("cancel-scan").addEventListener("click", () => {
  window.location.href = "../index.html#assessment";
});
document.getElementById("open-dashboard").addEventListener("click", () => {
  localStorage.setItem("growthOperatorPreviewScores", JSON.stringify(scores));
  localStorage.setItem("growthOperatorPreviewMission", JSON.stringify(mission));
  window.location.href = "dashboard.html";
});
document.getElementById("restart-scan").addEventListener("click", () => {
  window.location.reload();
});

async function runExperience() {
  businessContext.textContent =
    `Analyzing ${businessName} across Visibility, Trust, Conversion, Operations, Intelligence, and Growth.`;

  phaseTitle.textContent = "Initializing Growth Operator";
  footerStatus.textContent = `Secure preview session • ${hostnameFromWebsite(website)}`;

  await addTerminalLine("Secure assessment payload received.", "emphasis");
  await wait(350);

  phaseTitle.textContent = "Connecting business systems";
  await runModuleSequence();

  phaseTitle.textContent = "Scoring the six Growth Pillars";
  pillarStatus.textContent = "PROCESSING";
  await addTerminalLine(logLines[2], "emphasis");
  await runPillarSequence();

  phaseTitle.textContent = "Selecting the highest-impact mission";
  pillarStatus.textContent = "COMPLETE";
  await runFinalLog();

  progressBar.style.width = "100%";
  engineStateLabel.textContent = "COMPLETE";
  footerStatus.textContent = "Analysis package generated";

  await wait(800);
  showMission();
}

async function runModuleSequence() {
  for (let index = 0; index < modules.length; index += 1) {
    const module = modules[index];
    const card = document.createElement("article");
    card.className = "module-row";
    card.innerHTML = `
      <span class="module-row__icon">${module.icon}</span>
      <small>${module.label}</small>
      <strong>${module.title}</strong>
      <p>${module.detail}</p>
    `;
    moduleFeed.appendChild(card);

    progressBar.style.width = `${8 + ((index + 1) / modules.length) * 34}%`;
    await addTerminalLine(logLines[Math.min(index, 1)]);
    await wait(390);

    card.classList.add("complete");
    card.querySelector(".module-row__icon").textContent = "✓";
  }
}

async function runPillarSequence() {
  const pillarElements = [...document.querySelectorAll(".pillar")];

  for (let index = 0; index < pillarElements.length; index += 1) {
    const pillar = pillarElements[index];
    const name = pillar.dataset.pillar;
    const score = scores[name];

    pillar.classList.add("scanning");
    pillar.querySelector("b").textContent = "…";
    await wait(220);

    pillar.querySelector(".pillar-track span").style.width = `${score}%`;
    animateNumber(pillar.querySelector("b"), score, 650);
    progressBar.style.width = `${48 + ((index + 1) / pillarElements.length) * 38}%`;

    await addTerminalLine(`${name} signal model completed at ${score}.`);
    await wait(420);

    pillar.classList.remove("scanning");
    pillar.classList.add("complete");
  }
}

async function runFinalLog() {
  for (const line of logLines.slice(3)) {
    const type = line.includes("ready") ? "success" : "";
    await addTerminalLine(line, type);
    await wait(390);
  }
}

async function addTerminalLine(text, className = "") {
  removeCursor();

  const line = document.createElement("p");
  line.className = `terminal-line ${className}`.trim();
  line.textContent = text;
  terminal.appendChild(line);

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  terminal.appendChild(cursor);
  terminal.scrollTop = terminal.scrollHeight;

  await wait(120);
}

function removeCursor() {
  terminal.querySelector(".cursor")?.remove();
}

function showMission() {
  missionBusinessName.textContent =
    `${businessName}'s Growth Operator command center is prepared.`;
  missionTitle.textContent = mission.title;
  missionReason.textContent = mission.reason;
  missionConfidence.textContent = `${mission.confidence}%`;

  missionReveal.classList.add("open");
  missionReveal.setAttribute("aria-hidden", "false");
}

function chooseMission(pillarScores) {
  const lowest = Object.entries(pillarScores)
    .sort((a, b) => a[1] - b[1])[0][0];

  const missions = {
    Visibility: {
      title: "Strengthen local discovery",
      reason: "Improve the path from nearby traveler searches to your direct booking experience."
    },
    Trust: {
      title: "Turn reputation into booking confidence",
      reason: "Surface stronger proof at the moments when travelers are deciding whether to book."
    },
    Conversion: {
      title: "Improve mobile booking conversion",
      reason: "Reduce friction between tour discovery and completed checkout."
    },
    Operations: {
      title: "Create a faster lead follow-up workflow",
      reason: "Reduce response delays and protect high-intent booking opportunities."
    },
    Intelligence: {
      title: "Build your competitor benchmark",
      reason: "Track the market signals that should influence your next growth move."
    },
    Growth: {
      title: "Install a weekly growth operating rhythm",
      reason: "Turn scattered ideas into one prioritized mission and measurable outcome."
    }
  };

  return {
    pillar: lowest,
    ...missions[lowest],
    confidence: 88 + (seed % 8)
  };
}

function loadAssessment() {
  try {
    return JSON.parse(localStorage.getItem("growthOperatorAssessment")) || {};
  } catch {
    return {};
  }
}

function normalizeWebsite(value) {
  if (!value || value === "your website") return value;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function hostnameFromWebsite(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function createSeed(value) {
  return [...value].reduce((total, character) => {
    return (total * 31 + character.charCodeAt(0)) >>> 0;
  }, 7);
}

function buildScores(value) {
  const base = 58 + (value % 12);
  return {
    Visibility: clamp(base + ((value >> 1) % 17), 56, 88),
    Trust: clamp(base + ((value >> 3) % 20), 60, 91),
    Conversion: clamp(base - 7 + ((value >> 5) % 14), 48, 78),
    Operations: clamp(base + ((value >> 7) % 15), 57, 89),
    Intelligence: clamp(base - 3 + ((value >> 9) % 16), 52, 84),
    Growth: clamp(base + ((value >> 11) % 13), 58, 87)
  };
}

function clamp(number, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, number));
}

function animateNumber(element, target, duration) {
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(target * eased)}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}