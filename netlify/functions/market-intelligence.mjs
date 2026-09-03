const SERP_ENDPOINT = "https://serpapi.com/search.json";
const GO_MARKET_BUILD_ID = "B034-DISCOVERY-INTELLIGENCE-RECOVERY-MI-20260902";
const MAX_QUERIES = 10;
const MAX_ORGANIC = 10;
const MAX_LOCAL = 10;

export default async (request) => {
  if (request.method === "OPTIONS") {
    return response(204, "");
  }

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  // Runtime handshake is intentionally independent of SerpApi. This lets the browser
  // prove which Netlify function build is actually executing before GO trusts market data.
  if (body.action === "runtime") {
    return json(200, {
      ok: true,
      action: "runtime",
      buildId: GO_MARKET_BUILD_ID,
      runtimeBuildId: GO_MARKET_BUILD_ID,
      observedAt: new Date().toISOString(),
    });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return json(500, {
      ok: false,
      buildId: GO_MARKET_BUILD_ID,
      runtimeBuildId: GO_MARKET_BUILD_ID,
      error: "SERPAPI_KEY is not configured on the server.",
    });
  }

  const businessName = cleanText(body.businessName);
  const website = cleanUrl(body.website);
  const location = cleanText(body.location);
  const debugRunId = cleanText(body.debugRunId);
  const frontendBuildId = cleanText(body.frontendBuildId);

  // Acquisition is intentionally separate from market judgment. The browser-side
  // reader can occasionally return challenge/interstitial text; GO must recover
  // first-party evidence before it tries to model or judge the operator.
  if (body.action === "acquire") {
    if (!website) return json(400, { ok: false, error: "website is required." });
    try {
      const acquisition = await acquireWebsiteEvidence({ website, apiKey });
      return json(200, { ok: true, buildId: GO_MARKET_BUILD_ID, runtimeBuildId: GO_MARKET_BUILD_ID, acquisition });
    } catch (error) {
      console.error("Website acquisition error", error);
      return json(502, { ok: false, error: error instanceof Error ? error.message : "Website acquisition failed." });
    }
  }
  const queries = Array.isArray(body.queries)
    ? [...new Set(body.queries.map(cleanText).filter(Boolean))].slice(0, MAX_QUERIES)
    : [];

  if (!businessName || !location || !queries.length) {
    return json(400, {
      ok: false,
      error: "businessName, location and at least one query are required.",
    });
  }

  try {
    // Resolve the operator first so GO does not mistake a DBA / Google entity name
    // for an absent business. FSA is a good example: website branding and Google's
    // entity naming can differ.
    const identity = await resolveTargetIdentity({
      businessName,
      location,
      website,
      apiKey,
    });

    const queryResults = await Promise.all(
      queries.map((query) =>
        runMarketQuery({
          query,
          location,
          businessName,
          canonicalName: identity.name || businessName,
          website,
          apiKey,
        })
      )
    );

    const players = aggregatePlayers(
      queryResults,
      businessName,
      identity.name || businessName,
      website
    );
    const qualificationAudit = buildQualificationAudit(queryResults);

    return json(200, {
      ok: true,
      buildId: GO_MARKET_BUILD_ID,
      runtimeBuildId: GO_MARKET_BUILD_ID,
      market: {
        provider: "SerpApi",
        buildId: GO_MARKET_BUILD_ID,
        runtimeBuildId: GO_MARKET_BUILD_ID,
        observedAt: new Date().toISOString(),
        location,
        target: identity,
        queries: queryResults,
        players,
        qualificationAudit,
        runtimeDebug: {
          marketFunctionBuildId: GO_MARKET_BUILD_ID,
          frontendBuildIdReceived: frontendBuildId || "MISSING",
          runIdReceived: debugRunId || "MISSING",
          request: { businessName, website, location, queries },
          queryResults: queryResults.map(row => ({
            query: row.query,
            targetLocalPosition: row.targetLocalPosition ?? null,
            targetOrganicPosition: row.targetOrganicPosition ?? null,
            localResultsChecked: row.localResultsChecked ?? null,
            organicResultsChecked: row.organicResultsChecked ?? null,
            localResults: (row.localResults || []).slice(0, 10).map(x => ({ name: x.name || x.title || "", link: x.link || x.website || "", position: x.position ?? null, rating: x.rating ?? null, reviews: x.reviews ?? null })),
            organicResults: (row.organicResults || []).slice(0, 10).map(x => ({ title: x.title || x.name || "", link: x.link || "", position: x.position ?? null }))
          })),
          qualifiedPlayers: players.slice(0, 20).map(player => ({ name: player.name, website: player.website, category: player.category, queries: player.queries, reasons: player.qualificationReasons || [] }))
        },
        qualificationDebug: players.slice(0, 20).map(player => ({
          name: player.name,
          website: player.website,
          category: player.category,
          queries: player.queries,
          reasons: player.qualificationReasons || []
        })),
        searchesUsed:
          queryResults.reduce(
            (sum, row) => sum + (row.localSearchUsed ? 2 : 1),
            0
          ) + identity.searchesUsed,
      },
    });
  } catch (error) {
    console.error("SerpApi market intelligence error", error);
    return json(502, {
      ok: false,
      buildId: GO_MARKET_BUILD_ID,
      runtimeBuildId: GO_MARKET_BUILD_ID,
      error: error instanceof Error ? error.message : "Market intelligence provider failed.",
    });
  }
};

