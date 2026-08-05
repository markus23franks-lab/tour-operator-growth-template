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
const liveAudit = readStorage("growthOperatorLiveAudit", null);
const previewScores = readStorage("growthOperatorPreviewScores", fallbackScores);
const previewMission = readStorage("growthOperatorPreviewMission", fallbackMission);
const intelligenceEngine = new window.GOIntelligenceEngine();
const intelligence = intelligenceEngine.analyze({ assessment, previewScores, previewMission, liveAudit });
const scores = intelligence.scores;
const mission = intelligence.mission;
const profile = buildProfile(intelligence.assessment, scores, mission);
profile.growthScore = intelligence.growthScore;
profile.findings = intelligence.findings;
profile.intelligence = intelligence;

const goEngine = new window.GOWorkEngine(profile);
const goWorkState = goEngine.state;

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
  renderFindings(profile);
  renderGOWorkbench();
  animateCounters();
  animateBars();
  wireInteractions();
  revealCards();
});


function renderGOWorkbench() {
  setText("go-work-headline", goWorkState.headline);
  setText("go-completed-count", String(goWorkState.completed.length));
  setText("go-revenue-tracked", `$${Math.round(goWorkState.revenueModel.annual).toLocaleString("en-US")}`);

  const approvalList = document.getElementById("go-approval-list");
  approvalList.innerHTML = goWorkState.approvals.map(item => `
    <article class="go-approval-item" data-go-approval="${item.id}">
      <div><small>${item.pillar.toUpperCase()}</small><h4>${item.title}</h4><p>${item.detail}</p></div>
      <span class="go-approval-status">${item.status}</span>
      <div class="go-approval-actions">
        <button class="secondary-button" type="button" data-go-review="${item.id}">Review work</button>
        <button class="primary-button" type="button" data-go-approve="${item.id}">${item.status.startsWith("Approved") ? "Approved ✓" : "Approve and let GO handle it →"}</button>
      </div>
    </article>
  `).join("");

  const workingList = document.getElementById("go-working-list");
  workingList.innerHTML = goWorkState.working.map(item => `
    <div class="go-working-row"><div><strong>${item.label}</strong><span>${item.progress}% prepared</span></div><i><b style="--go-progress:${item.progress}%"></b></i></div>
  `).join("");

  const monitoringList = document.getElementById("go-monitoring-list");
  monitoringList.innerHTML = goWorkState.monitoring.map(item => `
    <div class="go-monitoring-row"><span></span><div><strong>${item.label}</strong><small>${item.detail}</small></div><b>${item.state}</b></div>
  `).join("");

  approvalList.querySelectorAll("[data-go-review]").forEach(button => {
    button.addEventListener("click", () => {
      const item = goWorkState.approvals.find(entry => entry.id === button.dataset.goReview);
      openModal({
        eyebrow: "GO PREPARED THIS FOR YOU",
        title: item.title,
        copy: item.detail,
        callout: `<strong>What GO will do:</strong> prepare the change, preserve the original, request final approval, and measure the result afterward.<br><br><strong>You stay in control:</strong> nothing publishes without approval.`,
        action: "Review prepared change →"
      });
    });
  });

  approvalList.querySelectorAll("[data-go-approve]").forEach(button => {
    button.addEventListener("click", () => {
      const item = goEngine.approve(button.dataset.goApprove);
      if (!item) return;
      button.textContent = "Approved ✓";
      button.disabled = true;
      button.closest(".go-approval-item").querySelector(".go-approval-status").textContent = item.status;
      showToast(`${item.title} approved. GO is moving it forward.`);
    });
  });

  document.getElementById("revenue-math-button")?.addEventListener("click", () => {
    const model = goWorkState.revenueModel;
    const liftPercent = (model.modeledLift * 100).toFixed(1);
    openModal({
      eyebrow: "RECOVERABLE REVENUE MODEL",
      title: "Here’s the math behind the opportunity.",
      copy: "GO uses a conservative scenario so the number is explainable, testable, and replaceable with real connected data.",
      callout: `<strong>${model.monthlyVisitors.toLocaleString("en-US")}</strong> monthly visitors × <strong>${liftPercent}%</strong> modeled conversion lift × <strong>$${model.averageBooking}</strong> average booking × 12 months = approximately <strong>$${Math.round(model.annual).toLocaleString("en-US")}/year</strong>.<br><br>${model.disclaimer}`,
      action: "Track this outcome →"
    });
  });
}

