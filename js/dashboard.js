"use strict";

const modal = document.getElementById("modal");
const toast = document.getElementById("toast");

const fallbackAssessment = {
  businessName: "Blue River Rafting",
  ownerName: "Markus Franks",
  website: "https://blueriverrafting.com",
  bookingPlatform: "FareHarbor"
};

const fallbackScores = {
  Visibility: 82,
  Trust: 74,
  Conversion: 61,
  Operations: 74,
  Intelligence: 68,
  Growth: 76
};

const fallbackMission = {
  pillar: "Conversion",
  title: "Improve mobile booking conversion",
  reason: "Reduce friction between tour discovery and completed checkout.",
  confidence: 94
};

const assessment = readStorage("growthOperatorAssessment", fallbackAssessment);
const scores = readStorage("growthOperatorPreviewScores", fallbackScores);
const mission = readStorage("growthOperatorPreviewMission", fallbackMission);
const profile = buildProfile(assessment, scores, mission);

const modalContent = {
  mission: {
    eyebrow: "TODAY’S HIGHEST-IMPACT MOVE",
    title: `${profile.mission.title} is ready.`,
    copy: profile.mission.description,
    callout: `<strong>Why we selected it</strong><br>${profile.mission.reason}<br><br>Confidence: <strong>${profile.mission.confidence}%</strong>.`,
    action: "Begin the mission →"
  },
  preview: {
    eyebrow: "PREVIEW THE IMPROVEMENT",
    title: "Here’s what I would change first.",
    copy: "The strongest version keeps the value proposition, trust signals, availability, and booking action visible before the visitor scrolls.",
    callout: `<strong>Business:</strong> ${profile.businessName}<br><strong>Website:</strong> ${profile.website}<br><strong>Primary pillar:</strong> ${profile.mission.pillar}`,
    action: "Use this recommendation →"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  personalizeDashboard();
  animateCounters();
  animateBars();
  wireInteractions();
  revealCards();
});

function personalizeDashboard() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  document.getElementById("greeting").innerHTML = `${greeting}, ${profile.firstName} <span>👋</span>`;
  document.getElementById("today-label").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  document.getElementById("briefing-line").innerHTML = `Here’s what’s moving the needle for <strong>${profile.businessName}</strong> and where we can help you grow.`;
  document.getElementById("scan-time").textContent = "Latest scan: just now";

  setText("sidebar-owner", profile.ownerName);
  setText("sidebar-business", profile.businessName);
  setText("sidebar-avatar", profile.initials);
  setText("top-avatar", profile.initials);
  setText("phone-business", profile.businessName);

  const scoreNode = document.getElementById("growth-score");
  scoreNode.dataset.count = profile.growthScore;
  document.getElementById("score-ring").style.setProperty("--score", profile.growthScore);
  document.getElementById("score-ring").setAttribute("aria-label", `Growth score ${profile.growthScore} out of 100`);
  setText("growth-status", scoreStatus(profile.growthScore));
  setText("score-percentile", `Top ${profile.percentile}%`);
  setText("score-benchmark", `of modeled ${profile.industryLabel}`);
  document.getElementById("score-change").innerHTML = `↑ ${profile.scoreChange} points <span>from the last analysis</span>`;

  document.getElementById("mission-title").innerHTML = splitMissionTitle(profile.mission.title);
  setText("mission-description", profile.mission.description);
  setText("mission-confidence", `${profile.mission.confidence}%`);
  document.querySelector(".confidence-bar i").style.setProperty("--value", `${profile.mission.confidence}%`);
  setText("mission-revenue", `+$${profile.revenueOpportunity.toLocaleString("en-US")}`);

  renderPillars(profile.scores);
  renderGrowthBrief(profile);
}

