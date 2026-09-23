import {COMMERCIAL_SYNTHESIS_SCHEMA,validateCommercialSynthesis} from "./commercial-synthesis.mjs";
const ENDPOINT="https://api.openai.com/v1/responses";

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

export async function buildBusinessDossierWithModel({evidence=[],apiKey,model=process.env.GO_RESEARCH_MODEL||"gpt-5"}){
 if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
 const compact=evidence.map(({id,surface,claimType,subject,observation,source,status})=>({id,surface,claimType,subject,observation,source,status}));
 const instructions=["You are the Business Understanding stage of Growth Operator, software for tour/activity operators.","Infer only from supplied evidence. Never use outside knowledge.","Understand what the operator actually sells before market judgment.","Distinguish transaction model from activity: rental is not tour; charter is not generic tour; admission is not guided tour.","Every product, positioning theme and traveler intent must cite supplied evidence IDs.","Do not create traveler intent for an unsupported product family.","Preserve uncertainty in unknowns rather than guessing."].join("\n");
 const payload=await callStructured({model,apiKey,name:"go_business_dossier",schema:BUSINESS_DOSSIER_SCHEMA,instructions,input:{evidence:compact}});
 const validation=validateModelCitations(payload.value,new Set(evidence.map(x=>x.id)));if(!validation.ok)throw new Error("Research model cited invalid evidence IDs: "+validation.invalidIds.join(", "));
 return {dossier:payload.value,model:payload.model,responseId:payload.responseId,usage:payload.usage};
}

export async function buildInvestigationPlanWithModel({dossier,evidence=[],signals={},apiKey,model=process.env.GO_RESEARCH_MODEL||"gpt-5"}){
 if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
 const instructions=["You are the Investigation Planner for Growth Operator.","Plan research that could change a tour/activity operator's business decision; do not produce an audit checklist.","Use only supplied dossier, normalized evidence and anomaly signals.","Prefer 3-6 high-value questions. A question may inspect multiple surfaces.","Evidence may create a follow-up question. Contradictions and entity anomalies deserve investigation.","Do not ask a generic SEO question when current evidence already shows healthy presence.","Do not recommend a change yet. Define what must be learned and when investigation can stop.","Every evidence-triggered question must cite real supplied evidence IDs. Seed queries must map to supported product/traveler intent."].join("\n");
 const compact=evidence.map(({id,surface,claimType,subject,observation,status})=>({id,surface,claimType,subject,observation,status}));
 const payload=await callStructured({model,apiKey,name:"go_investigation_plan",schema:INVESTIGATION_PLAN_SCHEMA,instructions,input:{dossier,evidence:compact,signals}});
 const validation=validatePlanCitations(payload.value,new Set(evidence.map(x=>x.id)));if(!validation.ok)throw new Error("Investigation planner cited invalid evidence IDs: "+validation.invalidIds.join(", "));
 return {plan:payload.value,model:payload.model,responseId:payload.responseId,usage:payload.usage};
}

export async function synthesizeCommercialJudgmentWithModel({dossier,evidence=[],signals={},plan={},apiKey,model=process.env.GO_SYNTHESIS_MODEL||process.env.GO_RESEARCH_MODEL||"gpt-5"}){
 if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
 const compact=evidence.map(({id,surface,claimType,subject,observation,source,status,confidence,operatorMatch})=>({id,surface,claimType,subject,observation,source,status,confidence,operatorMatch}));
 const instructions=["You are the commercial judgment stage of Growth Operator for tour/activity operators.","Act like a strong growth operator, owner and investigator, not an SEO audit.","Use only supplied evidence. Never claim a fact from general knowledge.","Do not manufacture weaknesses. Healthy areas should be explicitly preserved or deprioritized.","A provider failure, UNKNOWN row or missing observation is never evidence of absence.","Contradictions and anomalies become INVESTIGATE until resolved.","Search rank is evidence about discovery only; never equate rank with conversion or revenue.","A VALIDATED_OPPORTUNITY or QUICK_WIN requires observed evidence strong enough to justify action now.","Every finding and next move must cite supplied evidence IDs.","EconomicBoundary must say what is and is not supported. Never manufacture ROI.","Prefer a small number of commercially meaningful findings over filling buckets.","If an unexpected observation matters more than the original research question, elevate it."].join("\n");
 const payload=await callStructured({model,apiKey,name:"go_commercial_synthesis",schema:COMMERCIAL_SYNTHESIS_SCHEMA,instructions,input:{dossier,evidence:compact,signals,plan}});
 const validation=validateCommercialSynthesis(payload.value,evidence);if(!validation.ok)throw new Error("Commercial synthesis failed truth validation: "+validation.errors.map(x=>x.error).join("; "));
 return {synthesis:payload.value,model:payload.model,responseId:payload.responseId,usage:payload.usage};
}

export function validateModelCitations(dossier={},validIds=new Set()){const cited=[];for(const p of dossier.products||[])cited.push(...(p.evidenceIds||[]));for(const p of dossier.positioning||[])cited.push(...(p.evidenceIds||[]));for(const p of dossier.travelerIntents||[])cited.push(...(p.evidenceIds||[]));const invalidIds=[...new Set(cited.filter(id=>!validIds.has(id)))];return {ok:invalidIds.length===0,invalidIds,cited:[...new Set(cited)]}}
export function validatePlanCitations(plan={},validIds=new Set()){const cited=(plan.questions||[]).flatMap(x=>x.evidenceIds||[]);const invalidIds=[...new Set(cited.filter(id=>!validIds.has(id)))];return {ok:invalidIds.length===0,invalidIds,cited:[...new Set(cited)]}}

async function callStructured({model,apiKey,name,schema,instructions,input}){
 const body={model,input:[{role:"user",content:[{type:"input_text",text:JSON.stringify(input)}]}],instructions,store:false,text:{format:{type:"json_schema",name,strict:true,schema}}};
 const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+apiKey},body:JSON.stringify(body)});
 const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||"OpenAI Responses API returned "+response.status);
 const raw=extractOutputText(payload);if(!raw)throw new Error("Research model returned no structured output");let value;try{value=JSON.parse(raw)}catch{throw new Error("Research model returned invalid JSON")}
 return {value,model:payload.model||model,responseId:payload.id||"",usage:payload.usage||null};
}
function extractOutputText(payload){if(typeof payload.output_text==="string")return payload.output_text;for(const item of payload.output||[])for(const part of item.content||[])if(part.type==="output_text"&&part.text)return part.text;return""}
