import {COMMERCIAL_SYNTHESIS_SCHEMA,validateCommercialSynthesis} from "./commercial-synthesis.mjs";
const ENDPOINT="https://api.openai.com/v1/responses";
const compactObservation=(observation,maxText=8000)=>{
 const o=observation||{};
 return {
  url:o.url,title:o.title,headings:Array.isArray(o.headings)?o.headings.slice(0,30):undefined,
  text:typeof o.text==='string'?o.text.slice(0,maxText):o.text,
  bookingLinks:Array.isArray(o.bookingLinks)?o.bookingLinks.slice(0,12):undefined,
  // Raw page-wide amounts have no product association (they may be parking or donations).
  // Keep them in the evidence artifact, but do not hand them to a reasoning stage as fees.
  address:o.address,phone:o.phone,website:o.website,placeId:o.placeId,
  position:o.position,snippet:o.snippet,domain:o.domain,link:o.link,
  rating:o.rating,reviews:o.reviews,category:o.category,openState:o.openState,
  hours:o.hours
 };
};

export const BUSINESS_DOSSIER_SCHEMA={type:"object",additionalProperties:false,properties:{
 businessName:{type:"string"},operatingMarket:{type:"string"},summary:{type:"string"},businessModel:{type:"string",enum:["tour","rental","charter","admission","class","transportation","mixed","unknown"]},
 products:{type:"array",items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},family:{type:"string"},transactionType:{type:"string"},priceText:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}}},required:["name","family","transactionType","priceText","evidenceIds"]}},
 positioning:{type:"array",items:{type:"object",additionalProperties:false,properties:{theme:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}}},required:["theme","evidenceIds"]}},
 travelerIntents:{type:"array",items:{type:"object",additionalProperties:false,properties:{query:{type:"string"},productFamily:{type:"string"},reason:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}}},required:["query","productFamily","reason","evidenceIds"]}},
 unknowns:{type:"array",items:{type:"string"}}
},required:["businessName","operatingMarket","summary","businessModel","products","positioning","travelerIntents","unknowns"]};

export const INVESTIGATION_PLAN_SCHEMA={type:"object",additionalProperties:false,properties:{
 questions:{type:"array",items:{type:"object",additionalProperties:false,properties:{id:{type:"string"},question:{type:"string"},commercialReason:{type:"string"},capabilities:{type:"array",items:{type:"string",enum:["ORGANIC_SERP","LOCAL_MAPS","BUSINESS_ENTITY","REVIEW_REPUTATION","COMPETITOR_SITE","BOOKING_FLOW","VISUAL_SCREENSHOT","OTA_MARKETPLACE"]}},seedQueries:{type:"array",items:{type:"string"}},evidenceIds:{type:"array",items:{type:"string"}},stopWhen:{type:"string"}},required:["id","question","commercialReason","capabilities","seedQueries","evidenceIds","stopWhen"]}},
 deprioritized:{type:"array",items:{type:"object",additionalProperties:false,properties:{area:{type:"string"},reason:{type:"string"}},required:["area","reason"]}}
},required:["questions","deprioritized"]};

export async function buildBusinessDossierWithModel({evidence=[],apiKey,model=process.env.GO_RESEARCH_MODEL||"gpt-5",onUsage}){
 if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
 const compact=evidence.map(({id,surface,claimType,subject,observation,source,status})=>({id,surface,claimType,subject,observation:compactObservation(observation),source,status}));
 const instructions=["You are the Business Understanding stage of Growth Operator, software for tour/activity operators.","Infer only from supplied evidence. Never use outside knowledge.","Understand what the operator actually sells before market judgment.","Distinguish transaction model from activity: rental is not tour; charter is not generic tour; admission is not guided tour.","Every product, positioning theme and traveler intent must cite supplied evidence IDs.","Do not create traveler intent for an unsupported product family.","Preserve uncertainty in unknowns rather than guessing."].join("\n");
 const payload=await callStructured({model,apiKey,name:"go_business_dossier",schema:BUSINESS_DOSSIER_SCHEMA,instructions,input:{evidence:compact},onUsage});
 const validation=validateBusinessDossier(payload.value,evidence);if(!validation.ok)throw new Error("Business dossier failed truth validation: "+validation.errors.join("; "));
 return {dossier:payload.value,model:payload.model,responseId:payload.responseId,usage:payload.usage};
}

