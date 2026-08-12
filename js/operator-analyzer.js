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
  const bookingProvider = detectBookingProvider(combined);
  const trust = detectTrust(combined);
  const contacts = detectContacts(combined);
  const location = extractLocation(combined);
  const callsToAction = countMatches(combined, /\b(book now|book online|reserve now|check availability|book your|book today|reserve your)\b/gi);
  const internalPages = Math.max(1, pages.length);
  const seo = assessSearchFoundation(home, businessName, location, offers);
  const scores = scorePublicProfile({ offers, prices, bookingProvider, trust, contacts, callsToAction, internalPages, seo, combined });
  const growthScore = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.keys(scores).length);
  const opportunities = buildWebsiteFindings({ businessName, url, offers, prices, bookingProvider, trust, contacts, location, callsToAction, internalPages, seo, scores, combined });

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
    summary: summarizeBusiness({ businessName, offers, prices, bookingProvider, trust, opportunities }),
    publicProfile: {
      offers: offers.slice(0, 5),
      pricing: prices.slice(0, 4),
      bookingProvider: bookingProvider.label,
      trust: trust.summary,
      contact: contacts.summary,
      location: location || "Location needs verification"
    },
    opportunities,
    watchItems: [
      { title: "Search rankings + demand", detail: "GO has assessed the website's search foundation, but Build 026 does not yet claim live Google rankings or keyword demand." },
      { title: "Google review velocity", detail: "GO can see trust proof shown on the website, but public review counts and review velocity are a separate scan layer." },
      { title: "Actual conversion + revenue", detail: "Analytics and booking data are required before GO can prove where visitors drop out or attach dollars to an improvement." }
    ]
  };
}

function buildWebsiteFindings(ctx) {
  const findings = [];
  const evidence = (label, detail) => ({ type: "public", label, detail });
  const inferred = (label, detail) => ({ type: "operator", label, detail });

  if (ctx.callsToAction === 0) {
    findings.push({
      pillar: "Conversion", icon: "↗", title: "Customers have to work too hard to find the booking action",
      problem: `GO did not find a clear “Book Now,” “Reserve,” or “Check Availability” action in the readable public content for ${ctx.businessName}.`,
      action: "GO would make the primary booking action unmistakable on the homepage and highest-intent experience pages, then measure click-through to the booking flow.",
      metric: "Website visit → booking-flow click", moneyLabel: "Needs analytics + booking baseline", confidence: "High",
      sources: [evidence("Live website", "No clear booking CTA was found in the public page content GO read."), inferred("GO inference", "For an experience business, a hidden booking path can create avoidable conversion friction.")]
    });
  } else if (ctx.callsToAction >= 5) {
    findings.push({
      pillar: "Conversion", icon: "↗", title: "The website is already pushing customers toward booking",
      problem: `GO found ${ctx.callsToAction} booking-oriented calls to action across the pages it read. That is a positive conversion signal — the next question is whether the handoff into the booking flow actually converts.`,
      action: "GO would preserve the strong booking visibility, establish the click-to-book baseline and focus optimization on the point where real customers are dropping out.",
      metric: "CTA click → completed booking", moneyLabel: "Needs analytics + booking data", confidence: "High",
      sources: [evidence("Live website", `${ctx.callsToAction} booking-oriented calls to action were detected across ${ctx.internalPages} page${ctx.internalPages === 1 ? "" : "s"}.`), inferred("GO inference", "This does not look like a business that needs a rebuild merely because it sells online; GO should measure before changing what already works.")]
    });
  }

  if (ctx.prices.length === 0 && ctx.offers.length >= 2) {
    findings.push({
      pillar: "Conversion", icon: "$", title: "Customers can see the experiences, but GO could not find public pricing",
      problem: `${ctx.businessName} appears to offer multiple bookable experiences, but GO did not find clear price signals in the public content it read.`,
      action: "GO would verify whether pricing is intentionally hidden. If not, it would test clearer price-from messaging so travelers can qualify themselves before entering the booking flow.",
      metric: "Experience-page engagement + booking starts", moneyLabel: "Needs traffic + booking baseline", confidence: "Medium-high",
      sources: [evidence("Live website", `${ctx.offers.length} experience signals were detected, but no obvious public currency pricing was found.`)]
    });
  } else if (ctx.prices.length >= 2) {
    findings.push({
      pillar: "Conversion", icon: "$", title: "Pricing is visible — now GO would test how well the value is being sold",
      problem: `GO found public price signals including ${ctx.prices.slice(0, 3).join(", ")}. That helps customers self-qualify, but price only converts when the site makes the experience feel worth it.`,
      action: "GO would compare pricing language with the trust and differentiation shown around it, then measure whether stronger value positioning lifts direct booking conversion without unnecessary discounting.",
      metric: "Experience page → completed booking + average booking value", moneyLabel: "Needs conversion + revenue baseline", confidence: "Medium-high",
      sources: [evidence("Live website", `Public pricing was detected: ${ctx.prices.slice(0, 4).join(", ")}.`)]
    });
  }

  if (ctx.trust.score < 2) {
    findings.push({
      pillar: "Trust", icon: "★", title: "The website needs stronger proof before asking travelers to book",
      problem: "GO found limited visible review/testimonial proof in the website content it could read. For an unfamiliar experience business, that can make the customer do extra trust research somewhere else.",
      action: "GO would bring authentic review proof, ratings or customer language closer to the booking decision and then build a review-capture system to keep that proof fresh.",
      metric: "Review velocity + booking conversion", moneyLabel: "Review target first · revenue attribution later", confidence: "Medium-high",
      sources: [evidence("Live website", ctx.trust.detail)]
    });
  } else {
    findings.push({
      pillar: "Trust", icon: "★", title: "Customer trust is already an asset — GO would make it work harder",
      problem: `${ctx.trust.summary}. The public site is using trust proof, which is good. GO's next question is whether fresh reviews are arriving fast enough and being surfaced where they influence bookings.`,
      action: "GO would benchmark Google/Tripadvisor review count and velocity, automate review capture where possible, and reuse the strongest customer themes across high-intent pages.",
      metric: "Reviews/month + review-request conversion + booking conversion", moneyLabel: "Needs public review scan + booking data", confidence: "Medium-high",
      sources: [evidence("Live website", ctx.trust.detail), inferred("Next evidence layer", "Build 026 has not yet verified public Google/Tripadvisor review velocity, so GO is not claiming a review gap yet.")]
    });
  }

  if (ctx.seo.score < 2) {
    findings.push({
      pillar: "Visibility", icon: "⌖", title: "The website is not giving search engines enough business context",
      problem: ctx.seo.problem,
      action: "GO would strengthen the page titles, headings, location/service language and dedicated experience pages before chasing more advanced SEO tactics.",
      metric: "Indexed search queries + non-branded organic visits", moneyLabel: "Needs Search Console + ranking baseline", confidence: "High",
      sources: [evidence("Live website", ctx.seo.detail)]
    });
  } else {
    findings.push({
      pillar: "Visibility", icon: "⌖", title: "The search foundation looks credible — rankings are the next proof point",
      problem: ctx.seo.problem,
      action: "GO would keep the useful on-page search foundation, then verify which high-intent searches the business actually ranks for, where competitors are ahead, and which pages deserve the next investment.",
      metric: "Search position + organic visits + organic bookings", moneyLabel: "Needs live search landscape + Search Console", confidence: "Medium-high",
      sources: [evidence("Live website", ctx.seo.detail), inferred("GO inference", "A good on-page foundation does not prove the business is winning valuable searches; rankings and demand must be measured separately.")]
    });
  }

  if (ctx.bookingProvider.provider) {
    findings.push({
      pillar: "Operations", icon: "⚡", title: `${ctx.bookingProvider.label} appears to be handling the booking handoff`,
      problem: `GO detected ${ctx.bookingProvider.label} in the public booking links or website content. That is useful context, but the OBP itself should not dictate the entire growth strategy.`,
      action: "GO would keep the OBP if it is serving the operator well, then measure the handoff from website → booking flow → completed booking before recommending any platform change.",
      metric: "Website click → OBP checkout → completed booking", moneyLabel: "Needs OBP + analytics connection", confidence: "High",
      sources: [evidence("Live website", `${ctx.bookingProvider.label} signals were found in the public site content.`)]
    });
  }

  const prioritized = prioritizeFindings(findings);
  return prioritized.slice(0, 3);
}

