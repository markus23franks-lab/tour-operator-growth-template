"use strict";

const fallback = {
  businessName: "Blue River Rafting",
  growthScore: 76,
  scores: { Visibility: 82, Trust: 74, Conversion: 61, Operations: 74, Intelligence: 68, Growth: 76 },
  revenueOpportunity: 26480,
  website: "https://blueriverrafting.com"
};

const profile = read("growthOperatorBusinessReviewProfile", fallback);
const assessment = read("growthOperatorAssessment", {});
const businessName = profile.businessName || assessment.businessName || fallback.businessName;
const score = Number(profile.growthScore || fallback.growthScore);
const totalOpportunity = Number(profile.revenueOpportunity || fallback.revenueOpportunity);
const scores = profile.scores || fallback.scores;
const opportunities = buildOpportunities(scores, totalOpportunity);

document.addEventListener("DOMContentLoaded", () => {
  text("business-name", businessName);
  text("growth-score", score);
  text("modeled-total", money(totalOpportunity));
  text("pace-estimate", money(totalOpportunity));
  document.getElementById("score-ring").style.setProperty("--score", score);
  text("score-read", score >= 80 ? "Strong business. Smaller leaks." : score >= 65 ? "Strong foundation. Clear upside." : "Real upside. Start with the basics.");
  text("score-copy", score >= 80 ? "GO sees a healthy foundation with a few focused opportunities worth testing." : "You do not need to fix everything. GO found a few moves that deserve attention first.");
  renderOpportunities();
  wire();
});

function buildOpportunities(currentScores, total) {
  const templates = {
    Conversion: {
      icon: "↗",
      title: "Turn more website visitors into bookings",
      problem: "People are showing interest, but the booking path is asking them to work too hard before they can reserve.",
      action: "GO would simplify the mobile booking path, strengthen the main booking action, save the baseline and measure conversion after the change.",
      metric: "Website visits → completed bookings",
      evidence: "Booking conversion",
      evidenceValue: `${currentScores.Conversion || 61}/100`,
      evidenceType: "conversion"
    },
    Intelligence: {
      icon: "◎",
      title: "See exactly where competitors are winning customers",
      problem: "Competitors can quietly pull ahead on reviews, pricing, visibility and positioning while the owner is busy running the business.",
      action: "GO would benchmark the competitors that matter, watch what changes and surface only the moves worth responding to.",
      metric: "Competitive position",
      evidence: "Competitive awareness",
      evidenceValue: `${currentScores.Intelligence || 68}/100`,
      evidenceType: "competitor"
    },
    Trust: {
      icon: "★",
      title: "Turn happy customers into more 5-star reviews",
      problem: "A great experience creates more bookings when fresh reviews keep showing future customers that people trust the business.",
      action: "GO would improve review generation, monitor review velocity and place stronger trust proof where travelers make booking decisions.",
      metric: "Review velocity + booking conversion",
      evidence: "Customer trust",
      evidenceValue: `${currentScores.Trust || 74}/100`,
      evidenceType: "reviews"
    },
    Visibility: {
      icon: "⌖",
      title: "Show up more often when customers are ready to book",
      problem: "Customers cannot book a business they do not find when they search for experiences nearby.",
      action: "GO would improve local visibility signals, track search movement and focus on the searches most likely to produce qualified traffic.",
      metric: "Search visibility + organic visits",
      evidence: "Local visibility",
      evidenceValue: `${currentScores.Visibility || 70}/100`,
      evidenceType: "visibility"
    },
    Operations: {
      icon: "⚡",
      title: "Stop interested customers from falling through the cracks",
      problem: "Calls, inquiries and unfinished bookings lose value when follow-up is slow or inconsistent.",
      action: "GO would tighten response and follow-up workflows, track what happens to each inquiry and protect more of the demand already coming in.",
      metric: "Inquiry → booking rate",
      evidence: "Lead follow-up",
      evidenceValue: `${currentScores.Operations || 70}/100`,
      evidenceType: "followup"
    },
    Growth: {
      icon: "✦",
      title: "Know what to fix first to get more bookings",
      problem: "Most owners have plenty of ideas. The hard part is knowing which improvement deserves attention first and whether it actually worked.",
      action: "GO would rank the highest-value opportunities, tackle one measurable improvement first and use the result to choose the next move.",
      metric: "Priority → measured business result",
      evidence: "Growth focus",
      evidenceValue: `${currentScores.Growth || score}/100`,
      evidenceType: "priority"
    }
  };

  const ranked = Object.entries(currentScores).sort((a,b) => Number(a[1]) - Number(b[1])).slice(0,3);
  const weights = [.46,.32,.22];
  return ranked.map(([pillar, pillarScore], index) => ({
    pillar,
    pillarScore,
    amount: Math.round(total * weights[index]),
    ...templates[pillar]
  }));
}

