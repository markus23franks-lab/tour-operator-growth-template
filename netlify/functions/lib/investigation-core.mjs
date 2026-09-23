export const SURFACES={FIRST_PARTY:"FIRST_PARTY_RENDERED",ORGANIC:"ORGANIC_SERP",LOCAL:"LOCAL_MAPS",ENTITY:"BUSINESS_ENTITY"};

const clean=v=>String(v??"").replace(/\s+/g," ").trim();
const norm=v=>clean(v).toLowerCase().replace(/\b(company|co|llc|inc|ltd|the)\b/g," ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const host=v=>{try{return new URL(v).hostname.toLowerCase().replace(/^www\./,"")}catch{return""}};
const digits=v=>clean(v).replace(/\D/g,"");
const id=(prefix,...parts)=>prefix+"_"+simpleHash(parts.map(clean).join("|"));
function simpleHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}

export function normalizeSerpEvidence({query,payload,operator={},observedAt=new Date().toISOString(),provider="SerpApi"}){
  const out=[];
  const organic=payload?.organic_results||[];
  organic.forEach((row,index)=>{
    out.push({id:id("ev",provider,"organic",query,row.link||row.title,index),surface:SURFACES.ORGANIC,claimType:"SEARCH_RESULT_OBSERVED",subject:{entityId:null,label:clean(row.title)},observation:{position:row.position??index+1,url:row.link||"",snippet:clean(row.snippet)},source:{provider,query,url:row.link||"",providerRef:row.result_id||""},observedAt,confidence:"HIGH",status:"OBSERVED"});
  });
  const localRows=payload?.local_results?.places||payload?.local_results||[];
  (Array.isArray(localRows)?localRows:[]).forEach((row,index)=>{
    const label=clean(row.title||row.name);
    out.push({id:id("ev",provider,"local",query,row.place_id||label,index),surface:SURFACES.LOCAL,claimType:"BUSINESS_ENTITY_OBSERVED",subject:{entityId:row.place_id||null,label},observation:{position:row.position??index+1,placeId:row.place_id||row.data_id||"",address:clean(row.address),phone:clean(row.phone),website:row.website||row.links?.website||"",rating:row.rating??null,reviews:row.reviews??row.reviews_count??null,type:clean(row.type)},source:{provider,query,url:row.website||row.links?.website||"",providerRef:row.place_id||row.data_id||""},observedAt,confidence:"HIGH",status:"OBSERVED"});
  });
  return out.map(x=>({...x,operatorMatch:scoreOperatorMatch(x,operator)}));
}

export function scoreOperatorMatch(record,operator={}){
  const targetName=norm(operator.name),label=norm(record.subject?.label);
  const targetHost=host(operator.website),recordHost=host(record.observation?.website||record.source?.url);
  let score=0;const reasons=[];
  if(targetHost&&recordHost&&targetHost===recordHost){score+=0.65;reasons.push("same-domain")}
  if(targetName&&label&&(targetName===label||targetName.includes(label)||label.includes(targetName))){score+=0.3;reasons.push("name-match")}
  else if(targetName&&label){const a=new Set(targetName.split(" ")),b=new Set(label.split(" "));const overlap=[...a].filter(x=>b.has(x)).length/Math.max(a.size,b.size);if(overlap>=0.6){score+=0.18;reasons.push("name-overlap")}}
  return {score:Math.min(1,score),reasons,likely:score>=0.3,strong:score>=0.65};
}

export function reconcileBusinessEntities(records=[],operator={}){
  const local=records.filter(x=>x.surface===SURFACES.LOCAL&&x.status==="OBSERVED");
  const target=local.filter(x=>x.operatorMatch?.likely);
  const groups=[];const used=new Set();
  for(let i=0;i<target.length;i++){
    if(used.has(i))continue;const cluster=[target[i]];used.add(i);
    for(let j=i+1;j<target.length;j++){
      if(used.has(j))continue;
      const a=target[i],b=target[j],ao=a.observation||{},bo=b.observation||{};
      const sameDomain=host(ao.website)&&host(ao.website)===host(bo.website);
      const samePhone=digits(ao.phone).length>=7&&digits(ao.phone)===digits(bo.phone);
      const sameAddress=norm(ao.address)&&norm(ao.address)===norm(bo.address);
      const nameClose=norm(a.subject?.label)===norm(b.subject?.label);
      if(sameDomain||samePhone||sameAddress||(nameClose&&(a.operatorMatch?.likely&&b.operatorMatch?.likely))){cluster.push(b);used.add(j)}
    }
    groups.push(cluster);
  }
  const anomalies=[];
  for(const cluster of groups){
    const providerIds=[...new Set(cluster.map(x=>x.observation?.placeId||x.source?.providerRef).filter(Boolean))];
    if(providerIds.length>1){
      anomalies.push({id:id("an","entity-fragmentation",...providerIds),type:"POSSIBLE_ENTITY_FRAGMENTATION",state:"INVESTIGATE",headline:`GO found ${providerIds.length} distinct local business entities that may represent the same operator.`,evidenceIds:cluster.map(x=>x.id),reason:"Multiple provider entity IDs share operator identity signals. Verify whether they are intentional locations/brands or fragmented listings before recommending consolidation.",questions:["Do the entities represent separate legitimate locations or the same customer-facing business?","Do phone, address, domain and booking destination overlap?","Are reviews and traveler trust split across the entities?"]});
    }
  }
  return {targetEntities:target,groups,anomalies};
}

export function reconcileSearchPresence(records=[],operator={}){
  const byQuery=new Map();
  for(const row of records){
    const q=clean(row.source?.query);if(!q)continue;
    if(!byQuery.has(q))byQuery.set(q,[]);
    byQuery.get(q).push(row);
  }
  return [...byQuery].map(([query,rows])=>{
    const observed=rows.filter(x=>x.operatorMatch?.likely&&x.status==="OBSERVED");
    const surfaces=[...new Set(observed.map(x=>x.surface))];
    return {query,state:observed.length?"OBSERVED_PRESENT":"UNRESOLVED",surfaces,evidenceIds:observed.map(x=>x.id),note:observed.length?`Operator presence observed on ${surfaces.join(" + ")}.`:"No normalized surface established operator presence; do not convert this to an absence claim."};
  });
}


export function detectEvidenceContradictions(records=[],operator={}){
  const byQuery=new Map();
  for(const row of records){
    const query=clean(row.source?.query);if(!query)continue;
    if(!byQuery.has(query))byQuery.set(query,[]);
    byQuery.get(query).push(row);
  }
  const contradictions=[];
  for(const [query,rows] of byQuery){
    const present=rows.filter(x=>x.status==="OBSERVED"&&x.operatorMatch?.likely);
    const absence=rows.filter(x=>x.status==="OBSERVED"&&x.claimType==="TARGET_ABSENCE_OBSERVED");
    if(present.length&&absence.length){
      contradictions.push({id:id("cx","presence",query),type:"CROSS_SURFACE_PRESENCE_CONTRADICTION",state:"INVESTIGATE",headline:`Public sources disagree about operator presence for “${query}”.`,evidenceIds:[...present,...absence].map(x=>x.id),reason:"An observed presence on one surface conflicts with an observed absence claim on another. Resolve source scope before making a visibility judgment."});
    }
  }
  return contradictions;
}


export function buildCompetitorCandidates(records=[],operator={}){
  const ownHost=host(operator.website),rows=records.filter(x=>x.status==="OBSERVED"&&(x.surface===SURFACES.ORGANIC||x.surface===SURFACES.LOCAL)&&!x.operatorMatch?.likely);
  const byHost=new Map();
  for(const row of rows){
    const url=row.observation?.website||row.source?.url||"",domain=host(url);
    if(!domain||domain===ownHost||/(tripadvisor|viator|getyourguide|yelp|facebook|instagram|youtube|wikipedia|reddit)\./i.test(domain))continue;
    if(!byHost.has(domain))byHost.set(domain,{domain,name:row.subject?.label||domain,evidenceIds:[],queries:new Set(),surfaces:new Set(),bestPosition:999});
    const item=byHost.get(domain);item.evidenceIds.push(row.id);if(row.source?.query)item.queries.add(row.source.query);item.surfaces.add(row.surface);item.bestPosition=Math.min(item.bestPosition,Number(row.observation?.position)||999);
  }
  return [...byHost.values()].map(x=>({...x,queries:[...x.queries],surfaces:[...x.surfaces],evidenceIds:[...new Set(x.evidenceIds)],score:x.queries.size*3+x.surfaces.size*2+(x.bestPosition<=5?2:0)})).sort((a,b)=>b.score-a.score||a.bestPosition-b.bestPosition).slice(0,8);
}


export function buildEntityIntegrityPlan({records=[],operator={}}){
 const reconciled=reconcileBusinessEntities(records,operator),steps=[];
 for(const anomaly of reconciled.anomalies){
   const rows=(anomaly.evidenceIds||[]).map(id=>records.find(x=>x.id===id)).filter(Boolean);
   const ids=[...new Set(rows.map(x=>x.observation?.placeId||x.source?.providerRef).filter(Boolean))];
   const domains=rows.map(x=>host(x.observation?.website)).filter(Boolean),phones=rows.map(x=>digits(x.observation?.phone)).filter(x=>x.length>=7),addresses=[...new Set(rows.map(x=>norm(x.observation?.address)).filter(Boolean))];
   steps.push({anomalyId:anomaly.id,type:anomaly.type,entityIds:ids,evidenceIds:anomaly.evidenceIds,observedSignals:{sharedDomain:domains.length>1&&new Set(domains).size===1,sharedPhone:phones.length>1&&new Set(phones).size===1,sameAddress:addresses.length===1&&addresses.length>0,addressCount:addresses.length},state:"INVESTIGATE",nextChecks:["Fetch each business entity by provider ID when supported.","Compare canonical website, phone, street address and coordinates.","Compare review count/rating and recent review stream.","Verify whether the operator intentionally maintains multiple locations or brands."],decisionBoundary:"Do not recommend merge/consolidation until ownership, location intent and provider-specific entity details are verified."});
 }
 return {state:steps.length?"FOLLOW_UP_REQUIRED":"NO_ENTITY_ANOMALY",steps};
}

export function buildResearchCoverage({records=[],signals={}}){
 const observed=records.filter(x=>x.status==="OBSERVED"),surfaces=[...new Set(observed.map(x=>x.surface))];
 const queries=[...new Set(observed.map(x=>x.source?.query).filter(Boolean))];
 const firstParty=observed.filter(x=>x.surface===SURFACES.FIRST_PARTY).length;
 const competitors=observed.filter(x=>x.surface==="COMPETITOR_SITE").length;
 const unresolved=(signals.presence||[]).filter(x=>x.state==="UNRESOLVED").length;
 const blockers=[];
 if(firstParty<1)blockers.push("NO_FIRST_PARTY_EVIDENCE");
 if(queries.length<3)blockers.push("TOO_FEW_MARKET_QUERIES");
 if(!surfaces.includes(SURFACES.LOCAL))blockers.push("NO_LOCAL_SURFACE");
 if(!surfaces.includes(SURFACES.ORGANIC))blockers.push("NO_ORGANIC_SURFACE");
 if(competitors<1)blockers.push("NO_COMPETITOR_SITE_EVIDENCE");
 return {state:blockers.length?"INCOMPLETE":"READY_FOR_JUDGMENT",surfaces,queries:firstParty?queries:[],firstPartyRecords:firstParty,competitorRecords:competitors,unresolvedQueries:unresolved,blockers};
}

export function buildInvestigationSignals({records=[],operator={}}){
  const entities=reconcileBusinessEntities(records,operator);
  const presence=reconcileSearchPresence(records,operator);
  const contradictions=detectEvidenceContradictions(records,operator);
  const competitorCandidates=buildCompetitorCandidates(records,operator);
  const strengths=presence.filter(x=>x.state==="OBSERVED_PRESENT").map(x=>({type:"DISCOVERY_STRENGTH",state:"LEVERAGE",headline:`Public presence is already observed for “${x.query}”.`,evidenceIds:x.evidenceIds,reason:x.note}));
  const anomalyQuestions=entities.anomalies.flatMap(x=>(x.questions||[]).map(question=>({triggerId:x.id,question,reason:x.reason})));const contradictionQuestions=contradictions.map(x=>({triggerId:x.id,question:'Which observed surface has the correct scope and identity match for this query?',reason:x.reason}));return {entities,presence,competitorCandidates,anomalies:[...entities.anomalies,...contradictions],contradictions,strengths,followUpQuestions:[...anomalyQuestions,...contradictionQuestions]};
}
