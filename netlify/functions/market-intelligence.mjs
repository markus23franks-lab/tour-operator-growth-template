const SERP_ENDPOINT = "https://serpapi.com/search.json";
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

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return json(500, {
      ok: false,
      error: "SERPAPI_KEY is not configured on the server.",
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const businessName = cleanText(body.businessName);
  const website = cleanUrl(body.website);
  const location = cleanText(body.location);

  // Acquisition is intentionally separate from market judgment. The browser-side
  // reader can occasionally return challenge/interstitial text; GO must recover
  // first-party evidence before it tries to model or judge the operator.
  if (body.action === "acquire") {
    if (!website) return json(400, { ok: false, error: "website is required." });
    try {
      const acquisition = await acquireWebsiteEvidence({ website, apiKey });
      return json(200, { ok: true, acquisition });
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

    return json(200, {
      ok: true,
      market: {
        provider: "SerpApi",
        observedAt: new Date().toISOString(),
        location,
        target: identity,
        queries: queryResults,
        players,
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
      error: error instanceof Error ? error.message : "Market intelligence provider failed.",
    });
  }
};

async function acquireWebsiteEvidence({ website, apiKey }) {
  const origin = new URL(website).origin;
  const hostName = host(website);
  const pages = [];
  const seen = new Set();

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
    addPage(website, htmlToEvidence(home.html, website), "direct-html");
    const links = extractInternalLinks(home.html, origin).slice(0, 10);
    for (const link of links.slice(0, 6)) {
      const page = await fetchPublicHtml(link).catch(() => null);
      if (page) addPage(link, htmlToEvidence(page.html, link), "direct-html");
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

  if (localResults.length < 3) {
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

function aggregatePlayers(
  queryResults,
  businessName,
  canonicalName,
  website
) {
  const map = new Map();
  const targetNames = [businessName, canonicalName].filter(Boolean);

  queryResults.forEach((row) => {
    row.localResults.forEach((item) =>
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
        },
        targetNames,
        website
      )
    );

    row.organicResults.forEach((item) => {
      if (isLowValueOrganicDomain(item.domain)) return;
      if (!isCommerciallyRelevantOrganicResult(item, row.query)) return;

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
  const category = classifyPlayer(item.website, item.name);
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
  if (!current.website && item.website) current.website = item.website;
  current.isTarget = current.isTarget || isTarget;
  map.set(key, current);
}

function classifyPlayer(url, name) {
  const value = `${host(url)} ${cleanText(name).toLowerCase()}`;

  if (
    /(tripadvisor|viator|getyourguide|airbnb|expedia|yelp|travelocity|booking\.com)/i.test(
      value
    )
  ) {
    return "marketplace";
  }

  if (
    /(visitpalmsprings|visitgreaterpalmsprings|tourism|chamber|city of|official|travel guide|historical society|museum|modernism week)/i.test(
      value
    )
  ) {
    return "authority";
  }

  return "direct";
}


function isCommerciallyRelevantOrganicResult(item, query) {
  const title = cleanText(item?.title || "");
  const snippet = cleanText(item?.snippet || "");
  const domain = String(item?.domain || "");
  const text = `${title} ${snippet}`.toLowerCase();
  if (!title && !domain) return false;

  // Keep obvious operator/commerce results and tourism authorities/marketplaces.
  if (/tour|charter|cruise|diving|dive|scuba|snorkel|fishing|sailing|excursion|adventure|rental|ride|trip|experience|activity|tickets?|booking|reserve/i.test(text)) return true;
  if (/tripadvisor|viator|getyourguide|yelp|tourism|visit|chamber|museum/i.test(`${domain} ${text}`)) return true;

  // Otherwise require meaningful overlap with the commercial part of the query. This blocks
  // celebrity songs/images/editorial pages from being promoted as market competitors.
  const stop = new Set(["the","and","for","with","from","near","best","top","islands","island","cayman","grand","tours","tour"]);
  const terms = String(query || "").toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 4 && !stop.has(t));
  const overlap = terms.filter(term => text.includes(term)).length;
  return overlap >= Math.min(2, Math.max(1, terms.length));
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