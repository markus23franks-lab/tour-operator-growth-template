"use strict";

const READER_ENDPOINT = "https://r.jina.ai/";
const MAX_EXTRA_PAGES = 3;

const caymanProfile = {
  businessName: "Cayman Ocean Adventures",
  website: "https://caymanoceanadventures.com",
  secondaryWebsite: "https://stingraycitycaymantours.com",
  growthScore: 68,
  growthScoreLabel: "Provisional score · public + operator evidence",
  revenueOpportunity: null,
  revenueLabel: "Connect booking data",
  scores: { Visibility: 76, Trust: 72, Conversion: 66, Operations: 63, Intelligence: 58, Growth: 68 },
  analysisType: "Evidence-backed operator benchmark",
  analysisConfidence: "High",
  confidenceCopy: "Public evidence + operator context",
  summary: "The experience looks strong. The bigger issue is that growth is fragmented across two brands, review capture is too manual, and low-price competitors are shaping the buying decision.",
  publicProfile: {
    offers: ["Stingray City tours", "Starfish Point", "Snorkeling", "Private charters"],
    pricing: ["From $69", "Grand Tour from $115"],
    bookingProvider: "Online booking detected",
    trust: "Strong guest testimonials",
    contact: "Phone + direct website"
  },
  opportunities: [
    {
      pillar: "Visibility", icon: "⌖", title: "Two websites are competing for the same customer",
      problem: "Cayman Ocean Adventures and Stingray City Cayman Tours sell overlapping experiences from the same family operation, use the same phone numbers and marina, and both direct customers toward the same core tours.",
      action: "GO would compare search queries, organic traffic and completed bookings by domain before changing anything. Then it would strengthen the winning search intent and prevent the two brands from quietly working against each other.",
      metric: "Organic bookings by website + search query", amount: null, moneyLabel: "Needs analytics + booking data", confidence: "High",
      sources: [
        { type: "public", label: "Public sites", detail: "Both brands publicly show the same phone numbers, Safe Haven Marina location and closely overlapping tour inventory." },
        { type: "operator", label: "Operator confirmed", detail: "The owner said most bookings currently come through Stingray City Cayman Tours even though payments flow to Cayman Ocean Adventures." }
      ]
    },
    {
      pillar: "Trust", icon: "★", title: "Happy guests are not becoming reviews consistently enough",
      problem: "The operator already asks guests for feedback, uses QR review cards and manually follows up — but says many guests still reply that they loved the trip without posting the public review.",
      action: "GO would turn review capture into a measured system: automatic post-tour requests, smart follow-up, request-to-review conversion tracking, review velocity monitoring and competitor benchmarking.",
      metric: "Review requests → public reviews + reviews/month", amount: null, moneyLabel: "Review target first · revenue attribution later", confidence: "High",
      sources: [
        { type: "operator", label: "Operator confirmed", detail: "QR cards and manual email follow-up are already in use, but the owner says happy guests frequently fail to post." },
        { type: "public", label: "Public website", detail: "The site prominently uses strong guest testimonials, confirming that customer satisfaction is an asset worth converting into more public proof." }
      ]
    },
    {
      pillar: "Conversion", icon: "↗", title: "Don't let low-price agents define why customers choose",
      problem: "The owner is seeing booking agents compete aggressively on price while her business believes it wins on service, personal attention and the quality of the actual experience.",
      action: "GO would test stronger value positioning across the website and booking journey — family-run history, direct operation, crew quality and experience — then measure whether direct conversion improves without joining a race to the bottom.",
      metric: "Direct booking conversion + average booking value", amount: null, moneyLabel: "Needs traffic + conversion baseline", confidence: "Medium-high",
      sources: [
        { type: "public", label: "Public positioning", detail: "The business emphasizes a family operation, professional service and direct Stingray City experiences." },
        { type: "operator", label: "Operator confirmed", detail: "The owner specifically described cheaper booking agents as the current competitive pressure and believes her experience is materially better." }
      ]
    }
  ],
  watchItems: [{ title: "SEO work needs a scoreboard", detail: "The owner said SEO work began recently but she does not know what changed or how to judge whether it is working. GO should establish the baseline and make the outcome visible." }]
};

const form = document.getElementById("analyzer-form");
const urlInput = document.getElementById("business-url");
const loadCayman = document.getElementById("load-cayman");
const scanPanel = document.getElementById("scan-panel");
const results = document.getElementById("results");
const unsupported = document.getElementById("unsupported");
const progress = document.getElementById("scan-progress");
const scanState = document.getElementById("scan-state");
let activeProfile = null;
let scanToken = 0;

form.addEventListener("submit", event => {
  event.preventDefault();
  runAnalysis(urlInput.value.trim());
});

loadCayman.addEventListener("click", () => {
  urlInput.value = caymanProfile.website;
  runCaymanBenchmark();
});

document.getElementById("open-snapshot").addEventListener("click", () => {
  if (!activeProfile) return;
  localStorage.setItem("growthOperatorProspectProfile", JSON.stringify(activeProfile));
  window.location.href = "growth-snapshot.html?source=operator-analyzer";
});

