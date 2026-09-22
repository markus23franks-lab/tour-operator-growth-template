const ENDPOINT="https://api.openai.com/v1/responses";

export const BUSINESS_DOSSIER_SCHEMA={
  type:"object",additionalProperties:false,
  properties:{
    businessName:{type:"string"},
    operatingMarket:{type:"string"},
    summary:{type:"string"},
    businessModel:{type:"string",enum:["tour","rental","charter","admission","class","transportation","mixed","unknown"]},
    products:{type:"array",items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},family:{type:"string"},transactionType:{type:"string"},priceText:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}}},required:["name","family","transactionType","priceText","evidenceIds"]}},
    positioning:{type:"array",items:{type:"object",additionalProperties:false,properties:{theme:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}}},required:["theme","evidenceIds"]}},
    travelerIntents:{type:"array",items:{type:"object",additionalProperties:false,properties:{query:{type:"string"},productFamily:{type:"string"},reason:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}}},required:["query","productFamily","reason","evidenceIds"]}},
    unknowns:{type:"array",items:{type:"string"}}
  },
  required:["businessName","operatingMarket","summary","businessModel","products","positioning","travelerIntents","unknowns"]
};

export async function buildBusinessDossierWithModel({evidence=[],apiKey,model=process.env.GO_RESEARCH_MODEL||"gpt-5"}){
  if(!apiKey)throw new Error("OPENAI_API_KEY is not configured");
  const compact=evidence.map(({id,surface,claimType,subject,observation,source,status})=>({id,surface,claimType,subject,observation,source,status}));
  const instructions=[
    "You are the Business Understanding stage of Growth Operator, software for tour/activity operators.",
    "Infer only from the supplied evidence. Never use outside knowledge.",
    "Your job is to understand what the operator actually sells before any market judgment.",
    "Distinguish transaction model from activity: rental is not tour; charter is not generic tour; admission is not guided tour.",
    "Every product, positioning theme and traveler intent must cite supplied evidence IDs.",
    "Do not create a traveler intent for a product family that is not supported by first-party evidence.",
    "If evidence is insufficient, preserve the uncertainty in unknowns rather than guessing."
  ].join("\n");
  const body={model,input:[{role:"user",content:[{type:"input_text",text:"Build the business dossier from this normalized first-party evidence:\n"+JSON.stringify(compact)}]}],instructions,store:false,text:{format:{type:"json_schema",name:"go_business_dossier",strict:true,schema:BUSINESS_DOSSIER_SCHEMA}}};
  const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+apiKey},body:JSON.stringify(body)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload?.error?.message||"OpenAI Responses API returned "+response.status);
  const raw=extractOutputText(payload);if(!raw)throw new Error("Research model returned no structured output");
  let dossier;try{dossier=JSON.parse(raw)}catch{throw new Error("Research model returned invalid JSON")}
  const validation=validateModelCitations(dossier,new Set(evidence.map(x=>x.id)));
  if(!validation.ok)throw new Error("Research model cited invalid evidence IDs: "+validation.invalidIds.join(", "));
  return {dossier,model:payload.model||model,responseId:payload.id||"",usage:payload.usage||null};
}

export function validateModelCitations(dossier={},validIds=new Set()){
  const cited=[];
  for(const p of dossier.products||[])cited.push(...(p.evidenceIds||[]));
  for(const p of dossier.positioning||[])cited.push(...(p.evidenceIds||[]));
  for(const p of dossier.travelerIntents||[])cited.push(...(p.evidenceIds||[]));
  const invalidIds=[...new Set(cited.filter(id=>!validIds.has(id)))];
  return {ok:invalidIds.length===0,invalidIds,cited:[...new Set(cited)]};
}
function extractOutputText(payload){if(typeof payload.output_text==="string")return payload.output_text;for(const item of payload.output||[])for(const part of item.content||[])if(part.type==="output_text"&&part.text)return part.text;return""}
