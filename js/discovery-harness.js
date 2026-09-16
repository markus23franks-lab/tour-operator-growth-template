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
  const res=await fetch('/.netlify/functions/market-intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessName,website,location,queries,frontendBuildId:'B051-TRUST-EVIDENCE-RESOLUTION-V1',debugRunId:`${tag}-${Date.now()}`})});
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
    const acquisitionRes=await fetch('/.netlify/functions/market-intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'acquire',website,frontendBuildId:'B051-TRUST-EVIDENCE-RESOLUTION-V1',debugRunId:`ACQUIRE-${Date.now()}`})}).catch(()=>null);
    const acquisitionPayload=acquisitionRes?await acquisitionRes.json().catch(()=>({})):{},acquisition=acquisitionPayload?.acquisition||null;
    const demand=window.GODemandIntelligence?.build({acquisition,location,websiteQueries})||{probes:[]},demandQueries=demand.probes.map(x=>x.query).filter(Boolean);
    const combinedQueries=[...new Set([...websiteQueries,...demandQueries])].slice(0,10);
    const pricingQueries=window.GOPricingIntelligence?.plan?.({businessName,location,website,websiteQueries,demandQueries})||[];
    const trustQueries=window.GOTrustIntelligence?.plan?.({businessName,location,website})||[];
    const [marketPayload,pricingPayload,trustPayload]=await Promise.all([
      providerCall({businessName,website,location,queries:combinedQueries,tag:'COMBINED'}),
      pricingQueries.length?providerCall({businessName,website,location,queries:pricingQueries,tag:'PRICING'}):Promise.resolve({market:{queries:[],searchesUsed:0}}),
      trustQueries.length?providerCall({businessName,website,location,queries:trustQueries,tag:'TRUST'}):Promise.resolve({market:{queries:[],searchesUsed:0}})
    ]);
    const websiteSet=new Set(websiteQueries.map(q=>q.toLowerCase()));
    const demandSet=new Set(demandQueries.map(q=>q.toLowerCase()));
    const combined={
      ...marketPayload.market,
      queries:(marketPayload.market.queries||[]).map(row=>{
        const key=String(row.query||'').toLowerCase(),portfolioSources=[];
        if(websiteSet.has(key))portfolioSources.push('OPERATOR-LANGUAGE');
        if(demandSet.has(key))portfolioSources.push('TRAVELER-DEMAND');
        return {...row,portfolioSource:portfolioSources[0]||'TRAVELER-DEMAND',portfolioSources,demandProbe:demand.probes.find(p=>String(p.query||'').toLowerCase()===key)||null};
      }),
      demandIntelligence:demand
    };
    render({...marketPayload,market:combined,pricingMarket:pricingPayload.market||{queries:[]},trustMarket:trustPayload.market||{queries:[]},acquisition,demandIntelligence:demand},Math.round(performance.now()-started));
    setStatus('Demand + Discovery Review complete. GO compared operator-derived searches with broader traveler-intent probes.');
  }catch(err){setStatus(`Evidence test failed: ${err.message}`,true)}
}

