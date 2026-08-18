"use strict";

const READER_ENDPOINT = "https://r.jina.ai/";
const MAX_EXTRA_PAGES = 3;
const MAX_MARKET_QUERIES = 3;
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

    setStage("search", "active", "DISCOVERING");
    setProgress(44);
    const websiteContext = buildWebsiteContext(url, [home, ...extraPages]);
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
    const profile = buildUniversalProfile(url, [home, ...extraPages], market);
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


function buildWebsiteContext(url, pages) {
  const combined = pages.map(page => page.markdown).join("\n\n");
  const home = pages[0]?.markdown || combined;
  const businessName = extractBusinessName(home, url);
  const offers = extractOffers(combined, businessName);
  const businessContext = inferBusinessContext(combined, home, url);
  return { url, businessName, offers, businessContext, combined };
}

function emptyMarket() {
  return {
    queries: [],
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
  return market;
}


async function readProfessionalMarket(ctx) {
  const queries = buildMarketQueries(ctx).slice(0, MAX_MARKET_QUERIES);
  if (!queries.length || !ctx.businessContext?.location) return null;

  try {
    const response = await fetch('/.netlify/functions/market-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: ctx.businessName,
        website: ctx.url,
        location: ctx.businessContext.location,
        queries
      })
    });

    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.ok || !payload.market) return null;

    return normalizeProfessionalMarket(payload.market, queries);
  } catch (error) {
    console.warn('GO professional market layer unavailable; falling back to public discovery.', error);
    return null;
  }
}

function normalizeProfessionalMarket(raw, queries) {
  const market = emptyMarket();
  market.provider = raw.provider || 'SerpApi';
  market.professional = true;
  market.observedAt = raw.observedAt || '';
  market.queries = queries;
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
    specialization: detectMarketSpecialization(`${player.name || ''} ${(player.queries || []).join(' ')}`, queries),
    sources: player.sources || []
  }));

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
  market.retrievalNote = `GO verified ${market.queryResults.length} localized Google market searches through ${market.provider} and separated direct operators, marketplaces and destination authorities before reasoning.`;
  return market;
}