function personalizeDashboard() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  document.getElementById("greeting").innerHTML = `${greeting}, ${profile.firstName} <span>👋</span>`;
  document.getElementById("today-label").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  document.getElementById("briefing-line").innerHTML = `Here’s what’s moving the needle for <strong>${profile.businessName}</strong> and where we can help you grow.`;
  document.getElementById("scan-time").textContent = liveAudit ? `Live website check: ${formatAuditTime(liveAudit.completedAt)}` : "Latest preview scan: just now";
  const contextStrong = document.querySelector("#scan-context strong");
  if (contextStrong) contextStrong.textContent = liveAudit ? "LIVE WEBSITE DATA" : "PREVIEW ANALYSIS";

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
  localStorage.setItem("growthOperatorBusinessReviewProfile", JSON.stringify(profile));
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


function renderFindings(currentProfile) {
  const findings = Array.isArray(currentProfile.findings) && currentProfile.findings.length
    ? currentProfile.findings
    : buildLiveFindings(currentProfile) || buildFindings(currentProfile);
  const list = document.getElementById("findings-list");
  if (!list) return;

  setText("findings-title", `${currentProfile.businessName}: the clearest things we found`);
  setText("findings-intro", liveAudit ? "These findings use a live mobile Lighthouse check of your website. Open any finding to see the measured signal and what we’d do next." : "We separated strengths from opportunities and ranked what we’d address first. Open any finding to see the reasoning behind it.");
  setText("findings-source-label", currentProfile.intelligence?.sourceSummary?.label || (liveAudit ? "LIVE SOURCE" : "REVIEWED ACROSS"));
  setText("findings-source-title", liveAudit ? "Website + GO Engine" : "GO Intelligence Engine");
  setText("findings-source-status", `v${currentProfile.intelligence?.engineVersion || "1.0"} • ${currentProfile.intelligence?.mode || "preview"}`);

  list.innerHTML = findings.map((finding, index) => `
    <article class="finding-card ${finding.tone} ${index === 0 ? "finding-primary" : ""}" data-finding-id="${finding.id}">
      <button class="finding-summary-row" type="button" aria-expanded="false">
        <span class="finding-rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="finding-icon">${finding.icon}</span>
        <span class="finding-main">
          <small>${finding.pillar}</small>
          <strong>${finding.title}</strong>
          <p>${finding.summary}</p>
        </span>
        <span class="finding-status">${finding.status}</span>
        <span class="finding-toggle">Show me <b>+</b></span>
      </button>
      <div class="finding-details" hidden>
        <div class="finding-detail-grid">
          <div><small>WHAT WE FOUND</small><p>${finding.found}</p></div>
          <div><small>WHY IT MATTERS</small><p>${finding.why}</p></div>
          <div><small>WHAT WE’D RECOMMEND</small><p>${finding.recommendation}</p></div>
          <div><small>EXPECTED RESULT</small><p>${finding.expected}</p></div>
        </div>
        <div class="finding-proof">
          <span><small>CURRENT SIGNAL</small><strong>${finding.score}/100</strong></span>
          <span><small>PRIORITY</small><strong>${finding.priorityScore ?? "--"}/100</strong></span>
          <p><strong>What we’ll verify with live data:</strong> ${finding.verify}</p>
          <button class="finding-action" type="button" data-finding-action="${finding.id}">${index === 0 ? "Start improving →" : "Make this a mission →"}</button>
        </div>
      </div>
    </article>
  `).join("");

  list.querySelectorAll(".finding-summary-row").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".finding-card");
      const details = card.querySelector(".finding-details");
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      details.hidden = expanded;
      card.classList.toggle("open", !expanded);
      button.querySelector(".finding-toggle").innerHTML = expanded ? "Show me <b>+</b>" : "Hide <b>−</b>";
    });
  });

  list.querySelectorAll("[data-finding-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const finding = findings.find((item) => item.id === button.dataset.findingAction);
      if (!finding) return;

      if (finding.pillar === currentProfile.mission.pillar) {
        openMissionWorkspace("start");
        return;
      }

      openModal({
        eyebrow: `${finding.pillar.toUpperCase()} FINDING`,
        title: finding.title,
        copy: finding.recommendation,
        callout: `<strong>Expected result:</strong> ${finding.expected}<br><br><strong>Next step:</strong> connect the supporting data source, verify the finding, and rank it against your current mission.`,
        action: "Add to improvement plan →"
      });
    });
  });
}


