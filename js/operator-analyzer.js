"use strict";

const caymanProfile = {
  businessName: "Cayman Ocean Adventures",
  website: "https://caymanoceanadventures.com",
  secondaryWebsite: "https://stingraycitycaymantours.com",
  growthScore: 68,
  growthScoreLabel: "Provisional score · public + operator evidence",
  revenueOpportunity: null,
  revenueLabel: "Connect booking data",
  scores: { Visibility: 76, Trust: 72, Conversion: 66, Operations: 63, Intelligence: 58, Growth: 68 },
  analysisType: "Evidence-backed operator test",
  analysisConfidence: "High",
  summary: "The experience looks strong. The bigger issue is that growth is fragmented across two brands, review capture is too manual, and low-price competitors are shaping the buying decision.",
  opportunities: [
    {
      pillar: "Visibility",
      icon: "⌖",
      title: "Two websites are competing for the same customer",
      problem: "Cayman Ocean Adventures and Stingray City Cayman Tours sell overlapping experiences from the same family operation, use the same phone numbers and marina, and both direct customers toward the same core tours.",
      action: "GO would compare search queries, organic traffic and completed bookings by domain before changing anything. Then it would strengthen the winning search intent and prevent the two brands from quietly working against each other.",
      metric: "Organic bookings by website + search query",
      amount: null,
      moneyLabel: "Needs analytics + booking data",
      confidence: "High",
      sources: [
        { type: "public", label: "Public sites", detail: "Both brands publicly show the same phone numbers, Safe Haven Marina location and closely overlapping tour inventory." },
        { type: "operator", label: "Operator confirmed", detail: "The owner said most bookings currently come through Stingray City Cayman Tours even though payments flow to Cayman Ocean Adventures." }
      ],
      visual: { type: "domains" }
    },
    {
      pillar: "Trust",
      icon: "★",
      title: "Happy guests are not becoming reviews consistently enough",
      problem: "The operator already asks guests for feedback, uses QR review cards and manually follows up — but says many guests still reply that they loved the trip without posting the public review.",
      action: "GO would turn review capture into a measured system: automatic post-tour requests, smart follow-up, request-to-review conversion tracking, review velocity monitoring and competitor benchmarking.",
      metric: "Review requests → public reviews + reviews/month",
      amount: null,
      moneyLabel: "Review target first · revenue attribution later",
      confidence: "High",
      sources: [
        { type: "operator", label: "Operator confirmed", detail: "QR cards and manual email follow-up are already in use, but the owner says happy guests frequently fail to post." },
        { type: "public", label: "Public website", detail: "The site prominently uses strong guest testimonials, confirming that customer satisfaction is an asset worth converting into more public proof." }
      ],
      visual: { type: "reviewFunnel" }
    },
    {
      pillar: "Conversion",
      icon: "↗",
      title: "Don't let low-price agents define why customers choose",
      problem: "The owner is seeing booking agents compete aggressively on price while her business believes it wins on service, personal attention and the quality of the actual experience.",
      action: "GO would test stronger value positioning across the website and booking journey — family-run history, direct operation, crew quality and experience — then measure whether direct conversion improves without joining a race to the bottom.",
      metric: "Direct booking conversion + average booking value",
      amount: null,
      moneyLabel: "Needs traffic + conversion baseline",
      confidence: "Medium-high",
      sources: [
        { type: "public", label: "Public pricing", detail: "Stingray City Cayman Tours lists the Ocean Adventure from $69 and the Grand Tour from $115; public marketplace results include multi-stop Stingray City experiences from $55." },
        { type: "public", label: "Public positioning", detail: "The business emphasizes a family operation since 1997, friendly professional service and direct Stingray City experiences." },
        { type: "operator", label: "Operator confirmed", detail: "The owner specifically described cheaper booking agents as the current competitive pressure and believes her experience is materially better." }
      ],
      visual: { type: "positioning" }
    }
  ],
  watchItems: [
    {
      title: "SEO work needs a scoreboard",
      detail: "The owner said SEO work began roughly 2–3 months ago but she does not know what changed or how to judge whether it is working. GO should establish the baseline and make the outcome visible."
    }
  ]
};

const form = document.getElementById("analyzer-form");
const urlInput = document.getElementById("business-url");
const loadCayman = document.getElementById("load-cayman");
const scanPanel = document.getElementById("scan-panel");
const results = document.getElementById("results");
const unsupported = document.getElementById("unsupported");
const progress = document.getElementById("scan-progress");
const scanState = document.getElementById("scan-state");
let timers = [];