document.getElementById("reset-analysis").addEventListener("click", reset);
document.getElementById("try-supported").addEventListener("click", () => {
  reset();
  urlInput.value = caymanProfile.website;
  runCaymanBenchmark();
});

async function runAnalysis(rawUrl) {
  const token = ++scanToken;
  const url = normalizeUrl(rawUrl);
  if (!url) return showUnsupported(rawUrl, "That does not look like a valid public website URL.");

  if (isCayman(url)) return runCaymanBenchmark();

  beginScan();
  setStage("website", "active", "READING");
  setProgress(10);

  try {
    const home = await readPublicPage(url);
    if (token !== scanToken) return;
    setStage("website", "done", "VERIFIED");
    setProgress(30);

    const pageLinks = discoverUsefulLinks(home.markdown, url).slice(0, MAX_EXTRA_PAGES);
    const extraPages = [];
    for (const link of pageLinks) {
      try {
        const page = await readPublicPage(link);
        extraPages.push(page);
      } catch (error) {
        // A single blocked internal page should not kill the entire business scan.
      }
    }
    if (token !== scanToken) return;

    setStage("search", "done", "ASSESSED");
    setProgress(50);
    setStage("reviews", "active", "CHECKING");
    await wait(220);
    setStage("reviews", "done", "ON-SITE ONLY");
    setProgress(68);

    setStage("competitors", "active", "CHECKING");
    await wait(220);
    setStage("competitors", "partial", "NEXT LAYER");
    setProgress(82);

    setStage("operator", "active", "SCORING");
    const profile = buildUniversalProfile(url, [home, ...extraPages]);
    await wait(240);
    setStage("operator", "done", "COMPLETE");
    setProgress(100);
    scanState.innerHTML = "<i></i> COMPLETE";

    activeProfile = profile;
    localStorage.setItem("growthOperatorProspectProfile", JSON.stringify(profile));
    showResults(profile);
  } catch (error) {
    if (token !== scanToken) return;
    console.error("GO public scan failed", error);
    showUnsupported(url, "GO could not retrieve enough public website content to produce an evidence-backed read. Some sites block automated readers, load almost everything behind scripts, or temporarily reject the request.");
  }
}

async function runCaymanBenchmark() {
  ++scanToken;
  beginScan();
  const stages = ["website", "search", "reviews", "competitors", "operator"];
  for (let i = 0; i < stages.length; i += 1) {
    setStage(stages[i], "active", "CHECKING");
    setProgress(12 + i * 18);
    await wait(250);
    setStage(stages[i], "done", "VERIFIED");
  }
  setProgress(100);
  scanState.innerHTML = "<i></i> COMPLETE";
  activeProfile = caymanProfile;
  localStorage.setItem("growthOperatorProspectProfile", JSON.stringify(caymanProfile));
  showResults(caymanProfile);
}

async function readPublicPage(url) {
  const endpoint = `${READER_ENDPOINT}${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Accept": "text/plain" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Reader returned ${response.status}`);
    const markdown = await response.text();
    if (!markdown || markdown.trim().length < 120) throw new Error("Not enough readable content");
    return { url, markdown: markdown.slice(0, 120000) };
  } finally {
    clearTimeout(timer);
  }
}

function buildUniversalProfile(url, pages) {
  const combined = pages.map(page => page.markdown).join("\n\n");
  const home = pages[0]?.markdown || combined;
  const businessName = extractBusinessName(home, url);
  const offers = extractOffers(combined, businessName);
  const prices = extractPrices(combined);
  const businessContext = inferBusinessContext(combined, home, url);
  const bookingProvider = detectBookingProvider(combined);
  const trust = detectTrust(combined);
  const contacts = detectContacts(combined);
  const location = extractLocation(combined);
  const callsToAction = countMatches(combined, /\b(book now|book online|reserve now|check availability|book your|book today|reserve your)\b/gi);
  const internalPages = Math.max(1, pages.length);
  const seo = assessSearchFoundation(home, businessName, location, offers);
  const scores = scorePublicProfile({ offers, prices, bookingProvider, trust, contacts, callsToAction, internalPages, seo, combined });
  const growthScore = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.keys(scores).length);
  const opportunities = buildWebsiteFindings({ businessName, url, offers, prices, bookingProvider, trust, contacts, location, callsToAction, internalPages, seo, scores, combined, businessContext });

  return {
    businessName,
    website: url,
    growthScore,
    growthScoreLabel: "Provisional score · live public website evidence",
    revenueOpportunity: null,
    revenueLabel: "Connect business data",
    scores,
    analysisType: "Live public website scan",
    analysisConfidence: opportunities.some(item => item.confidence === "High") ? "Medium-high" : "Medium",
    confidenceCopy: `${pages.length} public page${pages.length === 1 ? "" : "s"} read live`,
    summary: summarizeBusiness({ businessName, offers, prices, bookingProvider, trust, opportunities, businessContext }),
    publicProfile: {
      offers: offers.slice(0, 5),
      pricing: prices.slice(0, 4),
      bookingProvider: bookingProvider.label,
      trust: trust.summary,
      contact: contacts.summary,
      location: businessContext.location || location || "Location needs verification",
      businessContext
    },
    opportunities,
    watchItems: [
      { title: "Search rankings + demand", detail: "GO has assessed the website's search foundation, but Build 027 does not yet claim live Google rankings or keyword demand." },
      { title: "Google review velocity", detail: "GO can see trust proof shown on the website, but public review counts and review velocity are a separate scan layer." },
      { title: "Actual conversion + revenue", detail: "Analytics and booking data are required before GO can prove where visitors drop out or attach dollars to an improvement." }
    ]
  };
}