function mergeLiveScores(previewScores, audit) {
  const category = audit.categories || {};
  const performance = category.performance ?? previewScores.Conversion;
  const seo = category.seo ?? previewScores.Visibility;
  const accessibility = category.accessibility ?? previewScores.Trust;
  const bestPractices = category.bestPractices ?? previewScores.Operations;
  return {
    ...previewScores,
    Visibility: Math.round((previewScores.Visibility * 0.35) + (seo * 0.65)),
    Trust: Math.round((previewScores.Trust * 0.45) + (accessibility * 0.55)),
    Conversion: Math.round((previewScores.Conversion * 0.25) + (performance * 0.75)),
    Operations: Math.round((previewScores.Operations * 0.45) + (bestPractices * 0.55)),
    Intelligence: Math.round((previewScores.Intelligence * 0.7) + 21),
    Growth: Math.round((performance + seo + accessibility + bestPractices) / 4)
  };
}

function formatAuditTime(value) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function buildLiveFindings(currentProfile) {
  if (!liveAudit || !Array.isArray(liveAudit.findings) || !liveAudit.findings.length) return null;
  return liveAudit.findings.slice(0, 5).map((finding, index) => ({
    id: finding.id || `live-${index + 1}`,
    pillar: finding.pillar || "Conversion",
    icon: finding.icon || "◎",
    title: finding.title,
    summary: finding.summary,
    found: finding.found,
    why: finding.why,
    recommendation: finding.recommendation,
    expected: finding.expected,
    verify: finding.evidence || `Measured during the live mobile website check completed ${formatAuditTime(liveAudit.completedAt)}.`,
    score: Number.isFinite(finding.score) ? finding.score : currentProfile.scores[finding.pillar] || currentProfile.growthScore,
    status: finding.status || "Live finding",
    tone: finding.tone || (index === 0 ? "opportunity" : "neutral")
  }));
}