function renderOpportunities() {
  const root = document.getElementById("opportunity-list");
  root.innerHTML = opportunities.map((item, index) => `
    <article class="opportunity-card ${index === 0 ? "priority" : ""}">
      <div class="op-number">0${index + 1}</div>
      <div class="op-main">
        <div class="op-kicker"><span>${item.icon}</span><small>${item.pillar.toUpperCase()} ${index === 0 ? "• HIGHEST PRIORITY" : ""}</small></div>
        <h3>${item.title}</h3>
        <p>${item.problem}</p>
        ${evidenceVisual(item)}
      </div>
      <div class="op-action"><small>WHAT GO WOULD DO</small><p>${item.action}</p><div class="metric"><span>GO WOULD MEASURE</span><strong>${item.metric}</strong></div></div>
      <div class="op-money"><small>MODELED ANNUAL OPPORTUNITY</small><strong>${money(item.amount)}</strong><span>Estimate until connected data replaces assumptions and proves impact.</span><button data-math="${index}">How GO calculated this →</button></div>
    </article>`).join("");
}

function evidenceVisual(item) {
  const label = `<div class="evidence-label"><span>WHAT GO SEES</span><small>VISUAL PREVIEW • LIVE DATA COMING NEXT</small></div>`;

  if (item.evidenceType === "competitor") {
    return `${label}<div class="proof-visual competitor-proof">
      <div class="proof-bar"><span>Your business</span><i><b style="width:${item.pillarScore}%"></b></i><strong>${item.pillarScore}</strong></div>
      <div class="proof-bar competitor"><span>Competitor avg.</span><i><b style="width:${Math.min(92,item.pillarScore+18)}%"></b></i><strong>${Math.min(92,item.pillarScore+18)}</strong></div>
      <div class="proof-callout">GO watches the gap across visibility, reviews, pricing and positioning.</div>
    </div>`;
  }

  if (item.evidenceType === "priority") {
    return `${label}<div class="proof-visual priority-proof">
      <div class="priority-row first"><b>1</b><span><strong>Fix first</strong><small>Highest expected booking impact</small></span><em>NOW</em></div>
      <div class="priority-row"><b>2</b><span><strong>Next</strong><small>Important, but not before #1</small></span><em>NEXT</em></div>
      <div class="priority-row"><b>3</b><span><strong>Later</strong><small>GO keeps watching it</small></span><em>WATCH</em></div>
    </div>`;
  }

  if (item.evidenceType === "conversion") {
    return `${label}<div class="proof-visual booking-proof">
      <div class="booking-step done"><span>1</span><strong>Website</strong></div><i>→</i>
      <div class="booking-step done"><span>2</span><strong>Tour</strong></div><i>→</i>
      <div class="booking-step friction"><span>3</span><strong>Availability</strong><small>FRICTION</small></div><i>→</i>
      <div class="booking-step"><span>4</span><strong>Book</strong></div>
    </div>`;
  }

  if (item.evidenceType === "reviews") {
    return `${label}<div class="proof-visual review-proof">
      <div><span>Your reviews</span><strong>184</strong><i><b style="width:43%"></b></i></div>
      <div><span>Competitor avg.</span><strong>427</strong><i><b style="width:100%"></b></i></div>
      <small>Example comparison until GO completes the live public review scan.</small>
    </div>`;
  }

  if (item.evidenceType === "visibility") {
    return `${label}<div class="proof-visual search-proof">
      <div><b>#1</b><span>Competitor</span></div><div><b>#2</b><span>Competitor</span></div><div class="your-rank"><b>#7</b><span>Your business</span><em>GO sees upside</em></div>
      <small>Example high-intent search position until the live local scan is connected.</small>
    </div>`;
  }

  return `${label}<div class="proof-visual followup-proof">
    <div><b>NEW LEAD</b><span>0 min</span></div><i>→</i><div class="warning"><b>FOLLOW-UP</b><span>Too slow</span></div><i>→</i><div><b>BOOKING</b><span>At risk</span></div>
  </div>`;
}

function wire() {
  document.querySelectorAll("[data-math]").forEach(button => button.addEventListener("click", () => openMath(Number(button.dataset.math))));
  document.getElementById("close-modal").addEventListener("click", closeMath);
  document.getElementById("math-modal").addEventListener("click", event => { if (event.target.id === "math-modal") closeMath(); });
  document.getElementById("book-review").addEventListener("click", () => {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  });
}

function openMath(index) {
  const item = opportunities[index];
  const visitors = 1800;
  const avgBooking = 165;
  const monthlyTarget = Math.max(1, Math.round(item.amount / 12 / avgBooking));
  const lift = ((monthlyTarget / visitors) * 100).toFixed(2);
  text("math-title", `${item.pillar}: ${money(item.amount)} modeled annual opportunity`);
  document.getElementById("math-content").innerHTML = `<div class="math-grid"><div><small>ASSUMED MONTHLY VISITORS</small><strong>${visitors.toLocaleString()}</strong></div><div><small>ASSUMED AVG. BOOKING</small><strong>${money(avgBooking)}</strong></div><div><small>MODELED MONTHLY GAIN</small><strong>+${monthlyTarget} bookings</strong></div><div><small>MODELED LIFT NEEDED</small><strong>~${lift}%</strong></div></div><p><strong>Why this matters:</strong> GO shows the assumptions instead of hiding them. Once analytics and booking data are connected, these assumptions are replaced with the operator's actual traffic, conversion, booking value and revenue.</p>`;
  document.getElementById("math-modal").hidden = false;
}

function closeMath(){ document.getElementById("math-modal").hidden = true; }
function money(value){ return `$${Math.round(Number(value)||0).toLocaleString("en-US")}`; }
function text(id,value){ const node=document.getElementById(id); if(node) node.textContent=value; }
function read(key,fallback){ try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }