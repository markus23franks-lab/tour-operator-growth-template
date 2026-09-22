(()=>{
'use strict';
const params=new URLSearchParams(location.search);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();

function normalizeSearchValue(value){
  if(typeof value==='string')return norm(value);
  if(value&&typeof value==='object')return norm(value.query||value.search||value.term||'');
  return '';
}
function extractSearches(profile){
  const candidates=[
    profile?.pipelineDebug?.selectedQueries,
    profile?.discoveryIntelligence?.searches,
    profile?.marketEvidence?.checkedSearches,
    profile?.pipelineDebug?.market?.queries
  ];
  const seen=new Set(),out=[];
  for(const list of candidates){
    if(!Array.isArray(list))continue;
    for(const raw of list){
      const query=normalizeSearchValue(raw);
      const key=query.toLowerCase();
      if(!query||seen.has(key))continue;
      if(window.GOColdStartV3?.validQuery&&window.GOColdStartV3.validQuery(query)===false)continue;
      seen.add(key);out.push(query);
      if(out.length>=5)return out;
    }
  }
  return out;
}

// The developer Lab historically expands its entered searches with broader demand probes.
// In the one-URL autopilot path Build 055 has already done that thinking and selected the
// representative evidence portfolio. Do not silently replace five deliberate searches with
// a new 10-query legacy portfolio during Analyzer -> Lab -> Snapshot handoff.
function installRepresentativeDemandGuard(){
  if(params.get('auto')!=='1'||!window.GODemandIntelligence?.build)return false;
  if(window.GODemandIntelligence.__goRepresentativeGuard)return true;
  const original=window.GODemandIntelligence.build.bind(window.GODemandIntelligence);
  window.GODemandIntelligence.build=input=>{
    const result=original(input)||{};
    return {...result,probes:[]};
  };
  window.GODemandIntelligence.__goRepresentativeGuard=true;
  return true;
}

function installAnalyzerBridge(){
  const button=document.getElementById('open-snapshot');
  if(!button)return;
  button.textContent='See what GO found →';
  button.addEventListener('click',event=>{
    const profile=read('growthOperatorProspectProfile');
    if(!profile)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const research=profile.researchIntelligence;
    if(research?.brain?.candidates?.length){
      localStorage.setItem('growthOperatorOpportunityBrain',JSON.stringify({savedAt:new Date().toISOString(),source:'operator-analyzer-direct',website:profile.website||profile.url||'',businessName:profile.businessName||profile.name||'',location:profile.publicProfile?.location||profile.businessContext?.location||'',brain:research.brain,dossier:research.dossier||null,pricing:research.pricing||null,offerComparison:research.offerComparison||null,trust:research.trust||null,conversion:research.conversion||null,bookingJourney:research.bookingJourney||null,competition:research.competition||null,positioning:research.positioning||null,positioningComparison:research.positioningComparison||null,market:profile.marketEvidence||null,researchPlans:research.researchPlans||null}));
      location.href='growth-snapshot.html?source=operator-analyzer-direct';
      return;
    }
    localStorage.removeItem('growthOperatorOpportunityBrain');
    location.href='discovery-harness.html?auto=1';
  },true);
}

function installLabAutopilot(){
  if(params.get('auto')!=='1')return;
  const profile=read('growthOperatorProspectProfile');
  const run=document.getElementById('run');
  const controls=document.querySelector('.controls');
  if(!profile||!run||!controls)return;

  document.body.classList.add('go-autopilot');
  const card=document.createElement('div');
  card.className='go-auto-card';
  card.innerHTML='<p class="eyebrow">GO IS INVESTIGATING</p><h2>GO figured out the business. Now it is checking where the money may be hiding.</h2><p id="go-auto-copy">Building the search plan from the operator’s own products and market context — no keywords required.</p><div class="go-auto-progress"><i></i></div><small>Reading the business → testing demand → checking pricing, trust and the booking path → choosing what matters</small>';
  controls.prepend(card);
  [...controls.children].forEach(child=>{if(child!==card)child.style.display='none'});

  const p=profile;
  document.getElementById('website').value=p.website||p.url||'';
  document.getElementById('business-name').value=p.businessName||p.name||'';
  document.getElementById('location').value=p.businessContext?.location||p.location||p.publicProfile?.location||'';
  document.getElementById('queries').value=extractSearches(p).join('\n');

  const missing=[];
  if(!document.getElementById('business-name').value)missing.push('business identity');
  if(!document.getElementById('location').value)missing.push('market location');
  if(!document.getElementById('queries').value)missing.push('commercial search plan');
  if(missing.length){
    document.getElementById('go-auto-copy').textContent=`GO could not safely infer ${missing.join(', ')} from the public site, so it stopped instead of inventing it.`;
    return;
  }

  installRepresentativeDemandGuard();
  const started=Date.now();
  const before=read('growthOperatorOpportunityBrain')?.savedAt||'';
  run.click();
  const timer=setInterval(()=>{
    const handoff=read('growthOperatorOpportunityBrain');
    if(handoff?.savedAt&&handoff.savedAt!==before&&Date.now()-started>250){
      clearInterval(timer);
      location.replace('growth-snapshot.html?source=zero-input');
    }
  },250);
  setTimeout(()=>{
    clearInterval(timer);
    const copy=document.getElementById('go-auto-copy');
    if(copy&&!read('growthOperatorOpportunityBrain')?.savedAt)copy.textContent='GO kept the result unresolved because the investigation did not finish with enough evidence. Try again later rather than treating a timeout as a growth problem.';
  },90000);
}

window.GOZeroInputFlow={extractSearches,normalizeSearchValue,installRepresentativeDemandGuard};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installAnalyzerBridge();installLabAutopilot();});else{installAnalyzerBridge();installLabAutopilot();}
})();