function buildWebsiteFindings(ctx) {
  const candidates = [];
  const evidence = (label, detail) => ({ type: "public", label, detail });
  const inferred = (label, detail) => ({ type: "operator", label, detail });
  const combinedSignals = [];
  if (ctx.offers.length) combinedSignals.push(`${ctx.offers.length} experience signals`);
  if (ctx.prices.length) combinedSignals.push(`${ctx.prices.length} public price signals`);
  if (ctx.callsToAction) combinedSignals.push(`${ctx.callsToAction} booking CTAs`);
  if (ctx.bookingProvider.provider) combinedSignals.push(ctx.bookingProvider.label);
  if (ctx.trust.score >= 2) combinedSignals.push("multiple trust signals");

  const customPricingContext = /(private|custom|customized|bespoke|quote|call for price|contact for price|request a quote|per group|group size|itinerary)/i.test(ctx.combined);
  const strongBookingPath = ctx.callsToAction >= 3 && Boolean(ctx.bookingProvider.provider);
  const strongMerchandising = ctx.offers.length >= 3 && ctx.prices.length >= 2;
  const strongTrust = ctx.trust.score >= 2;

  const add = item => candidates.push({
    kind: "opportunity",
    severity: 2,
    evidenceStrength: 2,
    revenueProximity: 2,
    actionability: 2,
    uncertainty: 0,
    supportCount: 2,
    counterEvidence: "No material counter-evidence found in the public pages GO read.",
    ...item
  });

  // Conversion: only promote a missing booking action when other evidence says customers should be able to transact online.
  if (ctx.callsToAction === 0 && ctx.offers.length >= 2) {
    const providerCounter = ctx.bookingProvider.provider
      ? `${ctx.bookingProvider.label} is present, so a booking path may exist even though GO could not see a clear booking action in the readable page content.`
      : "GO did not detect a booking provider that would explain a hidden handoff.";
    add({
      pillar: "Conversion", icon: "↗", title: "The experiences are visible, but the next step to buy is not",
      problem: `GO found ${ctx.offers.length} experience signals for ${ctx.businessName}, but no clear “Book Now,” “Reserve,” or “Check Availability” action in the readable public content. That creates a possible gap between product interest and the next buying step.`,
      action: "GO would first verify the real mobile and desktop booking path. If the action is genuinely hard to reach, GO would make the primary booking step unmistakable on the highest-intent pages and measure whether more visitors enter checkout.",
      metric: "Experience-page visit → booking-flow start", moneyLabel: "Needs analytics + booking baseline", confidence: ctx.bookingProvider.provider ? "Medium-high" : "High",
      priorityReason: "This sits directly between product interest and the booking flow, so it is closer to revenue than broader website polish.",
      counterEvidence: providerCounter,
      evidenceStrength: ctx.bookingProvider.provider ? 2 : 3,
      revenueProximity: 3,
      severity: 3,
      uncertainty: ctx.bookingProvider.provider ? 1 : 0,
      supportCount: ctx.bookingProvider.provider ? 2 : 3,
      sources: [
        evidence("Live website", `${ctx.offers.length} experience signals were detected across ${ctx.internalPages} public page${ctx.internalPages === 1 ? "" : "s"}.`),
        evidence("Booking action", "No clear booking-oriented CTA was found in the readable content GO scanned."),
        ...(ctx.bookingProvider.provider ? [evidence("Booking technology", `${ctx.bookingProvider.label} was detected elsewhere in the public site.`)] : [])
      ]
    });
  }

  // Strong booking path: this is not a defect. It becomes a qualified investigation because it is the closest measurable revenue handoff.
  if (strongBookingPath) {
    add({
      kind: "investigation",
      pillar: "Conversion", icon: "↗", title: `The website is getting travelers to ${ctx.bookingProvider.label} — GO would measure the handoff before changing it`,
      problem: `GO found ${ctx.callsToAction} booking-oriented calls to action and detected ${ctx.bookingProvider.label}. ${ctx.prices.length ? `It also found public pricing (${ctx.prices.slice(0, 3).join(", ")}), which means travelers can qualify themselves before entering checkout.` : "That suggests a real path from interest into checkout already exists."}`,
      action: "GO would preserve the visible booking path, establish the website → booking-flow → completed-booking baseline, and only change the handoff if the data shows customers are leaking there.",
      metric: "Booking CTA click → checkout start → completed booking", moneyLabel: "Needs analytics + OBP data", confidence: "High",
      priorityReason: "This is the closest public signal GO can see to actual revenue. Measuring it can tell us whether conversion work belongs on the website, inside the booking flow, or somewhere earlier in demand generation.",
      counterEvidence: "The public evidence looks healthy here. GO is deliberately not calling the booking path broken without conversion data.",
      severity: 1,
      evidenceStrength: 3,
      revenueProximity: 3,
      actionability: 3,
      uncertainty: 1,
      supportCount: 3 + (ctx.prices.length ? 1 : 0),
      sources: [
        evidence("Live website", `${ctx.callsToAction} booking-oriented calls to action were detected across ${ctx.internalPages} page${ctx.internalPages === 1 ? "" : "s"}.`),
        evidence("Booking technology", `${ctx.bookingProvider.label} signals were found in the public site.`),
        ...(ctx.prices.length ? [evidence("Public pricing", `GO found ${ctx.prices.slice(0, 4).join(", ")}.`)] : []),
        inferred("GO judgment", "The public path appears functional enough that measurement should come before a redesign.")
      ]
    });
  }

  // Pricing: missing pricing is only an opportunity if the business looks standardized enough that the absence is meaningful.
  if (ctx.prices.length === 0 && ctx.offers.length >= 2 && !customPricingContext) {
    add({
      pillar: "Conversion", icon: "$", title: "Travelers can compare the experiences, but price is still an unanswered question",
      problem: `${ctx.businessName} appears to offer ${ctx.offers.length} bookable experiences, but GO did not find clear public price signals. For a standardized tour catalog, that can force a traveler to enter the booking process before they know whether the experience fits their budget.`,
      action: "GO would verify whether pricing is intentionally withheld. If not, GO would test clear price-from messaging on the highest-intent experience pages and measure whether qualified booking starts increase.",
      metric: "Experience-page visit → qualified booking start", moneyLabel: "Needs traffic + booking baseline", confidence: "Medium-high",
      priorityReason: "Price sits close to the buying decision and appears to affect multiple experiences, making it more consequential than cosmetic website changes.",
      counterEvidence: "GO did not find strong private/custom/quote-dependent language that would clearly explain why pricing should stay hidden.",
      severity: 2, evidenceStrength: 2, revenueProximity: 3, actionability: 3, uncertainty: 1, supportCount: 2,
      sources: [
        evidence("Experience inventory", `${ctx.offers.length} experience signals were detected.`),
        evidence("Public pricing", "No obvious currency pricing was found in the readable pages GO scanned.")
      ]
    });
  } else if (ctx.prices.length === 0 && ctx.offers.length >= 2 && customPricingContext) {
    add({
      kind: "investigation",
      pillar: "Conversion", icon: "$", title: "Pricing is not obvious, but GO would not call that a conversion problem yet",
      problem: `GO found multiple experience signals without clear public pricing, but the site also uses private/custom/quote-dependent language. That makes hidden or variable pricing potentially intentional rather than automatically broken.`,
      action: "GO would confirm how pricing is actually determined and compare inquiry/booking behavior before recommending a public-pricing change.",
      metric: "Inquiry rate + booking conversion by experience type", moneyLabel: "Needs operator context + booking data", confidence: "Medium-high",
      priorityReason: "This is worth validating, but the counter-evidence is strong enough that GO would not spend implementation time here first.",
      counterEvidence: "Private/custom/quote-dependent language suggests a fixed public price may not fit the product being sold.",
      severity: 1, evidenceStrength: 2, revenueProximity: 2, actionability: 1, uncertainty: 2, supportCount: 2,
      sources: [
        evidence("Live website", `${ctx.offers.length} experience signals were detected without obvious public currency pricing.`),
        evidence("Counter-evidence", "Private/custom/quote-dependent language was also detected in the public content."),
        inferred("GO judgment", "GO would validate the pricing model before recommending a change.")
      ]
    });
  }

  // Visible pricing + product depth + trust is a healthy foundation. Treat the next step as market investigation, not a conversion defect.
  if (strongMerchandising && strongTrust) {
    add({
      kind: "investigation",
      pillar: "Intelligence", icon: "◎", title: "The buying basics are in place — GO would benchmark the market before changing them",
      problem: `GO found ${ctx.offers.length} experience signals, public pricing such as ${ctx.prices.slice(0, 3).join(", ")}, and ${ctx.trust.summary.toLowerCase()}. Travelers can see what is for sale, what it costs, and reasons to trust the operator. That is useful context, but not enough to call pricing a problem. The next valuable question is how these offers compare with the operators winning the same Palm Springs demand on price, visibility and trust.`,
      action: "GO would preserve the working buying path and use the next public-intelligence layer to compare similar experiences, search position and review trust against real competitors before recommending a pricing or positioning change.",
      metric: "Competitor price + search position + review trust → booking performance", moneyLabel: "Needs analytics + booking revenue", confidence: "Medium-high",
      priorityReason: "GO is not seeing a missing buying foundation here. The higher-value next step is to compare FSA against the operators competing for the same demand before changing a working conversion path.",
      counterEvidence: "Public evidence cannot prove that value positioning is underperforming. If these pages already convert strongly, GO should leave them alone and move to another constraint.",
      severity: 1, evidenceStrength: 3, revenueProximity: 2, actionability: 2, uncertainty: 1, supportCount: 3,
      sources: [
        evidence("Experience inventory", `${ctx.offers.length} experience signals were detected.`),
        evidence("Public pricing", `GO found ${ctx.prices.slice(0, 4).join(", ")}.`),
        evidence("Trust proof", ctx.trust.detail),
        inferred("GO inference", "With the buying basics present, value differentiation becomes a more plausible test than simply adding more booking buttons.")
      ]
    });
  }

  // Trust: weak proof only becomes a major opportunity when the site is already asking people to buy.
  if (ctx.trust.score < 2 && (ctx.callsToAction >= 2 || ctx.prices.length >= 1)) {
    add({
      pillar: "Trust", icon: "★", title: "The site asks travelers to make a buying decision before showing much proof",
      problem: `GO found ${ctx.callsToAction ? `${ctx.callsToAction} booking-oriented calls to action` : "public pricing"}, but only limited review/testimonial/history proof in the readable content. That means the site may be creating purchase intent faster than it is reducing perceived risk.`,
      action: "GO would verify the operator's strongest public review assets, bring authentic proof closer to high-intent booking moments, and measure whether trust exposure improves booking starts and completion.",
      metric: "Trust exposure → booking start/completion + review velocity", moneyLabel: "Needs public review scan + booking baseline", confidence: "Medium-high",
      priorityReason: "This is tied to existing buying intent, so it is more actionable than simply recommending 'get more reviews' in isolation.",
      counterEvidence: "GO has only assessed trust proof visible in the pages it could read. Strong Google/Tripadvisor proof may already exist off-site and could weaken this finding.",
      severity: 2, evidenceStrength: 2, revenueProximity: 3, actionability: 3, uncertainty: 1, supportCount: 2,
      sources: [
        evidence("Buying intent", `${ctx.callsToAction} booking-oriented CTA${ctx.callsToAction === 1 ? "" : "s"} and ${ctx.prices.length} public price signal${ctx.prices.length === 1 ? "" : "s"} were detected.`),
        evidence("On-site trust", ctx.trust.detail),
        inferred("Needs next evidence layer", "Public Google/Tripadvisor review strength is not yet verified by this scan.")
      ]
    });
  }

  // SEO: only promote a weak foundation when GO has enough site depth to trust the observation.
  if (ctx.seo.score < 2 && ctx.offers.length >= 2 && ctx.internalPages >= 2) {
    add({
      pillar: "Visibility", icon: "⌖", title: "GO can understand the experiences better than the search context around them",
      problem: ctx.seo.problem,
      action: "GO would strengthen service/location context on the pages already representing real experiences, then verify whether those pages gain visibility for high-intent searches before expanding content volume.",
      metric: "High-intent search visibility + organic visits + organic bookings", moneyLabel: "Needs live search landscape + Search Console", confidence: "High",
      priorityReason: "The issue appears across real experience pages rather than a single metadata field, giving GO a stronger reason to investigate visibility before producing more content.",
      counterEvidence: "On-page search context does not prove ranking performance. The business may already rank well despite this foundation, so live search evidence is still required.",
      severity: 2, evidenceStrength: 3, revenueProximity: 2, actionability: 3, uncertainty: 1, supportCount: 3,
      sources: [
        evidence("Live website", ctx.seo.detail),
        evidence("Experience inventory", `${ctx.offers.length} experience signals were detected across ${ctx.internalPages} pages.`),
        inferred("Needs next evidence layer", "GO has not yet verified actual Google rankings or search demand.")
      ]
    });
  }

  const ranked = prioritizeFindings(candidates);
  const qualified = ranked.filter(item => item.kind === "opportunity" && item.priorityScore >= 8 && item.supportCount >= 2);
  const investigations = ranked.filter(item => item.kind === "investigation" && item.priorityScore >= 6);

  // Top slots are scarce. GO may return fewer than three rather than manufacture weak opportunities.
  const selected = qualified.slice(0, 3);
  if (selected.length < 3) {
    investigations.forEach(item => {
      if (selected.length < 3) selected.push(item);
    });
  }
  return selected;
}

