(()=>{
'use strict';

/* Build 055 — Cold-Start Intelligence V1
   Converts first-party product truth into structured traveler intent before a query is rendered.
   Page copy may establish what the operator sells; it may never become a query verbatim. */

const priorDemand=window.buildDemandPlan;
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const key=v=>norm(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const FAMILIES=[
 {id:'canyoneering',label:'canyoneering',patterns:[/\bcanyoneering\b/i,/\brappell?ing\b/i,/\bcanyon tours?\b/i]},
 {id:'rock-climbing',label:'rock climbing',patterns:[/\brock climbing\b/i,/\bclimbing tours?\b/i,/\bclimbing guides?\b/i]},
 {id:'hiking',label:'hiking tours',patterns:[/\bguided hik(?:e|es|ing)\b/i,/\bhiking tours?\b/i,/\bhiking adventures?\b/i]},
 {id:'snorkeling',label:'snorkeling tours',patterns:[/\bsnorkel(?:ing)?\b/i]},
 {id:'scuba',label:'scuba diving',patterns:[/\bscuba\b/i,/\bdiving tours?\b/i]},
 {id:'private-charter',label:'private boat charters',patterns:[/\bprivate (?:boat )?charters?\b/i,/\bprivate boat tours?\b/i]},
 {id:'boat-tour',label:'boat tours',patterns:[/\bboat tours?\b/i,/\bboat trips?\b/i,/\bpowerboat\b/i]},
 {id:'sunset',label:'sunset cruises',patterns:[/\bsunset (?:cruises?|sails?|tours?)\b/i]},
 {id:'sailing',label:'sailing tours',patterns:[/\bsailing\b/i,/\bsailboat\b/i,/\bcatamaran\b/i]},
 {id:'fishing',label:'fishing charters',patterns:[/\bfishing charters?\b/i,/\bsportfishing\b/i,/\bdeep sea fishing\b/i]},
 {id:'kayak',label:'kayak tours',patterns:[/\bkayak(?:ing)?\b/i]},
 {id:'rafting',label:'rafting tours',patterns:[/\brafting\b/i,/\bwhitewater\b/i]},
 {id:'horseback',label:'horseback riding',patterns:[/\bhorseback\b/i,/\btrail rides?\b/i]},
 {id:'atv',label:'ATV tours',patterns:[/\bATV\b/i,/\bUTV\b/i,/\boff[- ]road tours?\b/i]},
 {id:'jeep',label:'jeep tours',patterns:[/\bjeep tours?\b/i]},
 {id:'helicopter',label:'helicopter tours',patterns:[/\bhelicopter tours?\b/i]},
 {id:'food',label:'food tours',patterns:[/\bfood tours?\b/i,/\bculinary tours?\b/i]},
 {id:'wine',label:'wine tours',patterns:[/\bwine tours?\b/i,/\bwinery tours?\b/i]},
 {id:'brewery',label:'brewery tours',patterns:[/\bbrewery tours?\b/i,/\bbeer tours?\b/i]},
 {id:'walking',label:'walking tours',patterns:[/\bwalking tours?\b/i,/\bhistory tours?\b/i,/\bhistoric tours?\b/i]},
 {id:'bike',label:'bike tours',patterns:[/\bbike tours?\b/i,/\bcycling tours?\b/i,/\bmountain biking\b/i]},
 {id:'ebike-rental',label:'e-bike rentals',patterns:[/\be-?bike rentals?\b/i,/\belectric bike rentals?\b/i]},
 {id:'surf',label:'surf lessons',patterns:[/\bsurf(?:ing)? lessons?\b/i]},
 {id:'paddleboard',label:'paddleboard rentals',patterns:[/\bpaddleboards?\b/i,/\bSUP rentals?\b/i]},
 {id:'jet-ski',label:'jet ski rentals',patterns:[/\bjet skis?\b/i,/\bjetski\b/i]},
 {id:'boat-rental',label:'boat rentals',patterns:[/\bboat rentals?\b/i,/\bpontoon rentals?\b/i,/\brent(?:al|als|ing)?\s+(?:a\s+)?(?:boat|powerboat|pontoon|vessel|dinghy)\b/i,/\b(?:boat|powerboat|pontoon|vessel|dinghy)\s+rentals?\b/i,/\b(?:self[- ]drive|bareboat)\b/i]},
 {id:'parasailing',label:'parasailing',patterns:[/\bparasail(?:ing)?\b/i]},
 {id:'whale',label:'whale watching',patterns:[/\bwhale watching\b/i]},
 {id:'dolphin',label:'dolphin tours',patterns:[/\bdolphin tours?\b/i,/\bdolphin watching\b/i]},
 {id:'city',label:'city tours',patterns:[/\bcity tours?\b/i,/\bsightseeing tours?\b/i]},
 {id:'bus',label:'sightseeing bus tours',patterns:[/\bhop[- ]on hop[- ]off\b/i,/\bsightseeing bus\b/i,/\bbus tours?\b/i]},
 {id:'ghost',label:'ghost tours',patterns:[/\bghost tours?\b/i]},
 {id:'zipline',label:'zipline tours',patterns:[/\bzip ?line(?:s| tours?)?\b/i]},
 {id:'ski',label:'ski tours',patterns:[/\bski tours?\b/i,/\bskiing\b/i]},
 {id:'snowmobile',label:'snowmobile tours',patterns:[/\bsnowmobil(?:e|ing)\b/i]},
 {id:'museum',label:'museum tickets',patterns:[/\bmuseum admission\b/i,/\bmuseum tickets?\b/i,/\bgeneral admission\b/i]},
 {id:'attraction',label:'attraction tickets',patterns:[/\battraction tickets?\b/i,/\badmission tickets?\b/i]},
 {id:'escape-room',label:'escape rooms',patterns:[/\bescape rooms?\b/i]}
];

function cleanLocation(v){let s=norm(v).replace(/\b(?:United States|USA)\b/ig,'').replace(/\s*,\s*,/g,',').replace(/^[, ]+|[, ]+$/g,'');if(s.includes(','))s=s.split(',')[0].trim();return s;}
function sourceText(ctx){return [ctx?.combined,(ctx?.offers||[]).join(' '),(ctx?.commercialTruth?.primaryProducts||[]).map(x=>x.name||x).join(' '),(ctx?.commercialTruth?.segments||[]).map(x=>x.name||x).join(' ')].filter(Boolean).join('\n');}
function structuredText(ctx){return [(ctx?.commercialTruth?.primaryProducts||[]).map(x=>x.name||x).join(' '),(ctx?.commercialTruth?.segments||[]).map(x=>x.name||x).join(' '),(ctx?.offers||[]).join(' '),(ctx?.siteArchitecture?.commercialPages||[]).map(x=>x.name||'').join(' '),(ctx?.siteArchitecture?.internalProducts||[]).map(x=>x.name||'').join(' ')].filter(Boolean).join('\n');}
function occurrences(text,family){return family.patterns.reduce((n,re)=>n+((text.match(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g')))||[]).length,0)}
function transactionModel(ctx){
 const all=sourceText(ctx),structured=structuredText(ctx);
 const rental=/\b(?:rent|rents|rented|rental|rentals|hire|self[- ]drive|bareboat)\b/i;
 const water=/\b(?:boat|powerboat|pontoon|catamaran|sailboat|yacht|vessel|dinghy)\b/i;
 const rentalWater=new RegExp(`(?:${rental.source})[\\s\\S]{0,90}(?:${water.source})|(?:${water.source})[\\s\\S]{0,90}(?:${rental.source})`,'i');
 return {rentalWater:rentalWater.test(all),structuredRentalWater:rentalWater.test(structured),structured};
}
function familyScore(ctx,f,count){
 const tx=transactionModel(ctx),structuredCount=occurrences(tx.structured,f);
 let score=count+(structuredCount*8);
 if(tx.rentalWater){
   if(f.id==='boat-rental')score+=80;
   if(['boat-tour','snorkeling','sailing','sunset','private-charter'].includes(f.id)&&structuredCount===0)score-=60;
 }
 return {score,structuredCount};
}
function destinations(text){const out=[],seen=new Set();const patterns=[/\b([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,4}\s+National Park)\b/g,/\b([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,4}\s+State Park)\b/g,/\b([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,3}\s+National Monument)\b/g];patterns.forEach(re=>{for(const m of text.matchAll(re)){const v=norm(m[1]),k=key(v);if(v&&!seen.has(k)){seen.add(k);out.push(v)}}});return out.slice(0,4);}
function item(family,location,count,role='core',destination=''){const query=destination?`${destination} ${family.label}`:`${location} ${family.label}`;return {id:`intent-v3-${family.id}${destination?'-'+key(destination).replace(/ /g,'-'):''}`,coverageFamily:`intent-v3-${family.id}`,label:destination?`${destination} ${family.label}`:family.label,intent:family.label,query:norm(query),aliases:[],verifiedProductFamily:true,semanticProduct:true,commercialRole:role,websiteScore:Math.min(70,44+count*4),productSignalCount:count,websiteMentionCount:count,websiteEvidence:`First-party evidence supports the ${family.label} product family.`,intentObject:{destination:destination||location,activity:family.label,intent:'book-or-compare',specificity:destination?'destination-product':'core-category',familyId:family.id}};}
function validQuery(q){const s=norm(q);if(!s||s.length>72||s.split(' ').length>8)return false;if(/\b(?:book now|learn more|click|hours?|packages? designed|various packages|suit different|our tours|our adventures|available daily|view details|read more|reserve now)\b/i.test(s))return false;return true;}

window.buildDemandPlan=function(ctx){const text=sourceText(ctx),location=cleanLocation(ctx?.businessContext?.location||ctx?.commercialTruth?.geography||'');if(!location)return [];const tx=transactionModel(ctx);let found=FAMILIES.map(f=>{const count=occurrences(text,f),rank=familyScore(ctx,f,count);return {f,count,score:rank.score,structuredCount:rank.structuredCount}}).filter(x=>x.count>0||x.score>0);if(tx.rentalWater&&!found.some(x=>x.f.id==='boat-rental')){const f=FAMILIES.find(x=>x.id==='boat-rental');found.push({f,count:1,score:80,structuredCount:tx.structuredRentalWater?1:0});}found=found.filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.structuredCount-a.structuredCount||b.count-a.count);const out=[],seen=new Set();const add=x=>{if(!x||!validQuery(x.query))return;const k=key(x.query);if(seen.has(k))return;seen.add(k);out.push(x)};found.forEach(x=>add(item(x.f,location,x.count,'core')));const hiking=found.find(x=>x.f.id==='hiking');if(hiking)destinations(text).forEach(p=>add(item(hiking.f,location,hiking.count,'destination',p)));const legacy=typeof priorDemand==='function'?priorDemand(ctx):[];for(const old of legacy){if(out.length>=8)break;const oi=key(old?.intent||''),oq=key(old?.query||'');const family=found.find(x=>oi===key(x.f.label)||oq.includes(key(x.f.label)));if(family)add(item(family.f,location,Math.max(1,family.count),'core'));}return out.slice(0,8);};

window.buildRepresentativeSearchPortfolio=function(ctx,selected,demandPlan){const plan=Array.isArray(demandPlan)?demandPlan:[],ordered=[selected,...plan].filter(Boolean),out=[],seenFamilies=new Set();for(const p of ordered){if(out.length>=5)break;const family=p.intentObject?.familyId||key(p.intent);if(!p.verifiedProductFamily||seenFamilies.has(family)||!validQuery(p.query))continue;seenFamilies.add(family);out.push(p.query);}const destination=plan.find(p=>p.intentObject?.specificity==='destination-product'&&validQuery(p.query));if(destination&&!out.some(q=>key(q)===key(destination.query))){const i=out.findIndex(q=>/\bhiking tours?\b/i.test(q));if(i>=0)out[i]=destination.query;else if(out.length<5)out.push(destination.query);}return [...new Set(out)].slice(0,5);};

function queryState(row){const local=Number(row?.targetLocalPosition)||null,organic=Number(row?.targetOrganicPosition)||null;const checked=(Number(row?.localResultsChecked)||0)+(Number(row?.organicResultsChecked)||0),providerError=norm(row?.providerError);if(local||organic)return 'OBSERVED_WIN';if(checked>0&&!providerError)return 'OBSERVED_GAP';return 'UNKNOWN';}
function portfolioQuality(rows){const qs=(rows||[]).map(r=>norm(r.query));return {count:qs.length,natural:qs.filter(validQuery).length,unique:new Set(qs.map(key)).size,unknown:(rows||[]).filter(r=>queryState(r)==='UNKNOWN').length,wins:(rows||[]).filter(r=>queryState(r)==='OBSERVED_WIN').length,gaps:(rows||[]).filter(r=>queryState(r)==='OBSERVED_GAP').length};}
function emptyMarket(){return {queries:[],demandPlan:[],demandFamilies:[],selectedDemand:null,searchPages:[],discoveryDocs:[],competitors:[],marketEntities:[],reviewSignals:[],evidence:[],queryResults:[],retrievalNote:'No external market evidence was verified.'};}
function chooseSelected(plan,rows){const wins=new Set((rows||[]).filter(r=>queryState(r)==='OBSERVED_WIN').map(r=>key(r.query)));return plan.find(p=>wins.has(key(p.query)))||plan[0]||null;}

/* Build 055 owns professional retrieval rather than calling the legacy 8-query/two-pass routine.
   Candidate intent can remain broad internally; provider work is capped to the representative five. */
window.readProfessionalMarket=async function(ctx){
 const plan=window.buildDemandPlan(ctx);const portfolio=window.buildRepresentativeSearchPortfolio(ctx,null,plan);if(!portfolio.length||!ctx?.businessContext?.location)return null;
 try{
  const response=await fetch('/.netlify/functions/market-intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessName:ctx.businessName,website:ctx.url,location:ctx.businessContext.location,queries:portfolio,debugRunId:typeof GO_ACTIVE_RUN_ID!=='undefined'?GO_ACTIVE_RUN_ID:'',frontendBuildId:typeof GO_FRONTEND_BUILD_ID!=='undefined'?GO_FRONTEND_BUILD_ID:'B055-COLD-START-V1'})});
  const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok||!payload?.market)return null;
  const raw=payload.market,market=emptyMarket();market.provider=raw.provider||'SerpApi';market.professional=true;market.observedAt=raw.observedAt||'';market.runtimeBuildId=raw.runtimeBuildId||raw.buildId||'';market.runtimeDebug=raw.runtimeDebug||null;market.target=raw.target||null;market.demandPlan=plan;market.queryResults=(Array.isArray(raw.queries)?raw.queries:[]).filter(r=>portfolio.some(q=>key(q)===key(r.query))).map(r=>({...r,evidenceState:queryState(r),evidenceVerified:queryState(r)!=='UNKNOWN'}));market.queries=portfolio.slice();market.searchPages=market.queryResults.map(r=>({query:r.query,source:`${market.provider} · Google`,url:'',markdown:''}));market.competitors=(Array.isArray(raw.players)?raw.players:[]).map(p=>({name:p.name||'',url:p.website||p.link||'',label:p.name||'',category:p.category||'direct',authority:p.category==='authority',evidenceOnly:true,offers:[],prices:p.prices||[],trust:p.trust||{},specialization:p.specialization||[]}));market.reviewSignals=Array.isArray(raw.reviewSignals)?raw.reviewSignals:[];market.selectedDemand=chooseSelected(plan,market.queryResults);market.portfolioQuality=portfolioQuality(market.queryResults);market.retrievalNote=`GO selected ${portfolio.length} representative searches from verified product families. ${market.portfolioQuality.wins} showed observed visibility, ${market.portfolioQuality.gaps} showed an observed gap, and ${market.portfolioQuality.unknown} remained unknown.`;market.pipelineDebug={marketHandoff:{ok:true,buildId:market.runtimeBuildId,status:String(response.status),fallbackUsed:false},selectedQueries:portfolio.slice(),coldStartV3:{version:'B055-COLD-START-V1',portfolioQuality:market.portfolioQuality,intents:plan.map(x=>x.intentObject).filter(Boolean),candidateQueries:plan.map(x=>x.query),representativeQueries:portfolio.slice(),providerQueryCount:portfolio.length}};return market;
 }catch(error){console.warn('GO Build 055 professional market unavailable; public fallback may run.',error);return null;}
};

window.GOColdStartV3={version:'B055-COLD-START-V1.1',validQuery,families:FAMILIES.map(({id,label})=>({id,label})),transactionModel};
})();