function setStatus(text, error=false){$('status').hidden=false;$('status').textContent=text;$('status').style.borderColor=error?'#713943':''}
function render(payload, clientMs){
  const m=payload.market, rows=m.queries||[], target=m.target||{}, players=m.players||[], audit=m.qualificationAudit||{};
  const state=r=>r.evidenceState||(r.providerError?'UNKNOWN':(r.targetLocalPosition||r.targetOrganicPosition?'OBSERVED_WIN':'OBSERVED_GAP'));
  const verified=rows.filter(r=>state(r)!=='UNKNOWN');
  const visible=verified.filter(r=>state(r)==='OBSERVED_WIN').length;
  const gaps=verified.filter(r=>state(r)==='OBSERVED_GAP').length;
  const failed=rows.filter(r=>state(r)==='UNKNOWN').length;
  const providerCalls=Number(m.searchesUsed||0);
  const avg=rows.length?Math.round(rows.reduce((n,r)=>n+Number(r.timing?.totalMs||0),0)/rows.length):0;
  $('metrics').innerHTML=metric(rows.length,'checks planned')+metric(verified.length,'verified')+metric(visible,'operator visible')+metric(gaps,'observed gaps')+metric(failed,'unverified')+metric(providerCalls,'provider searches')+metric(`${(clientMs/1000).toFixed(1)}s`,'end-to-end latency');
  window.__lastMarket = m;
  window.__lastAcquisition = payload.acquisition || null;
  const opportunity = window.GOOpportunityIntelligence?.build ? window.GOOpportunityIntelligence.build(m, payload.acquisition) : null;
  window.__lastPricing = window.GOPricingIntelligence?.build ? window.GOPricingIntelligence.build({pricingMarket:payload.pricingMarket,businessName:$('business-name').value.trim(),website:$('website').value.trim()}) : null;
  window.__lastTrust = window.GOTrustIntelligence?.build ? window.GOTrustIntelligence.build({trustMarket:payload.trustMarket,businessName:$('business-name').value.trim(),website:$('website').value.trim()}) : null;
  window.__lastConversion = window.GOConversionIntelligence?.build ? window.GOConversionIntelligence.build(payload.acquisition) : null;
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
  const state=r.evidenceState||(r.providerError?'UNKNOWN':(r.targetLocalPosition||r.targetOrganicPosition?'OBSERVED_WIN':'OBSERVED_GAP'));
  const unknown=state==='UNKNOWN';
  const local=r.targetLocalPosition?`Maps/local #${r.targetLocalPosition}`:unknown?'Local: unverified':`Local: not found in ${r.localResultsChecked||0}`;
  const organic=r.targetOrganicPosition?`Organic #${r.targetOrganicPosition}`:unknown?'Organic: unverified':`Organic: not found in ${r.organicResultsChecked||0}`;
  const cls=unknown?'unknown':state==='OBSERVED_WIN'?'good':'gap';
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
  const rows=(m?.queries||[]).filter(r=>r.portfolioSource===source||(r.portfolioSources||[]).includes(source)),target=m?.target||{};
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
function visibleStats(m){
  const rows=m?.queries||[];
  const state=r=>r.evidenceState||(r.providerError?'UNKNOWN':(r.targetLocalPosition||r.targetOrganicPosition?'OBSERVED_WIN':'OBSERVED_GAP'));
  const verified=rows.filter(r=>state(r)!=='UNKNOWN'), unknown=rows.filter(r=>state(r)==='UNKNOWN');
  const visible=verified.filter(r=>state(r)==='OBSERVED_WIN');
  const winning=visible.filter(r=>Math.min(Number(r.targetLocalPosition||999),Number(r.targetOrganicPosition||999))<=3);
  const gaps=verified.filter(r=>state(r)==='OBSERVED_GAP');
  return {rows,verified,unknown,visible,winning,gaps};
}
function topSignals(m,o){
  const {verified}=visibleStats(m);
  const scored=verified.map(r=>{
    const best=Math.min(Number(r.targetLocalPosition||999),Number(r.targetOrganicPosition||999));
    const op=(o?.opportunities||[]).find(x=>x.query===r.query);
    const w=op?.commercialImportance==='CORE'?4:op?.commercialImportance==='SECONDARY'?2.5:1;
    return {r,op,best,win:best<=3,gap:best===999,score:w+(best<=3?5:best<999?2:0)+(r.portfolioSource==='TRAVELER-DEMAND'?2:0)};
  });
  return {
    wins:scored.filter(x=>x.win).sort((a,b)=>b.score-a.score).slice(0,3),
    gaps:scored.filter(x=>x.gap).sort((a,b)=>(b.op?.rank||0)-(a.op?.rank||0)).slice(0,2)
  };
}
function compactSignal(x,type){
  const r=x.r, comps=competitorLine(r,window.__lastMarket?.target?.name);
  return `<div class="signal-card ${type}"><span>${type==='win'?'WORKING':'WATCH'}</span><h4>${esc(r.query)}</h4><strong>${esc(posText(r))}</strong><p>${type==='win'?'GO observed strong discovery here. Protect it.':`GO did not observe you here${comps[0]?`; ${esc(comps[0])} did appear`:''}.`}</p></div>`;
}
function economicPanel(e){
  const statusClass=e.state==='MEASURED'?'measured':e.state==='ESTIMATE'?'estimate':e.state==='DIRECTIONAL'?'directional':'unknown';
  return `<div class="economic-card ${statusClass}">
    <div><small>WHAT COULD THIS BE WORTH?</small><span class="economic-state">${esc(e.label)}</span></div>
    <h3>${e.range?esc(e.range):'Dollar value not yet defensible'}</h3>
    <p>${esc(e.headline)}</p>
    <div class="economic-proof"><b>Why GO stops here</b><span>${esc(e.explanation)}</span></div>
  </div>`;
}
function connectionPath(e){
  return `<details class="data-path"><summary>Turn this into verified economics <span>WHY CONNECT DATA ↓</span></summary>
    <p>Connected data is not setup homework. Each connection replaces an unknown with the operator's actual numbers.</p>
    <div class="connection-grid">${e.connectionPath.map((x,i)=>`<div><b>${i+1}</b><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('')}</div>
  </details>`;
}
function renderPricing(p){
 if(!p)return '';
 const money=v=>v?`$${Math.round(v).toLocaleString()}`:'Not established',own=p.operator||{},market=p.market||{};
 const label={PRICING_POWER_CANDIDATE:'Pricing power candidate',PREMIUM_POSITION:'Premium position',MARKET_ALIGNED:'Market aligned',INSUFFICIENT_EVIDENCE:'Pricing evidence incomplete'}[p.state]||p.state;
 return `<section class="pricing-intel"><div class="section-kicker">NEW REVENUE LEVER · PRICING INTELLIGENCE V1</div><div class="pricing-grid"><div><div class="pricing-state">${esc(label)}</div><h2>${esc(p.headline)}</h2><p>${esc(p.recommendation)}</p></div><div class="pricing-numbers"><div><span>Operator public price signal</span><strong>${money(own.median)}</strong><small>${own.signals||0} recovered signals</small></div><div><span>Comparable market signal</span><strong>${money(market.median)}</strong><small>${market.signals||0} observed signals</small></div></div></div><div class="pricing-note"><b>${esc(p.research?.verified||0)} of ${esc(p.research?.planned||0)} dedicated pricing checks verified.</b> ${esc(p.evidenceNote)}</div></section>`;
}
function renderTrust(t){
 if(!t)return '';
 const rating=v=>v?Number(v).toFixed(1):'Not verified', reviews=v=>v?Math.round(v).toLocaleString():'Not verified';
 const label={TRUST_ADVANTAGE:'Trust advantage',REPUTATION_GAP:'Reputation gap',MARKET_COMPETITIVE:'Market competitive',INSUFFICIENT_EVIDENCE:'Trust evidence incomplete'}[t.state]||t.state;
 const names=(t.market?.sample||[]).slice(0,3).map(x=>`${x.name}${x.rating?` · ${Number(x.rating).toFixed(1)}★`:''}${x.reviews?` · ${Math.round(x.reviews).toLocaleString()} reviews`:''}`).join('  •  ');
 return `<section class="trust-intel"><div class="section-kicker">NEW GROWTH SENSE · REVIEWS + TRUST INTELLIGENCE V1</div><div class="trust-grid"><div><div class="trust-state">${esc(label)}</div><h2>${esc(t.headline)}</h2><p>${esc(t.summary)}</p><div class="trust-action"><b>WHAT GO DOES WITH THIS</b><br>${esc(t.action)}</div></div><div><div class="trust-numbers"><div><span>Operator reputation</span><strong>${rating(t.target?.rating)}★</strong><small>${reviews(t.target?.reviews)} reviews</small></div><div><span>Observed competitor median</span><strong>${rating(t.market?.medianRating)}★</strong><small>${reviews(t.market?.medianReviews)} reviews · ${t.market?.competitors||0} competitors</small></div></div><div class="trust-sample">${names?`Observed examples: ${esc(names)}`:'No qualified competitor reputation sample yet.'}<br><br><b>${esc(t.research?.verified||0)} of ${esc(t.research?.planned||0)} dedicated trust checks verified · ${esc(t.research?.targetMatches||0)} operator match(es).</b><br><br>${esc(t.evidenceNote)}</div></div></div></section>`;
}

function renderConversion(c){
 if(!c)return '';
 const labels={bookingCTA:'Booking CTA',pricing:'Visible pricing',reviews:'Review proof',trust:'Trust signals',urgency:'Availability / urgency',productDepth:'Product detail',faq:'Decision support'};
 const signal=Object.entries(c.signals||{}).map(([k,v])=>`<div class="conversion-signal">${esc(labels[k]||k)}<b>${v?'OBSERVED':'NOT VERIFIED'}</b></div>`).join('');
 const state={CTA_RISK:'Booking-path risk',TRUST_MERCHANDISING_GAP:'Trust merchandising gap',STRONG_FOUNDATION:'Strong conversion foundation',CONVERSION_FOUNDATION:'Conversion foundation'}[c.state]||c.state;
 return `<section class="conversion-intel"><div class="section-kicker">NEW GROWTH SENSE · WEBSITE CONVERSION INTELLIGENCE V1</div><div class="conversion-grid"><div><div class="conversion-state">${esc(state)}</div><h2>${esc(c.headline)}</h2><p>${esc(c.summary)}</p><div class="conversion-action"><b>WHAT GO DOES WITH THIS</b><br>${esc(c.action)}</div></div><div><div class="conversion-signals">${signal}</div><div class="conversion-note">${esc(c.pages)} first-party pages recovered · ${esc(c.score)}/${esc(c.total)} public conversion signals observed.<br><br>${esc(c.evidenceNote)}</div></div></div></section>`;
}
function renderJudgment(j){
  const host=$('judgment');if(!j){host.innerHTML='<p class="note">GO Judgment engine unavailable.</p>';return}
  const o=j.opportunityIntelligence,m=window.__lastMarket,d=m?.demandIntelligence;
  const e=window.GOEconomics?.build({market:m,opportunity:o,acquisition:window.__lastAcquisition})||{state:'UNKNOWN',label:'Needs data',headline:'Economic model unavailable.',missing:[],connectionPath:[]};
  const st=visibleStats(m), sig=topSignals(m,o);
  const visibilityPct=st.verified.length?Math.round(st.visible.length/st.verified.length*100):0;
  const why=j.coverage?.sufficient?`GO verified ${st.verified.length} of ${st.rows.length} planned checks and observed you in ${st.visible.length}, with top-three placement in ${st.winning.length}. ${st.gaps.length?`${st.gaps.length} verified gaps remain; GO will not assume the cleanest gap is the most valuable one.`:'No verified discovery gap in this sample is strong enough to manufacture a new search mission.'}`:`GO verified ${st.verified.length} of ${st.rows.length} planned checks. ${st.unknown.length} remain unknown, and GO is not treating them as ranking gaps.`;
  host.innerHTML=`
    <div class="operator-read">
      <div class="read-kicker">GO'S READ · 30-SECOND VIEW</div>
      <div class="read-head"><div><h2>${esc(j.headline)}</h2><p>${esc(j.summary)}</p></div><div class="read-score"><strong>${j.coverage?.sufficient?visibilityPct+'%':st.verified.length+'/'+st.rows.length}</strong><span>${j.coverage?.sufficient?'visible across verified discovery':'checks successfully verified'}</span></div></div>
      <div class="value-grid">
        <div class="value-card priority"><small>BEST EVIDENCE-BACKED PRIORITY</small><h3>${esc(o?.priority?.headline||j.action)}</h3><p>${esc(o?.priority?.reason||j.action)}</p></div>
        ${economicPanel(e)}
        <div class="value-card investigate"><small>GO INVESTIGATES NEXT</small><h3>${esc(o?.investigation?.headline||'Find the next growth lever')}</h3><p>${esc(o?.investigation?.reason||'GO needs more evidence before choosing the next mission.')}</p></div>
      </div>
      <div class="why-strip"><small>WHY GO THINKS THIS</small><p>${esc(why)}</p></div>
    </div>
    ${renderPricing(window.__lastPricing)}
    ${renderTrust(window.__lastTrust)}
    ${renderConversion(window.__lastConversion)}

    <section class="signal-section"><div class="compact-head"><div><small>THE SIGNALS THAT MATTER MOST</small><h3>What's working — and what deserves attention.</h3></div><span>${st.rows.length} planned · ${st.verified.length} verified · ${st.unknown.length} unknown</span></div>
      <div class="signal-columns"><div><h4>Strongest discovery wins</h4><div class="signal-list">${sig.wins.map(x=>compactSignal(x,'win')).join('')||'<p class="muted">No top-three wins observed.</p>'}</div></div>
      <div><h4>Opportunities to watch</h4><div class="signal-list">${sig.gaps.map(x=>compactSignal(x,'gap')).join('')||'<p class="muted">No clear gaps observed in this sample.</p>'}</div></div></div>
    </section>

    <details class="all-discovery"><summary>View all discovery evidence <span>10-search research view ↓</span></summary>
      <section class="search-proof"><div class="review-section-head"><div><small>LENS 1 · WHAT YOUR SITE TEACHES GOOGLE</small><h3>Product-derived discovery.</h3></div><p>Tests whether Google appears to associate you with the experiences and differentiators your site markets.</p></div>${renderSearchProof(m,o,'OPERATOR-LANGUAGE')}</section>
      <section class="search-proof demand-proof"><div class="review-section-head"><div><small>LENS 2 · HOW A TRAVELER MAY START</small><h3>Broader demand discovery.</h3></div><p>Broader traveler-intent probes tied to real inventory. GO does not claim these are verified highest-volume searches.</p></div>${renderSearchProof(m,o,'TRAVELER-DEMAND')}</section>
    </details>

    <div class="next-senses"><small>WHERE GO LOOKS NEXT</small><div><span>Demand volume</span><span>Pricing power</span><span>Conversion leakage</span><span>AI discovery</span><span>Product-demand whitespace</span><span>Competitor momentum</span><span>Distribution mix</span></div><p>These are investigation targets, not findings. Each must compete on expected recoverable revenue.</p></div>
    ${connectionPath(e)}
    <div class="integrity-note"><b>Economic confidence: ${esc(e.label)}</b><span>GO will show a dollar range only when the evidence supports one. Current missing inputs: ${esc((e.missing||[]).join(' · ')||'none')}.</span></div>
    ${renderInternalWeighting(o)}`;
}