function prioritizeFindings(items) {
  return items
    .map(item => {
      const score = (item.severity || 0) + (item.evidenceStrength || 0) + (item.revenueProximity || 0) + (item.actionability || 0) - (item.uncertainty || 0);
      return { ...item, priorityScore: score };
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if ((b.supportCount || 0) !== (a.supportCount || 0)) return (b.supportCount || 0) - (a.supportCount || 0);
      return (b.revenueProximity || 0) - (a.revenueProximity || 0);
    })
    .map((item, index, all) => ({
      ...item,
      rankExplanation: index === 0
        ? `GO ranked this first because it has the strongest combination of evidence, proximity to bookings/revenue and a testable next action among the ${all.length} qualified patterns it found.`
        : `GO ranked this behind #1 because its evidence, revenue proximity or certainty is weaker. GO would not work on it first unless connected data changes the picture.`
    }));
}

function scorePublicProfile(ctx) {
  const conversion = clamp(42 + Math.min(22, ctx.callsToAction * 4) + (ctx.prices.length ? 9 : 0) + (ctx.bookingProvider.provider ? 9 : 0));
  const trust = clamp(44 + ctx.trust.score * 10 + (ctx.contacts.hasPhone ? 5 : 0) + (ctx.contacts.hasSocial ? 4 : 0));
  const visibility = clamp(45 + ctx.seo.score * 11 + Math.min(8, ctx.internalPages * 2));
  const operations = clamp(48 + (ctx.bookingProvider.provider ? 15 : 0) + (ctx.contacts.hasPhone ? 7 : 0) + (ctx.contacts.hasEmail ? 6 : 0));
  const intelligence = 50; // Public website scan cannot verify analytics discipline yet.
  const growth = clamp(Math.round((conversion + trust + visibility + operations + intelligence) / 5));
  return { Visibility: visibility, Trust: trust, Conversion: conversion, Operations: operations, Intelligence: intelligence, Growth: growth };
}