export async function buildInvestigationPlanWithModel({dossier,evidence=[],signals={},apiKey,model=process.env.GO_RESEARCH_MODEL||"gpt-5",onUsage}){
 if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
 const instructions=["You are the Investigation Planner for Growth Operator.","Plan research that could change a tour/activity operator's business decision; do not produce an audit checklist.","Use only supplied dossier, normalized evidence and anomaly signals.","Return at most 3 high-value questions and at most 2 seed queries per question; keep each field to one brief sentence.","A question may inspect multiple surfaces. Evidence may create a follow-up question; contradictions and entity anomalies deserve investigation.","Do not ask a generic SEO question when current evidence already shows healthy presence.","Do not recommend a change yet. Define what must be learned and when investigation can stop.","Every evidence-triggered question must cite real supplied evidence IDs. Seed queries must map to supported product/traveler intent."].join("\n");
 const compact=evidence.map(({id,surface,claimType,subject,observation,status})=>({id,surface,claimType,subject,observation:compactObservation(observation),status}));
 const payload=await callStructured({model,apiKey,name:"go_investigation_plan",schema:INVESTIGATION_PLAN_SCHEMA,instructions,input:{dossier,evidence:compact,signals},onUsage});
 const validation=validatePlanCitations(payload.value,new Set(evidence.map(x=>x.id)));if(!validation.ok)throw new Error("Investigation planner cited invalid evidence IDs: "+validation.invalidIds.join(", "));
 return {plan:payload.value,model:payload.model,responseId:payload.responseId,usage:payload.usage};
}

export async function synthesizeCommercialJudgmentWithModel({dossier,evidence=[],signals={},plan={},apiKey,model=process.env.GO_SYNTHESIS_MODEL||process.env.GO_RESEARCH_MODEL||"gpt-5",onUsage}){
 if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
 const input=buildSynthesisInput({dossier,evidence,signals,plan});
 const instructions=["You are the commercial judgment stage of Growth Operator for tour/activity operators.","Act like a strong growth operator, owner and investigator, not an SEO audit.","Use only supplied evidence. Never claim a fact from general knowledge.","Do not manufacture weaknesses. Healthy areas should be explicitly preserved or deprioritized.","A provider failure, UNKNOWN row or missing observation is never evidence of absence.","A listing or search snippet without a price cannot establish that the product page lacks a price; inspect the product page or classify this as INVESTIGATE.","A generic extracted prices array does not identify which product, fee, donation or parking charge an amount belongs to; use source text for context.","Contradictions and anomalies become INVESTIGATE until resolved.","Search rank is evidence about discovery only; never equate rank with conversion or revenue.","A VALIDATED_OPPORTUNITY or QUICK_WIN requires observed evidence strong enough to justify action now.","Every finding and next move must cite supplied evidence IDs.","Choose exactly one existing finding as the next move; copy its headline into findingHeadline, match its type, and include all its evidence IDs. Never combine unverified investigations into a QUICK_WIN.","EconomicBoundary must say what is and is not supported. Never manufacture ROI.","Prefer a small number of commercially meaningful findings over filling buckets.","If an unexpected observation matters more than the original research question, elevate it."].join("\n");
 const payload=await callStructured({model,apiKey,name:"go_commercial_synthesis",schema:COMMERCIAL_SYNTHESIS_SCHEMA,instructions,input,onUsage});
 const visibleIds=new Set(input.evidence.map(x=>x.id));
 const synthesis=normalizeSynthesisBuckets(payload.value);
 const validation=validateCommercialSynthesis(synthesis,evidence.filter(x=>visibleIds.has(x.id)));if(!validation.ok){const error=new Error("Commercial synthesis failed truth validation: "+validation.errors.map(x=>x.error).join("; "));error.draftJudgment=synthesis;throw error}
 return {synthesis,model:payload.model,responseId:payload.responseId,usage:payload.usage};
}

export function normalizeSynthesisBuckets(value){
 const copy={...value,strengths:[...(value.strengths||[])],opportunities:[],investigations:[...(value.investigations||[])],doNotPrioritize:[...(value.doNotPrioritize||[])]};
 for(const finding of value.opportunities||[]){
  if(finding.type==="INVESTIGATE")copy.investigations.push(finding);
  else if(finding.type==="LEVERAGE")copy.strengths.push(finding);
  else if(finding.type==="DO_NOT_PRIORITIZE")copy.doNotPrioritize.push(finding);
  else if(finding.type==="MEASURE")continue; // Measurement alone is not an actionable opportunity.
  else copy.opportunities.push(finding);
 }
 return copy;
}

// A deterministic coverage sample keeps all original evidence in the response artifact.
// The model sees a bounded selection spanning queries and surfaces; missing records
// cannot be treated as proof of absence.
export function buildSynthesisInput({dossier,evidence=[],signals={},plan={}}){
 const selected=new Map(),groups=new Map();
 const add=row=>{if(row?.id&&!selected.has(row.id)&&selected.size<48)selected.set(row.id,row)};
 evidence.filter(x=>x.surface==="FIRST_PARTY_RENDERED").slice(0,6).forEach(add);
 const market=evidence.filter(x=>x.surface!=="FIRST_PARTY_RENDERED");
 for(const row of market){const key=[row.source?.query||"",row.surface].join("|");if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)}
 for(const rows of groups.values()){
  rows.sort((a,b)=>Number(b.operatorMatch?.likely)-Number(a.operatorMatch?.likely)||Number(a.observation?.position||999)-Number(b.observation?.position||999));
  rows.slice(0,3).forEach(add);
 }
 for(const row of market.filter(x=>x.surface==="COMPETITOR_SITE"))add(row);
 const compact=[...selected.values()].map(({id,surface,claimType,subject,observation,source,status,confidence,operatorMatch})=>({id,surface,claimType,subject:{label:subject?.label},observation:compactObservation(observation,500),source:{query:source?.query,url:source?.url},status,confidence,operatorMatch:{likely:operatorMatch?.likely}}));
 const briefSignals={presence:(signals.presence||[]).map(x=>({query:x.query,state:x.state,surfaces:x.surfaces,evidenceIds:x.evidenceIds?.filter(id=>selected.has(id))})),anomalies:(signals.anomalies||[]).map(x=>({type:x.type,headline:x.headline,evidenceIds:x.evidenceIds?.filter(id=>selected.has(id))})),competitorCandidates:(signals.competitorCandidates||[]).slice(0,5).map(x=>({name:x.name,domain:x.domain,queries:x.queries,bestPosition:x.bestPosition}))};
 const input={dossier,evidence:compact,signals:briefSignals,plan:{questions:(plan.questions||[]).slice(0,3).map(q=>({question:q.question,commercialReason:q.commercialReason,seedQueries:q.seedQueries}))},sampling:{totalRecords:evidence.length,visibleRecords:compact.length,rule:"Evidence is sampled; omitted records are not proof of absence."}};
 if(JSON.stringify(input).length>90000)throw new Error("Synthesis evidence selection exceeds 90000 characters before model dispatch");
 return input;
}

export function validateBusinessDossier(dossier={},evidence=[]){
 const errors=[],validIds=new Set(evidence.map(x=>x.id)),citation=validateModelCitations(dossier,validIds);
 if(!citation.ok)errors.push("invalid evidence ids: "+citation.invalidIds.join(", "));
 const firstParty=new Map(evidence.filter(x=>x.surface==="FIRST_PARTY_RENDERED"&&x.status==="OBSERVED").map(x=>[x.id,x]));
 const evidenceText=id=>{const row=firstParty.get(id);if(!row)return"";const o=row.observation||{};return [row.subject?.label,o.title,...(o.headings||[]),o.text].join(" ").toLowerCase()};
 const supported=(needle,ids=[])=>{needle=String(needle||"").toLowerCase().trim();if(!needle)return false;const tokens=needle.replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(x=>x.length>2);return ids.some(id=>{const text=evidenceText(id);return text&&(text.includes(needle)||tokens.filter(t=>text.includes(t)).length>=Math.max(1,Math.ceil(tokens.length*.6)))})};
 if(!String(dossier.businessName||"").trim())errors.push("businessName required");
 if(!String(dossier.summary||"").trim())errors.push("summary required");
 for(const [i,p] of (dossier.products||[]).entries()){if(!(p.evidenceIds||[]).some(id=>firstParty.has(id)))errors.push("product "+i+" lacks observed first-party evidence");else if(!supported(p.name,p.evidenceIds))errors.push("product "+i+" name is not grounded in cited first-party text")}
 for(const [i,x] of (dossier.travelerIntents||[]).entries()){if(!(x.evidenceIds||[]).some(id=>firstParty.has(id)))errors.push("traveler intent "+i+" lacks first-party support")}
 if(dossier.businessModel!=="unknown"&&(dossier.products||[]).length===0)errors.push("known business model requires at least one evidenced product");
 return {ok:errors.length===0,errors};
}

export function validateModelCitations(dossier={},validIds=new Set()){const cited=[];for(const p of dossier.products||[])cited.push(...(p.evidenceIds||[]));for(const p of dossier.positioning||[])cited.push(...(p.evidenceIds||[]));for(const p of dossier.travelerIntents||[])cited.push(...(p.evidenceIds||[]));const invalidIds=[...new Set(cited.filter(id=>!validIds.has(id)))];return {ok:invalidIds.length===0,invalidIds,cited:[...new Set(cited)]}}
export function validatePlanCitations(plan={},validIds=new Set()){const cited=(plan.questions||[]).flatMap(x=>x.evidenceIds||[]);const invalidIds=[...new Set(cited.filter(id=>!validIds.has(id)))];return {ok:invalidIds.length===0,invalidIds,cited:[...new Set(cited)]}}

async function callStructured({model,apiKey,name,schema,instructions,input,onUsage}){
 const inputText=JSON.stringify(input);
 if(inputText.length>100000)throw new Error(`${name} exceeds the 100000-character research input ceiling`);
 const body={model,input:[{role:"user",content:[{type:"input_text",text:inputText}]}],instructions,store:false,max_output_tokens:6000,...(model.startsWith("gpt-5")?{reasoning:{effort:"low"}}:{}),text:{format:{type:"json_schema",name,strict:true,schema}}};
 const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+apiKey},body:JSON.stringify(body)});
 const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||"OpenAI Responses API returned "+response.status);
 onUsage?.({model:payload.model||model,responseId:payload.id||"",usage:payload.usage||null});
 const raw=extractOutputText(payload);if(!raw)throw new Error("Research model returned no structured output (status="+payload.status+", reason="+(payload.incomplete_details?.reason||"unknown")+")");let value;try{value=JSON.parse(raw)}catch{throw new Error("Research model returned invalid JSON (status="+payload.status+", reason="+(payload.incomplete_details?.reason||"unknown")+")")}
 return {value,model:payload.model||model,responseId:payload.id||"",usage:payload.usage||null};
}
function extractOutputText(payload){if(typeof payload.output_text==="string")return payload.output_text;for(const item of payload.output||[])for(const part of item.content||[])if(part.type==="output_text"&&part.text)return part.text;return""}
