"use strict";

const GO_FRONTEND_BUILD_ID = "B029-MARKET-HANDOFF-REPAIR-FE-20260831-2248";
let GO_MARKET_HANDOFF_STATUS = { ok: false, buildId: "UNVERIFIED", status: "not-checked", error: "" };
let GO_ACTIVE_RUN_ID = "";

const READER_ENDPOINT = "https://r.jina.ai/";
const MAX_EXTRA_PAGES = 6;
const MAX_MARKET_QUERIES = 8;
const REPRESENTATIVE_SEARCH_TARGET = 8;
const MIN_REPRESENTATIVE_SEARCHES = 5;
const MAX_DEMAND_CANDIDATES = 8;
const MAX_COMPETITORS_TO_READ = 5;
const MAX_PUBLIC_DISCOVERY_DOCS = 8;
const PUBLIC_SEARCH_ROUTES = [
  query => ({ source: "Jina · Google", url: `${READER_ENDPOINT}https://www.google.com/search?q=${encodeURIComponent(query)}`, mode: "text" }),
  query => ({ source: "Jina · Bing", url: `${READER_ENDPOINT}https://www.bing.com/search?q=${encodeURIComponent(query)}`, mode: "text" }),
  query => ({ source: "Public proxy · Bing", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.bing.com/search?q=${encodeURIComponent(query)}`)}`, mode: "html" }),
  query => ({ source: "Public proxy · DuckDuckGo", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)}`, mode: "html" })
];

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
  GO_ACTIVE_RUN_ID = `go-${Date.now()}-${token}`;
  const url = normalizeUrl(rawUrl);
  if (!url) return showUnsupported(rawUrl, "That does not look like a valid public website URL.");

  if (isCayman(url)) return runCaymanBenchmark();

  beginScan();
  setStage("website", "active", "READING");
  setProgress(10);

  try {
    const readerHome = await readPublicPage(url).catch(() => null);
    if (token !== scanToken) return;

    // Site acquisition is a distinct integrity layer. Do not let a challenge page or
    // thin reader response become GO's mental model of the operator. The server can
    // recover direct HTML and indexed first-party pages independently.
    const acquisition = await acquireFirstPartyEvidence(url).catch(() => null);
    const recoveredPages = normalizeAcquiredPages(acquisition, url);
    const readerUsable = readerHome && isMeaningfulBusinessContent(readerHome.markdown);
    const recoveredHome = recoveredPages.find(page => samePage(page.url, url)) || null;

    // IMPORTANT: direct/server recovery and the public reader are complementary evidence
    // sources. The previous implementation preferred the recovered homepage and then dropped
    // the reader copy when both represented the same URL. On JS-heavy sites that silently
    // discarded the richer rendered navigation, product headings and external booking links.
    // Merge same-page evidence before operator modeling instead of choosing one winner.
    const home = mergeFirstPartyPageEvidence(
      recoveredHome,
      readerUsable ? readerHome : null,
      url
    ) || recoveredPages[0];

    if (!home || !isMeaningfulBusinessContent(home.markdown)) {
      throw new Error("GO could not establish a sufficient first-party website foundation");
    }

    setStage("website", "done", acquisition?.sufficient ? "RECOVERED + VERIFIED" : "VERIFIED");
    setProgress(30);

    const extraPages = recoveredPages.filter(page => !samePage(page.url, home.url));
    if (readerUsable && !samePage(readerHome.url, home.url)) extraPages.unshift(readerHome);

    // Use reader-discovered links as a supplement, not the sole crawl plan.
    const pageLinks = discoverUsefulLinks(readerHome?.markdown || home.markdown, url).slice(0, MAX_EXTRA_PAGES);
    for (const link of pageLinks) {
      if (extraPages.length >= Math.max(MAX_EXTRA_PAGES, 6)) break;
      if ([home, ...extraPages].some(page => samePage(page.url, link))) continue;
      try {
        const page = await readPublicPage(link);
        if (isMeaningfulBusinessContent(page.markdown)) extraPages.push(page);
      } catch (error) {
        // One blocked internal page should not kill a business scan.
      }
    }
    if (token !== scanToken) return;

    setStage("search", "active", "DISCOVERING");
    setProgress(44);

    // Booking providers frequently live behind external checkout links rather than in the
    // readable body copy. Preserve those public link destinations as evidence before GO
    // decides that no OBP is present.
    const bookingLinkEvidence = [
      collectBookingLinkEvidence([home, ...extraPages]),
      String(acquisition?.bookingEvidence || "")
    ].filter(Boolean).join("\n");
    const websiteContext = buildWebsiteContext(url, [home, ...extraPages], bookingLinkEvidence);
    await verifyMarketFunctionRuntime();
    const market = await investigatePublicMarket(websiteContext);
    if (token !== scanToken) return;
    setStage("search", market.searchPages.length ? "done" : "partial", market.searchPages.length ? "PUBLIC WEB" : "LIMITED");
    setProgress(61);

    setStage("reviews", "active", "CHECKING");
    await wait(120);
    setStage("reviews", market.reviewSignals.length ? "done" : "partial", market.reviewSignals.length ? "PUBLIC SIGNALS" : "LIMITED");
    setProgress(72);

    setStage("competitors", "active", "COMPARING");
    await wait(120);
    setStage("competitors", market.competitors.length ? "done" : "partial", market.competitors.length ? "VERIFIED" : "LIMITED");
    setProgress(86);

    setStage("operator", "active", "SYNTHESIZING");
    const profile = buildUniversalProfile(url, [home, ...extraPages], market, bookingLinkEvidence);
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

async function verifyMarketFunctionRuntime() {
  try {
    const response = await fetch('/.netlify/functions/market-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'runtime', frontendBuildId: GO_FRONTEND_BUILD_ID, debugRunId: GO_ACTIVE_RUN_ID })
    });
    const payload = await response.json().catch(() => ({}));
    const buildId = payload.runtimeBuildId || payload.buildId || 'MISSING';
    GO_MARKET_HANDOFF_STATUS = { ok: Boolean(response.ok && payload.ok && buildId !== 'MISSING'), buildId, status: `${response.status}`, error: payload.error || '' };
    return GO_MARKET_HANDOFF_STATUS;
  } catch (error) {
    GO_MARKET_HANDOFF_STATUS = { ok: false, buildId: 'UNREACHABLE', status: 'fetch-error', error: error?.message || String(error) };
    return GO_MARKET_HANDOFF_STATUS;
  }
}

async function acquireFirstPartyEvidence(url) {
  const response = await fetch('/.netlify/functions/market-intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'acquire', website: url })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'First-party acquisition failed');
  return payload.acquisition || null;
}

function mergeFirstPartyPageEvidence(primary, secondary, fallbackUrl = "") {
  if (!primary && !secondary) return null;
  if (!primary) return secondary;
  if (!secondary) return primary;

  const chunks = [];
  const seen = new Set();
  for (const source of [primary.markdown, secondary.markdown]) {
    const value = String(source || "").trim();
    if (!value) continue;
    // Keep both representations, but avoid exact duplicate payloads.
    const key = value.replace(/\s+/g, " ").slice(0, 12000);
    if (seen.has(key)) continue;
    seen.add(key);
    chunks.push(value);
  }

  return {
    url: primary.url || secondary.url || fallbackUrl,
    markdown: chunks.join("\n\n--- GO FIRST-PARTY SOURCE MERGE ---\n\n").slice(0, 180000),
    acquisitionSource: `${primary.acquisitionSource || "recovered"}+${secondary.acquisitionSource || "reader"}`
  };
}

function normalizeAcquiredPages(acquisition, website) {
  const targetHost = safeHost(website);
  const pages = Array.isArray(acquisition?.pages) ? acquisition.pages : [];
  return pages
    .filter(page => page && page.url && page.markdown && safeHost(page.url) === targetHost)
    .filter(page => isMeaningfulBusinessContent(page.markdown))
    .map(page => ({ url: page.url, markdown: String(page.markdown).slice(0, 120000), acquisitionSource: page.source || 'recovered' }));
}

function isMeaningfulBusinessContent(text) {
  const value = String(text || '').trim();
  if (value.length < 180) return false;
  if (/robot challenge|captcha|verify you are human|access denied|checking your browser|enable javascript and cookies/i.test(value)) return false;
  const businessSignals = (value.match(/book|tour|charter|ride|rental|dive|cruise|experience|activity|trip|lesson|adventure|excursion|reserve|price|about|contact/gi) || []).length;
  return value.length >= 700 || businessSignals >= 3;
}

function samePage(a, b) {
  try {
    const left = new URL(a);
    const right = new URL(b);
    return left.host === right.host && left.pathname.replace(/\/$/, '') === right.pathname.replace(/\/$/, '');
  } catch { return a === b; }
}

function safeHost(value) {
  try { return new URL(value).hostname.replace(/^www\./i, '').toLowerCase(); } catch { return ''; }
}

async function readPublicPage(url) {
  const endpoint = `${READER_ENDPOINT}${url}`;
  let lastError = null;

  // Public readers occasionally fail transiently. One automatic retry is materially better
  // than asking the operator to click Analyze again, while still failing safely if evidence
  // genuinely cannot be retrieved.
  for (let attempt = 0; attempt < 2; attempt += 1) {
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
    } catch (error) {
      lastError = error;
      if (attempt === 0) await wait(350);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("Unable to read public page");
}


function buildWebsiteContext(url, pages, bookingLinkEvidence = "") {
  const combined = `${pages.map(page => page.markdown).join("\n\n")}\n\n${bookingLinkEvidence}`;
  const home = pages[0]?.markdown || combined;
  const businessName = extractBusinessName(home, url);
  const offers = extractOffers(combined, businessName);
  const businessContext = inferBusinessContext(combined, home, url);
  const siteArchitecture = buildSiteArchitectureModel(pages, url, businessName);
  const semanticModel = buildSemanticOperatorModel(combined, offers, businessContext, businessName, siteArchitecture);
  const commercialTruth = buildCommercialTruthModel({
    businessName,
    combined,
    offers,
    siteArchitecture,
    semanticModel,
    location: businessContext.location || ""
  });

  // Foundational facts must pass semantic-role validation before GO uses them downstream.
  // A product/service label must never silently become geography.
  if (semanticModel.geography?.value) {
    businessContext.location = semanticModel.geography.value;
    businessContext.locationConfidence = semanticModel.geography.confidence;
  } else if (semanticModel.geography?.rejectedCandidate) {
    businessContext.location = "";
    businessContext.locationConfidence = "Low";
  }

  const preflight = buildOperatorPreflight(combined, offers, businessContext, siteArchitecture);
  return { url, businessName, offers, businessContext, semanticModel, commercialTruth, preflight, siteArchitecture, combined };
}

function emptyMarket() {
  return {
    queries: [],
    demandPlan: [],
    demandFamilies: [],
    selectedDemand: null,
    searchPages: [],
    discoveryDocs: [],
    competitors: [],
    marketEntities: [],
    reviewSignals: [],
    evidence: [],
    retrievalNote: "No external market evidence was verified."
  };
}

async function investigatePublicMarket(ctx) {
  const professional = await readProfessionalMarket(ctx);
  if (professional) return professional;

  const market = emptyMarket();
  market.queries = buildMarketQueries(ctx).slice(0, MAX_MARKET_QUERIES);
  if (!market.queries.length) return market;

  for (const query of market.queries) {
    const result = await readPublicSearch(query);
    if (result && isUsefulDiscoveryDocument(result.markdown, ctx.url)) {
      market.searchPages.push({ query, markdown: result.markdown, source: result.source, url: result.url });
      continue;
    }

    const discovery = await readPublicDirectorySurfaces(query, ctx);
    discovery.forEach(item => {
      if (market.discoveryDocs.length < MAX_PUBLIC_DISCOVERY_DOCS) market.discoveryDocs.push(item);
    });
  }

  // Directory/marketplace surfaces are useful even when a general public SERP is blocked.
  if (market.discoveryDocs.length < 2) {
    for (const query of market.queries.slice(0, 2)) {
      const discovery = await readPublicDirectorySurfaces(query, ctx);
      discovery.forEach(item => {
        if (market.discoveryDocs.length < MAX_PUBLIC_DISCOVERY_DOCS && !market.discoveryDocs.some(existing => existing.url === item.url)) {
          market.discoveryDocs.push(item);
        }
      });
    }
  }

  const allDiscoveryDocs = [
    ...market.searchPages,
    ...market.discoveryDocs.map(item => ({ query: item.query, markdown: item.markdown, source: item.source, url: item.url }))
  ];

  market.marketEntities = discoverMarketEntities(allDiscoveryDocs, ctx);
  const candidates = discoverCompetitorCandidates(allDiscoveryDocs, ctx.url, ctx);

  for (const candidate of candidates.slice(0, MAX_COMPETITORS_TO_READ)) {
    try {
      const page = await readPublicPage(candidate.url);
      const name = extractBusinessName(page.markdown, candidate.url);
      const offers = extractOffers(page.markdown, name);
      const prices = extractPrices(page.markdown);
      const trust = detectTrust(page.markdown);
      const specialization = detectMarketSpecialization(page.markdown, market.queries);
      market.competitors.push({ ...candidate, name, offers: offers.slice(0, 4), prices: prices.slice(0, 4), trust, specialization });
    } catch (error) {
      market.competitors.push({
        ...candidate,
        name: candidate.label || domainLabel(candidate.url),
        offers: [],
        prices: [],
        trust: { score: 0, summary: "Trust not verified", detail: "GO could not read enough of this competitor site to verify trust signals." },
        specialization: []
      });
    }
  }

  // If discovery surfaces named relevant businesses but did not expose clean external websites,
  // retain them as market evidence instead of throwing the evidence away.
  market.marketEntities.forEach(entity => {
    if (market.competitors.some(item => namesLikelyMatch(item.name, entity.name))) return;
    market.competitors.push({
      url: entity.url || "",
      label: entity.name,
      name: entity.name,
      appearances: entity.appearances,
      queries: entity.queries,
      authority: entity.authority,
      evidenceOnly: true,
      source: entity.source,
      offers: [],
      prices: entity.prices || [],
      trust: entity.trust || { score: 0, summary: "Trust evidence limited", detail: "GO found the business on an external public market surface but did not verify full reputation data." },
      specialization: entity.specialization || []
    });
  });

  market.competitors = dedupeMarketCompetitors(market.competitors).slice(0, 8);
  market.reviewSignals = extractMarketReviewSignals(allDiscoveryDocs);
  market.evidence = buildMarketEvidenceSummary(market);

  const verifiedSurfaceCount = market.searchPages.length + market.discoveryDocs.length;
  market.retrievalNote = verifiedSurfaceCount
    ? `GO verified external market evidence across ${verifiedSurfaceCount} public discovery surface${verifiedSurfaceCount === 1 ? "" : "s"} and surfaced ${market.competitors.length} relevant market player${market.competitors.length === 1 ? "" : "s"}.`
    : "GO could not verify an external public discovery surface during this scan, so it withheld market conclusions.";
  market.handoffStatus = { ...GO_MARKET_HANDOFF_STATUS, fallbackUsed: true };
  market.pipelineDebug = { ...(market.pipelineDebug || {}), marketHandoff: { ...GO_MARKET_HANDOFF_STATUS, fallbackUsed: true } };
  return market;
}


async function readProfessionalMarket(ctx) {
  const demandPlan = buildDemandPlan(ctx);
  const queries = demandPlan.slice(0, MAX_MARKET_QUERIES).map(item => item.query);
  if (!queries.length || !ctx.businessContext?.location) return null;

  try {
    const response = await fetch('/.netlify/functions/market-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: ctx.businessName,
        website: ctx.url,
        location: ctx.businessContext.location,
        queries,
        debugRunId: GO_ACTIVE_RUN_ID,
        frontendBuildId: GO_FRONTEND_BUILD_ID
      })
    });

    const payload = await response.json().catch(() => ({}));
    const responseBuildId = payload.runtimeBuildId || payload.buildId || payload?.market?.runtimeBuildId || payload?.market?.buildId || 'MISSING';
    GO_MARKET_HANDOFF_STATUS = { ok: Boolean(response.ok && payload?.ok && payload?.market), buildId: responseBuildId, status: `${response.status}`, error: payload?.error || '' };
    if (!GO_MARKET_HANDOFF_STATUS.ok) {
      console.warn('GO professional market handoff failed', GO_MARKET_HANDOFF_STATUS);
      return null;
    }

    const discoveryMarket = normalizeProfessionalMarket(payload.market, demandPlan);
    discoveryMarket.handoffStatus = { ...GO_MARKET_HANDOFF_STATUS };
    const portfolio = buildRepresentativeSearchPortfolio(ctx, discoveryMarket.selectedDemand, demandPlan);

    // Analyzer V1 uses the first small discovery pass to choose the commercially relevant
    // demand family, then checks a representative portfolio around that demand. This keeps
    // the operator experience broad enough to be credible without becoming a keyword tracker.
    if (portfolio.length > marketQueriesFromRaw(payload.market).length) {
      const portfolioResponse = await fetch('/.netlify/functions/market-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: ctx.businessName,
          website: ctx.url,
          location: ctx.businessContext.location,
          queries: portfolio,
          debugRunId: GO_ACTIVE_RUN_ID,
          frontendBuildId: GO_FRONTEND_BUILD_ID
        })
      });
      const portfolioPayload = await portfolioResponse.json().catch(() => ({}));
      const portfolioBuildId = portfolioPayload.runtimeBuildId || portfolioPayload.buildId || portfolioPayload?.market?.runtimeBuildId || portfolioPayload?.market?.buildId || GO_MARKET_HANDOFF_STATUS.buildId || 'MISSING';
      GO_MARKET_HANDOFF_STATUS = { ok: Boolean(portfolioResponse.ok && portfolioPayload?.ok && portfolioPayload?.market), buildId: portfolioBuildId, status: `${portfolioResponse.status}`, error: portfolioPayload?.error || '' };
      if (GO_MARKET_HANDOFF_STATUS.ok) {
        const normalized = normalizeRepresentativeMarket(portfolioPayload.market, discoveryMarket, demandPlan);
        normalized.handoffStatus = { ...GO_MARKET_HANDOFF_STATUS };
        return normalized;
      }
      console.warn('GO representative market handoff failed', GO_MARKET_HANDOFF_STATUS);
    }

    return discoveryMarket;
  } catch (error) {
    console.warn('GO professional market layer unavailable; falling back to public discovery.', error);
    return null;
  }
}

function marketQueriesFromRaw(raw) {
  return Array.isArray(raw?.queries) ? raw.queries.map(row => row.query).filter(Boolean) : [];
}

function buildRepresentativeSearchPortfolio(ctx, selectedDemand, demandPlan) {
  const location = cleanMarketLocation(ctx.businessContext?.location || ctx.commercialTruth?.geography || '');
  const plan = Array.isArray(demandPlan) ? demandPlan : [];
  if (!location) return plan.slice(0, REPRESENTATIVE_SEARCH_TARGET).map(item => item.query).filter(Boolean);

  const variants = [];
  const seen = new Set();
  const add = query => {
    const clean = String(query || '').replace(/\s+/g, ' ').trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return;
    seen.add(key); variants.push(clean);
  };

  // Put the winning commercially validated product first, then preserve breadth across other
  // primary products. No generic destination query is added when real product truth exists.
  const ordered = [selectedDemand, ...plan].filter(Boolean);
  for (const item of ordered) {
    if (!item.intent || item.intent === 'tours' || item.verifiedProductFamily === false) continue;
    add(`${location} ${item.intent}`);
    if (variants.length >= REPRESENTATIVE_SEARCH_TARGET) break;
  }

  // If there is still room, add destination-last variants of the strongest products. These
  // remain the exact same first-party commercial intent, not invented keyword families.
  for (const item of ordered.slice(0, 4)) {
    if (!item?.intent || item.intent === 'tours') continue;
    add(`${item.intent} ${location}`);
    if (variants.length >= REPRESENTATIVE_SEARCH_TARGET) break;
  }

  return variants.slice(0, REPRESENTATIVE_SEARCH_TARGET);
}

function buildRecoveryIntents(ctx, selectedDemand) {
  const source = `${(ctx.offers || []).join(' ')} ${(ctx.preflight?.primarySignals || []).join(' ')} ${(ctx.preflight?.materialFamilies || []).flatMap(item => item.primaryEvidence || []).join(' ')}`.toLowerCase();
  const rules = [
    [/horseback|horse riding|trail ride|trail riding|equestrian/, ['horseback riding', 'trail rides']],
    [/catamaran/, ['catamaran tours']],
    [/private[^\n]{0,30}(boat|charter)|boat charter|private charter/, ['private boat charters']],
    [/boat|powerboat|cruise|sailing|yacht/, ['boat tours']],
    [/snorkel|reef|coral/, ['snorkeling tours']],
    [/fishing|sportfishing|deep sea/, ['fishing charters']],
    [/jeep|safari/, ['jeep tours', 'island safari tours']],
    [/atv|utv/, ['ATV tours']],
    [/sightseeing|city tour|guided tour/, ['sightseeing tours']],
    [/celebrity|movie star|famous homes/, ['celebrity homes tours']],
    [/architect|modernism|mid-century|midcentury/, ['architecture tours']]
  ];
  const out = [];
  rules.forEach(([pattern, intents]) => {
    if (!pattern.test(source)) return;
    intents.forEach(intent => {
      if (!out.some(existing => existing.toLowerCase() === intent.toLowerCase())) out.push(intent);
    });
  });
  return out.filter(intent => intent !== selectedDemand?.intent).slice(0, 6);
}

function normalizeRepresentativeMarket(raw, discoveryMarket, demandPlan) {
  const market = normalizeProfessionalMarket(raw, demandPlan);
  market.discoveryDemandFamilies = discoveryMarket.demandFamilies;
  market.demandFamilies = discoveryMarket.demandFamilies;
  market.selectedDemand = discoveryMarket.selectedDemand;
  market.queries = marketQueriesFromRaw(raw);
  market.retrievalNote = market.selectedDemand
    ? `GO prioritized ${market.selectedDemand.label}, then checked ${market.queryResults.length} representative commercial searches around the experiences this operator actually sells.`
    : market.retrievalNote;
  return market;
}

function normalizeProfessionalMarket(raw, demandPlan) {
  const market = emptyMarket();
  market.provider = raw.provider || 'SerpApi';
  market.professional = true;
  market.observedAt = raw.observedAt || '';
  market.runtimeBuildId = raw.runtimeBuildId || raw.buildId || '';
  market.runtimeDebug = raw.runtimeDebug || null;
  market.demandPlan = demandPlan;
  market.queries = demandPlan.slice(0, MAX_MARKET_QUERIES).map(item => item.query);
  market.target = raw.target || null;
  market.queryResults = Array.isArray(raw.queries) ? raw.queries : [];
  market.searchPages = market.queryResults.map(row => ({
    query: row.query,
    source: `${market.provider} · Google`,
    url: '',
    markdown: ''
  }));

  market.competitors = (Array.isArray(raw.players) ? raw.players : []).map(player => ({
    name: player.name || '',
    url: player.website || player.link || '',
    label: player.name || '',
    category: player.category || 'direct',
    authority: player.category === 'authority',
    marketplace: player.category === 'marketplace',
    appearances: player.appearances || 0,
    queries: Array.isArray(player.queries) ? player.queries : [],
    rating: player.rating ?? null,
    reviews: player.reviews ?? null,
    bestLocalPosition: player.bestLocalPosition ?? null,
    bestOrganicPosition: player.bestOrganicPosition ?? null,
    trust: {
      score: player.rating || 0,
      rating: player.rating ?? null,
      reviewCount: player.reviews ?? null,
      summary: [
        player.rating ? `${Number(player.rating).toFixed(1)} rating` : null,
        player.reviews ? `${Number(player.reviews).toLocaleString()} reviews` : null
      ].filter(Boolean).join(' · '),
      detail: [
        player.rating ? `${Number(player.rating).toFixed(1)} Google rating` : null,
        player.reviews ? `${Number(player.reviews).toLocaleString()} reviews` : null
      ].filter(Boolean).join(' · ') || 'No structured trust metrics returned.'
    },
    specialization: detectMarketSpecialization(`${player.name || ''} ${(player.queries || []).join(' ')}`, market.queries),
    sources: player.sources || [],
    qualificationReasons: Array.isArray(player.qualificationReasons) ? player.qualificationReasons : []
  }));

  market.demandFamilies = scoreDemandFamilies({
    demandPlan,
    queryResults: market.queryResults,
    competitors: market.competitors
  });
  market.selectedDemand = market.demandFamilies[0] || null;

  if (market.selectedDemand) {
    market.queries = [
      market.selectedDemand.query,
      ...market.demandFamilies
        .slice(1)
        .map(item => item.query)
        .filter(query => query !== market.selectedDemand.query)
    ];
  }

  market.marketEntities = market.competitors;
  market.reviewSignals = market.competitors
    .filter(item => item.rating || item.reviews)
    .map(item => ({
      query: item.queries?.[0] || '',
      source: market.provider,
      rating: item.rating,
      reviews: item.reviews,
      detail: `${item.name}: ${item.trust.summary}`
    }));
  market.evidence = buildMarketEvidenceSummary(market);
  market.retrievalNote = market.selectedDemand
    ? `GO compared ${market.demandFamilies.length} traveler-demand families through ${market.provider} and prioritized ${market.selectedDemand.label} based on operator relevance plus external market evidence.`
    : `GO verified ${market.queryResults.length} localized Google market searches through ${market.provider} and separated direct operators, marketplaces and destination authorities before reasoning.`;
  market.pipelineDebug = {
    frontendBuildId: GO_FRONTEND_BUILD_ID,
    marketFunctionBuildId: market.runtimeBuildId || GO_MARKET_HANDOFF_STATUS.buildId || "MISSING",
    marketHandoff: { ...GO_MARKET_HANDOFF_STATUS },
    runId: GO_ACTIVE_RUN_ID,
    runtimeDebug: market.runtimeDebug || null,
    demandPlan: demandPlan.map(item => ({ id: item.id, label: item.label, intent: item.intent, query: item.query, semanticProduct: !!item.semanticProduct, websiteEvidence: item.websiteEvidence })),
    selectedDemand: market.selectedDemand ? { label: market.selectedDemand.label, intent: market.selectedDemand.intent, query: market.selectedDemand.query, priorityScore: market.selectedDemand.priorityScore, reason: market.selectedDemand.reason } : null,
    selectedQueries: market.queries.slice(),
    rawQueryResults: market.queryResults.map(row => ({ query: row.query, targetLocalPosition: row.targetLocalPosition, targetOrganicPosition: row.targetOrganicPosition, localResultsChecked: row.localResultsChecked, organicResultsChecked: row.organicResultsChecked })),
    qualificationAudit: Array.isArray(raw.qualificationAudit) ? raw.qualificationAudit : [],
    qualifiedPlayers: market.competitors.slice(0, 12).map(item => ({ name: item.name, category: item.category, queries: item.queries, bestLocalPosition: item.bestLocalPosition, bestOrganicPosition: item.bestOrganicPosition, reasons: item.qualificationReasons || [] }))
  };
  return market;
}

function buildMarketQueries(ctx) {
  return buildDemandPlan(ctx)
    .slice(0, MAX_MARKET_QUERIES)
    .map(item => item.query);
}


function inferSpecificSearchLocation(ctx, truth) {
  const base = cleanMarketLocation(ctx.businessContext?.location || truth?.geography || '');
  const candidates = [];
  const push = value => {
    const v = cleanText(value || '').replace(/^[\s,\-]+|[\s,\-]+$/g, '');
    if (!v || v.length < 3 || v.length > 60) return;
    if (!candidates.some(x => x.toLowerCase() === v.toLowerCase())) candidates.push(v);
  };
  const sourceNames = [
    ...(truth?.primaryProducts || []).map(x => x.name),
    ...(truth?.segments || []).map(x => x.name),
    ...(ctx.offers || []).slice(0, 20)
  ];
  for (const raw of sourceNames) {
    const text = String(raw || '');
    const m = text.match(/\b(?:in|near|around)\s+([A-Z][A-Za-z.'’\-]+(?:\s+[A-Z][A-Za-z.'’\-]+){0,3})\b/);
    if (m) push(m[1]);
  }
  if (base) push(base);
  // Prefer a more specific place phrase that still overlaps the validated geography.
  const baseTokens = new Set(String(base || '').toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 3));
  const specific = candidates.find(c => {
    const tokens = c.toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 3);
    return tokens.some(t => baseTokens.has(t)) && c.toLowerCase() !== String(base || '').toLowerCase();
  });
  return specific || base;
}

function cleanCommercialSearchIntent(value, searchLocation, validatedLocation) {
  let text = canonicalCommercialIntent(value || '');
  if (!text) return '';
  const locationTokens = new Set(
    `${searchLocation || ''} ${validatedLocation || ''}`
      .toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3)
  );
  text = text.replace(/^(?:go|book|explore|discover|experience)\s+/i, ' ');
  text = text.replace(/\b(?:in|near|around|at)\s+([a-z][a-z.'’\-]+(?:\s+[a-z][a-z.'’\-]+){0,3})$/i, (full, place) => {
    const tokens = place.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3);
    return tokens.some(t => locationTokens.has(t)) ? ' ' : full;
  });
  for (const loc of [searchLocation, validatedLocation].filter(Boolean)) {
    for (const token of String(loc).toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3)) {
      text = text.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, 'ig'), ' ');
    }
  }
  text = text
    .replace(/\b(?:image|photo|gallery|package|packages)\s*\d*\b/gi, ' ')
    .replace(/\s+/g, ' ').trim();
  if (!text || isNonCommercialInventoryLabel(text)) return '';
  // Search demand should be a concise thing a traveler could plausibly type.
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 6) return '';
  return text;
}

function intentSpecificityScore(intent) {
  const words = String(intent || '').split(/\s+/).filter(Boolean);
  const generic = /^(?:tours?|activities|experiences|adventures|things to do|excursions?)$/i.test(intent || '');
  return (generic ? -20 : 0) + Math.min(words.length, 5) * 3 + (/\b(?:private|scuba|snorkel|charter|diving|dive|night|sunset|sailing|fishing|horseback|rafting|kayak|jeep|safari|food|wine|helicopter)\b/i.test(intent || '') ? 8 : 0);
}

function buildDemandPlan(ctx) {
  const location = cleanMarketLocation(ctx.businessContext?.location || ctx.commercialTruth?.geography || '');
  if (!location) return [];

  const truth = ctx.commercialTruth || buildCommercialTruthModel({
    businessName: ctx.businessName,
    combined: ctx.combined,
    offers: ctx.offers,
    siteArchitecture: ctx.siteArchitecture,
    semanticModel: ctx.semanticModel,
    location
  });
  const searchLocation = inferSpecificSearchLocation(ctx, truth) || location;
  const candidates = [];
  const seen = new Set();
  const add = (intent, source, score, evidence = [], role = 'primary') => {
    const cleanIntent = cleanCommercialSearchIntent(intent, searchLocation, location);
    if (!cleanIntent || /^(?:tours?|activities|experiences|adventures)$/i.test(cleanIntent)) return;
    const query = `${searchLocation} ${cleanIntent}`.replace(/\s+/g, ' ').trim();
    const key = query.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({
      id: `truth-${key.replace(/[^a-z0-9]+/g, '-')}`,
      coverageFamily: `truth-${canonicalDemandFamily(cleanIntent)}`,
      label: source || cleanIntent,
      intent: cleanIntent,
      query,
      aliases: [],
      verifiedProductFamily: true,
      semanticProduct: true,
      commercialRole: role,
      websiteScore: Math.max(18, Math.min(58, Number(score || 0))),
      productSignalCount: Math.max(1, Array.isArray(evidence) ? evidence.length : 1),
      websiteMentionCount: 0,
      websiteEvidence: `Commercial truth: ${(Array.isArray(evidence) ? evidence : [evidence]).filter(Boolean).join(' + ') || 'first-party product evidence'}`
    });
  };

  (truth.primaryProducts || []).forEach(product => add(product.intent || product.name, product.name, product.score, product.evidence, 'primary'));
  (truth.secondaryProducts || []).forEach(product => add(product.intent || product.name, product.name, Math.max(18, Number(product.score || 0) - 4), product.evidence, 'secondary'));

  // A major positioning phrase can represent a real commercial segment even when individual
  // detail pages are sparse. It is derived from first-party headings/title, not a tourism taxonomy.
  (truth.segments || []).forEach(segment => add(segment.intent || segment.name, segment.name, segment.score || 30, segment.evidence, 'segment'));

  if (!candidates.length) {
    // Safe fallback: only use concise first-party offers, never loose body-copy categories.
    (ctx.offers || []).slice(0, 5).forEach((offer, index) => add(offer, offer, 20 - index, ['offer inventory'], 'fallback'));
  }

  return candidates
    .sort((a, b) => {
      const roleWeight = { primary: 4, segment: 3, secondary: 2, fallback: 1 };
      const roleDiff = (roleWeight[b.commercialRole] || 0) - (roleWeight[a.commercialRole] || 0);
      if (roleDiff) return roleDiff;
      const specificityDiff = intentSpecificityScore(b.intent) - intentSpecificityScore(a.intent);
      if (specificityDiff) return specificityDiff;
      return (b.websiteScore || 0) - (a.websiteScore || 0);
    })
    .slice(0, MAX_DEMAND_CANDIDATES);
}

function buildCommercialTruthModel({ businessName, combined, offers, siteArchitecture, semanticModel, location }) {
  const products = [];
  const seen = new Map();
  const add = (name, score, evidence, urls = []) => {
    const clean = normalizePrimaryProductName(name, businessName);
    const intent = canonicalCommercialIntent(clean);
    if (!clean || !intent || !looksLikeBookableProductName(clean) || isNonCommercialInventoryLabel(clean)) return;
    const key = intent.toLowerCase();
    const current = seen.get(key) || { name: clean, intent, score: 0, evidence: [], urls: [] };
    current.score = Math.max(current.score, Number(score || 0));
    for (const item of (Array.isArray(evidence) ? evidence : [evidence])) if (item && !current.evidence.includes(item)) current.evidence.push(item);
    for (const url of (Array.isArray(urls) ? urls : [urls])) if (url && !current.urls.includes(url)) current.urls.push(url);
    seen.set(key, current);
  };

  (semanticModel?.primaryProducts || []).forEach(p => add(p.name, Math.max(30, Number(p.score || 0)), p.evidence || ['semantic primary product'], p.urls));
  (siteArchitecture?.commercialPages || []).forEach(p => add(p.name, Math.max(34, Number(p.score || 0)), p.evidence || 'commercial detail page', p.url));
  (siteArchitecture?.internalProducts || []).forEach(p => add(p.name, Math.max(28, Number(p.score || 0)), p.evidence || 'internal product link', p.url));
  extractStructuredProductPhrases(combined || '').forEach(p => add(p.name, Math.max(24, Number(p.score || 0)), p.evidence || 'structured commercial section'));
  (offers || []).forEach(p => add(p, 22, 'offer inventory'));

  // Explicit positioning headings often describe the two or three businesses the operator is
  // really in (e.g. "Private Boat Charters & Scuba Diving in Grand Cayman"). Split those
  // phrases into open-ended segments without requiring a predefined activity dictionary.
  extractPositioningSegments(combined || '', location, businessName).forEach(p => add(p.name, p.score, p.evidence));

  products.push(...seen.values());
  products.sort((a, b) => b.score - a.score);

  // Collapse near-duplicates so "Private Dive Charter" and "Private Dive Charters" do not
  // consume separate market slots, while genuinely different products remain represented.
  const deduped = [];
  for (const product of products) {
    const tokens = demandTokens(product.intent);
    const duplicate = deduped.find(existing => tokenSimilarity(tokens, demandTokens(existing.intent)) >= 0.82);
    if (!duplicate) deduped.push(product);
    else {
      duplicate.score = Math.max(duplicate.score, product.score);
      product.evidence.forEach(e => { if (!duplicate.evidence.includes(e)) duplicate.evidence.push(e); });
    }
  }

  const primaryProducts = deduped.slice(0, 8);
  const segments = extractPositioningSegments(combined || '', location, businessName).slice(0, 4);
  return {
    geography: cleanMarketLocation(location || semanticModel?.geography?.value || ''),
    primaryProducts,
    secondaryProducts: [],
    segments,
    marketReady: Boolean(cleanMarketLocation(location || semanticModel?.geography?.value || '') && primaryProducts.length),
    evidenceSummary: primaryProducts.map(p => `${p.name}: ${p.evidence.join(', ')}`).slice(0, 10)
  };
}

function extractPositioningSegments(text, location = '', businessName = '') {
  const lines = String(text || '').split(/\n+/).map(cleanText).filter(Boolean);
  const out = [];
  const seen = new Set();
  const locationParts = String(location || '').split(',').map(x => x.trim()).filter(Boolean);
  const add = raw => {
    let value = cleanText(raw || '')
      .replace(/^(?:top rated|best|premier|leading|#?1|number one)\s+/i, '')
      .replace(new RegExp(`\\b(?:in|near|around)\\s+(?:${locationParts.map(escapeRegExp).join('|') || 'a^'})\\b.*$`, 'i'), '')
      .replace(/\bwith\s+.+$/i, '')
      .trim();
    if (businessName) value = value.replace(new RegExp(escapeRegExp(businessName), 'ig'), ' ').replace(/\s+/g, ' ').trim();
    const pieces = value.split(/\s+(?:&|and|\+)\s+/i).map(v => normalizePrimaryProductName(v, businessName)).filter(Boolean);
    for (const piece of pieces) {
      const intent = canonicalCommercialIntent(piece);
      if (!intent || isNonCommercialInventoryLabel(piece) || seen.has(intent)) continue;
      const words = intent.split(/\s+/).filter(Boolean);
      if (words.length < 2 || words.length > 7) continue;
      seen.add(intent);
      out.push({ name: piece, intent, score: 36, evidence: ['primary positioning heading'] });
    }
  };
  for (const line of lines.slice(0, 120)) {
    if (line.length < 8 || line.length > 110) continue;
    if (/^(?:title:|#|##|###)/i.test(line)) {
      const candidate = line.replace(/^(?:title:\s*|#{1,4}\s*)/i, '');
      if (/\b(?:charter|diving|dive|tour|ride|rental|cruise|excursion|experience|lesson|class|safari|rafting|kayak|snorkel|fishing|sailing|adventure)\b/i.test(candidate)) add(candidate);
    }
  }
  return out;
}

function isNonCommercialInventoryLabel(value) {
  const text = String(value || '').trim();
  return /^(?:home|about|contact|gallery|reviews?|testimonials?|rates?|pricing|book now|learn more|services?|activities?|experiences?|adventures?|courses?|dive with us|stay with us)$/i.test(text)
    || /\b(?:why choose|what our guests say|your trip|your plan|your pace|discover the experience|safe with us|top rated|personalised|personalized|image\s*\d*|photo\s*\d*|gallery)\b/i.test(text);
}

function normalizeCommercialIntentForLocation(intent, location) {
  let text = String(intent || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const locationParts = String(location || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  text = text.replace(/^(?:go|book|explore|discover|experience)\s+/i, ' ');
  for (const part of locationParts) {
    if (!part) continue;
    const escaped = escapeRegExp(part);
    text = text.replace(new RegExp(`\\b(?:in|at|near|around)\\s+${escaped}\\b`, 'ig'), ' ').replace(new RegExp(`\\b${escaped}\\b`, 'ig'), ' ');
  }
  text = text.replace(/\b(?:image|photo|gallery)\s*\d*\b/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!text || /^(?:image|photo|gallery|home|about|contact|book now)$/i.test(text)) return '';
  return text;
}

function canonicalCommercialIntent(value) {
  let text = normalizePrimaryProductName(value || '')
    .replace(/\b(?:top rated|award winning|personalized|personalised|exclusive|amazing|ultimate|best)\b/gi, ' ')
    .replace(/\b(?:experience|experiences)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!text || isNonCommercialInventoryLabel(text)) return '';
  // Preserve product nouns; only remove phrases that rarely change commercial search intent.
  text = text.replace(/\b(?:guided|small group|all inclusive)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  if (text.split(/\s+/).length > 8) return '';
  return text;
}

function cleanMarketLocation(value) {
  const text = cleanText(String(value || '')).replace(/\s+/g, ' ').trim();
  if (!text || /\b(?:tour|ride|charter|diving|dive|rental|experience|activity)\b/i.test(text)) return '';
  return text.split(',').slice(0, 2).join(', ').trim();
}

function demandTokens(value) {
  const stop = new Set(['the','a','an','in','at','of','and','tour','tours','experience','experiences']);
  return String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !stop.has(t));
}

function tokenSimilarity(a, b) {
  if (!a.length || !b.length) return 0;
  const aa = new Set(a), bb = new Set(b);
  const intersection = [...aa].filter(x => bb.has(x)).length;
  return intersection / Math.max(aa.size, bb.size);
}

function canonicalDemandFamily(intent) {
  return demandTokens(intent).slice(0, 3).join('-') || 'product';
}

function collectValidatedCommercialProducts(ctx) {
  return (ctx.commercialTruth?.primaryProducts || buildCommercialTruthModel({
    businessName: ctx.businessName,
    combined: ctx.combined,
    offers: ctx.offers,
    siteArchitecture: ctx.siteArchitecture,
    semanticModel: ctx.semanticModel,
    location: ctx.businessContext?.location || ''
  }).primaryProducts || []).slice(0, 10);
}

function resolveDemandIntent(family, offerText, bodyText, preflightFamily = null) {
  // Specific search intent must come from primary product/category evidence, not incidental copy.
  const productText = `${offerText} ${(preflightFamily?.primaryEvidence || []).join(' ')}`.toLowerCase();
  if (family.id === 'water') {
    if (/catamaran/.test(productText)) return 'catamaran tours';
    if (/boat|powerboat|charter|cruise|sailing|yacht/.test(productText)) return 'boat tours';
    if (/snorkel|reef|coral/.test(productText)) return 'snorkeling tours';
    if (/stingray/.test(productText)) return 'stingray tours';
    if (/whale watching/.test(productText)) return 'whale watching tours';
    if (/dolphin/.test(productText)) return 'dolphin tours';
    if (/sunset cruise/.test(productText)) return 'sunset cruises';
  }
  if (family.id === 'adventure') {
    if (/jeep|hummer|off-road|safari|buggy/.test(productText)) return /jeep|safari/.test(productText) ? 'island safari tours' : 'off-road tours';
    if (/atv|utv/.test(productText)) return 'ATV tours';
    if (/horseback|horse riding|trail ride|trail riding|equestrian/.test(productText)) return 'horseback riding tours';
    if (/rafting/.test(productText)) return 'rafting tours';
    if (/kayak/.test(productText)) return 'kayak tours';
    if (/zipline/.test(productText)) return 'zipline tours';
  }
  return family.intent;
}

function countPatternMatches(text, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  return (String(text || '').match(regex) || []).length;
}

function scoreDemandFamilies({ demandPlan, queryResults, competitors }) {
  return demandPlan
    .slice(0, MAX_MARKET_QUERIES)
    .map(candidate => {
      const row = queryResults.find(item => item.query === candidate.query) || {};
      const players = competitors.filter(item => (item.queries || []).includes(candidate.query));
      const direct = players.filter(item => item.category === 'direct');
      const authorities = players.filter(item => item.category === 'authority');
      const marketplaces = players.filter(item => item.category === 'marketplace');

      const localChecked = row.localResultsChecked || row.localResults?.length || 0;
      const organicChecked = row.organicResultsChecked || row.organicResults?.length || 0;
      const targetLocal = row.targetLocalPosition ?? null;
      const targetOrganic = row.targetOrganicPosition ?? null;
      const targetObserved = targetLocal != null || targetOrganic != null;
      const visibilityGap = !targetObserved && (localChecked >= 3 || organicChecked >= 5);

      // Build 029 — Commercial Intent / Demand Prioritization.
      // Search-result abundance is evidence, not the objective. GO should prefer demand that
      // is tightly connected to a bookable product unless broader demand has materially
      // stronger evidence. This is generic logic: no operator names or destination exceptions.
      const broadDemand = candidate.id === 'general-tours' || candidate.intent === 'tours';
      const productSignals = Number(candidate.productSignalCount || 0);
      const websiteMentions = Number(candidate.websiteMentionCount || 0);
      const specificityScore = broadDemand ? 0 : 3;
      const inventoryFitScore = broadDemand
        ? 0
        : Math.min(5, (productSignals * 2) + (websiteMentions > 0 ? 1 : 0));
      const commercialIntentScore = specificityScore + inventoryFitScore;

      const marketValidationScore =
        Math.min(6, direct.length * 2) +
        Math.min(2, authorities.length) +
        Math.min(2, marketplaces.length) +
        (localChecked >= 3 ? 2 : 0) +
        (organicChecked >= 5 ? 1 : 0);
      const opportunityScore = visibilityGap ? 3 : (targetObserved ? 2 : 0);

      // Broad discovery remains useful context, but receives a small distance-to-booking
      // penalty so a generic SERP cannot win solely because it contains more businesses.
      const breadthPenalty = broadDemand ? 4 : 0;
      const priorityScore =
        candidate.websiteScore +
        marketValidationScore +
        opportunityScore +
        commercialIntentScore -
        breadthPenalty;

      return {
        ...candidate,
        directCompetitors: direct.length,
        authorityResults: authorities.length,
        marketplaceResults: marketplaces.length,
        targetLocalPosition: targetLocal,
        targetOrganicPosition: targetOrganic,
        localResultsChecked: localChecked,
        organicResultsChecked: organicChecked,
        targetObserved,
        visibilityGap,
        marketValidationScore,
        opportunityScore,
        commercialIntentScore,
        breadthPenalty,
        priorityScore,
        reason: buildDemandReason({
          candidate,
          directCount: direct.length,
          authorityCount: authorities.length,
          marketplaceCount: marketplaces.length,
          targetObserved,
          visibilityGap,
          commercialIntentScore,
          broadDemand
        })
      };
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if (b.commercialIntentScore !== a.commercialIntentScore) return b.commercialIntentScore - a.commercialIntentScore;
      if (b.websiteScore !== a.websiteScore) return b.websiteScore - a.websiteScore;
      return b.marketValidationScore - a.marketValidationScore;
    });
}

function buildDemandReason({
  candidate,
  directCount,
  authorityCount,
  marketplaceCount,
  targetObserved,
  visibilityGap,
  commercialIntentScore = 0,
  broadDemand = false
}) {
  const parts = [];
  if (candidate.websiteEvidence) parts.push(candidate.websiteEvidence);
  parts.push(broadDemand ? 'broad discovery demand' : 'specific bookable demand');
  if (commercialIntentScore > 0) parts.push('strong operator-to-demand fit');
  if (directCount) parts.push(`${directCount} direct operator${directCount === 1 ? '' : 's'} surfaced`);
  if (authorityCount) parts.push(`${authorityCount} destination/category authority result${authorityCount === 1 ? '' : 's'}`);
  if (marketplaceCount) parts.push(`${marketplaceCount} marketplace result${marketplaceCount === 1 ? '' : 's'}`);
  if (visibilityGap) parts.push('operator underrepresented in checked results');
  else if (targetObserved) parts.push('operator visibility verified');
  return parts.filter(Boolean).join(' · ');
}


function buildCheckedSearchRows(rows, demandFamilies, selectedDemand = null) {
  return (rows || []).map(row => {
    const family = (demandFamilies || []).find(item => item.query === row.query) || null;
    const localChecked = row.localResultsChecked || row.localResults?.length || 0;
    const organicChecked = row.organicResultsChecked || row.organicResults?.length || 0;
    const localPosition = row.targetLocalPosition ?? null;
    const organicPosition = row.targetOrganicPosition ?? null;

    return {
      query: row.query || '',
      demandLabel: family?.label || selectedDemand?.label || 'Relevant traveler demand',
      localPosition,
      organicPosition,
      localChecked,
      organicChecked,
      localStatus: localPosition != null
        ? `This business was #${localPosition} in the Google Maps results GO checked.`
        : localChecked
          ? `GO checked the first ${localChecked} business${localChecked === 1 ? '' : 'es'} Google showed in Maps. This business wasn't one of them.`
          : 'GO did not receive Google Maps results for this search.',
      organicStatus: organicPosition != null
        ? `This website was #${organicPosition} in the regular Google results GO checked.`
        : organicChecked
          ? `GO checked the first ${organicChecked} regular Google result${organicChecked === 1 ? '' : 's'}. This website wasn't one of them.`
          : 'GO did not receive regular Google results for this search.'
    };
  });
}