function buildFindings(currentProfile) {
  const templates = {
    Visibility: {
      icon: "◎",
      title: "Make it easier for nearby travelers to find you",
      summary: "Your local presence can do more of the work before a traveler ever reaches your website.",
      found: "Our preview analysis suggests there is room to strengthen how consistently your business appears across high-intent local searches and discovery channels.",
      why: "Travelers often choose from the first credible options they see. Weak or inconsistent visibility means competitors can win the click before your experience is considered.",
      recommendation: "Tighten your local search presence, confirm business information everywhere, and build pages around the searches most likely to produce bookings.",
      expected: "More qualified website visits and booking inquiries from travelers already looking for what you offer.",
      verify: "Google Business Profile completeness, local rankings, Search Console queries, directory consistency, and location-page coverage."
    },
    Trust: {
      icon: "★",
      title: "Use customer trust more deliberately",
      summary: "Your reputation should reduce hesitation at every important booking decision.",
      found: "Customer trust appears to be an important business asset, but it may not be visible enough throughout the customer journey.",
      why: "Travelers compare unfamiliar operators quickly. Reviews, photos, policies, and proof help them feel safe choosing you instead of a competitor.",
      recommendation: "Place strong reviews and clear trust signals near pricing, availability, booking buttons, and checkout decisions.",
      expected: "Higher booking confidence and stronger conversion without needing additional traffic.",
      verify: "Google and Tripadvisor rating trends, review volume, response rate, testimonial placement, photo quality, and policy clarity."
    },
    Conversion: {
      icon: "➤",
      title: "Remove friction from the booking journey",
      summary: "Interested visitors should never have to work hard to become paying customers.",
      found: "The booking journey is the clearest modeled constraint. Calls to action, mobile usability, or unnecessary decisions may be allowing high-intent visitors to leave.",
      why: "More marketing cannot solve a conversion problem. Every unclear step between interest and checkout creates another chance to lose revenue.",
      recommendation: "Keep the booking action visible, simplify the path to availability, and answer the most important questions before checkout.",
      expected: "More direct bookings from the traffic and demand you already have.",
      verify: "Mobile CTA visibility, booking-engine steps, page speed, abandonment data, form friction, analytics funnels, and checkout completion."
    },
    Operations: {
      icon: "⚙",
      title: "Protect leads with consistent follow-up",
      summary: "Demand only becomes revenue when calls, inquiries, confirmations, and staff handoffs are handled reliably.",
      found: "The business may be relying on people to remember important follow-up steps that should happen automatically and consistently.",
      why: "Missed calls, slow responses, manual calendars, and inconsistent guest communication create revenue leakage and unnecessary staff work.",
      recommendation: "Centralize inquiries, automate confirmations and reminders, and create a visible owner for every follow-up task.",
      expected: "More inquiries converted, fewer dropped opportunities, and less manual work for the team.",
      verify: "Call-answer rate, inquiry response time, confirmation delivery, waiver completion, calendar ownership, CRM capture, and cancellation workflows."
    },
    Intelligence: {
      icon: "✦",
      title: "Turn market information into better decisions",
      summary: "Competitor, pricing, traffic, and customer signals should guide what you do next.",
      found: "Useful market knowledge likely exists, but it is not yet organized into a reliable benchmark the business can monitor over time.",
      why: "Without a consistent comparison point, operators can react to noise, miss competitor changes, or invest in the wrong improvement.",
      recommendation: "Establish a small competitor set and monitor pricing, reviews, visibility, offers, and positioning on a repeatable schedule.",
      expected: "Faster, more confident decisions about pricing, marketing, positioning, and investment.",
      verify: "Competitor pricing, review velocity, search position, offer changes, ad activity, social presence, and product mix."
    },
    Growth: {
      icon: "↗",
      title: "Create one repeatable improvement rhythm",
      summary: "The business needs a clear way to choose, complete, and measure the next improvement.",
      found: "There are several credible ways to grow, but pursuing too many at once can dilute attention and make results difficult to measure.",
      why: "Operators are busy. A focused improvement cycle creates accountability and makes it easier to see what actually changed the business.",
      recommendation: "Work one prioritized mission at a time, define the expected outcome, and measure the result before choosing the next move.",
      expected: "More consistent progress, clearer ROI, and fewer unfinished initiatives.",
      verify: "Mission completion, baseline metrics, outcome tracking, revenue impact, owner accountability, and time-to-result."
    }
  };

  const ordered = Object.entries(currentProfile.scores)
    .map(([pillar, score]) => ({ pillar, score: Number(score) }))
    .sort((a, b) => a.score - b.score);

  const primaryPillar = currentProfile.mission.pillar;
  const selectedPillars = [primaryPillar];
  ordered.forEach(({ pillar }) => {
    if (!selectedPillars.includes(pillar) && selectedPillars.length < 4) selectedPillars.push(pillar);
  });
  const strongest = [...ordered].sort((a, b) => b.score - a.score)[0]?.pillar;
  if (strongest && !selectedPillars.includes(strongest)) selectedPillars.push(strongest);

  return selectedPillars.slice(0, 5).map((pillar) => {
    const score = Number(currentProfile.scores[pillar] ?? 0);
    const template = templates[pillar] || templates.Growth;
    const status = score >= 78 ? "Strength" : score >= 60 ? "Opportunity" : "Needs attention";
    const tone = status === "Strength" ? "finding-strength" : status === "Needs attention" ? "finding-alert" : "finding-opportunity";
    return {
      id: pillar.toLowerCase(),
      pillar,
      score,
      status,
      tone,
      ...template
    };
  });
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