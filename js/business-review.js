"use strict";

const assessment = readStorage("growthOperatorAssessment", {
  businessName: "River Ranch Educational Charities",
  ownerName: "Markus Franks",
  website: "https://riverranch.org",
  bookingPlatform: "Homegrown system"
});
const intelligence = readStorage("growthOperatorIntelligence", null);
const activeMission = readStorage("growthOperatorActiveMission", null);

const businessName = normalizeBusinessName(assessment.businessName || "Your business");
const website = normalizeWebsite(assessment.website || "https://riverranch.org");
const host = hostname(website);

const findings = buildReviewFindings();
let currentIndex = 0;

const stepsNode = document.getElementById("review-steps");
const completeOverlay = document.getElementById("review-complete");

document.addEventListener("DOMContentLoaded", () => {
  setText("review-business-header", businessName);
  setText("rail-business-name", businessName);
  setText("review-total-count", findings.length);
  setText("complete-business-name", `${businessName}: here’s where we’d start.`);
  renderSteps();
  renderFinding(0);
});

document.getElementById("previous-finding").addEventListener("click", () => {
  if (currentIndex > 0) renderFinding(currentIndex - 1);
});

document.getElementById("next-finding").addEventListener("click", () => {
  if (currentIndex < findings.length - 1) {
    renderFinding(currentIndex + 1);
  } else {
    openComplete();
  }
});

document.getElementById("start-recommended-mission").addEventListener("click", () => {
  const first = findings[0];
  const existing = activeMission || {};
  const mission = {
    ...existing,
    businessName,
    ownerName: assessment.ownerName || "Operator",
    website,
    bookingPlatform: assessment.bookingPlatform || "Not connected",
    growthScore: intelligence?.growthScore || existing.growthScore || 66,
    scores: intelligence?.scores || existing.scores || {},
    revenueOpportunity: first.revenueOpportunity,
    mission: {
      pillar: first.pillar,
      title: first.prescriptionTitle,
      reason: first.recommendation,
      confidence: first.confidence,
      description: first.expected
    },
    mode: "start",
    startedAt: new Date().toISOString()
  };
  localStorage.setItem("growthOperatorActiveMission", JSON.stringify(mission));
  window.location.href = "mission.html?mode=start";
});

function renderSteps() {
  stepsNode.innerHTML = findings.map((finding, index) => `
    <li>
      <button class="review-step ${index === currentIndex ? "active" : ""}" type="button" data-step="${index}">
        <span>${index + 1}</span>
        <div><small>${escapeHtml(finding.pillar)}</small><strong>${escapeHtml(finding.shortTitle)}</strong></div>
      </button>
    </li>
  `).join("");

  stepsNode.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => renderFinding(Number(button.dataset.step)));
  });
}

function renderFinding(index) {
  currentIndex = index;
  const finding = findings[index];

  setText("finding-pillar", finding.pillar.toUpperCase());
  setText("finding-title", finding.title);
  setText("finding-summary", finding.summary);
  setText("finding-status", finding.status.toUpperCase());
  setText("finding-priority", `${finding.priority.toUpperCase()} PRIORITY`);
  setText("evidence-url", host);
  setText("finding-found", finding.found);
  setText("finding-why", finding.why);
  setText("finding-recommendation", finding.recommendation);
  setText("finding-expected", finding.expected);
  setText("prescription-title", finding.prescriptionTitle);
  setText("prescription-copy", finding.prescriptionCopy);
  setText("metric-impact", finding.impact);
  setText("metric-effort", finding.effort);
  setText("metric-confidence", `${finding.confidence}%`);
  document.getElementById("evidence-canvas").innerHTML = finding.evidence();

  setText("review-step-count", index + 1);
  document.getElementById("review-progress").style.width = `${((index + 1) / findings.length) * 100}%`;
  document.getElementById("previous-finding").disabled = index === 0;
  setText("next-finding", index === findings.length - 1 ? "Finish review →" : "Next finding →");

  stepsNode.querySelectorAll(".review-step").forEach((step, stepIndex) => {
    step.classList.toggle("active", stepIndex === index);
    step.classList.toggle("complete", stepIndex < index);
    if (stepIndex < index) step.querySelector("span").textContent = "✓";
    else step.querySelector("span").textContent = stepIndex + 1;
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openComplete() {
  const first = findings[0];
  setText("complete-summary", `${businessName} appears to have real demand. The clearest opportunity is turning more of that interest into booked revenue and a better guest experience.`);
  setText("complete-priority-title", first.prescriptionTitle);
  setText("complete-priority-copy", first.prescriptionCopy);
  completeOverlay.classList.add("open");
  completeOverlay.setAttribute("aria-hidden", "false");
}

function buildReviewFindings() {
  const isRiverRanch = /river\s*ranch|riverranch/i.test(`${businessName} ${host}`);
  const primary = intelligence?.findings?.[0];

  if (!isRiverRanch && primary) {
    return buildGenericFindings(primary);
  }

  return [
    {
      pillar: "Conversion",
      shortTitle: "Booking friction",
      title: "Interested visitors are not getting a clear path to book.",
      summary: "Demand may already exist, but the website and booking experience are asking customers to work too hard before they can reserve.",
      status: "Opportunity",
      priority: "High",
      found: "The booking journey does not consistently move a visitor from interest to a simple date, time, and checkout decision.",
      why: "Every unclear step creates another chance for a ready-to-buy customer to leave, call later, or choose a competitor.",
      recommendation: "Make one primary booking action impossible to miss, simplify the path to availability, and automate recovery when someone leaves before paying.",
      expected: "More direct bookings from the interest and website traffic the business already has.",
      prescriptionTitle: "Simplify the booking path first.",
      prescriptionCopy: "Before buying more traffic, fix the point where current demand is leaking. This is the clearest path to revenue improvement.",
      impact: "High", effort: "Medium", confidence: 94, revenueOpportunity: 26480,
      evidence: () => `<div class="mock-site"><div class="mock-nav"><strong>${escapeHtml(shortBusinessName())}</strong><div><span>Experiences</span><span>Events</span><span>About</span></div><button>BOOK NOW</button></div><div class="mock-hero"><small>EXPERIENCES IN DALLAS</small><h3>Make memories on horseback.</h3><p>Trail rides, lessons, events, and outdoor experiences for families and groups.</p><span class="mock-cta">Explore experiences</span><div class="evidence-highlight" style="right:22px;top:-48px;width:78px;height:34px"></div><div class="evidence-label" style="right:34px;top:30px"><strong>BOOKING FRICTION</strong>The customer sees several directions to explore, but the next booking step is not consistently reinforced.</div></div></div>`
    },
    {
      pillar: "Visibility",
      shortTitle: "Google accuracy",
      title: "Incorrect business information can quietly cost high-intent customers.",
      summary: "A traveler who sees the business marked closed may never visit the website or call to verify.",
      status: "Needs attention",
      priority: "High",
      found: "The public Google profile may show hours or availability that do not match when the business is actually operating.",
      why: "Google often becomes the first decision point. Incorrect hours can suppress calls, directions, and bookings before the customer reaches you.",
      recommendation: "Confirm ownership of the profile, correct hours, and assign one person responsible for keeping key information accurate.",
      expected: "Protect local visibility and recover high-intent inquiries that may currently assume the business is unavailable.",
      prescriptionTitle: "Correct and control the Google profile.",
      prescriptionCopy: "This is a fast, low-cost fix with an immediate impact on customer confidence and local discovery.",
      impact: "High", effort: "Easy", confidence: 91, revenueOpportunity: 9200,
      evidence: () => `<div class="google-card"><div class="google-searchbar">🔍 horseback riding near Dallas</div><div class="google-panel"><small>Horseback riding</small><h3>${escapeHtml(shortBusinessName())}</h3><div class="google-stars">★★★★★ <span style="color:#5f6368">4.8 · 286 reviews</span></div><p style="font-size:9px;color:#5f6368">Outdoor activities · Dallas, Texas</p><div class="google-hours">Closed today · Hours may be inaccurate</div><div class="evidence-label" style="right:26px;bottom:26px"><strong>LOCAL VISIBILITY LEAK</strong>A customer searching right now may believe the business is unavailable.</div></div></div>`
    },
    {
      pillar: "Trust",
      shortTitle: "Review advantage",
      title: "Strong customer experiences are not being fully converted into proof.",
      summary: "The business may deliver a great experience, but competitors can still look safer when they have more visible and recent customer proof.",
      status: "Opportunity",
      priority: "Medium",
      found: "Review quality appears strong, but review volume, recency, and placement may not fully reflect the number of satisfied guests.",
      why: "Travelers compare proof quickly. More recent reviews reduce hesitation and strengthen both local ranking and booking confidence.",
      recommendation: "Automate review requests after every experience and place the strongest proof closer to the booking decision.",
      expected: "More trust, better local visibility, and a stronger conversion rate without increasing ad spend.",
      prescriptionTitle: "Turn happy guests into visible proof.",
      prescriptionCopy: "Create a repeatable review system instead of depending on staff to remember or guests to act on their own.",
      impact: "Medium", effort: "Easy", confidence: 88, revenueOpportunity: 9800,
      evidence: () => `<div class="compare-wrap"><div class="compare-heading"><small>MODELED LOCAL COMPARISON</small><h3>Customer proof at a glance</h3><p>What a traveler may see when comparing nearby options.</p></div><div class="compare-grid"><article class="compare-card featured"><small>YOUR BUSINESS</small><h4>${escapeHtml(shortBusinessName())}</h4><strong>286</strong><span>visible reviews</span><div class="compare-bar"><i style="width:42%"></i></div></article><article class="compare-card"><small>LOCAL LEADER</small><h4>Top competitor</h4><strong>682</strong><span>visible reviews</span><div class="compare-bar"><i style="width:100%"></i></div></article></div></div>`
    },
    {
      pillar: "Operations",
      shortTitle: "Guest follow-up",
      title: "Manual handoffs are creating avoidable work and customer uncertainty.",
      summary: "Confirmations, waivers, arrival instructions, scheduling, and follow-up should not depend on staff remembering every step.",
      status: "Opportunity",
      priority: "High",
      found: "Key customer communication and staff handoffs appear fragmented across calls, calendars, manual agreements, and individual follow-up.",
      why: "Manual steps create missed messages, more inbound questions, inconsistent guest experiences, and lost leads.",
      recommendation: "Centralize reservations and automate confirmations, reminders, waivers, arrival details, and staff scheduling.",
      expected: "Save staff time, improve the guest experience, and convert more inquiries into completed bookings.",
      prescriptionTitle: "Automate the guest journey after booking.",
      prescriptionCopy: "Build one reliable operating flow so every guest receives the same clear experience and every staff member sees the same schedule.",
      impact: "High", effort: "Medium", confidence: 96, revenueOpportunity: 18200,
      evidence: () => `<div class="journey-wrap"><div class="journey-heading"><p class="eyebrow">CURRENT CUSTOMER JOURNEY</p><h3>Too many manual handoffs</h3><p>Each break creates another chance for information or revenue to be lost.</p></div><div class="journey-flow"><div class="journey-step"><span>☎</span><strong>Inquiry</strong><small>Call, voicemail, or website request</small></div><b class="journey-arrow">→</b><div class="journey-step journey-break"><span>!</span><strong>Manual follow-up</strong><small>Staff must remember the next action</small></div><b class="journey-arrow">→</b><div class="journey-step journey-break"><span>!</span><strong>Separate calendar</strong><small>Availability and staffing are updated later</small></div><b class="journey-arrow">→</b><div class="journey-step"><span>✓</span><strong>Guest arrival</strong><small>Instructions and waivers may still be incomplete</small></div></div></div>`
    },
    {
      pillar: "Intelligence",
      shortTitle: "Account ownership",
      title: "The business needs control of the systems and audiences it is paying to build.",
      summary: "Marketing activity only compounds when the business owns the accounts, customer data, and measurement behind it.",
      status: "Needs attention",
      priority: "Medium",
      found: "Social accounts, customer information, and key systems may be controlled by individuals or disconnected vendors instead of the business.",
      why: "Without centralized ownership, the business can fund attention and content without retaining the audience, data, or long-term value.",
      recommendation: "Create a business-owned access map for every account, system, phone number, domain, social profile, and customer database.",
      expected: "Protect the company’s digital assets and make future marketing measurable, transferable, and easier to manage.",
      prescriptionTitle: "Put the business back in control of its digital assets.",
      prescriptionCopy: "Ownership is the foundation for reliable marketing, clean measurement, and a business that does not depend on one employee or vendor.",
      impact: "Medium", effort: "Medium", confidence: 90, revenueOpportunity: 7400,
      evidence: () => `<div class="ownership-wrap"><div class="ownership-heading"><p class="eyebrow">DIGITAL OWNERSHIP REVIEW</p><h3>Who owns the audience?</h3><p>The business should retain control even when staff or partners create the content.</p></div><div class="ownership-grid"><article class="ownership-card"><span>⌂</span><h4>Business website</h4><p>Domain, analytics, hosting, and forms should remain business-owned.</p></article><article class="ownership-card alert"><span>!</span><h4>Social audience</h4><p>Content posted to personal accounts builds someone else’s asset.</p></article><article class="ownership-card alert"><span>!</span><h4>Customer data</h4><p>Leads and guest history need one accessible, exportable source of truth.</p></article></div></div>`
    }
  ];
}

function buildGenericFindings(primary) {
  const base = [primary, ...(intelligence?.findings || []).filter(item => item.id !== primary.id)].slice(0, 5);
  while (base.length < 5) base.push({ pillar: "Growth", title: "Fix the highest-impact booking problem first", summary: "GO identifies the clearest booking opportunity, fixes it first, and measures the result.", found: "The business has multiple opportunities, but not all of them matter equally to bookings.", why: "Working on too many things at once makes it hard to know what actually increased bookings or revenue.", recommendation: "Start with the opportunity most likely to affect bookings, save the baseline, make the change, and measure the result before moving on.", expected: "More bookings from the work that proves it is actually moving the business.", status: "Opportunity", priorityScore: 70, confidence: 86 });
  return base.map((item, index) => ({
    pillar: item.pillar || "Growth", shortTitle: shortText(item.title, 24), title: item.title,
    summary: item.summary || item.found, status: item.status || "Opportunity", priority: index === 0 ? "High" : "Medium",
    found: item.found || item.summary, why: item.why || "This signal affects how easily customers can find, trust, and book the business.",
    recommendation: item.recommendation || "Fix this opportunity with one clear action tied to a measurable booking result.", expected: item.expected || "A clearer customer journey and stronger measurable results.",
    prescriptionTitle: item.recommendation || item.title, prescriptionCopy: item.expected || "Complete the improvement and measure the result before selecting the next mission.",
    impact: index === 0 ? "High" : "Medium", effort: index === 0 ? "Easy" : "Medium", confidence: item.confidence || 88, revenueOpportunity: 18400 - index * 2200,
    evidence: () => `<div class="compare-wrap"><div class="compare-heading"><small>GUIDED REVIEW PREVIEW</small><h3>${escapeHtml(item.title)}</h3><p>Live website, Google, review, and competitor evidence will populate this space.</p></div><div class="compare-grid"><article class="compare-card featured"><small>CURRENT SIGNAL</small><h4>${escapeHtml(item.pillar || "Growth")}</h4><strong>${item.score || 66}</strong><span>modeled score</span><div class="compare-bar"><i style="width:${item.score || 66}%"></i></div></article><article class="compare-card"><small>NEXT STEP</small><h4>Verify with live data</h4><strong>${index + 1}</strong><span>priority rank</span><div class="compare-bar"><i style="width:${100-index*12}%"></i></div></article></div></div>`
  }));
}

function shortBusinessName() { return businessName.replace(/Educational Charities|Tours|Adventures|LLC|Inc\.?/gi, "").trim() || businessName; }
function normalizeBusinessName(value) { return String(value || "Your business").replace(/\s+/g, " ").trim(); }
function normalizeWebsite(value) { const v=String(value||"").trim(); return /^https?:\/\//i.test(v)?v:`https://${v}`; }
function hostname(value) { try { return new URL(value).hostname.replace(/^www\./,""); } catch { return value; } }
function readStorage(key, fallback) { try { const value=localStorage.getItem(key); return value?JSON.parse(value):fallback; } catch { return fallback; } }
function setText(id, value) { const node=document.getElementById(id); if(node) node.textContent=value; }
function escapeHtml(value) { return String(value??"").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }
function shortText(value, max) { const text=String(value||""); return text.length>max?`${text.slice(0,max-1)}…`:text; }