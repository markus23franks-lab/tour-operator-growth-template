(()=>{
'use strict';
const params=new URLSearchParams(location.search);
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};

function installAnalyzerBridge(){
  const button=document.getElementById('open-snapshot');
  if(!button)return;
  button.textContent='See what GO found →';
  button.addEventListener('click',event=>{
    const profile=read('growthOperatorProspectProfile');
    if(!profile)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    localStorage.removeItem('growthOperatorOpportunityBrain');
    location.href='discovery-harness.html?auto=1';
  },true);
}

function installLabAutopilot(){
  if(params.get('auto')!=='1')return;
  const profile=read('growthOperatorProspectProfile');
  const load=document.getElementById('load-profile');
  const run=document.getElementById('run');
  const controls=document.querySelector('.controls');
  if(!profile||!load||!run)return;

  document.body.classList.add('go-autopilot');
  if(controls){
    controls.innerHTML='<div class="go-auto-card"><p class="eyebrow">GO IS INVESTIGATING</p><h2>GO figured out the business. Now it is checking where the money may be hiding.</h2><p id="go-auto-copy">Building the search plan from the operator’s own products and market context — no keywords required.</p><div class="go-auto-progress"><i></i></div><small>Reading the business → testing demand → checking pricing, trust and the booking path → choosing what matters</small></div>';
  }

  // Recreate the hidden controls expected by the existing intelligence runner. This keeps
  // the development harness intact while removing all operator-entered fields from the flow.
  const hidden=document.createElement('div');
  hidden.hidden=true;
  hidden.innerHTML='<input id="website"><input id="business-name"><input id="location"><textarea id="queries"></textarea><button id="load-profile"></button><button id="run"></button><button id="load-caicos"></button>';
  document.body.appendChild(hidden);

  const p=profile;
  document.getElementById('website').value=p.website||p.url||'';
  document.getElementById('business-name').value=p.businessName||p.name||'';
  document.getElementById('location').value=p.businessContext?.location||p.location||p.publicProfile?.location||'';
  const searches=p.discoveryIntelligence?.searches?.map(x=>x.query)||p.marketEvidence?.checkedSearches||p.pipelineDebug?.market?.queries||p.pipelineDebug?.selectedQueries||[];
  document.getElementById('queries').value=[...new Set(searches.filter(Boolean))].slice(0,5).join('\n');

  const missing=[];
  if(!document.getElementById('business-name').value)missing.push('business identity');
  if(!document.getElementById('location').value)missing.push('market location');
  if(!document.getElementById('queries').value)missing.push('commercial search plan');
  if(missing.length){
    const copy=document.getElementById('go-auto-copy');
    if(copy)copy.textContent=`GO could not safely infer ${missing.join(', ')} from the public site, so it stopped instead of inventing it.`;
    return;
  }

  const started=Date.now();
  const before=read('growthOperatorOpportunityBrain')?.savedAt||'';
  // Existing listeners were attached before this bridge loaded, so dispatching a click uses
  // the same tested Intelligence Lab pipeline without duplicating its provider logic.
  document.getElementById('run').click();
  const timer=setInterval(()=>{
    const handoff=read('growthOperatorOpportunityBrain');
    if(handoff?.savedAt&&handoff.savedAt!==before&&Date.now()-started>250){
      clearInterval(timer);
      location.replace('growth-snapshot.html?source=zero-input');
    }
  },250);
  setTimeout(()=>clearInterval(timer),90000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installAnalyzerBridge();installLabAutopilot();});else{installAnalyzerBridge();installLabAutopilot();}
})();