"use strict";

const fallback = {
  businessName: "Your business",
  scores: {},
  website: ""
};

const prospectProfile = read("growthOperatorProspectProfile", null);
const profile = prospectProfile || read("growthOperatorBusinessReviewProfile", fallback);
const isProspect = Boolean(prospectProfile);
const businessName = isProspect ? (profile.businessName || fallback.businessName) : fallback.businessName;
const opportunities = isProspect && Array.isArray(profile.opportunities) ? profile.opportunities : [];
const hasLiveResearch = Boolean(profile?.researchIntelligence?.brain?.candidates?.length || read("growthOperatorOpportunityBrain", null)?.brain?.candidates?.length);

document.addEventListener("DOMContentLoaded", () => {
  text("business-name", businessName);
  text("growth-score", "—");
  text("score-label", "NOT SCORED");
  text("opportunity-count", opportunities.length);
  text("modeled-total", "Needs connected data");
  text("pace-estimate", "Not modeled yet");
  document.getElementById("score-ring").style.setProperty("--score", 0);
  text("score-read", "Public findings are not a calibrated score.");
  text("score-copy", isProspect ? (profile.summary || "Review the cited findings below; business performance still needs connected data.") : "Analyze a business to see what GO can support with public evidence.");
  if (isProspect) {
    text("snapshot-eyebrow", profile.sample===true ? "SAMPLE BENCHMARK · NOT A LIVE OPERATOR SCAN" : "PUBLIC + OPERATOR GROWTH SNAPSHOT");
    text("score-label", "NOT SCORED");
    text("score-read", "Public evidence is not a complete business health score.");
    text("hero-lede", profile.sample===true ? "This Cayman benchmark is an example from prior operator context. Review the product flow, but do not treat it as a fresh investigation or a measured Growth Score." : "GO carried the evidence from the business analysis into this Snapshot. These are the same findings — prioritized, actionable and separated from anything that still needs connected data.");
    text("revenue-strip-label", "REVENUE OPPORTUNITY");
    text("revenue-strip-copy", "GO needs first-party data before putting a defensible dollar value on these findings");
    const investigationCount = opportunities.filter(item => item.kind === "investigation").length;
    text("opportunity-count-copy", investigationCount === opportunities.length ? "evidence-backed investigations" : "evidence-backed findings");
    text("opportunity-heading", investigationCount === opportunities.length
      ? `The ${opportunities.length} questions GO would investigate next.`
      : `The ${opportunities.length} findings GO would prioritize next.`);
    text("opportunity-lede", investigationCount === opportunities.length
      ? "GO is not manufacturing problems from a healthy public website. These are the next questions worth proving with market or connected data."
      : "No generic audit. Each finding below comes directly from evidence GO showed in the business analysis.");
    if(profile.sample===true)text("opportunity-lede", "Example findings from a prior operator benchmark. Verify current sources and business conditions before acting.");
  }
  if (!isProspect) {
    text("opportunity-heading", "No reviewed prospect findings loaded.");
    text("opportunity-lede", "Analyze a business to begin a public investigation. GO will withhold a score and dollar estimate until it can defend them.");
    text("hero-lede", "GO has not loaded a reviewed business investigation for this Snapshot.");
    const action=document.querySelector('.hero-actions .primary');if(action){action.href='operator-analyzer.html';action.textContent='Analyze a business →';}
  }
  renderOpportunities();
  wire();
});

function renderOpportunities() {
  const root = document.getElementById("opportunity-list");
  root.innerHTML = opportunities.map((item, index) => {
    const modeled = 0;
    const moneyHeadline = modeled ? money(modeled) : (item.moneyLabel || "Needs connected data");
    const sourceMarkup = Array.isArray(item.sources) && item.sources.length
      ? `<div class="snapshot-source-stack">${item.sources.map(source => `<div class="snapshot-source ${source.type || "public"}"><b>${source.label}</b><span>${source.detail}</span></div>`).join("")}</div>`
      : "";
    return `
    <article class="opportunity-card ${index === 0 ? "priority" : ""}">
      <div class="op-number">0${index + 1}</div>
      <div class="op-main">
        <div class="op-kicker"><span>${item.icon || "↗"}</span><small>${(item.pillar || "Growth").toUpperCase()} • ${item.kind === "investigation" ? (index === 0 ? "INVESTIGATE FIRST" : "INVESTIGATE NEXT") : (index === 0 ? "HIGHEST PRIORITY" : "OPPORTUNITY")}</small>${item.confidence ? `<em class="confidence-pill">${item.confidence} confidence</em>` : ""}</div>
        <h3>${item.title}</h3>
        <p>${item.problem}</p>
        ${sourceMarkup || evidenceVisual(item)}
        ${(item.rankExplanation || item.counterEvidence) ? `<div class="snapshot-reasoning"><div><small>WHY THIS RANKS HERE</small><p>${item.rankExplanation || item.priorityReason || "GO ranked this against the other patterns it found."}</p></div><div><small>WHAT COULD WEAKEN THIS</small><p>${item.counterEvidence || "Connected data could change this priority."}</p></div></div>` : ""}
      </div>
      <div class="op-action"><small>${item.kind === "investigation" ? "WHAT GO WOULD VERIFY" : "WHAT GO WOULD DO"}</small><p>${item.action}</p><div class="metric"><span>GO WOULD MEASURE</span><strong>${item.metric}</strong></div></div>
      <div class="op-money"><small>${modeled ? "MODELED ANNUAL OPPORTUNITY" : "REVENUE MODEL"}</small><strong>${moneyHeadline}</strong><span>${modeled ? "Estimate until connected data replaces assumptions and proves impact." : "GO will not invent revenue without the traffic, conversion and booking data needed to defend it."}</span>${modeled ? `<button data-math="${index}">How GO calculated this →</button>` : `<button class="needs-data-button" data-needs-data="${index}">What GO needs to prove this →</button>`}</div>
    </article>`;
  }).join("");
}

