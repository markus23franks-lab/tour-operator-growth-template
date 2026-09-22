(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const generic=new Set(['tour','tours','experience','experiences','activity','activities','trip','trips','adventure','adventures','rental','rentals','charter','charters','ticket','tickets']);
const tokens=v=>new Set(clean(v).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2&&!generic.has(x)));
function sameFamily(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return clean(a).toLowerCase()===clean(b).toLowerCase();let hit=0;for(const x of A)if(B.has(x))hit++;return hit/Math.min(A.size,B.size)>=.6}
function build({dossier,competitors=[],positioningComparison,competition}={}){
 const qualified=(competition?.market?.sample||[]).map(x=>clean(x.name).toLowerCase()).filter(Boolean);
 const nameMatch=(a,b)=>{a=clean(a).toLowerCase();b=clean(b).toLowerCase();return a&&b&&(a===b||(Math.min(a.length,b.length)>=5&&(a.includes(b)||b.includes(a))))};
 const own=dossier?.products||[],rivals=(competitors||[]).filter(c=>(c.products||[]).length&&qualified.some(name=>nameMatch(name,c.name)));
 const ownFamilies=[...new Set(own.map(p=>clean(p.family||p.name).toLowerCase()).filter(Boolean))];
 const rivalFamilies=new Map();
 for(const c of rivals)for(const p of c.products||[]){const f=clean(p.family||p.name).toLowerCase();if(!f)continue;const row=rivalFamilies.get(f)||{family:f,competitors:new Set(),examples:[]};row.competitors.add(c.name||c.url||'competitor');if(row.examples.length<3)row.examples.push(p.name);rivalFamilies.set(f,row)}
 const adjacent=[...rivalFamilies.values()].filter(x=>x.competitors.size>=2&&!ownFamilies.some(o=>sameFamily(o,x.family))).map(x=>({family:x.family,competitors:x.competitors.size,examples:x.examples}));
 const parity=positioningComparison?.state==='CATEGORY_PARITY';
 const pressure=competition?.state==='REPEATED_COMPETITOR_PRESSURE';
 let state='NO_VERIFIED_ARCHITECTURE_GAP',headline='GO did not verify a public product-architecture gap worth acting on.',action='Preserve the current product set and keep looking for stronger commercial evidence.';
 if(adjacent.length){state='ADJACENT_OFFER_PATTERN';headline=`GO found ${adjacent.length} adjacent offer pattern${adjacent.length===1?'':'s'} sold by multiple direct competitors but not verified in this operator’s public inventory.`;action='Investigate traveler demand, operational fit, margin and cannibalization before treating an adjacent offer as an expansion opportunity.'}
 else if(parity&&pressure){state='DIFFERENTIATION_INVESTIGATION';headline='Direct competitors repeat in the market while the operator’s public positioning looks similar to the category.';action='Investigate whether a flagship product, package or proof point can create a clearer reason to book direct.'}
 return {version:'GO-PRODUCT-ARCHITECTURE-V3',state,headline,action,adjacent:adjacent.slice(0,4),operatorFamilies:ownFamilies,competitorsWithProducts:rivals.length,evidenceNote:'Absence from extracted public inventory is not treated as demand proof. Adjacent offers require repetition across competitors already qualified as direct by GO and still remain an investigation until demand and economics are verified.'};
}
window.GOProductArchitecture={build};
})();