async function acquireWebsiteEvidence({ website, apiKey }) {
  const origin = new URL(website).origin;
  const hostName = host(website);
  const pages = [];
  const seen = new Set();
  const bookingEvidence = [];

  const addBookingEvidence = (html, pageUrl) => {
    const raw = String(html || "");
    for (const match of raw.matchAll(/<(?:a|iframe|script)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi)) {
      try {
        const url = new URL(decodeEntities(match[1]), pageUrl).href;
        if (/book|reserve|availability|checkout|ticket|peek|fareharbor|junglebee|bokun|rezdy|xola|tripworks|checkfront|bookeo|rezgo|rocketrez/i.test(url)) {
          bookingEvidence.push(`BOOKING TECH URL: ${url}`);
        }
      } catch {}
    }
    for (const match of raw.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const label = cleanTextBlock(decodeEntities(match[2].replace(/<[^>]+>/g, " ")));
      if (!/book|reserve|availability|checkout|ticket/i.test(label)) continue;
      try { bookingEvidence.push(`BOOKING CTA: ${label} ${new URL(decodeEntities(match[1]), pageUrl).href}`); } catch {}
    }
  };

  const addPage = (url, text, source) => {
    const clean = cleanTextBlock(text);
    if (!url || !clean || clean.length < 180 || looksLikeChallenge(clean) || seen.has(url)) return;
    seen.add(url);
    pages.push({ url, markdown: clean.slice(0, 90000), source });
  };

  // 1) Server-side HTML retrieval. This is independent of Jina/browser rendering and
  // often succeeds when a public reader is challenged.
  const home = await fetchPublicHtml(website).catch(() => null);
  if (home) {
    addBookingEvidence(home.html, website);
    addPage(website, htmlToEvidence(home.html, website), "direct-html");
    const links = extractInternalLinks(home.html, origin).slice(0, 10);
    for (const link of links.slice(0, 6)) {
      const page = await fetchPublicHtml(link).catch(() => null);
      if (page) {
        addBookingEvidence(page.html, link);
        addPage(link, htmlToEvidence(page.html, link), "direct-html");
      }
      if (pages.length >= 6) break;
    }
  }

  // 2) Search-index recovery. This both validates that the domain represents the
  // business and recovers product/page language when direct retrieval is thin.
  let indexed = [];
  if (apiKey && hostName) {
    const payload = await serpSearch({ engine: "google", q: `site:${hostName}`, num: 10, hl: "en", api_key: apiKey }).catch(() => null);
    indexed = normalizeOrganic(payload?.organic_results || []).filter(row => host(row.link) === hostName);
    for (const row of indexed) {
      addPage(row.link || website, `Title: ${row.title}\n${row.snippet}`, "google-index");
    }
  }

  const directChars = pages.filter(p => p.source === "direct-html").reduce((n,p) => n + p.markdown.length, 0);
  const meaningful = pages.some(p => /book|tour|charter|ride|rental|dive|cruise|experience|activity|trip|lesson|adventure/i.test(p.markdown));
  return {
    website,
    pages: pages.slice(0, 10),
    indexedPages: indexed.slice(0, 10),
    sufficient: directChars >= 1200 && meaningful,
    directChars,
    bookingEvidence: [...new Set(bookingEvidence)].slice(0, 40).join("\n"),
    note: pages.length ? "Recovered first-party website evidence before operator modeling." : "Could not recover sufficient first-party website evidence."
  };
}

