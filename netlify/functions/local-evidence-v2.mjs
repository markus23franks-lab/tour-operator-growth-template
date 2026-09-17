const SERP_ENDPOINT = 'https://serpapi.com/search.json';

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response('', { status: 204 });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let body = {};
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'Invalid JSON body' }); }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return json(500, { ok: false, error: 'SERPAPI_KEY is not configured' });

  const queries = Array.isArray(body.queries) ? [...new Set(body.queries.map(clean).filter(Boolean))].slice(0, 8) : [];
  if (!queries.length) return json(400, { ok: false, error: 'queries are required' });

  const rows = await Promise.all(queries.map(async query => {
    const started = Date.now();
    try {
      const payload = await serp({
        engine: 'google_maps',
        q: query,
        type: 'search',
        hl: 'en',
        api_key: apiKey
      }, 6500);
      const localResults = normalize(payload.local_results || []);
      return { query, localResults, error: '', elapsedMs: Date.now() - started };
    } catch (error) {
      return { query, localResults: [], error: error instanceof Error ? error.message : String(error), elapsedMs: Date.now() - started };
    }
  }));

  return json(200, {
    ok: true,
    provider: 'SerpApi Google Maps fallback',
    observedAt: new Date().toISOString(),
    queries: rows
  });
};

async function serp(params, timeoutMs) {
  const url = new URL(SERP_ENDPOINT);
  Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v)); });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.error) throw new Error(payload.error || `SerpApi returned ${res.status}`);
    return payload;
  } finally { clearTimeout(timer); }
}

function normalize(items) {
  return items.slice(0, 10).map((item, index) => ({
    position: numberOrNull(item.position) || index + 1,
    title: clean(item.title),
    rating: numberOrNull(item.rating),
    reviews: integerOrNull(item.reviews),
    type: clean(item.type),
    address: clean(item.address),
    website: cleanUrl(item.website || item.links?.website || item.link),
    placeId: clean(item.place_id || item.data_id)
  })).filter(item => item.title);
}

function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function cleanUrl(value) { try { return new URL(String(value || '')).href; } catch { return ''; } }
function numberOrNull(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function integerOrNull(value) { const n = Number(String(value ?? '').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? Math.round(n) : null; }
function json(status, payload) { return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