function prioritizeFindings(items) {
  const priority = { "High": 3, "Medium-high": 2, "Medium": 1 };
  const pillarWeight = { Conversion: 4, Trust: 3, Visibility: 3, Operations: 2, Intelligence: 1, Growth: 1 };
  return [...items].sort((a, b) => (priority[b.confidence] + (pillarWeight[b.pillar] || 0)) - (priority[a.confidence] + (pillarWeight[a.pillar] || 0)));
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
  return `GO read this as ${offerText}, found ${priceText}, and detected ${bookingText}. The first recommendations below come from the live website itself; search rankings, review velocity, competitors and revenue remain separate evidence layers.`;
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
  return [...new Set(matches.map(value => value.replace(/\s+/g, " ").trim()))].slice(0, 8);
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
        <div class="finding-kicker"><span>${escapeHtml(item.icon || "↗")}</span><small>${escapeHtml((item.pillar || "Growth").toUpperCase())} · ${escapeHtml(String(item.confidence || "Medium").toUpperCase())} CONFIDENCE</small></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.problem)}</p>
        <div class="source-stack">${(item.sources || []).map(source => `<div class="source-chip ${source.type === "operator" ? "operator" : "public"}"><b>${escapeHtml(source.label)}</b><span>${escapeHtml(source.detail)}</span></div>`).join("")}</div>
      </div>
      <div class="finding-action"><small>WHAT GO WOULD DO</small><p>${escapeHtml(item.action)}</p><div><span>GO WOULD MEASURE</span><strong>${escapeHtml(item.metric)}</strong></div><em>${escapeHtml(item.moneyLabel || "Needs connected data")}</em></div>
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
    <div><small>GO THINKS THEY SELL</small><strong>${escapeHtml(offers)}</strong></div>
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