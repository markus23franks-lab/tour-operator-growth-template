(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
function build({dossier,competitors=[],positioningComparison,competition}={}){
 const own=dossier?.products||[],rivals=(competitors||[]).filter(c=>(c.products||[]).length);
 const ownFamilies=[...new Set(own.map(p=>clean(p.family||p.name).toLowerCase()).filter(Boolean))];
 const rivalFamilies=new Map();
 for(const c of rivals)for(const p of c.products||[]){const f=clean(p.family||p.name).toLowerCase();if(!f)continue;const row=rivalFamilies.get(f)||{family:f,competitors:new Set(),examples:[]};row.competitors.add(c.name||c.url||'competitor');if(row.examples.length<3)row.examples.push(p.name);rivalFamilies.set(f,row)}
 const adjacent=[...rivalFamilies.values()].filter(x=>x.competitors.size>=2&&!ownFamilies.some(o=>o===x.family||o.includes(x.family)||x.family.includes(o))).map(x=>({family:x.family,competitors:x.competitors.size,examples:x.examples}));
 const parity=positioningComparison?.state==='CATEGORY_PARITY';
 const pressure=competition?.state==='REPEATED_COMPETITOR_PRESSURE';
 let state='NO_VERIFIED_ARCHITECTURE_GAP',headline='GO did not verify a public product-architecture gap worth acting on.',action='Preserve the current product set and keep looking for stronger commercial evidence.';
 if(adjacent.length){state='ADJACENT_OFFER_PATTERN';headline=`GO found ${adjacent.length} adjacent offer pattern${adjacent.length===1?'':'s'} sold by multiple direct competitors but not verified in this operator’s public inventory.`;action='Investigate traveler demand, operational fit, margin and cannibalization before treating an adjacent offer as an expansion opportunity.'}
 else if(parity&&pressure){state='DIFFERENTIATION_INVESTIGATION';headline='Direct competitors repeat in the market while the operator’s public positioning looks similar to the category.';action='Investigate whether a flagship product, package or proof point can create a clearer reason to book direct.'}
 return {version:'GO-PRODUCT-ARCHITECTURE-V1',state,headline,action,adjacent:adjacent.slice(0,4),operatorFamilies:ownFamilies,competitorsWithProducts:rivals.length,evidenceNote:'Absence from extracted public inventory is not treated as demand proof. Adjacent offers require repetition across qualified direct competitors and still remain an investigation until demand and economics are verified.'};
}
window.GOProductArchitecture={build};
})();