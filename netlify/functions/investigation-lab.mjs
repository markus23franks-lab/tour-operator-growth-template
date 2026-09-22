import {normalizeSerpEvidence,buildInvestigationSignals} from "./lib/investigation-core.mjs";
import {collectSearchSurfaces} from "./lib/serpapi-investigation-adapter.mjs";
const LAB_BUILD_ID = "GO-INVESTIGATION-LAB-V0.3";
const ALLOWED_SURFACES = new Set([
  "FIRST_PARTY_RENDERED","ORGANIC_SERP","LOCAL_MAPS","BUSINESS_ENTITY",
  "REVIEW_REPUTATION","COMPETITOR_SITE","BOOKING_FLOW","VISUAL_SCREENSHOT","OTA_MARKETPLACE"
]);
const ALLOWED_STATES = new Set(["OBSERVED","INFERRED","UNKNOWN","CONTRADICTED"]);

export default async (request) => {
  if (request.method === "OPTIONS") return response(204, "");
  if (request.method !== "POST") return json(405,{ok:false,error:"Method not allowed"});
  let body={}; try{body=await request.json()}catch{return json(400,{ok:false,error:"Invalid JSON body"})}
  if(body.action==="runtime") return json(200,{ok:true,buildId:LAB_BUILD_ID,architecture:"BACKEND_INVESTIGATION_LAB",observedAt:new Date().toISOString()});
  if(body.action==="research-search"){
    const operator={name:String(body.operator?.name||"").trim(),website:String(body.operator?.website||"").trim()};
    const query=String(body.query||"").trim(),location=String(body.location||"").trim();
    if(!operator.name||!query)return json(400,{ok:false,error:"operator.name and query are required"});
    try{
      const collected=await collectSearchSurfaces({query,location,apiKey:process.env.SERPAPI_KEY});
      const records=normalizeSerpEvidence({query,payload:collected.payload,operator,provider:collected.provider});
      const validation=validateEvidenceRecords(records);
      if(!validation.ok)return json(422,{ok:false,buildId:LAB_BUILD_ID,validation});
      const signals=buildInvestigationSignals({records,operator});
      return json(200,{ok:true,buildId:LAB_BUILD_ID,operator,query,location,surfaceStatus:collected.surfaceStatus,providerErrors:collected.errors,records,signals});
    }catch(error){
      return json(502,{ok:false,buildId:LAB_BUILD_ID,error:error instanceof Error?error.message:String(error)});
    }
  }
  if(body.action==="reconcile-serp-proof"){
    const operator={name:String(body.operator?.name||"").trim(),website:String(body.operator?.website||"").trim()};
    const query=String(body.query||"").trim();
    if(!operator.name||!query)return json(400,{ok:false,error:"operator.name and query are required"});
    const records=normalizeSerpEvidence({query,payload:body.payload||{},operator,provider:body.provider||"fixture"});
    const validation=validateEvidenceRecords(records);
    if(!validation.ok)return json(422,{ok:false,buildId:LAB_BUILD_ID,validation});
    const signals=buildInvestigationSignals({records,operator});
    return json(200,{ok:true,buildId:LAB_BUILD_ID,operator,query,records,signals});
  }
  if(body.action==="validate-evidence"){
    const records=Array.isArray(body.records)?body.records:[];
    const validation=validateEvidenceRecords(records);
    return json(validation.ok?200:422,{...validation,buildId:LAB_BUILD_ID});
  }
  if(body.action==="validate-finding"){
    const records=Array.isArray(body.records)?body.records:[];
    const result=validateFinding(body.finding||{},records);
    return json(result.ok?200:422,{...result,buildId:LAB_BUILD_ID});
  }
  return json(501,{
    ok:false,
    buildId:LAB_BUILD_ID,
    state:"ARCHITECTURE_PROOF",
    error:"Investigation execution is intentionally not wired yet. Evidence contracts are being proven before provider/model credentials are introduced."
  });
};

export function validateEvidenceRecord(record={}){
  const errors=[];
  if(!record.id)errors.push("id required");
  if(!ALLOWED_SURFACES.has(record.surface))errors.push("invalid surface");
  if(!record.claimType)errors.push("claimType required");
  if(!record.subject?.label)errors.push("subject label required");
  if(!ALLOWED_STATES.has(record.status))errors.push("invalid status");
  if(!record.source?.provider)errors.push("source provider required");
  if(!record.observedAt)errors.push("observedAt required");
  if(!["HIGH","MEDIUM","LOW"].includes(record.confidence))errors.push("invalid confidence");
  if(record.status==="OBSERVED"&&!record.source?.url&&!record.source?.query&&!record.source?.providerRef)errors.push("observed evidence requires retrievable provenance");
  return {ok:errors.length===0,errors};
}

export function validateEvidenceRecords(records=[]){
  const ids=new Set(),errors=[];
  records.forEach((record,index)=>{
    const row=validateEvidenceRecord(record);
    if(ids.has(record.id))row.errors.push("duplicate id");else if(record.id)ids.add(record.id);
    if(!row.ok||row.errors.length)errors.push({index,id:record.id||null,errors:row.errors});
  });
  return {ok:errors.length===0,count:records.length,errors};
}

export function validateFinding(finding={},records=[]){
  const errors=[],byId=new Map(records.map(x=>[x.id,x]));
  const evidenceIds=[...new Set(finding.evidenceIds||[])];
  if(!finding.type)errors.push("finding type required");
  if(!finding.headline)errors.push("headline required");
  if(!evidenceIds.length)errors.push("finding requires evidence ids");
  const evidence=evidenceIds.map(id=>byId.get(id));
  const missing=evidenceIds.filter((id,i)=>!evidence[i]);
  if(missing.length)errors.push("finding references missing evidence: "+missing.join(", "));
  const definitive=["VALIDATED_OPPORTUNITY","QUICK_WIN","LEVERAGE"].includes(finding.type);
  if(definitive&&evidence.some(x=>x&&["UNKNOWN","CONTRADICTED"].includes(x.status)))errors.push("definitive finding cannot rely on unknown or contradicted evidence");
  if(definitive&&finding.contradictionIds?.length)errors.push("definitive finding has unresolved contradictions");
  if(finding.economicClaim&&!finding.economicBoundary)errors.push("economic claim requires explicit boundary");
  return {ok:errors.length===0,errors,evidenceIds};
}

function json(status,payload){return new Response(JSON.stringify(payload),{status,headers:headers({"Content-Type":"application/json; charset=utf-8"})})}
function response(status,body){return new Response(body,{status,headers:headers()})}
function headers(extra={}){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS",...extra}}
