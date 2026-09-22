(()=>{
'use strict';
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const direct=p=>p&&p.category==='direct'&&!p.isTarget;
function build({market}={}){
 const rows=Array.isArray(market?.queryResults)?market.queryResults:(Array.isArray(market?.queries)?market.queries.filter(x=>x&&typeof x==='object'):[]);
 const players=(market?.players||[]).filter(direct);
 const verified=rows.filter(r=>r?.evidenceState&&r.evidenceState!=='UNKNOWN');
 const rivals=players.map(p=>({
  name:p.name||'',
  website:p.website||p.link||'',
  appearances:num(p.appearances)||0,
  queries:Array.isArray(p.queries)?p.queries:[],
  rating:num(p.rating),reviews:num(p.reviews),
  bestLocalPosition:num(p.bestLocalPosition),bestOrganicPosition:num(p.bestOrganicPosition),
  sources:Array.isArray(p.sources)?p.sources:[]
 })).filter(p=>p.name).sort((a,b)=>b.appearances-a.appearances||(a.bestLocalPosition||99)-(b.bestLocalPosition||99)||(a.bestOrganicPosition||99)-(b.bestOrganicPosition||99));
 const repeated=rivals.filter(p=>p.appearances>=2||p.queries.length>=2);
 const leader=repeated[0]||rivals[0]||null;
 const targetWins=verified.filter(r=>r.evidenceState==='OBSERVED_WIN').length;
 const targetGaps=verified.filter(r=>r.evidenceState==='OBSERVED_GAP').length;
 let state='INSUFFICIENT_EVIDENCE',headline='GO has not verified a repeat direct competitor strongly enough yet.',summary='One search appearance is not enough to call another operator a strategic competitor.',action='Keep competitor claims unresolved until the same direct operator appears repeatedly in relevant commercial demand.';
 if(verified.length>=3&&leader&&repeated.length){
  if(targetGaps>=2&&leader.appearances>=2){
   state='REPEATED_COMPETITOR_PRESSURE';
   headline=`${leader.name} repeatedly appears in commercial demand where this business has verified gaps.`;
   summary=`GO observed ${leader.name} across ${leader.appearances} relevant search context${leader.appearances===1?'':'s'} while the operator had ${targetGaps} verified visibility gap${targetGaps===1?'':'s'}. That makes this a competitor worth investigating, not just a search result.`;
   action='Compare the overlapping products, offer structure, reputation, positioning and booking path before choosing a response.';
  }else{
   state='COMPETITOR_CONTEXT';
   headline=`${leader.name} is a repeated market player, but GO has not proven it is taking meaningful demand from this business.`;
   summary=`GO observed ${leader.name} repeatedly, while this business still won ${targetWins} of ${verified.length} verified searches. Treat the competitor as context until a specific commercial advantage is proven.`;
   action='Watch the repeated competitor and compare only the product families where both businesses genuinely overlap.';
  }
 }
 return {version:'GO-COMPETITIVE-INTELLIGENCE-V1',state,headline,summary,action,leader,market:{qualifiedDirect:rivals.length,repeatedDirect:repeated.length,sample:rivals.slice(0,5)},research:{verifiedQueries:verified.length,targetWins,targetGaps},evidenceNote:'GO only promotes direct operators qualified by relevant commercial search evidence. Marketplaces and destination authorities remain demand context, not direct competitors.'};
}
window.GOCompetitiveIntelligence={build};
})();