function explainCheckedSearches(rows, demandFamilies) {
  const count = (rows || []).length;
  return `GO selected these ${count} search${count === 1 ? '' : 'es'} from where the business operates and the experiences it actually sells. They represent realistic ways a traveler could search when looking to book a business like this one. GO favors specific, bookable demand and keeps broader destination searches as context. These are representative searches, not a claim about the market's highest-volume keywords; verified search-volume data is not part of Analyzer V1 yet.`;
}

async function readPublicSearch(query) {
  for (const buildRoute of PUBLIC_SEARCH_ROUTES) {
    const route = buildRoute(query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(route.url, {
        method: "GET",
        headers: { "Accept": route.mode === "html" ? "text/html,text/plain" : "text/plain" },
        signal: controller.signal
      });
      if (!response.ok) continue;
      const raw = await response.text();
      const markdown = route.mode === "html" ? normalizeSearchHtml(raw) : raw;
      if (markdown && markdown.length >= 300 && countExternalDiscoveryLinks(markdown) >= 2) {
        return { query, markdown: markdown.slice(0, 100000), source: route.source, url: route.url };
      }
    } catch (error) {
      // Try another zero-key public discovery route.
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function readPublicDirectorySurfaces(query, ctx) {
  const location = String(ctx.businessContext?.location || "").split(",")[0].trim();
  const intent = query.replace(new RegExp(`^${escapeRegExp(location)}\\s+`, "i"), "").trim();
  const surfaces = [
    {
      source: "Tripadvisor public search",
      url: `${READER_ENDPOINT}https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`
    },
    {
      source: "Yelp public search",
      url: `${READER_ENDPOINT}https://www.yelp.com/search?find_desc=${encodeURIComponent(intent)}&find_loc=${encodeURIComponent(location)}`
    },
    {
      source: "GetYourGuide public discovery",
      url: `${READER_ENDPOINT}https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`
    }
  ];

  const results = [];
  for (const surface of surfaces) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(surface.url, { headers: { "Accept": "text/plain" }, signal: controller.signal });
      if (!response.ok) continue;
      const markdown = await response.text();
      if (!isUsefulDiscoveryDocument(markdown, ctx.url)) continue;
      results.push({ query, source: surface.source, url: surface.url.replace(READER_ENDPOINT, ""), markdown: markdown.slice(0, 90000) });
      if (results.length >= 2) break;
    } catch (error) {
      // Public marketplace surfaces are opportunistic. One failure does not fail the scan.
    } finally {
      clearTimeout(timer);
    }
  }
  return results;
}

function isUsefulDiscoveryDocument(markdown, operatorUrl) {
  if (!markdown || markdown.length < 350) return false;
  const lower = markdown.toLowerCase();
  if (/captcha|unusual traffic|access denied|enable javascript to continue/.test(lower) && countExternalDiscoveryLinks(markdown) < 2) return false;
  const operatorHost = safeHost(operatorUrl);
  const links = extractMarkdownLinks(markdown).filter(link => {
    const host = safeHost(link.url);
    return host && host !== operatorHost;
  });
  return links.length >= 2 || /tripadvisor|yelp|getyourguide|viator|tour|architecture|sightseeing|reviews?/i.test(markdown);
}

function normalizeSearchHtml(html) {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const lines = [];
  doc.querySelectorAll("a[href]").forEach(anchor => {
    const label = cleanText(anchor.textContent || "");
    const url = decodeSearchRedirect(anchor.getAttribute("href") || "");
    if (!label || label.length < 2 || !/^https?:\/\//i.test(url)) return;
    lines.push(`[${label}](${url})`);
  });
  const bodyText = cleanText(doc.body?.innerText || "");
  return `${lines.join("\n")}\n\n${bodyText}`;
}

function decodeSearchRedirect(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.href);
    if (/bing\.com$/i.test(parsed.hostname) && parsed.pathname.startsWith("/ck/")) {
      const encoded = parsed.searchParams.get("u") || "";
      if (/^a1/i.test(encoded)) {
        const payload = encoded.slice(2).replace(/-/g, "+").replace(/_/g, "/");
        try { return atob(payload); } catch { return url; }
      }
    }
    if (/duckduckgo\.com$/i.test(parsed.hostname)) {
      const target = parsed.searchParams.get("uddg");
      if (target) return decodeURIComponent(target);
    }
    return parsed.href;
  } catch {
    return url;
  }
}