async function fetchPublicHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; GrowthOperator/1.0; +public-business-analysis)"
      },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Website returned ${res.status}`);
    const html = await res.text();
    if (!html || html.length < 200) throw new Error("Website returned too little content");
    return { html };
  } finally { clearTimeout(timer); }
}

function htmlToEvidence(html, url) {
  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, " "));
  const links = [];
  for (const match of String(html || "").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const href = new URL(decodeEntities(match[1]), url).href;
      const label = cleanTextBlock(decodeEntities(match[2].replace(/<[^>]+>/g, " ")));
      if (label && /^https?:\/\//i.test(href)) links.push(`[${label}](${href})`);
    } catch {}
  }
  const headingized = String(html || "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, value) => `\n# ${decodeEntities(value.replace(/<[^>]+>/g, " "))}\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, value) => `\n## ${decodeEntities(value.replace(/<[^>]+>/g, " "))}\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, value) => `\n### ${decodeEntities(value.replace(/<[^>]+>/g, " "))}\n`);
  const providerUrls = [...new Set((String(html || "").match(/https?:\/\/[^\s"'<>]+(?:peek|fareharbor|junglebee|bokun|rezdy|xola|tripworks|checkfront|bookeo|rezgo|rocketrez)[^\s"'<>]*/gi) || []))]
    .slice(0, 20)
    .map(value => `BOOKING LINK: ${value}`);
  const body = headingized
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|nav|a)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return `URL: ${url}\nTitle: ${title}\n${links.join("\n")}\n${providerUrls.join("\n")}\n\n${decodeEntities(body)}`;
}

function extractInternalLinks(html, origin) {
  const scored = [];
  const seen = new Set();
  const utilityLabel = /^(home|about|contact|faq|faqs|blog|news|gallery|reviews?|privacy|terms|policy|login|sign in|cart|checkout|donate|shop|search|menu)$/i;

  for (const match of String(html || "").matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const u = new URL(decodeEntities(match[1]), origin);
      if (u.origin !== origin || seen.has(u.href)) continue;
      const label = cleanTextBlock(decodeEntities(match[2].replace(/<[^>]+>/g, " ")));
      const path = u.pathname.toLowerCase();
      if (!label || utilityLabel.test(label)) continue;
      if (/privacy|terms|policy|login|account|cart|checkout|blog|news|faq|contact|about|gallery|donate|shop/.test(path)) continue;
      if (label.length < 3 || label.length > 100) continue;
      seen.add(u.href);
      const depth = u.pathname.split('/').filter(Boolean).length;
      let score = 4;
      if (label.split(/\s+/).length >= 2) score += 2;
      if (depth >= 1 && depth <= 3) score += 2;
      if (/\/(tours?|experiences?|activities?|services?|products?|book)(?:\/|$)/i.test(path)) score += 3;
      if (/book|reserve|availability|pricing|price/i.test(label)) score += 2;
      scored.push({ url: u.href, score });
    } catch {}
  }
  return scored.sort((a,b) => b.score-a.score).map(x => x.url);
}

function looksLikeChallenge(text) {
  return /robot challenge|captcha|verify you are human|access denied|checking your browser|enable javascript and cookies/i.test(text);
}

function cleanTextBlock(value) {
  return decodeEntities(String(value || ""))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

async function runMarketQuery({
  query,
  location,
  businessName,
  canonicalName,
  website,
  apiKey,
}) {
  const organicPayload = await serpSearch({
    engine: "google",
    q: query,
    location,
    gl: "us",
    hl: "en",
    device: "desktop",
    api_key: apiKey,
  });

  const organicResults = normalizeOrganic(organicPayload.organic_results || []);
  let localResults = normalizeLocal(extractLocalFromGoogle(organicPayload));
  let localSearchUsed = false;

  // Speed rule: the normal Google response often already contains a local pack. Use it.
  // A second google_local request for every query doubled the slowest part of the scan.
  // Only spend that extra request when Google returned no local evidence at all.
  if (localResults.length === 0) {
    const localPayload = await serpSearch({
      engine: "google_local",
      q: query,
      location,
      gl: "us",
      hl: "en",
      device: "desktop",
      api_key: apiKey,
    });
    localResults = normalizeLocal(localPayload.local_results || []);
    localSearchUsed = true;
  }

  const targetNames = [businessName, canonicalName].filter(Boolean);
  const targetOrganicPosition = findTargetPosition(
    organicResults,
    targetNames,
    website,
    "position"
  );
  const targetLocalPosition = findTargetPosition(
    localResults,
    targetNames,
    website,
    "position"
  );

  return {
    query,
    targetOrganicPosition,
    targetLocalPosition,
    organicResultsChecked: organicResults.length,
    localResultsChecked: localResults.length,
    organicResults,
    localResults,
    localSearchUsed,
  };
}

async function resolveTargetIdentity({ businessName, location, website, apiKey }) {
  const targetHost = host(website);
  const hostLabel = targetHost ? targetHost.split(".")[0] : "";
  const identityQueries = [
    `${businessName} ${location}`,
    targetHost ? `${targetHost} ${location}` : "",
    hostLabel && hostLabel !== targetHost ? `${hostLabel} ${location}` : "",
  ].filter(Boolean);

  const seen = [];

  for (const query of [...new Set(identityQueries)]) {
    const payload = await serpSearch({
      engine: "google_local",
      q: query,
      location,
      gl: "us",
      hl: "en",
      device: "desktop",
      api_key: apiKey,
    });

    const results = normalizeLocal(payload.local_results || []);
    seen.push(...results);

    const exact = results.find((item) =>
      matchesTarget(item, [businessName], website)
    );

    if (exact) {
      return targetIdentityFromMatch(exact, website, query, seen.length);
    }
  }

  // If Google uses a different public entity / DBA name, website-domain matching
  // is the strongest public bridge between the operator site and Google entity.
  if (targetHost) {
    const domainMatch = seen.find((item) => host(item.website) === targetHost);
    if (domainMatch) {
      return targetIdentityFromMatch(
        domainMatch,
        website,
        "website-domain match",
        seen.length
      );
    }
  }

  return {
    name: businessName,
    website,
    rating: null,
    reviews: null,
    localPosition: null,
    address: "",
    placeId: "",
    source: "SerpApi Google Local",
    identityVerified: false,
    identityNote:
      "GO did not verify a matching Google local entity strongly enough to make exact absence claims.",
    searchesUsed: [...new Set(identityQueries)].length,
  };
}

function targetIdentityFromMatch(match, website, query, searchesUsed) {
  return {
    name: match.title,
    website: match.website || website,
    rating: match.rating || null,
    reviews: match.reviews || null,
    localPosition: match.position || null,
    address: match.address || "",
    placeId: match.placeId || "",
    source: "SerpApi Google Local",
    identityVerified: true,
    identityNote: `GO matched the operator to Google's local entity using ${query}.`,
    searchesUsed: Math.max(1, searchesUsed),
  };
}

async function serpSearch(params) {
  const url = new URL(SERP_ENDPOINT);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.error) {
      throw new Error(payload.error || `SerpApi returned ${res.status}`);
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function extractLocalFromGoogle(payload) {
  const local = payload && payload.local_results;
  if (!local) return [];
  if (Array.isArray(local)) return local;
  if (Array.isArray(local.places)) return local.places;
  return [];
}

function normalizeOrganic(items) {
  return items
    .slice(0, MAX_ORGANIC)
    .map((item) => ({
      position: numberOrNull(item.position),
      title: cleanText(item.title),
      link: cleanUrl(item.link),
      domain: host(item.link),
      snippet: cleanText(item.snippet),
      rating: numberOrNull(item.rating),
      reviews: integerOrNull(item.reviews),
    }))
    .filter((item) => item.title || item.link);
}

function normalizeLocal(items) {
  return items
    .slice(0, MAX_LOCAL)
    .map((item) => ({
      position: numberOrNull(item.position),
      title: cleanText(item.title),
      rating: numberOrNull(item.rating),
      reviews: integerOrNull(item.reviews),
      type: cleanText(item.type),
      address: cleanText(item.address),
      website: cleanUrl(item.website || item.links?.website || item.link),
      placeId: cleanText(item.place_id),
      gps: item.gps_coordinates || null,
    }))
    .filter((item) => item.title);
}

function buildQualificationAudit(queryResults) {
  const audit = [];
  queryResults.forEach((row) => {
    row.localResults.forEach((item) => {
      const q = qualifyLocalMarketResult(item, row.query);
      audit.push({ query: row.query, source: "Google Local", name: item.title || "", url: item.website || "", type: item.type || "", category: q.category, accepted: !!q.include, reason: q.reason });
    });
    row.organicResults.forEach((item) => {
      if (isLowValueOrganicDomain(item.domain)) {
        audit.push({ query: row.query, source: "Google Organic", name: item.title || "", url: item.link || "", type: "", category: "noise", accepted: false, reason: "Low-value social/community domain" });
        return;
      }
      const q = qualifyOrganicMarketResult(item, row.query);
      audit.push({ query: row.query, source: "Google Organic", name: item.title || "", url: item.link || "", type: "", category: q.category, accepted: !!q.include, reason: q.reason });
    });
  });
  return audit.slice(0, 120);
}

function aggregatePlayers(
  queryResults,
  businessName,
  canonicalName,
  website
) {
  const map = new Map();
  const targetNames = [businessName, canonicalName].filter(Boolean);

  queryResults.forEach((row) => {
    row.localResults.forEach((item) => {
      const qualification = qualifyLocalMarketResult(item, row.query);
      if (!qualification.include) return;
      addPlayer(
        map,
        {
          name: item.title,
          website: item.website,
          rating: item.rating,
          reviews: item.reviews,
          localPosition: item.position,
          organicPosition: null,
          query: row.query,
          source: "Google Local",
          resultType: item.type || "",
          address: item.address || "",
          qualification,
        },
        targetNames,
        website
      );
    });

    row.organicResults.forEach((item) => {
      if (isLowValueOrganicDomain(item.domain)) return;
      const qualification = qualifyOrganicMarketResult(item, row.query);
      if (!qualification.include) return;

      addPlayer(
        map,
        {
          name: item.title,
          website: item.link,
          rating: item.rating,
          reviews: item.reviews,
          localPosition: null,
          organicPosition: item.position,
          query: row.query,
          source: "Google Organic",
          qualification,
        },
        targetNames,
        website
      );
    });
  });

  return [...map.values()]
    .filter((player) => !player.isTarget)
    .sort((a, b) => {
      const aScore =
        (a.appearances || 0) * 10 -
        (a.bestLocalPosition || 20) -
        (a.bestOrganicPosition || 20);
      const bScore =
        (b.appearances || 0) * 10 -
        (b.bestLocalPosition || 20) -
        (b.bestOrganicPosition || 20);
      return bScore - aScore;
    })
    .slice(0, 20);
}

function addPlayer(map, item, targetNames, website) {
  const category = item.qualification?.category || classifyPlayer(item.website, item.name, item.resultType);
  const key = playerKey(item.name, item.website);
  if (!key) return;

  const isTarget = matchesTarget(
    { title: item.name, website: item.website },
    targetNames,
    website
  );

  const current = map.get(key) || {
    name: item.name,
    website: item.website || "",
    link: item.website || "",
    category,
    appearances: 0,
    queries: [],
    rating: null,
    reviews: null,
    bestLocalPosition: null,
    bestOrganicPosition: null,
    sources: [],
    qualificationReasons: [],
    isTarget,
  };

  current.appearances += 1;
  if (item.query && !current.queries.includes(item.query)) {
    current.queries.push(item.query);
  }
  if (item.rating && (!current.rating || item.rating > current.rating)) {
    current.rating = item.rating;
  }
  if (item.reviews && (!current.reviews || item.reviews > current.reviews)) {
    current.reviews = item.reviews;
  }
  if (
    item.localPosition &&
    (!current.bestLocalPosition || item.localPosition < current.bestLocalPosition)
  ) {
    current.bestLocalPosition = item.localPosition;
  }
  if (
    item.organicPosition &&
    (!current.bestOrganicPosition ||
      item.organicPosition < current.bestOrganicPosition)
  ) {
    current.bestOrganicPosition = item.organicPosition;
  }
  if (item.source && !current.sources.includes(item.source)) {
    current.sources.push(item.source);
  }
  const qualificationReason = item.qualification?.reason || (item.source === "Google Local" ? "Google Local business result" : "Qualified commercial search result");
  if (qualificationReason && !current.qualificationReasons.includes(qualificationReason)) {
    current.qualificationReasons.push(qualificationReason);
  }
  if (!current.website && item.website) current.website = item.website;
  current.isTarget = current.isTarget || isTarget;
  map.set(key, current);
}

function classifyPlayer(url, name, resultType = "") {
  const domain = host(url);
  const value = `${domain} ${cleanText(name).toLowerCase()} ${cleanText(resultType).toLowerCase()}`;

  if (/(tripadvisor|viator|getyourguide|airbnb|expedia|travelocity|booking\.com|yelp)/i.test(value)) {
    return "marketplace";
  }

  if (isAuthorityLikeResult(value, domain)) {
    return "authority";
  }

  return "direct";
}

function isAuthorityLikeResult(value, domain = "") {
  const text = `${value || ""} ${domain || ""}`.toLowerCase();
  return /(department of tourism|tourism board|tourism authority|visitor bureau|visitors bureau|visitor center|tourist information|official tourism|official travel|travel guide|destination guide|things to do|travel blog|travel magazine|travel news|chamber of commerce|historical society|wikipedia|copyright|image\s*\d*|photo gallery|resident guide|cayman resident|visit[a-z0-9-]*\.|\.gov(?:\.|$)|government)/i.test(text)
    || /(^|\.)(lonelyplanet|frommers|fodors|tripadvisor|cntraveler|travelandleisure)\./i.test(domain || "");
}

function queryCommercialTerms(query) {
  const stop = new Set(["the","and","for","with","from","near","best","top","islands","island","cayman","grand","tours","tour","things","activities","company","official"]);
  return String(query || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(term => term.length >= 4 && !stop.has(term));
}

function qualifyLocalMarketResult(item, query) {
  const title = cleanText(item?.title || "");
  const type = cleanText(item?.type || "");
  const website = cleanUrl(item?.website || "");
  const domain = host(website);
  const combined = `${domain} ${title} ${type}`.toLowerCase();
  if (!title) return { include: false, category: "noise", reason: "Missing local business identity" };

  const marketplace = /(tripadvisor|viator|getyourguide|airbnb|expedia|travelocity|booking\.com|yelp)/i.test(combined);
  if (marketplace) return { include: true, category: "marketplace", reason: "Marketplace/discovery surface in Google local results" };

  if (isAuthorityLikeResult(combined, domain)) {
    return { include: true, category: "authority", reason: "Destination/tourism authority in Google local results; demand context only" };
  }

  const terms = queryCommercialTerms(query);
  const overlap = terms.filter(term => combined.includes(term)).length;
  const commercialType = /(tour operator|tour agency|travel agency|boat tour|boat rental|dive shop|diving center|diving centre|scuba|charter|cruise|tourist attraction|outdoor activity|adventure sports|fishing charter|horseback|rafting|kayak|watersports?|excursion)/i.test(type);
  const commercialName = /(tour|charter|cruise|diving|dive|scuba|snorkel|fishing|sailing|excursion|adventure|rental|ride|experience|activity|boat|watersports?|horseback|rafting|kayak)/i.test(title);

  if ((commercialType || commercialName) && (terms.length === 0 || overlap >= 1 || commercialType)) {
    return { include: true, category: "direct", reason: `Google Local bookable-experience business${overlap ? ` matching ${overlap} specific query term${overlap === 1 ? "" : "s"}` : ""}` };
  }

  return { include: false, category: "noise", reason: "Local result does not look like a comparable tour/activity business for this search" };
}

function qualifyOrganicMarketResult(item, query) {
  const title = cleanText(item?.title || "");
  const snippet = cleanText(item?.snippet || "");
  const domain = String(item?.domain || host(item?.link) || "").toLowerCase();
  const text = `${title} ${snippet}`.toLowerCase();
  const combined = `${domain} ${text}`;
  if (!title && !domain) return { include: false, category: "noise", reason: "Missing usable result identity" };

  const marketplace = /(tripadvisor|viator|getyourguide|airbnb|expedia|travelocity|booking\.com|yelp)/i.test(combined);
  if (marketplace) return { include: true, category: "marketplace", reason: "Marketplace/discovery surface where travelers can compare or book experiences" };

  if (isAuthorityLikeResult(combined, domain)) {
    return { include: true, category: "authority", reason: "Destination/editorial authority; useful for demand context but not treated as a competing operator" };
  }

  const terms = queryCommercialTerms(query);
  const overlap = terms.filter(term => text.includes(term) || domain.includes(term)).length;
  const productLanguage = /(tour|charter|cruise|diving|dive|scuba|snorkel|fishing|sailing|excursion|adventure|rental|ride|trip|experience|activity|attraction|boat|watersports?|horseback|rafting|kayak)/i.test(text);
  const transactionLanguage = /(book(?:ing)?|reserve|availability|check availability|price|pricing|from \$|per person|private|small group|departures?|daily tours?|tickets?)/i.test(text);
  const operatorLanguage = /(we offer|our tours?|our charters?|our dives?|our excursions?|locally owned|tour operator|dive operator|charter company|adventure company)/i.test(text);
  const obviousNonCommercial = /(copyright|all rights reserved|privacy policy|terms of use|image|photo|lyrics|song|chemical|distributor|research|pdf|news|article|blog post)/i.test(text);

  if (obviousNonCommercial) {
    return { include: false, category: "noise", reason: "Editorial/utility/non-commercial result" };
  }

  // A direct competitor must look like a business selling the searched experience,
  // not merely a page that mentions the same words.
  const strongCommercial = productLanguage && (transactionLanguage || operatorLanguage);
  const queryMatch = terms.length === 0 ? productLanguage : overlap >= 1;
  const unrelatedCorporate = /(?:chemical|premix|fiber|telecom|insurance|bank|law|real estate|construction|distribution|distributor|medical|clinic|school|university)/i.test(text);
  if (strongCommercial && queryMatch && !unrelatedCorporate) {
    return { include: true, category: "direct", reason: `Comparable bookable-experience business${overlap ? ` matching ${overlap} specific query term${overlap === 1 ? "" : "s"}` : ""}` };
  }

  return { include: false, category: "noise", reason: "Result mentions the market but does not provide enough evidence of a comparable bookable experience business" };
}

function isLowValueOrganicDomain(domain) {
  return /(^|\.)(facebook|instagram|youtube|tiktok|pinterest|reddit|wikipedia)\./i.test(
    domain || ""
  );
}

function findTargetPosition(items, targetNames, website, field) {
  const match = items.find((item) => matchesTarget(item, targetNames, website));
  return match ? numberOrNull(match[field]) : null;
}

function matchesTarget(item, targetNames, website) {
  const targetHost = host(website);
  const itemHost = host(item.website || item.link);

  if (
    targetHost &&
    itemHost &&
    (itemHost === targetHost ||
      itemHost.endsWith(`.${targetHost}`) ||
      targetHost.endsWith(`.${itemHost}`))
  ) {
    return true;
  }

  return targetNames.some((targetName) => namesLikelyMatch(item.title || item.name, targetName));
}

function namesLikelyMatch(valueA, valueB) {
  const left = nameTokens(valueA);
  const right = nameTokens(valueB);

  if (!left.length || !right.length) return false;

  const overlap = left.filter((token) => right.includes(token)).length;
  const threshold = Math.min(2, left.length, right.length);
  return overlap >= threshold;
}

function playerKey(name, url) {
  const h = host(url);
  if (h) return h;
  const tokens = nameTokens(name);
  return tokens.join("-");
}

function nameTokens(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 2 &&
        ![
          "the",
          "and",
          "tour",
          "tours",
          "adventure",
          "adventures",
          "palm",
          "springs",
          "california",
        ].includes(token)
    );
}

function host(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function cleanUrl(value) {
  const text = cleanText(value);
  if (!text) return "";

  try {
    return new URL(text).toString();
  } catch {
    return "";
  }
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function integerOrNull(value) {
  const n = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function response(status, body) {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}