function renderGrowthBrief(currentProfile) {
  const ranked = Object.entries(currentProfile.scores).sort((a, b) => b[1] - a[1]);
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const briefCopy = {
    Visibility: {
      working: "Local discovery",
      workingCopy: "Your visibility signals are helping travelers find the business when they are ready to book.",
      opportunity: "Turn more searches into direct visits",
      opportunityCopy: "The clearest opportunity is making the path from local search to direct booking more consistent.",
      expected: "More qualified website visits from travelers already searching nearby."
    },
    Trust: {
      working: "Customer confidence",
      workingCopy: "Your reputation gives travelers a meaningful reason to trust the experience.",
      opportunity: "Put proof closer to the booking decision",
      opportunityCopy: "Strong reviews create more value when guests see them exactly when they are deciding.",
      expected: "More travelers moving from interest to a confident booking decision."
    },
    Conversion: {
      working: "Existing demand",
      workingCopy: "Travelers are reaching the business and showing interest in the experience.",
      opportunity: "Convert more visitors into bookings",
      opportunityCopy: "The strongest opportunity is making the booking path clearer and easier, especially on mobile.",
      expected: "More direct bookings from the traffic you already have."
    },
    Operations: {
      working: "A business worth contacting",
      workingCopy: "The experience creates demand and gives travelers a reason to reach out.",
      opportunity: "Protect more high-intent inquiries",
      opportunityCopy: "A faster, more consistent follow-up process can prevent valuable leads from going cold.",
      expected: "More inquiries becoming confirmed customers without adding more leads."
    },
    Intelligence: {
      working: "Strong operator instincts",
      workingCopy: "You already know the business and market well enough to make informed decisions.",
      opportunity: "Create a reliable competitor benchmark",
      opportunityCopy: "The clearest gap is turning informal market knowledge into a repeatable decision system.",
      expected: "Faster decisions with clearer context on pricing, positioning, and competition."
    },
    Growth: {
      working: "Multiple ways to grow",
      workingCopy: "The business has several credible opportunities available right now.",
      opportunity: "Create one focused growth rhythm",
      opportunityCopy: "The biggest need is choosing one priority, measuring it, and letting the result guide the next move.",
      expected: "More consistent progress without spreading time across too many ideas."
    }
  };

  const recommendation = briefCopy[currentProfile.mission.pillar] || briefCopy[weakest[0]] || briefCopy.Conversion;
  const strongestLabel = briefCopy[strongest[0]]?.working || strongest[0];
  const strongestCopy = briefCopy[strongest[0]]?.workingCopy || `Your ${strongest[0].toLowerCase()} signals are currently the strongest part of the business.`;

  setText("brief-business-name", currentProfile.businessName);
  setText("brief-summary-status", currentProfile.growthScore >= 75 ? "Strong foundation" : currentProfile.growthScore >= 60 ? "Promising foundation" : "Clear room to grow");
  setText("brief-summary-line", `Your strongest area is ${strongest[0].toLowerCase()}. Your clearest opportunity is ${weakest[0].toLowerCase()}.`);
  setText("working-title", strongestLabel);
  setText("working-copy", strongestCopy);
  setText("opportunity-title", recommendation.opportunity);
  setText("opportunity-copy", recommendation.opportunityCopy);
  setText("recommendation-title", currentProfile.mission.title);
  setText("recommendation-copy", `We recommend completing this before adding more complexity or spending more money on growth.`);
  setText("recommendation-why", currentProfile.mission.reason);
  setText("expected-result", recommendation.expected);
  document.getElementById("overall-assessment").innerHTML = `${currentProfile.businessName} has built a foundation worth growing. <strong>${strongest[0]}</strong> is currently working in your favor, while <strong>${weakest[0]}</strong> is the clearest constraint. We’d focus there first because it offers the most practical path to measurable improvement.`;
}

function renderPillars(pillarScores) {
  document.querySelectorAll("[data-pillar]").forEach((row) => {
    const pillar = row.dataset.pillar;
    const score = Number(pillarScores[pillar] ?? 0);
    row.querySelector("i").style.setProperty("--value", `${score}%`);
    row.querySelector("b").textContent = `${score}/100`;
  });
}

function buildProfile(assessmentData, pillarScores, missionData) {
  const ownerName = assessmentData.ownerName || fallbackAssessment.ownerName;
  const businessName = normalizeBusinessName(assessmentData.businessName || fallbackAssessment.businessName);
  const cleanScores = { ...fallbackScores, ...pillarScores };
  const values = Object.values(cleanScores).map(Number).filter(Number.isFinite);
  const growthScore = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const lowestPillar = Object.entries(cleanScores).sort((a, b) => a[1] - b[1])[0][0];
  const selectedMission = { ...fallbackMission, ...missionData };

  return {
    ownerName,
    firstName: ownerName.trim().split(/\s+/)[0] || "Operator",
    initials: ownerName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "GO",
    businessName,
    website: assessmentData.website || fallbackAssessment.website,
    bookingPlatform: assessmentData.bookingPlatform || "Not connected",
    scores: cleanScores,
    growthScore,
    percentile: Math.max(12, Math.min(48, 100 - growthScore)),
    scoreChange: 2 + (growthScore % 3),
    industryLabel: "tour operators",
    revenueOpportunity: 12400 + ((100 - cleanScores[lowestPillar]) * 320),
    mission: {
      pillar: selectedMission.pillar || lowestPillar,
      title: selectedMission.title || fallbackMission.title,
      reason: selectedMission.reason || fallbackMission.reason,
      confidence: selectedMission.confidence || fallbackMission.confidence,
      description: missionDescription(selectedMission.pillar || lowestPillar, businessName)
    }
  };
}


