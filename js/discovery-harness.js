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

async function providerCall({businessName,website,location,queries,tag}){
  const res=await fetch('/.netlify/functions/market-intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessName,website,location,queries,frontendBuildId:'B042-DEMAND-DISCOVERY-INTELLIGENCE-V1',debugRunId:`${tag}-${Date.now()}`})});
  const payload=await res.json().catch(()=>({}));
  if(!res.ok||!payload.ok||!payload.market)throw new Error(payload.error||`Provider returned HTTP ${res.status}`);
  return payload;
}
async function run(){
  const website=$('website').value.trim(),businessName=$('business-name').value.trim(),location=$('location').value.trim();
  const websiteQueries=[...new Set($('queries').value.split('\n').map(x=>x.trim()).filter(Boolean))].slice(0,5);
  if(!website||!businessName||!location||!websiteQueries.length)return setStatus('Website, business name, location and at least one operator/product search are required.',true);
  setStatus('Reading the operator, testing product-derived discovery, then probing broader traveler demand…');$('results').hidden=true;const started=performance.now();
  try{
    const acquisitionRes=await fetch('/.netlify/functions/market-intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'acquire',website,frontendBuildId:'B042-DEMAND-DISCOVERY-INTELLIGENCE-V1',debugRunId:`ACQUIRE-${Date.now()}`})}).catch(()=>null);
    const acquisitionPayload=acquisitionRes?await acquisitionRes.json().catch(()=>({})):{},acquisition=acquisitionPayload?.acquisition||null;
    const demand=window.GODemandIntelligence?.build({acquisition,location,websiteQueries})||{probes:[]},demandQueries=demand.probes.map(x=>x.query).filter(Boolean);
    const [operatorPayload,demandPayload]=await Promise.all([providerCall({businessName,website,location,queries:websiteQueries,tag:'OPERATOR'}),demandQueries.length?providerCall({businessName,website,location,queries:demandQueries,tag:'DEMAND'}):Promise.resolve(null)]);
    const op=operatorPayload.market,dm=demandPayload?.market||{queries:[],players:[],qualificationAudit:[],searchesUsed:0};
    const combinedRows=[...(op.queries||[]).map(x=>({...x,portfolioSource:'OPERATOR-LANGUAGE'})),...(dm.queries||[]).map(x=>({...x,portfolioSource:'TRAVELER-DEMAND',demandProbe:demand.probes.find(p=>p.query===x.query)||null}))];
    const dedup=[],seen=new Set();for(const row of combinedRows){const k=String(row.query||'').toLowerCase();if(!seen.has(k)){seen.add(k);dedup.push(row)}}
    const combined={...op,queries:dedup,players:[...(op.players||[]),...(dm.players||[])],qualificationAudit:[...(Array.isArray(op.qualificationAudit)?op.qualificationAudit:[]),...(Array.isArray(dm.qualificationAudit)?dm.qualificationAudit:[])],searchesUsed:Number(op.searchesUsed||0)+Number(dm.searchesUsed||0),demandIntelligence:demand};
    render({...operatorPayload,market:combined,acquisition,demandIntelligence:demand,operatorMarket:op,demandMarket:dm},Math.round(performance.now()-started));
    setStatus('Demand + Discovery Review complete. GO compared operator-derived searches with broader traveler-intent probes.');
  }catch(err){setStatus(`Evidence test failed: ${err.message}`,true)}
}

function setStatus(text, error=false){$('status').hidden=false;$('status').textContent=text;$('status').style.borderColor=error?'#713943':''}
function render(payload, clientMs){
  const m=payload.market, rows=m.queries||[], target=m.target||{}, players=m.players||[], audit=m.qualificationAudit||{};
  const visible=rows.filter(r=>r.targetLocalPosition||r.targetOrganicPosition).length;
  const failed=rows.filter(r=>r.providerError).length;
  const providerCalls=Number(m.searchesUsed||0);
  const avg=rows.length?Math.round(rows.reduce((n,r)=>n+Number(r.timing?.totalMs||0),0)/rows.length):0;
  $('metrics').innerHTML=metric(rows.length,'searches tested')+metric(visible,'operator visible')+metric(rows.length-visible,'observed gaps')+metric(failed,'provider failures')+metric(providerCalls,'provider searches')+metric(`${(clientMs/1000).toFixed(1)}s`,'end-to-end latency');
  window.__lastMarket = m;
  const opportunity = window.GOOpportunityIntelligence?.build ? window.GOOpportunityIntelligence.build(m, payload.acquisition) : null;
  const judgment = window.GOJudgment?.build ? window.GOJudgment.build(m, $('website').value.trim(), opportunity) : null;
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



function posText(row){
  const bits=[];
  if(row?.targetLocalPosition) bits.push(`Local #${row.targetLocalPosition}`);
  if(row?.targetOrganicPosition) bits.push(`Organic #${row.targetOrganicPosition}`);
  return bits.join(' · ') || 'Not observed';
}
function searchState(row){
  const best=Math.min(Number(row?.targetLocalPosition||999),Number(row?.targetOrganicPosition||999));
  if(best<=3) return ['WINNING','win'];
  if(best<999) return ['VISIBLE','visible'];
  return ['GAP','gap'];
}
function competitorLine(row,targetName){
  const all=[
    ...(row?.localResults||[]).map(x=>({...x,surface:'Local'})),
    ...(row?.organicResults||[]).map(x=>({...x,surface:'Organic'}))
  ].filter(x=>!String(x.name||x.title||'').toLowerCase().includes(String(targetName||'').toLowerCase()))
   .filter(x=>Number.isFinite(Number(x.position)))
   .sort((a,b)=>Number(a.position)-Number(b.position));
  const seen=new Set(), out=[];
  for(const x of all){
    const n=x.name||x.title||'Unknown';
    if(seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push(`${n} — ${x.surface} #${x.position}${x.rating?` · ${x.rating}★${x.reviews?` / ${Number(x.reviews).toLocaleString()} reviews`:''}`:''}`);
    if(out.length===2) break;
  }
  return out;
}
function renderSearchProof(m,o,source){
  const rows=(m?.queries||[]).filter(r=>r.portfolioSource===source),target=m?.target||{};
  return rows.map(row=>{
    const [label,cls]=searchState(row),op=(o?.opportunities||[]).find(x=>x.query===row.query),comps=competitorLine(row,target.name),commercial=op?.commercialImportance||'UNKNOWN';
    let meaning='';
    if(label==='WINNING')meaning=source==='TRAVELER-DEMAND'?'GO observed strong placement on a broader traveler-intent search tied to what you sell. Protect this discovery territory.':'Google appears to connect you with this product language. Protect the observed position.';
    else if(label==='VISIBLE')meaning=source==='TRAVELER-DEMAND'?'You are discoverable for this broader demand, but stronger placement may matter if it maps to a major product family.':'Google appears to recognize the offering, but the observed position leaves room to improve.';
    else meaning=source==='TRAVELER-DEMAND'?'Potential demand mismatch: this broader traveler-intent search maps to your inventory, but GO did not observe you in the returned results.':'Google did not surface you for this product-derived search. GO preserves the gap without assuming it is economically important.';
    return `<article class="proof-row"><div><span class="proof-state ${cls}">${label}</span><h4>${esc(row.query)}</h4><p>${esc(meaning)}</p>${row.demandProbe?`<small class="query-why">${esc(row.demandProbe.breadth)} · ${esc(row.demandProbe.why)}</small>`:''}</div><div class="operator-position"><small>OPERATOR OBSERVED</small><strong>${esc(posText(row))}</strong><span>${esc(commercial)} public prominence</span></div><div class="who-wins"><small>WHO APPEARED AHEAD / AROUND IT</small>${comps.length?comps.map(x=>`<span>${esc(x)}</span>`).join(''):'<span>No stronger named competitor observation needed for this row.</span>'}</div></article>`;
  }).join('')||'<p class="muted">No searches in this portfolio.</p>';
}
function mismatchCards(m,o){
  return (m?.queries||[]).filter(r=>r.portfolioSource==='TRAVELER-DEMAND').map(r=>{const op=(o?.opportunities||[]).find(x=>x.query===r.query),visible=Boolean(r.targetLocalPosition||r.targetOrganicPosition),commercial=op?.commercialImportance||'UNKNOWN';return{r,commercial,score:(commercial==='CORE'?4:commercial==='SECONDARY'?2.5:1)+(visible?0:4),status:!visible&&commercial==='CORE'?'HIGH-VALUE GAP':!visible?'GAP TO SIZE':Math.min(r.targetLocalPosition||99,r.targetOrganicPosition||99)<=3?'STRONG CAPTURE':'ROOM TO GROW'}}).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>`<div class="mismatch-card"><small>${esc(x.status)}</small><h4>${esc(x.r.query)}</h4><strong>${esc(posText(x.r))}</strong><p>${x.status==='HIGH-VALUE GAP'?'This is the pattern GO cares about most: broader traveler intent + commercially prominent inventory + weak observed capture.':x.status==='STRONG CAPTURE'?'Your existing discovery appears to capture this broader traveler intent. Protect it.':'GO found a discovery difference, but needs stronger demand/economic evidence before assigning dollars.'}</p></div>`).join('');
}
function renderInternalWeighting(o){if(!o)return'';return `<details class="brain-details"><summary>How GO weighted commercial importance <span>INTERNAL REASONING ↓</span></summary><p>GO uses relative first-party merchandising signals only. These labels are not claimed revenue share.</p>${(o.productHierarchy||[]).map(x=>`<div class="brain-row"><span>${esc(x.query)}</span><b>${esc(x.importance)}</b><small>${esc(x.signals.strongPages)} strong pages · ${esc(x.signals.dedicatedPages)} dedicated-page signals · ${esc(x.signals.homepageIntentSignals)} homepage intent signals</small></div>`).join('')}</details>`}
function renderJudgment(j){
  const host=$('judgment');if(!j){host.innerHTML='<p class="note">GO Judgment engine unavailable.</p>';return}
  const o=j.opportunityIntelligence,m=window.__lastMarket,d=m?.demandIntelligence;
  host.innerHTML=`<div class="review-kicker">DEMAND + DISCOVERY INTELLIGENCE · PUBLIC EVIDENCE</div><div class="review-hero"><div><h2>${esc(j.headline)}</h2><p>${esc(j.summary)}</p></div><div class="confidence"><small>GO CONFIDENCE</small><strong>${esc(j.confidence)}</strong><span>${esc(j.constraint)}</span></div></div>
  <div class="revenue-rule"><small>GO'S GOVERNING QUESTION</small><strong>Where is the most valuable recoverable revenue likely hiding?</strong><p>GO does not prioritize the ugliest ranking. It compares what you sell, what Google appears to recognize you for, broader traveler-intent discovery, and what evidence is still missing before assigning dollars.</p></div>
  <section class="mismatch-section"><div class="review-section-head"><div><small>DISCOVERY MISMATCHES TO WATCH</small><h3>Where traveler language and your current visibility diverge.</h3></div><p>${esc(d?.caveat||'Demand probes are directional until a volume source validates demand.')}</p></div><div class="mismatch-grid">${mismatchCards(m,o)}</div></section>
  <div class="review-decisions"><div class="review-decision"><small>WHAT GO WOULD DO NOW</small><h3>${esc(o?.priority?.headline||j.action)}</h3><p>${esc(o?.priority?.reason||j.action)}</p></div><div class="review-decision next"><small>WHAT GO WOULD INVESTIGATE NEXT</small><h3>${esc(o?.investigation?.headline||'Gather more evidence')}</h3><p>${esc(o?.investigation?.reason||'GO needs more evidence before choosing the next mission.')}</p></div></div>
  <section class="search-proof"><div class="review-section-head"><div><small>LENS 1 · WHAT YOUR SITE TEACHES GOOGLE</small><h3>Product-derived discovery.</h3></div><p>These searches come from experiences and differentiators GO recovered from your public website. They test what the market appears to associate you with today.</p></div>${renderSearchProof(m,o,'OPERATOR-LANGUAGE')}</section>
  <section class="search-proof demand-proof"><div class="review-section-head"><div><small>LENS 2 · HOW A TRAVELER MAY START</small><h3>Broader demand discovery.</h3></div><p>GO strips away product-specific modifiers and tests broader commercial language. V1 does not claim these are the highest-volume searches; volume validation is a future evidence source.</p></div>${renderSearchProof(m,o,'TRAVELER-DEMAND')}</section>
  <div class="review-grid"><div><small>WHY THIS MATTERS</small><p>Specific product language can prove Google understands an offering. Broader traveler language tests whether the operator is present earlier in the buying journey — before the traveler knows the differentiator.</p></div><div><small>WHAT KEEPS GO HONEST</small><p>Observed rank is location/time specific. Build 042 does not have defensible search-volume or ChatGPT-query-volume data, so GO will not label a query “high demand” merely because it sounds broad.</p></div><div><small>WHAT WOULD PROVE THE MONEY</small><p>Search Console · booking value · conversion rate · capacity · paid/organic demand data</p><p class="muted">Those inputs let GO turn a discovery mismatch into recoverable-revenue estimates.</p></div></div>
  <div class="next-senses"><small>WHERE GO LOOKS NEXT</small><div><span>Demand volume</span><span>Pricing power</span><span>Conversion leakage</span><span>AI discovery</span><span>Product-demand whitespace</span><span>Competitor momentum</span><span>Distribution mix</span></div><p>Each new sense must compete on expected recoverable revenue — not on how easy the problem is to detect.</p></div>${renderInternalWeighting(o)}`;
}