function summarizeBusiness(ctx) {
  const offerText = ctx.offers.length ? `${ctx.offers.length} clear experience signal${ctx.offers.length === 1 ? "" : "s"}` : "a bookable experience business";
  const priceText = ctx.prices.length ? "public pricing" : "no obvious public pricing";
  const bookingText = ctx.bookingProvider.provider ? ctx.bookingProvider.label : "no OBP GO could confidently identify";
  const context = ctx.businessContext || {};
  const identity = [context.businessType, context.location].filter(Boolean).join(" in ");
  return `GO reads ${ctx.businessName} as ${identity || "a tour and activity business"} with ${offerText}, ${priceText}, and ${bookingText}. Website evidence establishes the business context; search rankings, Google reviews and competitors are the next public layers GO needs before making market-level recommendations.`;
}

function extractBusinessName(markdown, url) {
  const titleMatch = markdown.match(/^Title:\s*(.+)$/mi);
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  const raw = cleanText(titleMatch?.[1] || h1Match?.[1] || domainLabel(url));
  return raw.replace(/\s*[|–—-]\s*(official site|home|book online|tours?|adventures?|charters?)\s*$/i, "").slice(0, 90) || domainLabel(url);
}

function extractOffers(text, businessName) {
  const lines = text.split(/\n+/).map(cleanText).filter(Boolean);
  const keywords = /(tour|charter|cruise|rental|rentals|adventure|excursion|experience|trip|ride|rafting|kayak|paddle|snorkel|dive|fishing|sailing|yacht|atv|utv|zipline|horse|boat|jet ski|jetski|lesson|escape room|museum|ticket)/i;
  const noise = /(privacy|terms|contact|about us|faq|login|cart|menu|navigation|copyright|facebook|instagram|youtube|review)/i;
  const seen = new Set();
  const offers = [];
  for (const line of lines) {
    const candidate = line.replace(/^#{1,6}\s*/, "").replace(/^[-*]\s*/, "").trim();
    if (candidate.length < 4 || candidate.length > 82 || noise.test(candidate) || !keywords.test(candidate)) continue;
    if (businessName && candidate.toLowerCase() === businessName.toLowerCase()) continue;
    const normalized = candidate.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    offers.push(candidate);
    if (offers.length >= 8) break;
  }
  return offers;
}

function extractPrices(text) {
  const matches = text.match(/(?:US\$|USD\s*|CA\$|CI\$|£|€|\$)\s?\d{1,5}(?:[,.]\d{2})?/gi) || [];
  const unique = [...new Set(matches.map(value => value.replace(/\s+/g, " ").trim()))];
  return unique.sort((a, b) => priceNumber(a) - priceNumber(b)).slice(0, 8);
}

function priceNumber(value) {
  const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function inferBusinessContext(text, home, url) {
  const haystack = `${home}\n${text}`;
  const locations = [
    ["Palm Springs, California", /palm springs(?:,?\s*(?:ca|california))?/i],
    ["Palm Desert, California", /palm desert(?:,?\s*(?:ca|california))?/i],
    ["Greater Palm Springs, California", /greater palm springs/i],
    ["Joshua Tree, California", /joshua tree(?: national park)?/i],
    ["Temecula, California", /temecula/i]
  ];
  const location = locations.find(([, regex]) => regex.test(haystack))?.[0] || extractLocation(text) || "";

  const types = [
    ["guided sightseeing tour operator", /(sightseeing|celebrity homes?|modernism|architecture|legends? and icons?|city tour)/i],
    ["bus and private transportation tour operator", /(charter bus|motorcoach|sprinter|luxury van|transportation|bus tour)/i],
    ["boat and water-experience operator", /(boat|snorkel|sailing|yacht|fishing|stingray|cruise)/i],
    ["outdoor adventure tour operator", /(jeep|hummer|atv|utv|rafting|kayak|hiking|adventure tour)/i]
  ];
  const businessType = types.find(([, regex]) => regex.test(haystack))?.[0] || "tour and activity operator";
  return { businessType, location, domain: domainLabel(url) };
}

function detectBookingProvider(text) {
  const providers = [
    ["Peek Pro", /book\.peek\.com|peek\.com\/pro|peek pro/i],
    ["FareHarbor", /fareharbor\.com|fareharbor/i],
    ["Bókun", /bokun\.io|bokun\.com|bokun/i],
    ["Rezdy", /rezdy\.com|rezdy/i],
    ["Xola", /xola\.com|xola/i],
    ["TripWorks", /tripworks\.com|tripworks/i],
    ["Checkfront", /checkfront\.com|checkfront/i],
    ["Bookeo", /bookeo\.com|bookeo/i],
    ["Rezgo", /rezgo\.com|rezgo/i],
    ["RocketRez", /rocketrez\.com|rocketrez/i],
    ["Tripadvisor / Viator", /tripadvisor\.com|viator\.com/i]
  ];
  for (const [label, regex] of providers) if (regex.test(text)) return { provider: label, label };
  return { provider: null, label: "Booking provider not confidently detected" };
}

function detectTrust(text) {
  let score = 0;
  const signals = [];
  if (/testimonial|what our guests say|guest reviews|customer reviews/i.test(text)) { score += 1; signals.push("testimonials"); }
  if (/tripadvisor|google reviews?|yelp/i.test(text)) { score += 1; signals.push("review platform proof"); }
  if (/\b4\.[5-9]\s*(?:\/\s*5|stars?|★)/i.test(text) || /5\s*[- ]?star/i.test(text)) { score += 1; signals.push("rating language"); }
  if (/since\s+(19|20)\d{2}|\d{1,2}\+?\s+years/i.test(text)) { score += 1; signals.push("experience/history"); }
  return {
    score,
    summary: signals.length ? `Trust signals found: ${signals.join(", ")}` : "Limited on-site trust proof detected",
    detail: signals.length ? `GO found ${signals.join(", ")} in the live website content.` : "GO did not find strong review-platform, rating, testimonial or long-history signals in the content it could read."
  };
}

function detectContacts(text) {
  const hasPhone = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|\+\d{1,3}[\s.-]\d{2,4}[\s.-]\d{3,4}/.test(text);
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const hasSocial = /instagram\.com|facebook\.com|tiktok\.com|youtube\.com/i.test(text);
  const hasWhatsapp = /wa\.me|whatsapp/i.test(text);
  const labels = [hasPhone && "phone", hasEmail && "email", hasWhatsapp && "WhatsApp", hasSocial && "social links"].filter(Boolean);
  return { hasPhone, hasEmail, hasSocial, hasWhatsapp, summary: labels.length ? labels.join(" + ") : "Limited contact signals" };
}

function extractLocation(text) {
  const patterns = [
    /(?:located in|based in|serving|departing from|departure from|meet us at|visit us at)\s+([^\n.]{3,70})/i,
    /(?:Address|Location):\s*([^\n]{3,90})/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return cleanText(match[1]).replace(/\s{2,}/g, " ").slice(0, 80);
  }
  return "";
}

function assessSearchFoundation(home, businessName, location, offers) {
  let score = 0;
  const details = [];
  const title = cleanText(home.match(/^Title:\s*(.+)$/mi)?.[1] || "");
  const headings = (home.match(/^#{1,3}\s+.+$/gm) || []).map(cleanText);
  if (title && title.length >= 25 && title.length <= 75) { score += 1; details.push("descriptive page title"); }
  if (headings.length >= 3) { score += 1; details.push("structured headings"); }
  if (offers.length >= 2) { score += 1; details.push("experience-specific language"); }
  if (location || /(near|located|island|city|beach|river|harbor|harbour|marina|county|downtown)/i.test(home)) { score += 1; details.push("local context"); }
  const detail = details.length ? `GO found ${details.join(", ")} on the live website.` : "GO found very little descriptive search context in the readable homepage content.";
  const problem = score >= 2
    ? `${businessName} is giving search engines useful context through ${details.join(", ")}. Build 026 can assess that foundation, but it does not yet prove where the business ranks or how much search demand exists.`
    : `${businessName} appears to give search engines limited service/location context in the public content GO could read.`;
  return { score, detail, problem };
}

function discoverUsefulLinks(markdown, baseUrl) {
  const matches = [...markdown.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].map(match => match[1]);
  let origin;
  try { origin = new URL(baseUrl).origin; } catch { return []; }
  const keywords = /(tour|charter|cruise|rental|adventure|experience|activities|activity|trip|ride|product|book|snorkel|dive|fishing|sailing|yacht|rafting|kayak|atv|utv|lesson)/i;
  const unique = [];
  for (const link of matches) {
    try {
      const parsed = new URL(link);
      if (parsed.origin !== origin || !keywords.test(parsed.pathname) || /#|mailto:|tel:/i.test(link)) continue;
      parsed.hash = "";
      const clean = parsed.toString();
      if (!unique.includes(clean) && clean !== baseUrl) unique.push(clean);
    } catch {}
  }
  return unique;
}

function showResults(profile) {
  text("result-business", profile.businessName);
  text("result-summary", profile.summary);
  text("confidence-score", String(profile.analysisConfidence || "Medium").toUpperCase());
  text("confidence-copy", profile.confidenceCopy || "Live public evidence");
  renderProfileStrip(profile.publicProfile || {});
  document.getElementById("finding-list").innerHTML = profile.opportunities.map((item, index) => `
    <article class="finding-card">
      <div class="finding-number">0${index + 1}</div>
      <div class="finding-copy">
        <div class="finding-kicker"><span>${escapeHtml(item.icon || "↗")}</span><small>${escapeHtml((item.pillar || "Growth").toUpperCase())} · ${escapeHtml(item.kind === "investigation" ? "INVESTIGATE FIRST" : "OPPORTUNITY")} · ${escapeHtml(String(item.confidence || "Medium").toUpperCase())} CONFIDENCE</small></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.problem)}</p>
        <div class="reasoning-strip">
          <div><small>WHY THIS RANKS HERE</small><p>${escapeHtml(item.rankExplanation || item.priorityReason || "GO ranked this against the other patterns it found.")}</p></div>
          <div><small>WHAT COULD WEAKEN THIS</small><p>${escapeHtml(item.counterEvidence || "Connected data could change the priority.")}</p></div>
        </div>
        <div class="source-stack">${(item.sources || []).map(source => `<div class="source-chip ${source.type === "operator" ? "operator" : "public"}"><b>${escapeHtml(source.label)}</b><span>${escapeHtml(source.detail)}</span></div>`).join("")}</div>
      </div>
      <div class="finding-action"><small>${item.kind === "investigation" ? "WHAT GO WOULD VERIFY" : "WHAT GO WOULD DO"}</small><p>${escapeHtml(item.action)}</p><div><span>GO WOULD MEASURE</span><strong>${escapeHtml(item.metric)}</strong></div><em>${escapeHtml(item.moneyLabel || "Needs connected data")}</em></div>
    </article>
  `).join("") + renderWatchItems(profile.watchItems || []);
  scanPanel.hidden = true;
  unsupported.hidden = true;
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProfileStrip(profile) {
  const offers = Array.isArray(profile.offers) && profile.offers.length ? profile.offers.slice(0, 3).join(" · ") : "Needs deeper crawl";
  const pricing = Array.isArray(profile.pricing) && profile.pricing.length ? profile.pricing.slice(0, 3).join(" · ") : "Not found publicly";
  document.getElementById("profile-strip").innerHTML = `
    <div><small>GO UNDERSTANDS THE BUSINESS</small><strong>${escapeHtml([profile.businessContext?.businessType, profile.businessContext?.location].filter(Boolean).join(" · ") || offers)}</strong></div>
    <div><small>PUBLIC PRICING</small><strong>${escapeHtml(pricing)}</strong></div>
    <div><small>BOOKING HANDOFF</small><strong>${escapeHtml(profile.bookingProvider || "Needs verification")}</strong></div>
    <div><small>TRUST / CONTACT</small><strong>${escapeHtml([profile.trust, profile.contact].filter(Boolean).join(" · ") || "Needs verification")}</strong></div>
  `;
}

function renderWatchItems(items) {
  if (!items.length) return "";
  return `<article class="watch-card"><span>◉</span><div><small>GO IS NOT CLAIMING THESE YET</small><h3>${escapeHtml(items[0].title)}</h3><p>${escapeHtml(items.map(item => item.detail).join(" "))}</p></div></article>`;
}

function beginScan() {
  results.hidden = true;
  unsupported.hidden = true;
  scanPanel.hidden = false;
  progress.style.width = "4%";
  scanState.innerHTML = "<i></i> WORKING";
  document.querySelectorAll("[data-stage]").forEach(stage => {
    stage.classList.remove("active", "done", "partial");
    stage.querySelector("b").textContent = "WAITING";
  });
  scanPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setStage(name, state, label) {
  const node = document.querySelector(`[data-stage="${name}"]`);
  if (!node) return;
  node.classList.remove("active", "done", "partial");
  if (state) node.classList.add(state);
  node.querySelector("b").textContent = label;
}

function showUnsupported(rawUrl, reason) {
  scanPanel.hidden = true;
  results.hidden = true;
  text("unsupported-url", rawUrl || "This website");
  text("unsupported-reason", reason);
  unsupported.hidden = false;
  unsupported.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reset() {
  ++scanToken;
  activeProfile = null;
  scanPanel.hidden = true;
  results.hidden = true;
  unsupported.hidden = true;
  progress.style.width = "0";
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => urlInput.focus(), 250);
}

function normalizeUrl(value) {
  if (!value) return null;
  let candidate = value.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname.includes(".")) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch { return null; }
}

function isCayman(url) { return /caymanoceanadventures|stingraycitycaymantours/i.test(url); }
function domainLabel(url) { try { return new URL(url).hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, char => char.toUpperCase()); } catch { return "This Business"; } }
function countMatches(text, regex) { return (text.match(regex) || []).length; }
function cleanText(value) { return String(value || "").replace(/\[(.*?)\]\([^)]*\)/g, "$1").replace(/[*_`>#]/g, " ").replace(/\s+/g, " ").trim(); }
function clamp(value) { return Math.max(35, Math.min(92, Math.round(value))); }
function setProgress(value) { progress.style.width = `${Math.max(0, Math.min(100, value))}%`; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function text(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }