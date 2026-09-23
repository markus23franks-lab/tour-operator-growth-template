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

export function buildInvestigationSignals({records=[],operator={}}){
  const entities=reconcileBusinessEntities(records,operator);
  const presence=reconcileSearchPresence(records,operator);
  const strengths=presence.filter(x=>x.state==="OBSERVED_PRESENT").map(x=>({type:"DISCOVERY_STRENGTH",state:"LEVERAGE",headline:`Public presence is already observed for “${x.query}”.`,evidenceIds:x.evidenceIds,reason:x.note}));
  return {entities,presence,anomalies:entities.anomalies,strengths,followUpQuestions:entities.anomalies.flatMap(x=>x.questions.map(question=>({triggerId:x.id,question,reason:x.reason})))};
}
