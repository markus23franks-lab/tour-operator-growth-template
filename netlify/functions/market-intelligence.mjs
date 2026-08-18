const SERP_ENDPOINT = "https://serpapi.com/search.json";
const MAX_QUERIES = 3;
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