function countExternalDiscoveryLinks(markdown) {
  const ignored = /(google\.|bing\.|duckduckgo\.|microsoft\.|jina\.ai)/i;
  return extractMarkdownLinks(markdown).filter(link => {
    const host = safeHost(link.url);
    return host && !ignored.test(host);
  }).length;
}

function extractMarkdownLinks(markdown, baseUrl = "") {
  const rows = [];
  for (const match of String(markdown || "").matchAll(/\[([^\]]{1,200})\]\(([^)\s]+)\)/g)) {
    const label = cleanText(match[1]);
    let target = String(match[2] || "").replace(/[.,]+$/, "").trim();
    if (!target || /^(#|mailto:|tel:|javascript:)/i.test(target)) continue;
    try {
      const url = baseUrl ? new URL(target, baseUrl).href : (/^https?:\/\//i.test(target) ? target : "");
      if (!url || !/^https?:\/\//i.test(url)) continue;
      rows.push({ label, url });
    } catch {}
  }
  return rows;
}


function buildSiteArchitectureModel(pages, rootUrl, businessName = "") {
  const rootHost = safeHost(rootUrl);
  const linkMap = new Map();
  const commercialPages = [];
  const sectionHeadings = [];

  const utility = /^(home|about|contact|faq|faqs|blog|news|gallery|reviews?|privacy|terms|policy|login|sign in|cart|checkout|donate|shop|search|menu)$/i;
  const commercialAction = /\b(book|reserve|check availability|pricing|price|from \$|starting at|per person|per guest|buy tickets?|schedule)\b/i;

  for (const page of pages || []) {
    const markdown = String(page?.markdown || "");
    const pageUrl = page?.url || rootUrl;
    const headings = (markdown.match(/^#{1,4}\s+.+$/gm) || []).map(line => cleanText(line.replace(/^#{1,4}\s+/, ""))).filter(Boolean);
    headings.forEach(h => { if (!utility.test(h) && !sectionHeadings.includes(h)) sectionHeadings.push(h); });

    const links = extractMarkdownLinks(markdown, pageUrl);
    for (const link of links) {
      if (safeHost(link.url) !== rootHost) continue;
      let parsed;
      try { parsed = new URL(link.url); } catch { continue; }
      const path = parsed.pathname.replace(/\/$/, "") || "/";
      if (path === "/" || /\/(privacy|terms|policy|contact|about|faq|blog|news|gallery|login|account|cart|checkout|donate|shop)(?:\/|$)/i.test(path)) continue;
      const label = normalizePrimaryProductName(link.label, businessName);
      if (!label || utility.test(label) || !looksLikeBookableProductName(label)) continue;
      const key = `${path.toLowerCase()}|${label.toLowerCase()}`;
      const row = linkMap.get(key) || { label, url: parsed.href, path, occurrences: 0, sourcePages: new Set(), score: 0 };
      row.occurrences += 1;
      row.sourcePages.add(pageUrl);
      row.score += 2;
      if (samePage(pageUrl, rootUrl)) row.score += 3;
      if (label.split(/\s+/).length >= 2) row.score += 2;
      if (commercialAction.test(markdown)) row.score += 1;
      linkMap.set(key, row);
    }

    if (!samePage(pageUrl, rootUrl)) {
      const title = cleanText((markdown.match(/^Title:\s*(.+)$/mi) || [])[1] || "");
      const h1 = headings[0] || "";
      const candidate = normalizePrimaryProductName(h1 || title, businessName);
      const hasCommercialEvidence = commercialAction.test(markdown);
      if (candidate && looksLikeBookableProductName(candidate) && hasCommercialEvidence) {
        commercialPages.push({ name: candidate, url: pageUrl, score: 14, evidence: "commercial detail page" });
      }
    }
  }

  const internalProducts = [...linkMap.values()]
    .map(row => ({
      name: row.label,
      url: row.url,
      score: row.score + Math.min(6, row.occurrences * 2),
      evidence: row.occurrences > 1 ? `repeated internal product link (${row.occurrences})` : "internal product link"
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);

  return { internalProducts, commercialPages, sectionHeadings: sectionHeadings.slice(0, 40) };
}

function discoverCompetitorCandidates(discoveryDocs, operatorUrl, ctx) {
  const operatorHost = safeHost(operatorUrl);
  const blocked = /(google\.|bing\.|duckduckgo\.|youtube\.com|facebook\.com|instagram\.com|pinterest\.com|tiktok\.com|wikipedia\.|reddit\.)/i;
  const marketplace = /(tripadvisor\.|viator\.|getyourguide\.|yelp\.|expedia\.|airbnb\.)/i;
  const authority = /(visit|tourism|chamber|cityof|gov\.|modernismweek|historicalsociety|museum)/i;
  const map = new Map();

  discoveryDocs.forEach(page => {
    extractMarkdownLinks(page.markdown).forEach(link => {
      const url = link.url;
      const host = safeHost(url);
      if (!host || host === operatorHost || blocked.test(host)) return;
      if (marketplace.test(host)) return; // Marketplace pages feed named-entity evidence separately.
      if (!linkLooksMarketRelevant(link.label, url, page.query, ctx)) return;
      const key = host.replace(/^www\./, "");
      const current = map.get(key) || { url, label: link.label, appearances: 0, queries: [], authority: authority.test(host), sources: [] };
      current.appearances += 1;
      if (!current.queries.includes(page.query)) current.queries.push(page.query);
      if (page.source && !current.sources.includes(page.source)) current.sources.push(page.source);
      map.set(key, current);
    });
  });

  return [...map.values()].sort((a, b) => {
    const aScore = a.appearances + a.queries.length * 2 + (a.authority ? 1 : 0);
    const bScore = b.appearances + b.queries.length * 2 + (b.authority ? 1 : 0);
    return bScore - aScore;
  });
}

function discoverMarketEntities(discoveryDocs, ctx) {
  const operatorName = String(ctx.businessName || "").toLowerCase();
  const authorityPattern = /(visit palm|visit greater|tourism|historical society|modernism week|museum|visitor)/i;
  const marketplacePattern = /(tripadvisor|yelp|getyourguide|viator)/i;
  const map = new Map();

  discoveryDocs.forEach(page => {
    const lines = String(page.markdown || "").split(/\n+/).map(cleanText).filter(Boolean);
    const links = extractMarkdownLinks(page.markdown);

    links.forEach(link => {
      const label = normalizeEntityName(link.label);
      if (!isLikelyMarketBusinessName(label, page.query, ctx)) return;
      if (operatorName && label.toLowerCase().includes(operatorName)) return;
      addMarketEntity(map, {
        name: label,
        query: page.query,
        url: link.url,
        source: page.source || domainLabel(link.url),
        authority: authorityPattern.test(label) || authorityPattern.test(link.url),
        specialization: detectMarketSpecialization(`${label} ${page.markdown.slice(0, 6000)}`, [page.query])
      });
    });

    // Marketplace/search surfaces often render business names as headings without external links.
    lines.slice(0, 220).forEach((line, index) => {
      if (line.length < 4 || line.length > 90) return;
      if (!isLikelyMarketBusinessName(line, page.query, ctx)) return;
      if (operatorName && line.toLowerCase().includes(operatorName)) return;
      const nearby = lines.slice(Math.max(0, index - 2), index + 4).join(" ");
      const trust = extractInlineTrust(nearby);
      const prices = extractPrices(nearby);
      addMarketEntity(map, {
        name: normalizeEntityName(line),
        query: page.query,
        url: page.url,
        source: page.source || "Public market surface",
        authority: authorityPattern.test(line),
        specialization: detectMarketSpecialization(nearby, [page.query]),
        trust,
        prices
      });
    });
  });

  return [...map.values()]
    .filter(entity => !marketplacePattern.test(entity.name))
    .sort((a, b) => (b.appearances + b.queries.length * 2 + (b.trust?.score || 0)) - (a.appearances + a.queries.length * 2 + (a.trust?.score || 0)))
    .slice(0, 10);
}

function addMarketEntity(map, candidate) {
  if (!candidate?.name) return;
  const key = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!key || key.length < 4) return;
  const current = map.get(key) || {
    name: candidate.name,
    url: candidate.url || "",
    source: candidate.source || "Public market surface",
    appearances: 0,
    queries: [],
    authority: !!candidate.authority,
    specialization: [],
    trust: candidate.trust || null,
    prices: candidate.prices || []
  };
  current.appearances += 1;
  if (candidate.query && !current.queries.includes(candidate.query)) current.queries.push(candidate.query);
  current.authority = current.authority || !!candidate.authority;
  (candidate.specialization || []).forEach(item => { if (!current.specialization.includes(item)) current.specialization.push(item); });
  if ((!current.trust || !current.trust.score) && candidate.trust?.score) current.trust = candidate.trust;
  if (!current.prices.length && candidate.prices?.length) current.prices = candidate.prices;
  map.set(key, current);
}

function isLikelyMarketBusinessName(value, query, ctx) {
  const text = normalizeEntityName(value);
  if (!text || text.length < 4 || text.length > 90) return false;
  if (/^(home|search|reviews?|photos?|overview|things to do|learn more|book now|view all|see all|results?|sponsored|advertisement|sign in|log in|menu|map)$/i.test(text)) return false;
  if (/\b(tour|tours|adventure|adventures|excursion|excursions|experience|experiences|sightseeing|modern|mod squad|historical society|architecture|travel|charter|cruise|museum)\b/i.test(text)) return true;
  const queryTerms = String(query || "").toLowerCase().split(/\s+/).filter(term => term.length > 5);
  const lower = text.toLowerCase();
  return queryTerms.some(term => lower.includes(term)) && /[A-Z]/.test(text);
}

function linkLooksMarketRelevant(label, url, query, ctx) {
  const haystack = `${label} ${url}`.toLowerCase();
  if (/tour|adventure|sightseeing|architecture|modern|travel|excursion|experience|historical|museum|visit/.test(haystack)) return true;
  const terms = String(query || "").toLowerCase().split(/\s+/).filter(term => term.length > 5);
  return terms.some(term => haystack.includes(term));
}

function normalizeEntityName(value) {
  return cleanText(String(value || ""))
    .replace(/^#+\s*/, "")
    .replace(/\s*[-|–—]\s*(tripadvisor|yelp|getyourguide|viator).*$/i, "")
    .replace(/\s*\([^)]*reviews?[^)]*\)\s*$/i, "")
    .trim();
}

function extractInlineTrust(text) {
  const ratingMatch = String(text || "").match(/\b([1-5]\.\d)\s*(?:stars?|★|out of 5)?/i);
  const reviewMatch = String(text || "").match(/\b([\d,]{2,8})\s+(?:google\s+)?reviews?\b/i);
  if (!ratingMatch && !reviewMatch) return null;
  const rating = ratingMatch ? Number(ratingMatch[1]) : null;
  const reviewCount = reviewMatch ? Number(reviewMatch[1].replace(/,/g, "")) : null;
  return {
    score: rating ? Math.min(5, Math.max(1, rating)) : 1,
    summary: [rating ? `${rating.toFixed(1)} rating` : null, reviewCount ? `${reviewCount.toLocaleString()} reviews` : null].filter(Boolean).join(" · "),
    detail: cleanText(text).slice(0, 180),
    rating,
    reviewCount
  };
}

function extractMarketReviewSignals(discoveryDocs) {
  const signals = [];
  discoveryDocs.forEach(page => {
    const regexes = [
      /(?:rated\s*)?([1-5]\.\d)\s*(?:stars?|★|out of 5)?[^\n]{0,80}?([\d,]{2,8})\s+(?:google\s+)?reviews?/gi,
      /([\d,]{2,8})\s+reviews?[^\n]{0,50}?([1-5]\.\d)\s*(?:stars?|★|out of 5)?/gi
    ];
    regexes.forEach((regex, index) => {
      let match;
      while ((match = regex.exec(page.markdown)) && signals.length < 16) {
        const rating = index === 0 ? match[1] : match[2];
        const reviews = index === 0 ? match[2] : match[1];
        signals.push({ query: page.query, source: page.source, rating, reviews, detail: cleanText(match[0]).slice(0, 150) });
      }
    });
  });
  return signals;
}

function buildMarketEvidenceSummary(market) {
  const repeated = market.competitors.filter(item => item.queries?.length >= 2 || item.appearances >= 2);
  const surfaceCount = market.searchPages.length + market.discoveryDocs.length;
  return [
    market.queries.length ? `${market.queries.length} operator-specific market searches generated` : null,
    surfaceCount ? `${surfaceCount} external public discovery surfaces verified` : null,
    market.competitors.length ? `${market.competitors.length} relevant businesses/authorities surfaced` : null,
    repeated.length ? `${repeated.length} appeared repeatedly across the market evidence` : null,
    market.reviewSignals.length ? `${market.reviewSignals.length} public rating/review references detected` : null
  ].filter(Boolean);
}

function detectMarketSpecialization(text, queries) {
  const lower = String(text || "").toLowerCase();
  const terms = [];
  const add = value => { if (value && !terms.includes(value)) terms.push(value); };
  if (/architect|modernism|midcentury|mid-century/.test(lower)) add("architecture");
  if (/celebrity|stars? homes?/.test(lower)) add("celebrity");
  if (/history|historical/.test(lower)) add("history");
  if (/private tour|private experience/.test(lower)) add("private");
  if (/walking tour/.test(lower)) add("walking");
  if (/bike|bicycle/.test(lower)) add("bike");
  if (/mini[- ]?coach|bus tour|coach tour/.test(lower)) add("coach");
  return terms.slice(0, 5);
}

function dedupeMarketCompetitors(items) {
  const result = [];
  items.forEach(item => {
    const existing = result.find(candidate => namesLikelyMatch(candidate.name, item.name));
    if (!existing) {
      result.push(item);
      return;
    }
    existing.appearances = Math.max(existing.appearances || 0, item.appearances || 0);
    (item.queries || []).forEach(q => { if (!existing.queries.includes(q)) existing.queries.push(q); });
    (item.specialization || []).forEach(s => { if (!existing.specialization.includes(s)) existing.specialization.push(s); });
    if ((!existing.trust || !existing.trust.score) && item.trust?.score) existing.trust = item.trust;
    if ((!existing.prices || !existing.prices.length) && item.prices?.length) existing.prices = item.prices;
  });
  return result;
}

function namesLikelyMatch(a, b) {
  const clean = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(the|tours?|adventures?|palm|springs)\b/g, " ").replace(/\s+/g, " ").trim();
  const left = clean(a);
  const right = clean(b);
  return !!left && !!right && (left === right || left.includes(right) || right.includes(left));
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function buildProfessionalMarketFinding(ctx) {
  const market = ctx.market || emptyMarket();
  const rows = Array.isArray(market.queryResults) ? market.queryResults : [];
  const direct = (market.competitors || []).filter(item => item.category === 'direct');
  const authorities = (market.competitors || []).filter(item => item.category === 'authority');
  const demandFamilies = Array.isArray(market.demandFamilies) ? market.demandFamilies : [];
  const selected = market.selectedDemand || demandFamilies[0] || null;
  if (!rows.length || !selected) return null;

  const focusRow = rows.find(row => row.query === selected.query) || rows[0];
  if (!focusRow) return null;

  const focusQuery = focusRow.query || selected.query;
  const targetLocal = focusRow.targetLocalPosition ?? null;
  const targetOrganic = focusRow.targetOrganicPosition ?? null;
  const localChecked = focusRow.localResultsChecked || focusRow.localResults?.length || 0;
  const organicChecked = focusRow.organicResultsChecked || focusRow.organicResults?.length || 0;

  const focusDirect = direct
    .filter(item => (item.queries || []).includes(focusQuery))
    .sort((a, b) => {
      const ap = a.bestLocalPosition ?? a.bestOrganicPosition ?? 99;
      const bp = b.bestLocalPosition ?? b.bestOrganicPosition ?? 99;
      return ap - bp;
    });

  const leaders = focusDirect.slice(0, 3);
  const hasComparableLeaders = leaders.length > 0;

  const leaderSummary = leaders.map(item => {
    const position = item.bestLocalPosition
      ? `local #${item.bestLocalPosition}`
      : item.bestOrganicPosition
        ? `organic #${item.bestOrganicPosition}`
        : 'visible';
    const trust = [
      item.rating ? `${Number(item.rating).toFixed(1)}★` : null,
      item.reviews ? `${Number(item.reviews).toLocaleString()} reviews` : null
    ].filter(Boolean).join(' · ');
    return `${item.name} (${position}${trust ? ` · ${trust}` : ''})`;
  }).join('; ');

  const authorityNames = authorities
    .filter(item => (item.queries || []).includes(focusQuery))
    .slice(0, 3)
    .map(item => item.name)
    .filter(Boolean);

  const snippetText = (focusRow.organicResults || [])
    .map(item => `${item.title || ''} ${item.snippet || ''}`)
    .join('\n');
  const marketPrices = extractPrices(snippetText).slice(0, 6);
  const operatorPrices = (ctx.prices || []).slice(0, 4);
  const operatorNumbers = operatorPrices.map(priceNumber).filter(Number.isFinite);
  const marketNumbers = marketPrices.map(priceNumber).filter(Number.isFinite);
  const operatorHigh = operatorNumbers.length ? Math.max(...operatorNumbers) : null;
  const marketHigh = marketNumbers.length ? Math.max(...marketNumbers) : null;
  const priceEvidenceWeakensDiscountTheory = operatorHigh && marketHigh && marketHigh >= operatorHigh;

  const notObservedLocally = targetLocal == null && localChecked >= 3;
  const notObservedOrganically = targetOrganic == null && organicChecked >= 5;
  const visibilityGap = notObservedLocally || notObservedOrganically;

  const comparedFamilies = demandFamilies.slice(0, 3).map(item => item.label);
  const alternatives = demandFamilies.slice(1, 3);
  const demandLabel = selected.label;
  const demandShort = demandLabel.replace(/\s*&\s*/g, ' / ').toLowerCase();
  const checkedSearches = buildCheckedSearchRows(rows, demandFamilies, market.selectedDemand);
  const searchSelectionWhy = explainCheckedSearches(rows, demandFamilies);

  const portfolioGapRows = rows.filter(row => (row.targetLocalPosition == null && (row.localResultsChecked || 0) >= 3) || (row.targetOrganicPosition == null && (row.organicResultsChecked || 0) >= 5));
  const portfolioVisibleRows = rows.filter(row => row.targetLocalPosition != null || row.targetOrganicPosition != null);

  let title = visibilityGap
    ? `GO found a search visibility gap for ${demandShort}`
    : hasComparableLeaders
      ? `You are visible for ${demandShort} — competitors still stand out`
      : `You are visible for ${demandShort} — GO would keep this demand on the watchlist`;

  const searchProof = [];
  if (notObservedLocally) {
    searchProof.push(`${ctx.businessName} was not observed in the ${localChecked} local listings returned for “${focusQuery}”`);
  } else if (targetLocal) {
    searchProof.push(`${ctx.businessName} appeared at local position #${targetLocal} for “${focusQuery}”`);
  }
  if (notObservedOrganically) {
    searchProof.push(`it was also not observed in the ${organicChecked} organic listings returned for that search`);
  } else if (targetOrganic) {
    searchProof.push(`its website appeared at organic position #${targetOrganic}`);
  }

  const portfolioSummary = rows.length > 1
    ? `GO checked ${rows.length} representative searches tied to products this business sells. ${portfolioGapRows.length ? `${ctx.businessName} had a visibility gap in ${portfolioGapRows.length} of those search sets` : `${ctx.businessName} was visible in ${portfolioVisibleRows.length || rows.length} of those search sets`}. `
    : '';
  const operatorProblem = visibilityGap
    ? hasComparableLeaders
      ? `${portfolioSummary}For “${focusQuery},” ${searchProof.length ? searchProof.join('; ') + '. ' : ''}Comparable operators showing up around this same bookable demand include ${leaderSummary}.`
      : `${portfolioSummary}For “${focusQuery},” ${searchProof.length ? searchProof.join('; ') + '. ' : ''}GO did not verify enough comparable operators to claim who is winning, but the missing visibility itself is measurable and directly tied to something ${ctx.businessName} sells.`
    : hasComparableLeaders
      ? `${portfolioSummary}${ctx.businessName} is already showing up for “${focusQuery},” while comparable operators such as ${leaderSummary} are also defining this category. GO would now determine which visibility and trust signals are helping those competitors stand out.`
      : `${portfolioSummary}${ctx.businessName} is already visible around “${focusQuery}.” GO did not verify enough comparable operators to make a competitive-position claim, so it would preserve this demand and move to the next verified constraint.`;

  const whyItMatters = `${demandLabel} is closely tied to an experience ${ctx.businessName} actually sells, so this is not generic traffic. Better visibility here can put the business in front of more travelers already looking for something they can book.`;

  if (priceEvidenceWeakensDiscountTheory) {
    // Keep pricing as supporting evidence, but do not make the operator interpret it in the lead story.
  }

  const action = visibilityGap
    ? `GO would map “${focusQuery}” to the strongest matching ${ctx.businessName} product page, improve that page's experience + location relevance, strengthen internal/trust signals supporting the offer${hasComparableLeaders ? `, compare the page and public proof against ${leaders.slice(0,2).map(x => x.name).join(' and ')}` : ''}, then rerun the same search portfolio to measure whether visibility improves.`
    : hasComparableLeaders
      ? `GO would preserve the pages already earning visibility, compare their content and trust signals against ${leaders.slice(0,2).map(x => x.name).join(' and ')}, improve only the gaps that are actually material, then keep measuring this same search portfolio.`
      : `GO would preserve the pages already earning visibility here, keep monitoring this exact search portfolio, and move execution priority to a stronger verified constraint instead of inventing a competitive problem.`;

  const counter = `${market.target?.identityVerified
    ? "GO matched the operator to a Google local entity before comparing the market."
    : "GO did not fully verify a matching Google local entity, so stronger absence claims still need entity confirmation."} This demand prioritization is based on website relevance plus observed competitive search evidence — not search-volume data. ${alternatives.length ? `GO also evaluated ${alternatives.map(item => item.label).join(' and ')}, and those should remain in the watchlist.` : ''}`;

  const sources = [
    {
      type: 'public',
      label: 'Why GO chose this demand',
      detail: `${demandLabel}: ${selected.reason}`
    },
    {
      type: 'public',
      label: 'Demand families compared',
      detail: demandFamilies.slice(0, 3).map(item => `${item.label} (${item.priorityScore})`).join(' · ')
    },
    {
      type: 'public',
      label: 'Localized Google check',
      detail: [
        targetLocal ? `Local #${targetLocal}` : (notObservedLocally ? `Not observed in ${localChecked} local results checked` : null),
        targetOrganic ? `Organic #${targetOrganic}` : (notObservedOrganically ? `Not observed in ${organicChecked} organic results checked` : null)
      ].filter(Boolean).join(' · ')
    },
    ...(hasComparableLeaders ? [{
      type: 'public',
      label: 'Comparable operators verified',
      detail: leaderSummary
    }] : [{
      type: 'public',
      label: 'Competitor qualification',
      detail: 'GO did not verify enough comparable bookable-experience businesses in the prioritized search to make a direct competitor claim.'
    }]),
    ...(authorityNames.length ? [{
      type: 'public',
      label: 'Destination / category authority',
      detail: authorityNames.join(' · ')
    }] : []),
    ...(priceEvidenceWeakensDiscountTheory ? [{
      type: 'public',
      label: 'Price counter-evidence',
      detail: `Operator: ${formatPriceRange(operatorPrices)} · Market snippets: ${formatPriceRange(marketPrices)}`
    }] : []),
    {
      type: 'operator',
      label: 'GO judgment',
      detail: visibilityGap
        ? `GO would investigate ${demandLabel.toLowerCase()} visibility/relevance before changing the booking handoff or lowering price.`
        : `GO verified operator visibility in the prioritized demand family, so the next question is why competitors still define the category.`
    }
  ];

  return {
    kind: 'opportunity',
    pillar: 'Visibility',
    icon: '⌖',
    title,
    problem: operatorProblem,
    whyItMatters,
    checkedSearches,
    searchSelectionWhy,
    action,
    metric: 'Visibility for this experience → qualified visits → booking starts → completed bookings',
    moneyLabel: 'Demand opportunity found · revenue needs connected data',
    confidence: market.target?.identityVerified ? 'High' : 'Medium-high',
    priorityReason: `GO compared ${demandFamilies.length} demand families and chose ${demandLabel} because it is closer to a bookable product and has stronger commercial relevance to this operator than broader discovery demand.`,
    rankExplanation: hasComparableLeaders
      ? `GO chose this first because it matches something ${ctx.businessName} actually sells, travelers can book it, comparable operators are showing up around it, and GO found a visibility opportunity it can act on.`
      : `GO chose this first because it matches something ${ctx.businessName} actually sells and GO found a measurable visibility gap. It is explicitly withholding a competitor claim until comparable commercial operators are verified.`,
    counterEvidence: counter,
    severity: 3,
    evidenceStrength: market.target?.identityVerified ? 4 : 3,
    revenueProximity: 3,
    actionability: 4,
    uncertainty: market.target?.identityVerified ? 0 : 1,
    supportCount: sources.length,
    priorityScore: 14,
    sources
  };
}

function buildMarketFindings(ctx) {
  const market = ctx.market || emptyMarket();
  if (market.professional) {
    const professionalFinding = buildProfessionalMarketFinding(ctx);
    if (professionalFinding) return [professionalFinding];
  }

  const surfaceCount = market.searchPages.length + market.discoveryDocs.length;
  if (!surfaceCount || !market.competitors.length) return [];

  const evidence = (label, detail) => ({ type: "public", label, detail });
  const inferred = (label, detail) => ({ type: "operator", label, detail });
  const direct = market.competitors.filter(item => !item.authority);
  const authorities = market.competitors.filter(item => item.authority);
  const repeated = direct.filter(item => item.queries?.length >= 2 || item.appearances >= 2);
  const specialist = direct.filter(item => item.specialization?.length);
  const trustRich = direct.filter(item => item.trust?.rating || item.trust?.reviewCount || item.trust?.score >= 4);
  const priced = direct.filter(item => item.prices?.length);

  const primaryPool = repeated.length ? repeated : (specialist.length ? specialist : direct);
  const names = primaryPool.slice(0, 3).map(item => item.name).filter(Boolean);
  if (!names.length) return [];

  const queryText = market.queries.slice(0, 3).map(q => `“${q}”`).join(", ");
  const competitorText = names.join(", ");
  const authorityText = authorities.slice(0, 2).map(item => item.name).filter(Boolean).join(" and ");
  const specialistText = specialist.slice(0, 3).map(item => item.name).filter(Boolean).join(", ");
  const trustText = trustRich.slice(0, 2).map(item => {
    const trust = item.trust || {};
    const detail = [trust.rating ? `${trust.rating.toFixed(1)} rating` : null, trust.reviewCount ? `${trust.reviewCount.toLocaleString()} reviews` : null].filter(Boolean).join(" · ");
    return detail ? `${item.name} (${detail})` : item.name;
  }).join("; ");
  const priceText = priced.slice(0, 2).map(item => `${item.name}: ${formatPriceRange(item.prices)}`).filter(Boolean).join("; ");

  const marketAngle = specialistText
    ? `${specialistText} surfaced with specialist language around the same demand GO derived from ${ctx.businessName}'s own products.`
    : `${competitorText} surfaced around demand tied directly to ${ctx.businessName}'s products and location.`;

  const externalProof = [
    authorityText ? `Independent destination/market sources also surfaced ${authorityText}.` : null,
    trustText ? `GO also found public trust evidence for ${trustText}.` : null,
    priceText ? `Public competitor pricing evidence included ${priceText}.` : null
  ].filter(Boolean).join(" ");

  return [{
    kind: "opportunity",
    pillar: "Visibility",
    icon: "⌖",
    title: "Your product may be stronger than your current market position suggests",
    problem: `GO moved outside ${ctx.businessName}'s website and investigated ${queryText}. ${competitorText} surfaced as relevant external market players. ${marketAngle} ${externalProof} This does not prove ${ctx.businessName} is losing bookings, but it is evidence the operator is competing inside a more specialized discovery market than the website alone revealed.`,
    action: `GO would compare ${ctx.businessName}'s strongest matching experience against ${competitorText}, then strengthen the pages and trust signals tied to the market language where those specialists are already visible. GO would not lower price or rebuild the booking flow first unless the comparative evidence shows those are the real constraints.`,
    metric: "Market visibility → qualified organic visits → booking starts → completed bookings",
    moneyLabel: "Market gap found · revenue needs connected data",
    confidence: repeated.length || authorityText || specialist.length >= 2 ? "High" : "Medium-high",
    priorityReason: `This outranks a generic website recommendation because GO found evidence outside ${ctx.businessName}'s own site that changes the growth question. The next issue is no longer simply whether the buying path works; it is whether a credible product is underrepresented against specialists already associated with the same demand.`,
    counterEvidence: "These public discovery surfaces are not an exact Google/Maps rank tracker. If Search Console and localized rank tracking show the operator already owns this demand, GO should deprioritize visibility and move to the next constraint.",
    severity: 3,
    evidenceStrength: authorityText || repeated.length ? 4 : 3,
    revenueProximity: 3,
    actionability: 3,
    uncertainty: 1,
    supportCount: 5,
    priorityScore: 12,
    sources: [
      evidence("Market demand", `GO investigated ${queryText}, generated from the operator's own location and product language.`),
      evidence("External market players", `${competitorText} surfaced outside ${ctx.businessName}'s website across public search, directory or marketplace evidence.`),
      ...(authorityText ? [evidence("Independent market authority", `${authorityText} also surfaced around this demand, confirming that the category is meaningful in the destination.`)] : []),
      ...(trustText ? [evidence("Public trust evidence", trustText)] : []),
      ...(priceText ? [evidence("Public competitor pricing", priceText)] : []),
      inferred("GO judgment", "The evidence is strong enough to make market position the next investigation, but not strong enough to claim exact rank or revenue loss without a production SERP/local source and connected customer data.")
    ]
  }];
}

function formatPriceRange(prices) {
  const nums = (prices || []).map(value => Number(String(value).replace(/[^0-9.]/g, ""))).filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return "";
  const unique = [...new Set(nums)];
  if (unique.length === 1) return `$${Math.round(unique[0])}`;
  return `$${Math.round(unique[0])}–$${Math.round(unique[unique.length - 1])}`;
}

function mergeAndPrioritizeFindings(marketFindings, websiteFindings) {
  const hasMarket = marketFindings.length > 0;
  const earnedWebsiteFindings = websiteFindings.filter(item => {
    if (!hasMarket) return (item.evidenceStrength || 0) >= 2 && (item.priorityScore || 0) >= 8;
    return (item.evidenceStrength || 0) >= 3 && (item.priorityScore || 0) >= 11 && item.kind !== "investigation";
  });
  const all = [...marketFindings, ...earnedWebsiteFindings];
  return all
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      rankExplanation: index === 0 && marketFindings.includes(item)
        ? "GO ranked this first because verified evidence outside the operator's website changes the growth hypothesis and maps directly to something the operator sells."
        : item.rankExplanation || item.priorityReason
    }));
}

function safeHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function buildUniversalProfile(url, pages, market = emptyMarket(), bookingLinkEvidence = "") {
  const combined = `${pages.map(page => page.markdown).join("\n\n")}\n\n${bookingLinkEvidence}`;
  const home = pages[0]?.markdown || combined;
  const businessName = extractBusinessName(home, url);
  const offers = extractOffers(combined, businessName);
  const prices = extractPrices(combined);
  const businessContext = inferBusinessContext(combined, home, url);
  const bookingProvider = detectBookingProvider(combined);
  const marketplaces = detectMarketplacePresence(combined);
  const preflight = buildOperatorPreflight(combined, offers, businessContext);
  const trust = detectTrust(combined);
  const contacts = detectContacts(combined);
  const location = extractLocation(combined);
  const callsToAction = countMatches(combined, /\b(book now|book online|reserve now|check availability|book your|book today|reserve your)\b/gi);
  const internalPages = Math.max(1, pages.length);
  const seo = assessSearchFoundation(home, businessName, location, offers);
  const scores = scorePublicProfile({ offers, prices, bookingProvider, trust, contacts, callsToAction, internalPages, seo, combined });
  const growthScore = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.keys(scores).length);
  const websiteFindings = buildWebsiteFindings({ businessName, url, offers, prices, bookingProvider, trust, contacts, location, callsToAction, internalPages, seo, scores, combined, businessContext });
  const marketFindings = buildMarketFindings({ businessName, url, offers, prices, businessContext, market });
  const opportunities = mergeAndPrioritizeFindings(marketFindings, websiteFindings);

  return {
    businessName,
    website: url,
    growthScore,
    growthScoreLabel: (market.searchPages.length || market.discoveryDocs.length) ? "Provisional score · website + public market evidence" : "Provisional score · live public website evidence",
    revenueOpportunity: null,
    revenueLabel: "Connect business data",
    scores,
    analysisType: (market.searchPages.length || market.discoveryDocs.length) ? "Live public website + market scan" : "Live public website scan",
    analysisConfidence: opportunities.some(item => item.confidence === "High") ? "Medium-high" : "Medium",
    confidenceCopy: (market.searchPages.length || market.discoveryDocs.length)
      ? `${pages.length} operator pages + ${market.searchPages.length + market.discoveryDocs.length} external market surface${market.searchPages.length + market.discoveryDocs.length === 1 ? "" : "s"}`
      : `${pages.length} public page${pages.length === 1 ? "" : "s"} read live`,
    summary: summarizeBusiness({ businessName, offers, prices, bookingProvider, trust, opportunities, businessContext, market }),
    publicProfile: {
      offers: offers.slice(0, 5),
      pricing: prices.slice(0, 4),
      bookingProvider: bookingProvider.label,
      marketplaces,
      inventoryFamilies: preflight.materialFamilies.map(item => item.label),
      trust: trust.summary,
      contact: contacts.summary,
      location: businessContext.location || location || "Location needs verification",
      businessContext,
      market: {
        queries: market.queries,
        competitors: market.competitors.slice(0, 4).map(item => item.name),
        status: (market.searchPages.length || market.discoveryDocs.length) ? "Public market evidence found" : "Public market retrieval limited"
      }
    },
    marketEvidence: market,
    pipelineDebug: {
      runtime: { frontendBuildId: GO_FRONTEND_BUILD_ID, marketFunctionBuildId: market?.pipelineDebug?.marketFunctionBuildId || market?.handoffStatus?.buildId || GO_MARKET_HANDOFF_STATUS.buildId || "NO MARKET FUNCTION ID", marketHandoff: market?.pipelineDebug?.marketHandoff || market?.handoffStatus || { ...GO_MARKET_HANDOFF_STATUS }, runId: GO_ACTIVE_RUN_ID },
      operatorTruth: { businessName, businessType: businessContext.businessType, geography: businessContext.location || location || "", bookingProvider: bookingProvider.label, bookingEvidence: bookingProvider.detail || bookingProvider.evidence || "" },
      inventoryTruth: { offers: offers.slice(0, 12), primarySignals: preflight.primarySignals.slice(0, 20), materialFamilies: preflight.materialFamilies.slice(0, 10), semanticProducts: (market?.pipelineDebug?.demandPlan || []).filter(item => item.semanticProduct).map(item => item.label) },
      market: market.pipelineDebug || null,
      findingInput: opportunities.map(item => ({ title: item.title, pillar: item.pillar, confidence: item.confidence, problem: item.problem, action: item.action, metric: item.metric, priorityReason: item.priorityReason, checkedSearches: item.checkedSearches || [], sources: item.sources }))
    },
    opportunities,
    watchItems: [
      { title: "Exact Google / Maps rank", detail: (market.searchPages.length || market.discoveryDocs.length) ? "Build 029 can verify public market presence and competitor evidence across independent discovery surfaces, but it does not convert that evidence into a universal Google or Maps rank. Local results vary by location and surface." : "Public market retrieval was limited in this scan, so GO is not claiming search position." },
      { title: "Google review velocity", detail: market.reviewSignals.length ? "GO found public rating/review references in market evidence, but review velocity still requires dated review history." : "GO can see trust proof shown on websites, but reliable public review velocity remains a separate evidence layer." },
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
      problem: `GO found ${ctx.offers.length} experience signals, public pricing such as ${ctx.prices.slice(0, 3).join(", ")}, and ${ctx.trust.summary.toLowerCase()}. Travelers can see what is for sale, what it costs, and reasons to trust the operator. That is useful context, but not enough to call pricing a problem. The next valuable question is how these offers compare with operators competing for the same relevant customer demand on price, visibility and trust.`,
      action: "GO would preserve the working buying path and use the next public-intelligence layer to compare similar experiences, search position and review trust against real competitors before recommending a pricing or positioning change.",
      metric: "Competitor price + search position + review trust → booking performance", moneyLabel: "Needs analytics + booking revenue", confidence: "Medium-high",
      priorityReason: "GO is not seeing a missing buying foundation here. The higher-value next step is to compare this operator against businesses competing for the same demand before changing a working conversion path.",
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
  if ((ctx.market?.searchPages?.length || ctx.market?.discoveryDocs?.length) && ctx.market?.competitors?.length) {
    const names = ctx.market.competitors.slice(0, 3).map(item => item.name).filter(Boolean).join(", ");
    return `GO reads ${ctx.businessName} as ${identity || "a tour and activity business"} with ${offerText}, ${priceText}, and ${bookingText}. Build 029 then moved outside the website and found external market evidence around the same demand, including ${names}. GO can now use that evidence to decide whether market position deserves attention before changing the buying experience.`;
  }
  return `GO reads ${ctx.businessName} as ${identity || "a tour and activity business"} with ${offerText}, ${priceText}, and ${bookingText}. Website evidence establishes the business context; the public market layer could not be verified strongly enough in this scan, so GO withheld market-level claims.`;
}

function extractBusinessName(markdown, url) {
  const domain = domainLabel(url);
  const candidates = [];

  const addCandidate = (value, weight, source) => {
    const cleaned = cleanBusinessIdentity(value);
    if (!cleaned || cleaned.length < 3 || cleaned.length > 90) return;

    const key = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key) return;

    const existing = candidates.find(item => item.key === key);

    if (existing) {
      existing.score += weight;
      existing.sources.push(source);
    } else {
      candidates.push({
        name: cleaned,
        key,
        score: weight,
        sources: [source]
      });
    }
  };

  // Page title is useful, but it is no longer allowed to decide identity alone.
  const title = markdown.match(/^Title:\s*(.+)$/mi)?.[1];
  if (title) {
    addCandidate(title, 2, "title");

    // Titles often look like:
    // "Simply the Best Tours | Five Star Adventures Tours"
    // Score the individual brand-like pieces too.
    title
      .split(/\s*[|–—]\s*/)
      .forEach(part => addCandidate(part, 2, "title-part"));
  }

  // H1 headings often contain the actual public-facing brand.
  const h1Matches = markdown.match(/^#\s+(.+)$/gm) || [];
  h1Matches.slice(0, 5).forEach(line => {
    addCandidate(line.replace(/^#\s+/, ""), 3, "h1");
  });

  // Look for explicit business identity language.
  const identityPatterns = [
    /(?:welcome to|about|operated by|owned by|provided by|company name[:\s]+)\s+([^\n.!?]{3,80})/gi,
    /(?:copyright|©)\s*(?:20\d{2})?\s*([^\n|]{3,80})/gi
  ];

  identityPatterns.forEach(pattern => {
    let match;

    while ((match = pattern.exec(markdown)) !== null) {
      addCandidate(match[1], 4, "explicit-identity");
    }
  });

  // Repeated branded names are stronger than a single SEO phrase.
  const brandPattern =
    /\b([A-Z][A-Za-z0-9'&.-]*(?:\s+[A-Z][A-Za-z0-9'&.-]*){1,5}\s+(?:Tours?|Adventures?|Excursions?|Charters?|Cruises?|Rentals?|Experiences?))\b/g;

  const repeated = {};
  let brandMatch;

  while ((brandMatch = brandPattern.exec(markdown)) !== null) {
    const cleaned = cleanBusinessIdentity(brandMatch[1]);
    const key = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!key) continue;

    if (!repeated[key]) {
      repeated[key] = {
        name: cleaned,
        count: 0
      };
    }

    repeated[key].count += 1;
  }

  Object.values(repeated).forEach(item => {
    addCandidate(
      item.name,
      Math.min(6, 2 + item.count),
      "repeated-brand"
    );
  });

  // The domain remains a useful fallback/supporting clue.
  if (domain) {
    const domainWords = domain
      .replace(/\.(com|net|org|co|io)$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();

    addCandidate(domainWords, 1, "domain");

    // Reward candidates whose initials/words align with the domain.
    candidates.forEach(candidate => {
      const initials = candidate.name
        .split(/\s+/)
        .filter(word => !/^(the|and|of|in|at)$/i.test(word))
        .map(word => word[0])
        .join("")
        .toLowerCase();

      const compactDomain = domainWords.replace(/\s+/g, "").toLowerCase();

      if (
        compactDomain &&
        (
          candidate.key.includes(compactDomain) ||
          compactDomain.includes(candidate.key) ||
          (initials.length >= 2 && compactDomain.includes(initials))
        )
      ) {
        candidate.score += 4;
        candidate.sources.push("domain-match");
      }
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates[0]?.name || domain || "Tour Operator";
}

function cleanBusinessIdentity(value) {
  return cleanText(value || "")
    .replace(/^#+\s*/, "")
    .replace(/\s*[|–—]\s*(official site|home|book online)$/i, "")
    .replace(/^(welcome to|about)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
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
  const location = inferDestinationLocation(haystack) || extractLocation(text) || "";

  const types = [
    ["guided sightseeing", /(sightseeing|celebrity homes?|modernism|architecture|legends? and icons?|city tour)/i],
    ["transportation / bus tours", /(charter bus|motorcoach|sprinter|luxury van|transportation|bus tour)/i],
    ["boat / water / diving experiences", /(boat|powerboat|catamaran|snorkel|scuba|div(?:e|ing)|sailing|yacht|fishing|stingray|starfish|reef|cruise)/i],
    ["outdoor adventure", /(jeep|hummer|atv|utv|off-road|rafting|kayak|hiking|adventure tour)/i]
  ];
  const matchedTypes = types.filter(([, regex]) => regex.test(haystack)).map(([label]) => label);
  const businessType = matchedTypes.length > 1
    ? `multi-segment tour operator (${matchedTypes.slice(0, 3).join(" + ")})`
    : matchedTypes.length === 1
      ? `${matchedTypes[0]} operator`
      : "tour and activity operator";
  return { businessType, businessTypes: matchedTypes, location, domain: domainLabel(url) };
}


function buildSemanticOperatorModel(text, offers, businessContext, businessName, siteArchitecture = null) {
  const raw = String(text || "");
  const primaryProducts = extractPrimaryProductModel(raw, offers, businessName, siteArchitecture);
  const geography = extractValidatedGeography(raw, businessContext?.location || "", primaryProducts);

  return {
    primaryProducts,
    geography,
    commerce: {
      bookingEvidencePresent: /BOOKING LINK:|book now|book a |book your|reserve|check availability/i.test(raw),
      marketplacePresence: detectMarketplacePresence(raw)
    },
    readyForMarket: Boolean(geography?.value && primaryProducts.length)
  };
}

function extractPrimaryProductModel(text, offers, businessName, siteArchitecture = null) {
  const raw = String(text || "");
  const links = extractMarkdownLinks(raw);
  const headings = (raw.match(/^#{1,4}\s+.+$/gm) || [])
    .map(line => cleanText(line.replace(/^#{1,4}\s+/, "")));
  const candidates = new Map();

  const add = (value, score, source, url = "") => {
    const name = normalizePrimaryProductName(value, businessName);
    if (!name || !looksLikeBookableProductName(name)) return;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key) return;

    const current = candidates.get(key) || {
      name,
      score: 0,
      evidence: [],
      urls: []
    };
    current.score += score;
    if (source && !current.evidence.includes(source)) current.evidence.push(source);
    if (url && !current.urls.includes(url)) current.urls.push(url);
    candidates.set(key, current);
  };

  // Explicit calls to book/reserve are the strongest open-ended signal because they tell GO
  // what the customer can actually transact on without requiring a predefined activity list.
  links.forEach(link => {
    const label = cleanText(link.label || "");
    const href = String(link.url || "");
    if (/^(book|reserve|check availability|buy tickets?|schedule)\b/i.test(label)) {
      add(label, 14, "booking action", href);
    } else if (/\/(tour|tours|experience|experiences|activity|activities|ride|rides|lesson|lessons|charter|charters|cruise|cruises|rental|rentals|trip|trips|ticket|tickets)\b/i.test(href)) {
      add(label, 10, "product page", href);
    }
  });

  // Site information architecture is first-class evidence. A product does not need to contain
  // a tourism keyword; its role as a repeated internal commercial link/detail page is enough.
  (siteArchitecture?.internalProducts || []).forEach(item => add(item.name, Math.max(11, Number(item.score || 0)), item.evidence || "site architecture", item.url));
  (siteArchitecture?.commercialPages || []).forEach(item => add(item.name, Math.max(14, Number(item.score || 0)), item.evidence || "commercial detail page", item.url));

  // STRUCTURED FIRST-PARTY COPY FALLBACK
  // Some sites expose their real inventory as short bullets/cards under commercial sections
  // rather than clean product URLs. Preserve that information architecture without requiring
  // an activity dictionary. This is intentionally role-based: short customer-facing items
  // beneath headings such as Experiences / Services / Discover / "... with us" are candidates.
  extractStructuredProductPhrases(raw).forEach(item => add(item.name, item.score, item.evidence));

  // Existing offer extraction is useful supporting evidence, but is no longer the sole ontology.
  (offers || []).forEach(offer => add(offer, 10, "offer inventory"));

  // Headings that repeat in booking/product evidence are promoted without knowing the activity type.
  headings.forEach(heading => {
    const normalized = normalizePrimaryProductName(heading, businessName);
    if (!normalized) return;
    const lower = normalized.toLowerCase();
    const linkedOrOffered = [...candidates.values()].some(item => {
      const itemLower = item.name.toLowerCase();
      return itemLower.includes(lower) || lower.includes(itemLower);
    });
    if (linkedOrOffered) add(normalized, 6, "product heading");
  });

  // Merge near-duplicates such as "Trail Ride" / "Trail Rides" and retain the strongest wording.
  const ranked = [...candidates.values()]
    .filter(item => item.score >= 9)
    .sort((a, b) => b.score - a.score);

  const deduped = [];
  ranked.forEach(item => {
    const compact = item.name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");
    const existing = deduped.find(row => {
      const other = row.name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");
      return compact === other || compact.includes(other) || other.includes(compact);
    });
    if (!existing) deduped.push(item);
    else {
      existing.score += Math.round(item.score / 2);
      item.evidence.forEach(e => { if (!existing.evidence.includes(e)) existing.evidence.push(e); });
      item.urls.forEach(u => { if (!existing.urls.includes(u)) existing.urls.push(u); });
    }
  });

  return deduped.slice(0, 10);
}

function extractStructuredProductPhrases(text) {
  const lines = String(text || "").split(/\n+/);
  const out = [];
  let commercialSectionDepth = 0;
  let sectionBudget = 0;

  const sectionSignal = value => /\b(experiences?|services?|activities|adventures?|things to do|discover|explore|choose|with us|our tours?|our trips?|our charters?|our rides?|our courses?|our rentals?)\b/i.test(value);
  const reject = value => /^(home|about|contact|faq|gallery|rates?|pricing|reviews?|testimonials?|follow us|menu|close menu|book now|learn more)$/i.test(value)
    || /privacy|terms|copyright|all rights reserved|call or whatsapp|newsletter|social/i.test(value);

  for (const rawLine of lines) {
    const line = cleanText(rawLine);
    if (!line) continue;
    const heading = rawLine.match(/^\s*(#{1,4})\s+(.+)$/);
    if (heading) {
      const depth = heading[1].length;
      const label = cleanText(heading[2]);
      if (sectionSignal(label)) {
        commercialSectionDepth = depth;
        sectionBudget = 14;
      } else if (commercialSectionDepth && depth <= commercialSectionDepth) {
        commercialSectionDepth = 0;
        sectionBudget = 0;
      }
      continue;
    }

    if (!commercialSectionDepth || sectionBudget <= 0) continue;
    sectionBudget -= 1;

    const candidate = line.replace(/^[-*•]+\s*/, "").trim();
    if (reject(candidate) || candidate.length < 3 || candidate.length > 70) continue;
    const words = candidate.split(/\s+/).filter(Boolean);
    if (words.length > 9 || /[.!?]$/.test(candidate)) continue;
    if (/^(small groups?|experienced|professional|safety|all |our |the |you |we |get in touch|total flexibility|expert guidance|intimate groups)/i.test(candidate)) continue;
    out.push({ name: candidate, score: 12, evidence: "structured commercial section" });
  }

  return out.slice(0, 24);
}

function normalizePrimaryProductName(value, businessName = "") {
  let text = cleanText(String(value || ""))
    .replace(/^(book|reserve|schedule|buy|check availability(?: for)?|learn more about)\s+(?:a|an|the|your)?\s*/i, "")
    .replace(/\b(book now|reserve now|learn more|details|more info)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (businessName) {
    const escaped = escapeRegExp(businessName);
    text = text.replace(new RegExp(`\\b${escaped}\\b`, "ig"), " ").replace(/\s+/g, " ").trim();
  }

  text = text
    .replace(/^[|–—:;\-]+|[|–—:;\-]+$/g, "")
    .replace(/\b(?:from|starting at)\s*[$€£]\s*\d[\d,.]*/gi, "")
    .trim();

  if (text.length < 3 || text.length > 75) return "";
  return text;
}

function looksLikeBookableProductName(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^(home|about|contact|services?|activities|tours?|experiences?|book|booking|reserve|gallery|faq|reviews?|donate|shop|menu|search)$/i.test(text)) return false;
  if (/privacy|terms|cookie|newsletter|sign in|log in|cart|gift card/i.test(text)) return false;
  if (/^[\d\s$€£.,-]+$/.test(text)) return false;

  // Reject marketing/editorial headings. These are meaningful website copy, but they are not
  // inventory and must never become traveler demand (e.g. "Dive Safe With Us").
  if (/\b(with us|why choose|our story|meet (?:the|our)|what to expect|safe(?:ty)?|welcome|top rated|best in|about our|our team|our crew|learn more|read more|blog|news)\b/i.test(text)) return false;
  if (/^(the|our|your|we|you|why|how|what)\b/i.test(text) && !/\b(tour|charter|cruise|rental|ride|lesson|course|diving|dive|snorkel|fishing|sailing|excursion|trip|experience)\b/i.test(text)) return false;

  // A product does not need to belong to a known activity taxonomy. It only needs to look like
  // a concise customer-facing noun phrase rather than navigation or prose.
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= 8 && /[A-Za-z]/.test(text);
}

function primaryProductIntent(name) {
  const intent = String(name || "")
    .replace(/\b(?:guided|basic|beginner|private appointment|appointment)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!intent || /\b(with us|why choose|our story|what to expect|safe with us)\b/i.test(intent)) return "";
  return intent;
}

function extractValidatedGeography(text, inferredCandidate, primaryProducts) {
  const raw = String(text || "");
  const candidates = [];

  const add = (value, score, source) => {
    const clean = cleanText(value || "").replace(/\s+/g, " ").trim();
    if (!clean || clean.length < 2 || clean.length > 80) return;
    if (isProductLikeGeography(clean, primaryProducts)) return;
    candidates.push({ value: clean, score, source });
  };

  // Strongest signal: city/state or city/region inside an explicit street address.
  const addressPatterns = [
    /\b\d{1,6}\s+[A-Za-z0-9.'#\- ]{3,60}\s+(?:Rd|Road|St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Hwy|Highway|Pkwy|Parkway)\.?(?:[^,\n]{0,35}),?\s+([A-Z][A-Za-z.' -]{2,35}),\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?/g,
    /(?:located at|address(?: is)?|location(?: address)?(?: is)?|visit us at)\s*:?\s*[^\n]{0,90}?\b([A-Z][A-Za-z.' -]{2,35}),\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?/gi
  ];
  addressPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(raw)) !== null) add(`${match[1]}, ${match[2]}`, 20, "street address");
  });

  // Explicit destination language is stronger than an inferred title phrase.
  const explicitPatterns = [
    /(?:located in|based in|serving|tours? in|experiences? in|rides? in|activities? in)\s+([A-Z][^\n.!?]{2,60})/gi,
    /(?:destination|city|region|location)\s*[:\-]\s*([A-Z][^\n]{2,60})/gi
  ];
  explicitPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(raw)) !== null) add(match[1], 12, "explicit geography");
  });

  if (inferredCandidate && !isProductLikeGeography(inferredCandidate, primaryProducts)) {
    add(inferredCandidate, 5, "inferred geography");
  }

  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length) {
    return { value: candidates[0].value, confidence: candidates[0].score >= 15 ? "High" : "Medium-high", source: candidates[0].source };
  }

  return {
    value: "",
    confidence: "Low",
    rejectedCandidate: inferredCandidate || "",
    source: "No validated geography"
  };
}

function isProductLikeGeography(value, primaryProducts) {
  const candidate = cleanText(value || "").toLowerCase();
  if (!candidate) return true;

  // Semantic-role guardrail: if the candidate substantially overlaps something the customer
  // can book, it cannot simultaneously be trusted as geography.
  const overlap = (primaryProducts || []).some(product => {
    const productName = String(product?.name || "").toLowerCase();
    return productName && (candidate.includes(productName) || productName.includes(candidate));
  });
  if (overlap) return true;

  return /\b(tour|tours|ride|rides|riding|lesson|lessons|charter|charters|cruise|cruises|rental|rentals|experience|experiences|adventure|adventures|excursion|excursions|activity|activities|safari|trip|trips)\b/i.test(candidate);
}

function buildOperatorPreflight(text, offers, businessContext, siteArchitecture = null) {
  const raw = String(text || "");
  const offerText = (offers || []).join(" ");
  const links = extractMarkdownLinks(raw);
  const headings = (raw.match(/^#{1,4}\s+.+$/gm) || []).map(line => cleanText(line.replace(/^#{1,4}\s+/, "")));

  // Product hierarchy: GO separates things the operator appears to SELL from things merely
  // INCLUDED in an experience. Only strong first-party product/category evidence can promote
  // a specific activity into the representative search portfolio.
  const productLike = value => /\b(tour|tours|charter|charters|cruise|cruises|excursion|excursions|safari|safaris|trip|trips|experience|experiences|rental|rentals)\b/i.test(value);
  const productLinks = links
    .filter(link => /\/(tour|tours|experience|experiences|excursion|excursions|activity|activities|charter|charters|cruise|cruises)\b/i.test(link.url) || productLike(link.label))
    .map(link => cleanText(`${link.label} ${link.url}`));
  const productHeadings = headings.filter(productLike);
  const architectureSignals = [
    ...(siteArchitecture?.internalProducts || []).map(item => cleanText(`${item.name} ${item.url || ""}`)),
    ...(siteArchitecture?.commercialPages || []).map(item => cleanText(`${item.name} ${item.url || ""}`))
  ];
  const primarySignals = [...new Set([...architectureSignals, ...productLinks, ...productHeadings, ...(offers || [])].map(cleanText).filter(Boolean))];

  const families = [
    { id: "water", label: "Boat / water experiences", pattern: /boat|powerboat|catamaran|snorkel|sail(?:ing)?|yacht|cruise|reef|sea tours?|water tours?|ocean|stingray|dolphin|whale/i },
    { id: "adventure", label: "Outdoor adventure", pattern: /jeep|hummer|atv|utv|off-road|rafting|kayak|zipline|horseback|hiking|buggy|safari/i },
    { id: "sightseeing", label: "Sightseeing / history", pattern: /sightseeing|city tour|history tour|historical|landmark|celebrity|architecture|modernism/i },
    { id: "fishing", label: "Fishing", pattern: /fishing|sportfishing|deep sea|fly fishing/i },
    { id: "food", label: "Food / culinary", pattern: /food tour|culinary|tasting tour|foodie/i },
    { id: "wine", label: "Wine / winery", pattern: /wine tour|winery|vineyard|wine tasting/i }
  ];

  const materialFamilies = families.map(family => {
    const primaryMatches = primarySignals.filter(signal => family.pattern.test(signal));
    const offerMatches = countPatternMatches(offerText, family.pattern);
    const bodyMatches = countPatternMatches(raw, family.pattern);
    const strength = (primaryMatches.length * 10) + (offerMatches * 5) + Math.min(4, bodyMatches);
    if (!strength) return null;
    return {
      id: family.id,
      label: family.label,
      strength,
      primaryMatches: primaryMatches.length,
      primaryEvidence: primaryMatches.slice(0, 6),
      offerMatches,
      bodyMatches,
      verifiedProductFamily: primaryMatches.length > 0 || offerMatches > 0
    };
  }).filter(Boolean).sort((a, b) => b.strength - a.strength);

  return {
    materialFamilies,
    primarySignals: primarySignals.slice(0, 24),
    multiSegment: materialFamilies.filter(item => item.verifiedProductFamily).length > 1 || (businessContext?.businessTypes || []).length > 1,
    coverageConfidence: materialFamilies.some(item => item.verifiedProductFamily) ? "High" : (materialFamilies.length ? "Medium-high" : "Medium")
  };
}

function inferDestinationLocation(text) {
  const source = String(text || "");
  const candidates = new Map();

  const add = (value, weight = 1) => {
    const cleaned = cleanText(value || "")
      .replace(/^(the|in|at|from|near)\s+/i, "")
      .replace(/\s+(tours?|adventures?|excursions?|activities|experiences?)$/i, "")
      .replace(/[|–—].*$/, "")
      .trim();
    if (!cleaned || cleaned.length < 3 || cleaned.length > 70) return;
    if (/^(home|contact|book now|about us|privacy|terms)$/i.test(cleaned)) return;
    const key = cleaned.toLowerCase();
    const current = candidates.get(key) || { value: cleaned, score: 0 };
    current.score += weight;
    candidates.set(key, current);
  };

  const explicitPatterns = [
    /(?:located in|based in|serving|departing from|departure from|meet us at|visit us at|tours? in|experiences? in)\s+([^\n.!?]{3,70})/gi,
    /(?:destination|location|address)[:\s]+([^\n]{3,80})/gi
  ];
  explicitPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(source)) !== null) add(match[1], 6);
  });

  // Capture destination-shaped place names without requiring a hand-maintained city list.
  const placePattern = /\b((?:[A-Z][A-Za-z'.-]+\s+){0,3}[A-Z][A-Za-z'.-]+\s+(?:Islands?|Beach|Bay|Harbour|Harbor|Springs|Valley|Coast|County|City|Village|Keys|Cays?|National Park))\b/g;
  let placeMatch;
  while ((placeMatch = placePattern.exec(source)) !== null) add(placeMatch[1], 3);

  // Repeated title/heading geography is useful for destinations such as "Grand Cayman"
  // that do not contain a generic suffix like "Island" or "City".
  const titleHeadingText = [
    ...(source.match(/^Title:\s*(.+)$/gmi) || []),
    ...(source.match(/^#{1,3}\s+(.+)$/gm) || [])
  ].join("\n");
  const repeatedPlacePattern = /\b([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,2})\b/g;
  const counts = new Map();
  let repeatedMatch;
  while ((repeatedMatch = repeatedPlacePattern.exec(titleHeadingText)) !== null) {
    const value = cleanText(repeatedMatch[1]);
    if (/Growth Operator|Book Now|Learn More|Cayman Ocean Adventures/i.test(value)) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  counts.forEach((count, value) => { if (count >= 2) add(value, Math.min(5, count)); });

  return [...candidates.values()].sort((a, b) => b.score - a.score)[0]?.value || "";
}

function collectBookingLinkEvidence(pages) {
  const rows = [];
  (pages || []).forEach(page => {
    const markdown = String(page?.markdown || '');
    for (const link of extractMarkdownLinks(markdown, page?.url || '')) {
      const label = cleanText(link.label || '');
      const href = link.url;
      if (/book|reserve|availability|checkout|ticket|peek|fareharbor|junglebee|bokun|rezdy|xola|tripworks|checkfront|bookeo|rezgo|rocketrez/i.test(`${label} ${href}`)) {
        rows.push(`BOOKING LINK: ${label} ${href}`);
      }
    }
  });
  return [...new Set(rows)].slice(0, 30).join('\n');
}

function detectBookingProvider(text) {
  const raw = String(text || "");
  const providers = [
    ["Peek Pro", /book\.peek\.com|peek\.com\/pro|peekpro\.com|peek pro|powered by peek|book with peek/i],
    ["FareHarbor", /fareharbor\.com|fareharbor/i],
    ["Junglebee", /junglebee\.(?:com|io)|powered by junglebee|junglebee booking/i],
    ["Bókun", /bokun\.io|bokun\.com|bokun/i],
    ["Rezdy", /rezdy\.com|rezdy/i],
    ["Xola", /xola\.com|xola/i],
    ["TripWorks", /tripworks\.com|tripworks/i],
    ["Checkfront", /checkfront\.com|checkfront/i],
    ["Bookeo", /bookeo\.com|bookeo/i],
    ["Rezgo", /rezgo\.com|rezgo/i],
    ["RocketRez", /rocketrez\.com|rocketrez/i]
  ];
  for (const [label, regex] of providers) {
    if (regex.test(raw)) return { provider: label, label, kind: "direct-booking" };
  }

  // General fallback: if GO can verify a real booking/reservation path but the vendor name is
  // not exposed publicly, report the verified fact instead of pretending no booking system exists.
  const hasBookingFlow = /BOOKING LINK:|book now|book a |book your|reserve now|reserve your|check availability|payment is due at (?:the )?time of booking/i.test(raw);
  if (hasBookingFlow) {
    return {
      provider: "Direct booking flow",
      label: "Direct booking flow detected · provider not publicly exposed",
      kind: "direct-booking-unknown-provider"
    };
  }

  return { provider: null, label: "Booking provider not confidently detected", kind: "unknown" };
}
function detectMarketplacePresence(text) {
  const marketplaces = [
    ["Viator", /viator\.com|\bviator\b/i],
    ["Tripadvisor", /tripadvisor\.com|\btripadvisor\b/i],
    ["GetYourGuide", /getyourguide\.com|\bgetyourguide\b/i]
  ];
  return marketplaces.filter(([, regex]) => regex.test(text)).map(([label]) => label);
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
  let origin;
  try { origin = new URL(baseUrl).origin; } catch { return []; }

  const utility = /^(home|about|contact|faq|faqs|blog|news|gallery|reviews?|privacy|terms|policy|login|sign in|cart|checkout|donate|shop|search|menu)$/i;
  const candidates = [];
  const seen = new Set();

  for (const item of extractMarkdownLinks(markdown, baseUrl)) {
    try {
      const parsed = new URL(item.url);
      if (parsed.origin !== origin) continue;
      parsed.hash = "";
      const clean = parsed.toString();
      const label = cleanText(item.label || "");
      if (!label || utility.test(label) || clean === baseUrl || seen.has(clean)) continue;
      if (/\/(privacy|terms|policy|contact|about|faq|blog|news|gallery|login|account|cart|checkout|donate|shop)(?:\/|$)/i.test(parsed.pathname)) continue;
      if (!looksLikeBookableProductName(label)) continue;
      seen.add(clean);
      const depth = parsed.pathname.split('/').filter(Boolean).length;
      let score = 4;
      if (label.split(/\s+/).length >= 2) score += 2;
      if (depth >= 1 && depth <= 3) score += 2;
      if (/\/(tours?|experiences?|activities?|services?|products?|book)(?:\/|$)/i.test(parsed.pathname)) score += 3;
      candidates.push({ url: clean, score });
    } catch {}
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, MAX_EXTRA_PAGES).map(item => item.url);
}

function showResults(profile) {
  text("result-business", profile.businessName);
  text("result-summary", profile.summary);
  text("confidence-score", String(profile.analysisConfidence || "Medium").toUpperCase());
  text("confidence-copy", profile.confidenceCopy || "Live public evidence");
  renderProfileStrip(profile.publicProfile || {});
  const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
  const debugPanel = debugEnabled ? renderPipelineDebug(profile.pipelineDebug || {}) : "";
  document.getElementById("finding-list").innerHTML = debugPanel + profile.opportunities.map((item, index) => `
    <article class="finding-card">
      <div class="finding-number">0${index + 1}</div>
      <div class="finding-copy">
        <div class="finding-kicker"><span>${escapeHtml(item.icon || "↗")}</span><small>${escapeHtml((item.pillar || "Growth").toUpperCase())} · ${escapeHtml(item.kind === "investigation" ? "INVESTIGATE FIRST" : "OPPORTUNITY")} · ${escapeHtml(String(item.confidence || "Medium").toUpperCase())} CONFIDENCE</small></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.problem)}</p>
        ${item.whyItMatters ? `<div class="operator-why"><small>WHY IT MATTERS</small><p>${escapeHtml(item.whyItMatters)}</p></div>` : ""}
        ${renderSearchEvidence(item)}
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


function renderPipelineDebug(debug) {
  const json = JSON.stringify(debug || {}, null, 2);
  return `
    <details style="margin:0 0 18px;border:1px solid rgba(91,181,255,.35);border-radius:14px;background:rgba(4,20,36,.78);padding:14px 16px;">
      <summary style="cursor:pointer;font-weight:800;color:#8fd0ff;letter-spacing:.06em;">GO PIPELINE DEBUG — INTERNAL ONLY</summary>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 8px;">
        <code style="padding:5px 8px;border:1px solid rgba(91,181,255,.3);border-radius:7px;color:#dcecff;">FE: ${escapeHtml(debug?.runtime?.frontendBuildId || debug?.market?.frontendBuildId || GO_FRONTEND_BUILD_ID)}</code>
        <code style="padding:5px 8px;border:1px solid rgba(91,181,255,.3);border-radius:7px;color:#dcecff;">MI: ${escapeHtml(debug?.runtime?.marketFunctionBuildId || debug?.market?.marketFunctionBuildId || "MISSING")}</code>
        <code style="padding:5px 8px;border:1px solid rgba(91,181,255,.3);border-radius:7px;color:#dcecff;">RUN: ${escapeHtml(debug?.runtime?.runId || debug?.market?.runId || "MISSING")}</code>
      </div>
      <p style="margin:8px 0 10px;color:#9fb3c8;font-size:12px;line-height:1.5;">If FE/MI are not the Runtime Truth IDs, we are debugging stale code. Operator truth → inventory truth → market request → generated demand → selected searches → raw results → qualified evidence → final finding input.</p>
      <pre style="white-space:pre-wrap;overflow:auto;max-height:720px;margin:0;background:#06101c;border-radius:10px;padding:14px;color:#dcecff;font-size:11px;line-height:1.45;">${escapeHtml(json)}</pre>
    </details>`;
}


function renderSearchEvidence(item) {
  const rows = Array.isArray(item.checkedSearches) ? item.checkedSearches : [];
  if (!rows.length) return '';

  const rowHtml = rows.map(row => {
    const localClass = row.localPosition != null ? 'found' : 'not-observed';
    const organicClass = row.organicPosition != null ? 'found' : 'not-observed';
    return `
      <div class="search-evidence-row">
        <div class="search-query-cell">
          <strong>${escapeHtml(row.query)}</strong>
          <small>${escapeHtml(row.demandLabel || '')}</small>
        </div>
        <div class="search-status-cell ${localClass}">
          <small>GOOGLE MAPS RESULTS</small>
          <strong>${escapeHtml(row.localStatus)}</strong>
        </div>
        <div class="search-status-cell ${organicClass}">
          <small>REGULAR GOOGLE RESULTS</small>
          <strong>${escapeHtml(row.organicStatus)}</strong>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="search-evidence">
      <div class="search-evidence-heading">
        <div>
          <small>SEARCHES GO ACTUALLY CHECKED</small>
          <strong>Here is what GO observed for each search.</strong>
        </div>
        <span>${rows.length} SEARCH${rows.length === 1 ? '' : 'ES'}</span>
      </div>
      <div class="search-evidence-grid">${rowHtml}</div>
      <div class="search-evidence-why">
        <small>WHY GO CHOSE THESE SEARCHES</small>
        <p>${escapeHtml(item.searchSelectionWhy || 'GO selected searches that match the operator\'s products, location and commercially relevant traveler intent.')}</p>
      </div>
    </div>`;
}

function renderProfileStrip(profile) {
  const offers = Array.isArray(profile.offers) && profile.offers.length ? profile.offers.slice(0, 3).join(" · ") : "Needs deeper crawl";
  const pricing = Array.isArray(profile.pricing) && profile.pricing.length ? profile.pricing.slice(0, 3).join(" · ") : "Not found publicly";
  document.getElementById("profile-strip").innerHTML = `
    <div><small>GO UNDERSTANDS THE BUSINESS</small><strong>${escapeHtml([profile.businessContext?.businessType, profile.businessContext?.location].filter(Boolean).join(" · ") || offers)}</strong></div>
    <div><small>PUBLIC PRICING</small><strong>${escapeHtml(pricing)}</strong></div>
    <div><small>BOOKING HANDOFF</small><strong>${escapeHtml(profile.bookingProvider || "Needs verification")}</strong></div>
    <div><small>TRUST / MARKET</small><strong>${escapeHtml([profile.trust, profile.market?.status].filter(Boolean).join(" · ") || profile.contact || "Needs verification")}</strong></div>
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

function isCayman(url) { return false; }
function domainLabel(url) { try { return new URL(url).hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, char => char.toUpperCase()); } catch { return "This Business"; } }
function countMatches(text, regex) { return (text.match(regex) || []).length; }
function cleanText(value) { return String(value || "").replace(/\[(.*?)\]\([^)]*\)/g, "$1").replace(/[*_`>#]/g, " ").replace(/\s+/g, " ").trim(); }
function clamp(value) { return Math.max(35, Math.min(92, Math.round(value))); }
function setProgress(value) { progress.style.width = `${Math.max(0, Math.min(100, value))}%`; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function text(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }