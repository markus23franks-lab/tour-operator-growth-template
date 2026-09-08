const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('load-caicos').addEventListener('click', () => {
  $('website').value = 'https://caicosdreamtours.com/';
  $('business-name').value = 'Caicos Dream Tours';
  $('location').value = 'Turks and Caicos Islands';
  $('queries').value = [
    'Turks and Caicos sand bar snorkel cruise',
    'Turks and Caicos private boat charters',
    'Turks and Caicos shipwrecks floating bar adults only',
    'Turks and Caicos snorkel sunset sail',
    'Turks and Caicos dream day getaway'
  ].join('\n');
});

$('load-profile').addEventListener('click', () => {
  const raw = localStorage.getItem('growthOperatorProspectProfile') || localStorage.getItem('growthOperatorBusinessReviewProfile');
  if (!raw) return setStatus('No saved Analyzer profile found in this browser. Run Analyzer first or enter the test manually.', true);
  try {
    const p = JSON.parse(raw);
    $('website').value = p.website || p.url || '';
    $('business-name').value = p.businessName || p.name || '';
    $('location').value = p.businessContext?.location || p.location || p.publicProfile?.location || '';
    const searches = p.discoveryIntelligence?.searches?.map(x => x.query) || p.marketEvidence?.checkedSearches || p.pipelineDebug?.market?.queries || [];
    $('queries').value = [...new Set(searches.filter(Boolean))].join('\n');
    setStatus(`Loaded saved profile for ${p.businessName || 'operator'}. Review the fields, then run the evidence layer directly.`);
  } catch { setStatus('The saved Analyzer profile could not be parsed.', true); }
});

$('run').addEventListener('click', run);

async function run() {
  const website = $('website').value.trim();
  const businessName = $('business-name').value.trim();
  const location = $('location').value.trim();
  const queries = [...new Set($('queries').value.split('\n').map(x => x.trim()).filter(Boolean))].slice(0, 10);
  if (!website || !businessName || !location || !queries.length) return setStatus('Website, business name, location and at least one commercial search are required.', true);
  setStatus(`Testing ${queries.length} searches against the production discovery provider…`);
  $('results').hidden = true;
  const started = performance.now();
  try {
    const res = await fetch('/.netlify/functions/market-intelligence', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessName,website,location,queries,frontendBuildId:'B038-GO-JUDGMENT-ENGINE-V1',debugRunId:`HARNESS-${Date.now()}`})});
    const payload = await res.json().catch(() => ({}));
    const clientMs = Math.round(performance.now() - started);
    if (!res.ok || !payload.ok || !payload.market) throw new Error(payload.error || `Provider returned HTTP ${res.status}`);
    render(payload, clientMs);
    setStatus(`Evidence test complete. GO Judgment V1 has synthesized the evidence below; the full evidence lab remains available for inspection.`);
  } catch (err) { setStatus(`Evidence test failed: ${err.message}`, true); }
}

function setStatus(text, error=false){$('status').hidden=false;$('status').textContent=text;$('status').style.borderColor=error?'#713943':''}
function render(payload, clientMs){
  const m=payload.market, rows=m.queries||[], target=m.target||{}, players=m.players||[], audit=m.qualificationAudit||{};
  const visible=rows.filter(r=>r.targetLocalPosition||r.targetOrganicPosition).length;
  const failed=rows.filter(r=>r.providerError).length;
  const providerCalls=Number(m.searchesUsed||0);
  const avg=rows.length?Math.round(rows.reduce((n,r)=>n+Number(r.timing?.totalMs||0),0)/rows.length):0;
  $('metrics').innerHTML=metric(rows.length,'queries tested')+metric(visible,'operator visible')+metric(rows.length-visible,'observed gaps')+metric(failed,'provider failures')+metric(providerCalls,'provider searches')+metric(`${(clientMs/1000).toFixed(1)}s`,'end-to-end latency');
  const judgment = window.GOJudgment?.build ? window.GOJudgment.build(m, $('website').value.trim()) : null;
  renderJudgment(judgment);
  $('provider').textContent=`${m.provider||'Unknown provider'} · ${m.buildId||payload.buildId||''}`;
  $('identity').innerHTML=`<div class="identity">${kv('Resolved name',target.name||'—')}${kv('Verified',target.identityVerified?'YES':'NO')}${kv('Rating',target.rating??'—')}${kv('Reviews',target.reviews??'—')}${kv('Identity source',target.source||'—')}</div><p class="note">${esc(target.identityNote||'')}</p>`;
  $('query-results').innerHTML=rows.map(renderQuery).join('')||'<p class="note">No query rows returned.</p>';
  $('players').innerHTML=renderPlayers(players);
  $('audit').innerHTML=renderAudit(audit);
  $('raw').textContent=JSON.stringify(payload,null,2);
  $('results').hidden=false;
}
function metric(v,l){return `<div class="metric"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`}
function kv(k,v){return `<div class="kv"><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`}
function renderQuery(r){
  const local=r.targetLocalPosition?`Maps/local #${r.targetLocalPosition}`:`Local: not found in ${r.localResultsChecked||0}`;
  const organic=r.targetOrganicPosition?`Organic #${r.targetOrganicPosition}`:`Organic: not found in ${r.organicResultsChecked||0}`;
  const cls=(r.targetLocalPosition||r.targetOrganicPosition)?'good':'gap';
  const error = r.providerError ? `<div class="provider-error"><b>Provider warning:</b> ${esc(r.providerError)}</div>` : '';
  return `<article class="query-card"><div class="query-title"><h3>${esc(r.query)}</h3><div class="positions"><span class="pill ${cls}">${esc(local)}</span><span class="pill ${cls}">${esc(organic)}</span><span class="pill">${esc(r.timing?.totalMs??'—')} ms</span></div></div>${error}<div class="result-grid">${resultList('LOCAL / MAPS',r.localResults||[],true)}${resultList('ORGANIC',r.organicResults||[],false)}</div></article>`;
}
function resultList(title,rows,local){return `<div class="result-list"><h4>${title} · ${rows.length} OBSERVED</h4>${rows.slice(0,10).map(x=>`<div class="result-row"><span class="pos">#${esc(x.position??'—')}</span><span><b>${esc(x.name||x.title||'Unknown')}</b><br><small>${esc(x.website||x.link||x.address||'')}</small></span><small>${local&&x.rating?`${esc(x.rating)} ★ · ${esc(x.reviews??0)} reviews`:''}</small></div>`).join('')||'<div class="result-row"><span>—</span><span>No results returned</span><span></span></div>'}</div>`}
function renderPlayers(rows){if(!rows.length)return '<p class="note">No qualified players returned.</p>';return `<table class="table"><thead><tr><th>PLAYER</th><th>TYPE</th><th>QUERIES</th><th>BEST LOCAL</th><th>BEST ORGANIC</th><th>TRUST</th><th>WHY ACCEPTED</th></tr></thead><tbody>${rows.slice(0,30).map(p=>`<tr><td><b>${esc(p.name)}</b><br><small>${esc(p.website||'')}</small></td><td>${esc(p.category||'')}</td><td>${esc((p.queries||[]).join(' · '))}</td><td>${esc(p.bestLocalPosition??'—')}</td><td>${esc(p.bestOrganicPosition??'—')}</td><td>${p.rating?`${esc(p.rating)} ★ / ${esc(p.reviews??0)}`:'—'}</td><td>${esc((p.qualificationReasons||[]).join(' · '))}</td></tr>`).join('')}</tbody></table>`}
function renderAudit(a){const rows=Array.isArray(a)?a.map(x=>({...x,state:x.accepted?'accepted':'rejected'})):[...(a?.accepted||[]).map(x=>({...x,state:'accepted'})),...(a?.rejected||[]).map(x=>({...x,state:'rejected'}))];if(!rows.length)return '<p class="note">No qualification audit rows returned.</p>';return `<table class="table"><thead><tr><th>STATE</th><th>ENTITY</th><th>SOURCE</th><th>QUERY</th><th>REASON</th></tr></thead><tbody>${rows.slice(0,120).map(x=>`<tr><td class="${x.state}">${x.state.toUpperCase()}</td><td>${esc(x.name||x.title||x.website||'—')}</td><td>${esc(x.source||'—')}</td><td>${esc(x.query||'—')}</td><td>${esc(x.reason||x.reasons||x.qualificationReason||'—')}</td></tr>`).join('')}</tbody></table>`}


function renderJudgment(j){
  const host=$('judgment');
  if(!j){host.innerHTML='<p class="note">GO Judgment engine unavailable.</p>';return;}
  const comp = j.primaryCompetitors?.length ? `<div class="judgment-competitors">${j.primaryCompetitors.map(c=>`<div><strong>${esc(c.name)}</strong><span>${esc(c.surface)} #${esc(c.position)}${c.rating?` · ${esc(c.rating)}★`:''}${c.reviews?` · ${esc(c.reviews)} reviews`:''}</span></div>`).join('')}</div>` : '<p class="note">No ranked competitor comparison was available for the primary query.</p>';
  host.innerHTML=`
    <div class="judgment-head"><div><p class="eyebrow">GO JUDGMENT · V1</p><h2>${esc(j.headline)}</h2><p class="judgment-summary">${esc(j.summary)}</p></div><div class="confidence"><small>CONFIDENCE</small><strong>${esc(j.confidence)}</strong><span>${esc(j.constraint)}</span></div></div>
    <div class="judgment-grid">
      <div class="judgment-block"><small>WHAT GO FOUND</small>${j.facts.map(x=>`<p>${esc(x)}</p>`).join('')}</div>
      <div class="judgment-block"><small>COUNTER-EVIDENCE</small>${j.counterEvidence.map(x=>`<p>${esc(x)}</p>`).join('')}</div>
    </div>
    <div class="primary-query"><small>PRIMARY SEARCH TO INVESTIGATE</small><h3>${esc(j.primaryQuery||'No single search should drive the mission yet.')}</h3><p>${esc(j.primaryQueryObservation||'GO needs more evidence before choosing a search-led mission.')}</p>${comp}</div>
    <div class="decision-grid">
      <div class="decision-card"><small>WHAT GO WOULD DO</small><p>${esc(j.action)}</p></div>
      <div class="decision-card"><small>WHAT GO WOULD MEASURE</small><p>${j.measurement.map(esc).join(' → ')}</p></div>
      <div class="decision-card"><small>WHAT GO STILL NEEDS</small><p>${j.connectedDataNeeded.map(esc).join(' · ')}</p></div>
    </div>`;
}