function normalizeBusinessName(value) {
  const cleaned = String(value || "").trim();
  if (cleaned.toLowerCase() === "growth operator") return "Growth Operator";
  return cleaned || fallbackAssessment.businessName;
}

function missionDescription(pillar, businessName) {
  const copy = {
    Visibility: `${businessName} has an opportunity to turn more local searches into direct website visits and bookings.`,
    Trust: `${businessName} can surface stronger proof at the moments when travelers are deciding whether to book.`,
    Conversion: `${businessName}'s mobile booking journey is the strongest modeled opportunity for improving direct conversion.`,
    Operations: `${businessName} can reduce response delays and protect more high-intent booking opportunities.`,
    Intelligence: `${businessName} can make faster decisions with a clearer competitor and market benchmark.`,
    Growth: `${businessName} can create a stronger weekly rhythm around one prioritized mission and measurable outcome.`
  };
  return copy[pillar] || copy.Conversion;
}

function scoreStatus(score) {
  if (score >= 85) return "Excellent";
  if (score >= 72) return "Good";
  if (score >= 60) return "Building";
  return "Needs Focus";
}

function splitMissionTitle(title) {
  const words = title.replace(/\.$/, "").split(" ");
  if (words.length < 5) return title;
  const midpoint = Math.ceil(words.length / 2);
  return `${words.slice(0, midpoint).join(" ")}<br>${words.slice(midpoint).join(" ")}`;
}

function readStorage(key, fallback) {
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) };
  } catch {
    return fallback;
  }
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function animateCounters() {
  document.querySelectorAll("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count);
    const duration = 750;
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function animateBars() {
  document.querySelectorAll(".health-row div>span i, .confidence-bar i").forEach((bar) => {
    bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, delay: 250, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    bar.style.transformOrigin = "left";
  });
}

function wireInteractions() {
  document.getElementById("start-mission").addEventListener("click", () => openMissionWorkspace("start"));
  document.getElementById("brief-start-mission")?.addEventListener("click", () => openMissionWorkspace("start"));
  document.getElementById("preview-fix").addEventListener("click", () => openMissionWorkspace("preview"));
  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  document.getElementById("modal-action").addEventListener("click", () => {
    closeModal();
    showToast(`Mission activated for ${profile.businessName}. Growth Operator will track the result.`);
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

  document.querySelectorAll("[data-pillar]").forEach((button) => {
    button.addEventListener("click", () => {
      const pillar = button.dataset.pillar;
      openModal({
        eyebrow: "SIX-PILLAR ANALYSIS",
        title: `${pillar}: ${profile.scores[pillar]}/100`,
        copy: `This modeled score reflects ${profile.businessName}'s current ${pillar.toLowerCase()} signal from the latest preview analysis.`,
        callout: `<strong>Next step:</strong> connect live data to replace the preview model and unlock detailed recommendations for ${pillar.toLowerCase()}.`,
        action: "View pillar plan →"
      });
    });
  });

  document.querySelectorAll("[data-opportunity]").forEach((button) => {
    button.addEventListener("click", () => openModal({
      eyebrow: "TOP OPPORTUNITY",
      title: button.dataset.opportunity,
      copy: "This opportunity is ranked by revenue potential, confidence, time to impact, and effort required.",
      callout: `<strong>Personalized for:</strong> ${profile.businessName}<br><strong>Booking platform:</strong> ${profile.bookingPlatform}`,
      action: "Turn this into a mission →"
    }));
  });

  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

function openMissionWorkspace(mode) {
  const missionWorkspace = {
    businessName: profile.businessName,
    ownerName: profile.ownerName,
    website: profile.website,
    bookingPlatform: profile.bookingPlatform,
    growthScore: profile.growthScore,
    scores: profile.scores,
    revenueOpportunity: profile.revenueOpportunity,
    mission: profile.mission,
    mode,
    startedAt: new Date().toISOString()
  };

  localStorage.setItem("growthOperatorActiveMission", JSON.stringify(missionWorkspace));
  window.location.href = `mission.html?mode=${mode}`;
}

function openModal(content) {
  document.getElementById("modal-eyebrow").textContent = content.eyebrow;
  document.getElementById("modal-title").textContent = content.title;
  document.getElementById("modal-copy").textContent = content.copy;
  document.getElementById("modal-callout").innerHTML = content.callout;
  document.getElementById("modal-action").textContent = content.action;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function revealCards() {
  document.querySelectorAll(".card").forEach((card, index) => {
    card.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 430, delay: Math.min(index * 40, 480), easing: "ease-out", fill: "both" });
  });
}