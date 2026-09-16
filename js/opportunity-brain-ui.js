(()=>{
 const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const old=window.renderJudgment;
 if(typeof old!=='function')return;
 function senseCard(c){
   const state=c.state==='UNKNOWN'?'UNRESOLVED':c.state.replaceAll('_',' ');
   return `<div class="sense-card"><small>${h(c.sense)}</small><b>${h(state)}</b><span>${h(c.finding)}</span></div>`;
 }
 window.renderJudgment=function(j){
   old(j);
   const host=document.getElementById('judgment');
   if(!host||!window.GOOpportunityBrain)return;
   const brain=window.GOOpportunityBrain.build({market:window.__lastMarket,discoveryOpportunity:j?.opportunityIntelligence,pricing:window.__lastPricing,trust:window.__lastTrust,conversion:window.__lastConversion});
   window.__lastOpportunityBrain=brain;
   const p=brain.primary||{};
   const unresolved=brain.unresolved?.length?`${brain.unresolved.length} sense${brain.unresolved.length===1?'':'s'} still need evidence: ${brain.unresolved.map(x=>x.sense).join(', ')}.`:'All four senses have enough evidence for a current-state read.';
   host.insertAdjacentHTML('afterbegin',`<section class="brain-v2"><div class="brain-label">GO OPPORTUNITY BRAIN · CURRENT DECISION</div><h2>${h(brain.headline)}</h2><p>${h(brain.summary)}</p><div class="brain-primary"><small>BEST NEXT MOVE · ${h(p.actionability||'INVESTIGATE')}</small><strong>${h(p.action||p.finding||'Continue investigation')}</strong><span>${h(p.requiredNextEvidence?`Evidence needed next: ${p.requiredNextEvidence}`:'')}</span></div><div class="sense-grid">${(brain.candidates||[]).map(senseCard).join('')}</div><p class="conversion-note"><b>Decision integrity:</b> ${h(unresolved)} ${h(brain.decisionPrinciple)}</p></section>`);
 };
})();