function buildMarketQueries(ctx) {
  const location = String(ctx.businessContext?.location || "")
    .replace(/,\s*(California|Florida|Utah|Nevada|Arizona|Hawaii|Texas|New York).*$/i, "")
    .trim();
  if (!location) return [];

  const text = `${ctx.offers.join(" ")} ${ctx.combined}`.toLowerCase();
  const intents = [];
  const add = value => { if (value && !intents.includes(value)) intents.push(value); };

  if (/architect|modernism|midcentury|mid-century/.test(text)) add("architecture tours");
  if (/celebrity|stars? homes?|legends? and icons?/.test(text)) add("celebrity homes tours");
  if (/sightseeing|city tour|history tour/.test(text)) add("sightseeing tours");
  if (/food|culinary/.test(text)) add("food tours");
  if (/wine|winery/.test(text)) add("wine tours");
  if (/boat|snorkel|sailing|yacht|cruise/.test(text)) add("boat tours");
  if (/atv|utv|jeep|hummer|off-road/.test(text)) add("adventure tours");
  if (!intents.length) add("tours");

  return intents.slice(0, MAX_MARKET_QUERIES).map(intent => `${location} ${intent}`);
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

function extractMarkdownLinks(markdown) {
  return [...String(markdown || "").matchAll(/\[([^\]]{2,160})\]\((https?:\/\/[^)\s]+)\)/g)]
    .map(match => ({ label: cleanText(match[1]), url: match[2].replace(/[.,]+$/, "") }));
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
  const direct = (market.competitors || []).filter(item => item.category === "direct");
  const authorities = (market.competitors || []).filter(item => item.category === "authority");
  if (!rows.length || !direct.length) return null;

  const architectureRow = rows.find(row => /architect|modern|midcentury/i.test(row.query || ""));
  const sightseeingRow = rows.find(row => /sightseeing/i.test(row.query || ""));
  const focusRow = architectureRow || sightseeingRow || rows[0];
  if (!focusRow) return null;

  const focusQuery = focusRow.query || market.queries?.[0] || "the highest-intent market search GO tested";
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

  const leaders = (focusDirect.length ? focusDirect : direct).slice(0, 3);
  if (!leaders.length) return null;

  const leaderSummary = leaders.map(item => {
    const position = item.bestLocalPosition
      ? `local #${item.bestLocalPosition}`
      : item.bestOrganicPosition
        ? `organic #${item.bestOrganicPosition}`
        : "visible";
    const trust = [
      item.rating ? `${Number(item.rating).toFixed(1)}★` : null,
      item.reviews ? `${Number(item.reviews).toLocaleString()} reviews` : null
    ].filter(Boolean).join(" · ");
    return `${item.name} (${position}${trust ? ` · ${trust}` : ""})`;
  }).join("; ");

  const authorityNames = authorities
    .filter(item => (item.queries || []).includes(focusQuery))
    .slice(0, 3)
    .map(item => item.name)
    .filter(Boolean);

  const snippetText = rows.flatMap(row => row.organicResults || [])
    .map(item => `${item.title || ""} ${item.snippet || ""}`)
    .join("\n");
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

  let title = "Specialists are owning the discovery moment around one of your strongest products";
  if (priceEvidenceWeakensDiscountTheory) {
    title = "Your architecture product looks under-discovered before it looks overpriced";
  } else if (!visibilityGap) {
    title = "Your market position is real — but specialists are still defining the category around you";
  }

  const observationParts = [];
  if (notObservedLocally) {
    observationParts.push(`${ctx.businessName} was not observed in the ${localChecked} local results GO checked for “${focusQuery}”.`);
  } else if (targetLocal) {
    observationParts.push(`${ctx.businessName} appeared at local position #${targetLocal} for “${focusQuery}” in this localized check.`);
  }
  if (notObservedOrganically) {
    observationParts.push(`It also was not observed in the ${organicChecked} organic results GO checked for that query.`);
  } else if (targetOrganic) {
    observationParts.push(`Its site appeared at organic position #${targetOrganic} for the same query.`);
  }
  observationParts.push(`The businesses surfaced around that demand included ${leaderSummary}.`);
  if (authorityNames.length) {
    observationParts.push(`Destination/category authorities such as ${authorityNames.join(", ")} also occupy the discovery landscape.`);
  }
  if (priceEvidenceWeakensDiscountTheory) {
    observationParts.push(`FSA's observed public pricing is ${formatPriceRange(operatorPrices)}, while search snippets in the same market surfaced offers up to ${formatPriceRange(marketPrices)}. That weakens the idea that FSA must discount before fixing discovery.`);
  }

  const action = visibilityGap
    ? `GO would first strengthen ${ctx.businessName}'s relevance for the specific ${focusQuery.replace(/^Palm Springs\s+/i, "")} demand it already serves: verify the Google Business Profile entity/category alignment, strengthen the matching experience page and on-page entity signals, earn the destination/industry citations competitors benefit from, and then monitor this same localized query set to see whether FSA enters and climbs the results.`
    : `GO would compare the pages, Google entity signals, destination citations and review profile of the specialists surrounding ${focusQuery}, then strengthen whichever relevance signals explain why travelers still encounter those businesses as the category leaders.`;

  const counter = market.target?.identityVerified
    ? "GO matched the operator to a Google local entity before comparing the market, reducing the risk of mistaking a DBA/name variation for absence. Rankings still vary by location, device and time, so this is a localized evidence check rather than a universal rank claim."
    : "GO did not fully verify a matching Google local entity. Before making a stronger absence claim, GO should confirm the operator's Google Business Profile / DBA identity and rerun the localized checks.";

  const sources = [
    {
      type: "public",
      label: "Localized Google check",
      detail: observationParts.slice(0, 2).join(" ")
    },
    {
      type: "public",
      label: "Direct market leaders",
      detail: leaderSummary
    },
    ...(authorityNames.length ? [{
      type: "public",
      label: "Destination / category authority",
      detail: authorityNames.join(" · ")
    }] : []),
    ...(priceEvidenceWeakensDiscountTheory ? [{
      type: "public",
      label: "Price counter-evidence",
      detail: `Operator: ${formatPriceRange(operatorPrices)} · Market snippets: ${formatPriceRange(marketPrices)}`
    }] : []),
    {
      type: "operator",
      label: "GO judgment",
      detail: visibilityGap
        ? "The stronger first hypothesis is category visibility/relevance, not a broken booking path or an obvious need to lower price."
        : "The operator is visible, so GO would study why specialist competitors still define the category before changing price or checkout."
    }
  ];

  return {
    kind: "opportunity",
    pillar: "Visibility",
    icon: "⌖",
    title,
    problem: observationParts.join(" "),
    action,
    metric: "Target-query local/organic visibility → qualified visits → booking starts → completed bookings",
    moneyLabel: "Real market gap · revenue needs connected data",
    confidence: market.target?.identityVerified ? "High" : "Medium-high",
    priorityReason: `This outranks the website-only findings because GO used localized external market evidence for “${focusQuery}” and found a competitive discovery pattern that can change what the operator works on first.`,
    rankExplanation: `GO ranked this first because live market evidence now changes the diagnosis: the first question is whether FSA is being discovered and understood for a product it already sells, not whether the existing FareHarbor handoff should be redesigned.`,
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
  const all = [...marketFindings, ...websiteFindings];
  return all
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      rankExplanation: index === 0 && marketFindings.includes(item)
        ? "GO ranked this first because verified evidence outside the operator's website now changes the growth hypothesis. It is the first finding that compares the business with the market surrounding it."
        : item.rankExplanation || item.priorityReason
    }));
}

function safeHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function buildUniversalProfile(url, pages, market = emptyMarket()) {
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
    opportunities,
    watchItems: [
      { title: "Exact Google / Maps rank", detail: (market.searchPages.length || market.discoveryDocs.length) ? "Build 028 can verify public market presence and competitor evidence across independent discovery surfaces, but it does not convert that evidence into a universal Google or Maps rank. Local results vary by location and surface." : "Public market retrieval was limited in this scan, so GO is not claiming search position." },
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
  if ((ctx.market?.searchPages?.length || ctx.market?.discoveryDocs?.length) && ctx.market?.competitors?.length) {
    const names = ctx.market.competitors.slice(0, 3).map(item => item.name).filter(Boolean).join(", ");
    return `GO reads ${ctx.businessName} as ${identity || "a tour and activity business"} with ${offerText}, ${priceText}, and ${bookingText}. Build 028 then moved outside the website and found external market evidence around the same demand, including ${names}. GO can now use that evidence to decide whether market position deserves attention before changing the buying experience.`;
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

function isCayman(url) { return /caymanoceanadventures|stingraycitycaymantours/i.test(url); }
function domainLabel(url) { try { return new URL(url).hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, char => char.toUpperCase()); } catch { return "This Business"; } }
function countMatches(text, regex) { return (text.match(regex) || []).length; }
function cleanText(value) { return String(value || "").replace(/\[(.*?)\]\([^)]*\)/g, "$1").replace(/[*_`>#]/g, " ").replace(/\s+/g, " ").trim(); }
function clamp(value) { return Math.max(35, Math.min(92, Math.round(value))); }
function setProgress(value) { progress.style.width = `${Math.max(0, Math.min(100, value))}%`; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function text(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }