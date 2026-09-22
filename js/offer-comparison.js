(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
const words=v=>new Set(clean(v).split(/[^a-z0-9]+/).filter(x=>x.length>2));
const overlap=(a,b)=>{const A=words(a),B=words(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.min(A.size,B.size)};
const num=v=>{const n=Number(String(v??'').replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n>0?n:null};
function compatible(operator,market){
 const family=operator.family&&market.family?overlap(operator.family,market.family)>=.5:overlap(operator.name,market.name)>=.35;
 const transaction=!operator.transactionType||!market.transactionType||clean(operator.transactionType)===clean(market.transactionType);
 const duration=operator.duration&&market.duration?clean(operator.duration)===clean(market.duration):false;
 const format=operator.format&&market.format?clean(operator.format)===clean(market.format):false;
 return family&&transaction&&duration&&format;
}
function build({dossier,pricing,competitors=[],qualifiedCompetitors=[]}={}){
 const own=(dossier?.products||[]).filter(x=>num(x.price));
 const qualified=(qualifiedCompetitors||[]).map(x=>clean(x.name||x)).filter(Boolean);
 const nameMatch=(a,b)=>{a=clean(a);b=clean(b);return a&&b&&(a===b||(Math.min(a.length,b.length)>=5&&(a.includes(b)||b.includes(a))))};
 const eligible=(competitors||[]).filter(c=>qualified.some(name=>nameMatch(name,c.name)));
 const structured=eligible.flatMap(c=>(c.products||[]).map(p=>({name:p.name||'',price:num(p.price),family:p.family||p.intent||p.name||'',transactionType:p.transactionType||'',duration:p.duration||'',format:p.format||'',source:p.sourceUrl||c.url||c.name||''}))).filter(x=>x.price);
 const directional=(pricing?.market?.sample||[]).map(x=>({name:x.name||x.query||'',price:num(x.value),family:x.family||x.query||'',transactionType:x.transactionType||'',duration:x.duration||'',format:x.format||'',source:x.link||x.name||''})).filter(x=>x.price);
 const market=structured.length?structured:directional;
 const structuredMode=structured.length>0;
 const matches=[];for(const o of own)for(const m of market)if(compatible(o,m))matches.push({operator:o,market:m,deltaPct:Math.round((m.price-num(o.price))/num(o.price)*100)});
 const sources=new Set(matches.map(x=>x.market.source).filter(Boolean));
 let state='INSUFFICIENT_EVIDENCE',headline='GO does not yet have a like-for-like public price set.',action='Keep pricing directional until GO verifies matching product structure.';
 if(structuredMode&&matches.length>=3&&sources.size>=2){const deltas=matches.map(x=>x.deltaPct).sort((a,b)=>a-b),mid=deltas[Math.floor(deltas.length/2)];state='COMPARABLE_SET_VERIFIED';headline='GO verified a like-for-like public pricing set.';action=Math.abs(mid)<10?'Pricing looks broadly aligned; investigate a higher-leverage constraint.':mid>=10?'A controlled pricing test may be worth investigating after booking volume and margin are connected.':'The operator appears premium; validate conversion and value proof before changing price.';return {version:'GO-OFFER-COMPARISON-V4',state,headline,action,medianDeltaPct:mid,matches:matches.slice(0,8),sources:sources.size,evidenceNote:'A comparable set requires compatible product family and transaction type; when duration or format are observed, those must also match.'}}
 if(matches.length){state='DIRECTIONAL_MATCHES';headline=`GO found ${matches.length} potentially comparable public price signal${matches.length===1?'':'s'}, but not enough independent structured evidence for a price move.`}
 return {version:'GO-OFFER-COMPARISON-V3',state,headline,action,matches:matches.slice(0,8),sources:sources.size,evidenceNote:'Missing duration or format is not treated as proof of equivalence. GO requires structured offers from competitors already qualified as direct and multiple independent matches before promoting pricing strategy.'};
}
window.GOOfferComparison={build};
})();