function evidenceVisual(item) {
  if (isProspect || hasLiveResearch) {
    const sources=Array.isArray(item.sources)?item.sources:[];
    if(!sources.length)return "";
    return `<div class="snapshot-live-proof"><div class="evidence-label"><span>VERIFIED EVIDENCE</span><small>LIVE PUBLIC RESEARCH</small></div>${sources.map(source=>`<div class="snapshot-source ${source.type||"public"}"><b>${source.label||"Evidence"}</b><span>${source.detail||""}</span></div>`).join("")}</div>`;
  }
  const label = `<div class="evidence-label"><span>WHAT GO SEES</span><small>VISUAL PREVIEW • LIVE DATA COMING NEXT</small></div>`;

  if (item.evidenceType === "competitor") return `${label}<div class="proof-visual competitor-proof"><div class="proof-bar"><span>Your business</span><i><b style="width:${item.pillarScore}%"></b></i><strong>${item.pillarScore}</strong></div><div class="proof-bar competitor"><span>Competitor avg.</span><i><b style="width:${Math.min(92,item.pillarScore+18)}%"></b></i><strong>${Math.min(92,item.pillarScore+18)}</strong></div></div>`;
  if (item.evidenceType === "priority") return `${label}<div class="proof-visual priority-proof"><div class="priority-row first"><b>1</b><span><strong>Fix first</strong><small>Highest expected booking impact</small></span><em>NOW</em></div></div>`;
  if (item.evidenceType === "conversion") return `${label}<div class="proof-visual booking-proof"><div class="booking-step done"><span>1</span><strong>Website</strong></div><i>→</i><div class="booking-step friction"><span>2</span><strong>Booking</strong></div></div>`;
  if (item.evidenceType === "reviews") return `${label}<div class="proof-visual review-proof"><small>Preview data only. Live prospect scans never use these example values.</small></div>`;
  if (item.evidenceType === "visibility") return `${label}<div class="proof-visual search-proof"><small>Preview data only. Live prospect scans never use these example rankings.</small></div>`;
  return `${label}<div class="proof-visual followup-proof"><div><b>NEW LEAD</b></div><i>→</i><div><b>BOOKING</b></div></div>`;
}

function wire() {
  document.querySelectorAll("[data-needs-data]").forEach(button => button.addEventListener("click", () => openNeedsData(Number(button.dataset.needsData))));
  document.getElementById("close-modal").addEventListener("click", closeMath);
  document.getElementById("math-modal").addEventListener("click", event => { if (event.target.id === "math-modal") closeMath(); });
  document.getElementById("book-review").addEventListener("click", () => {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  });
}

function openNeedsData(index) {
  const item = opportunities[index];
  text("math-title", `${item.pillar}: what GO needs to prove revenue impact`);
  document.getElementById("math-content").innerHTML = `<div class="math-grid"><div><small>WEBSITE TRAFFIC</small><strong>Connect analytics</strong></div><div><small>BOOKING CONVERSION</small><strong>Connect booking data</strong></div><div><small>AVERAGE BOOKING VALUE</small><strong>Use actual sales</strong></div><div><small>ATTRIBUTION</small><strong>Track before / after</strong></div></div><p><strong>GO's rule:</strong> ${item.moneyLabel || "No revenue claim yet."} We can identify the business problem from public and operator evidence, but we only turn it into a dollar model when the inputs are defensible.</p>`;
  document.getElementById("math-modal").hidden = false;
}

function closeMath(){ document.getElementById("math-modal").hidden = true; }
function money(value){ return `$${Math.round(Number(value)||0).toLocaleString("en-US")}`; }
function text(id,value){ const node=document.getElementById(id); if(node) node.textContent=value; }
function read(key,fallback){ try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