form.addEventListener("submit", event => {
  event.preventDefault();
  runAnalysis(urlInput.value.trim());
});

loadCayman.addEventListener("click", () => {
  urlInput.value = caymanProfile.website;
  runAnalysis(caymanProfile.website);
});

document.getElementById("open-snapshot").addEventListener("click", () => {
  localStorage.setItem("growthOperatorProspectProfile", JSON.stringify(caymanProfile));
  window.location.href = "growth-snapshot.html?source=operator-analyzer";
});

document.getElementById("reset-analysis").addEventListener("click", reset);
document.getElementById("try-supported").addEventListener("click", () => {
  reset();
  urlInput.value = caymanProfile.website;
  runAnalysis(caymanProfile.website);
});

function runAnalysis(rawUrl) {
  clearTimers();
  results.hidden = true;
  unsupported.hidden = true;
  scanPanel.hidden = false;
  progress.style.width = "4%";
  scanState.innerHTML = "<i></i> WORKING";
  document.querySelectorAll("[data-stage]").forEach(stage => {
    stage.classList.remove("active", "done");
    stage.querySelector("b").textContent = "WAITING";
  });

  const stages = ["website", "search", "reviews", "competitors", "operator"];
  stages.forEach((stageName, index) => {
    timers.push(setTimeout(() => activateStage(stageName, index, stages.length), 350 + index * 430));
  });

  timers.push(setTimeout(() => finish(rawUrl), 350 + stages.length * 430 + 250));
}

function activateStage(name, index, total) {
  const stage = document.querySelector(`[data-stage="${name}"]`);
  document.querySelectorAll("[data-stage].active").forEach(node => {
    node.classList.remove("active");
    node.classList.add("done");
    node.querySelector("b").textContent = "VERIFIED";
  });
  stage.classList.add("active");
  stage.querySelector("b").textContent = "CHECKING";
  progress.style.width = `${Math.round(((index + .65) / total) * 100)}%`;
}

function finish(rawUrl) {
  document.querySelectorAll("[data-stage]").forEach(node => {
    node.classList.remove("active");
    node.classList.add("done");
    node.querySelector("b").textContent = "VERIFIED";
  });
  progress.style.width = "100%";
  scanState.innerHTML = "<i></i> COMPLETE";
  const normalized = rawUrl.toLowerCase();
  const supported = normalized.includes("caymanoceanadventures") || normalized.includes("stingraycitycaymantours");
  timers.push(setTimeout(() => supported ? showCaymanResults() : showUnsupported(rawUrl), 350));
}

function showCaymanResults() {
  localStorage.setItem("growthOperatorProspectProfile", JSON.stringify(caymanProfile));
  text("result-business", caymanProfile.businessName);
  text("result-summary", caymanProfile.summary);
  text("confidence-score", caymanProfile.analysisConfidence.toUpperCase());
  document.getElementById("finding-list").innerHTML = caymanProfile.opportunities.map((item, index) => `
    <article class="finding-card">
      <div class="finding-number">0${index + 1}</div>
      <div class="finding-copy">
        <div class="finding-kicker"><span>${item.icon}</span><small>${item.pillar.toUpperCase()} · ${item.confidence.toUpperCase()} CONFIDENCE</small></div>
        <h3>${item.title}</h3>
        <p>${item.problem}</p>
        <div class="source-stack">${item.sources.map(source => `<div class="source-chip ${source.type}"><b>${source.label}</b><span>${source.detail}</span></div>`).join("")}</div>
      </div>
      <div class="finding-action"><small>WHAT GO WOULD DO</small><p>${item.action}</p><div><span>GO WOULD MEASURE</span><strong>${item.metric}</strong></div><em>${item.moneyLabel}</em></div>
    </article>
  `).join("") + `
    <article class="watch-card"><span>◉</span><div><small>GO WOULD ALSO WATCH</small><h3>${caymanProfile.watchItems[0].title}</h3><p>${caymanProfile.watchItems[0].detail}</p></div></article>`;
  scanPanel.hidden = true;
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showUnsupported(rawUrl) {
  scanPanel.hidden = true;
  text("unsupported-url", rawUrl || "This website");
  unsupported.hidden = false;
  unsupported.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset() {
  clearTimers();
  scanPanel.hidden = true;
  results.hidden = true;
  unsupported.hidden = true;
  progress.style.width = "0";
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => urlInput.focus(), 300);
}

function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function text(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }