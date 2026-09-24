const TYPES=new Set(["QUICK_WIN","VALIDATED_OPPORTUNITY","INVESTIGATE","LEVERAGE","MEASURE","DO_NOT_PRIORITIZE"]);
const clean=v=>String(v??"").replace(/\s+/g," ").trim();

export const COMMERCIAL_SYNTHESIS_SCHEMA={type:"object",additionalProperties:false,properties:{
 executiveRead:{type:"string"},
 strengths:{type:"array",items:findingSchema()},
 opportunities:{type:"array",items:findingSchema()},
 investigations:{type:"array",items:findingSchema()},
 doNotPrioritize:{type:"array",items:findingSchema()},
 nextMove:{type:"object",additionalProperties:false,properties:{findingHeadline:{type:"string"},type:{type:"string",enum:[...TYPES]},headline:{type:"string"},whyNow:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}},proofNeeded:{type:"array",items:{type:"string"}},connectedDataNeeded:{type:"array",items:{type:"string"}}},required:["findingHeadline","type","headline","whyNow","evidenceIds","proofNeeded","connectedDataNeeded"]}
},required:["executiveRead","strengths","opportunities","investigations","doNotPrioritize","nextMove"]};

function findingSchema(){return {type:"object",additionalProperties:false,properties:{type:{type:"string",enum:[...TYPES]},headline:{type:"string"},whyItMatters:{type:"string"},evidenceIds:{type:"array",items:{type:"string"}},supportQuotes:{type:"array",items:{type:"object",additionalProperties:false,properties:{evidenceId:{type:"string"},quote:{type:"string"}},required:["evidenceId","quote"]}},contradictionIds:{type:"array",items:{type:"string"}},confidence:{type:"string",enum:["HIGH","MEDIUM","LOW"]},actionBoundary:{type:"string"},economicBoundary:{type:"string"}},required:["type","headline","whyItMatters","evidenceIds","supportQuotes","contradictionIds","confidence","actionBoundary","economicBoundary"]}}
const moneyAmounts=text=>[...String(text||"").matchAll(/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)(?!\d)/g)].map(x=>Number(x[1].replaceAll(",","")));
const sourceText=row=>[row?.subject?.label,row?.observation?.title,...(row?.observation?.headings||[]),row?.observation?.mainText,row?.observation?.text,row?.observation?.snippet,row?.observation?.priceText].filter(Boolean).map(clean);
const validQuote=(anchor,ids,byId)=>{const row=byId.get(anchor?.evidenceId),quote=clean(anchor?.quote);return ids.includes(anchor?.evidenceId)&&row&&quote.length>=12&&quote.length<=280&&sourceText(row).some(t=>t.includes(quote))};

export function discardUnverifiableQuotes(synthesis={},records=[]){
 const byId=new Map(records.map(x=>[x.id,x])),copy={...synthesis},discarded=[],normalized=[];
 for(const bucket of ["strengths","opportunities","investigations","doNotPrioritize"]){
  copy[bucket]=(synthesis[bucket]||[]).map(f=>{const supportQuotes=(f.supportQuotes||[]).flatMap(q=>{
   if(validQuote(q,f.evidenceIds||[],byId))return [q];
   const prefix=clean(q?.quote).replace(/(?:\.{3}|…)$/,'').trim();
   if(prefix.length>=12&&prefix!==clean(q?.quote)&&validQuote({...q,quote:prefix},f.evidenceIds||[],byId)){
    normalized.push({bucket,headline:f.headline,evidenceId:q.evidenceId,reason:'terminal ellipsis removed'});
    return [{...q,quote:prefix}];
   }
   discarded.push({bucket,headline:f.headline,evidenceId:q?.evidenceId});return [];
  });return {...f,supportQuotes}});
 }
 return {synthesis:copy,discarded,normalized};
}

export function validateCommercialSynthesis(synthesis={},records=[]){
 const byId=new Map(records.map(x=>[x.id,x])),errors=[];
 const isDetail=row=>{if(row?.surface!=="FIRST_PARTY_RENDERED")return false;try{return new URL(row.observation?.url||row.source?.url).pathname.replace(/\/+$/,"").length>0}catch{return false}};
 // The generic "prices" list is a lossy extraction of all money on a page,
 // including donations and parking. Ground numbers in cited source text instead.
 const checkMoney=(description,text,ids)=>{const supported=new Set(moneyAmounts(ids.map(id=>{const x=byId.get(id);return [x?.observation?.text,x?.observation?.snippet,x?.observation?.price,x?.observation?.priceText].filter(Boolean).join(" ")}).join(" ")));for(const amount of new Set(moneyAmounts(text)))if(!supported.has(amount))errors.push({error:`${description} cites unsupported $${amount} amount`})};
 const buckets=["strengths","opportunities","investigations","doNotPrioritize"];
 const findings=buckets.flatMap(bucket=>(synthesis[bucket]||[]).map(x=>({...x,_bucket:bucket})));
 for(const [index,f] of findings.entries()){
   if(!TYPES.has(f.type))errors.push({index,error:"invalid finding type"});
   const ids=[...new Set(f.evidenceIds||[])],missing=ids.filter(id=>!byId.has(id));
   if(!ids.length)errors.push({index,error:"finding requires evidence"});
   if(missing.length)errors.push({index,error:"missing evidence ids: "+missing.join(", ")});
   const cited=ids.map(id=>byId.get(id)).filter(Boolean);
   const quotes=f.supportQuotes||[],verified=[];
   if(quotes.length>4)errors.push({index,error:"too many support quotes"});
   for(const anchor of quotes){
    const row=byId.get(anchor.evidenceId),quote=clean(anchor.quote);
    if(!ids.includes(anchor.evidenceId)||!row){errors.push({index,error:"support quote must cite finding evidence"});continue}
    if(!validQuote(anchor,ids,byId)){errors.push({index,error:"support quote not found verbatim in cited source"});continue}
    verified.push({row,quote});
   }
   checkMoney(`finding ${index}`,[f.headline,f.whyItMatters,f.actionBoundary,f.economicBoundary].join(" "),ids);
   if(["QUICK_WIN","VALIDATED_OPPORTUNITY","LEVERAGE"].includes(f.type)&&cited.some(x=>["UNKNOWN","CONTRADICTED"].includes(x.status)))errors.push({index,error:"definitive finding relies on unresolved evidence"});
   const contradictions=[...new Set(f.contradictionIds||[])];
   if(contradictions.some(id=>!byId.has(id)))errors.push({index,error:"missing contradiction evidence"});
   if(["QUICK_WIN","VALIDATED_OPPORTUNITY"].includes(f.type)&&contradictions.length)errors.push({index,error:"actionable opportunity has unresolved contradiction"});
   if(["QUICK_WIN","VALIDATED_OPPORTUNITY"].includes(f.type)&&!verified.some(x=>isDetail(x.row)))errors.push({index,error:"actionable opportunity needs a verbatim anchor from an observed first-party detail page"});
   if(f._bucket==="opportunities"&&!["QUICK_WIN","VALIDATED_OPPORTUNITY"].includes(f.type))errors.push({index,error:"opportunity bucket contains non-opportunity"});
   if(f._bucket==="investigations"&&f.type!=="INVESTIGATE")errors.push({index,error:"investigation bucket contains non-investigation"});
 }
 const next=synthesis.nextMove||{},nextIds=next.evidenceIds||[];
 checkMoney("next move",[next.headline,next.whyNow,...(next.proofNeeded||[]),...(next.connectedDataNeeded||[])].join(" "),nextIds);
 const seenHeadlines=new Set();
 for(const f of findings){const key=clean(f.headline).toLowerCase();if(key&&seenHeadlines.has(key))errors.push({error:"duplicate finding headline: "+f.headline});if(key)seenHeadlines.add(key)}
 if((synthesis.opportunities||[]).length>3)errors.push({error:"too many operator-facing opportunities"});
 if((synthesis.investigations||[]).length>3)errors.push({error:"too many operator-facing investigations"});
 if((synthesis.strengths||[]).length>4)errors.push({error:"too many operator-facing strengths"});
 if(!TYPES.has(next.type))errors.push({error:"invalid next move type"});
 if(!clean(next.headline))errors.push({error:"next move headline required"});
 const anchor=findings.find(f=>clean(f.headline)===clean(next.findingHeadline));
 if(!anchor)errors.push({error:"next move must cite an existing finding headline"});
 else{
  if(next.type!==anchor.type)errors.push({error:"next move type must match its finding type"});
  if(!(anchor.evidenceIds||[]).every(id=>nextIds.includes(id)))errors.push({error:"next move must include its finding evidence"});
 }
 if(nextIds.some(id=>!byId.has(id)))errors.push({error:"next move cites missing evidence"});
 if(["QUICK_WIN","VALIDATED_OPPORTUNITY"].includes(next.type)&&nextIds.map(id=>byId.get(id)).filter(Boolean).some(x=>["UNKNOWN","CONTRADICTED"].includes(x.status)))errors.push({error:"next move relies on unresolved evidence"});
 if(["QUICK_WIN","VALIDATED_OPPORTUNITY","LEVERAGE"].includes(next.type)&&!nextIds.length)errors.push({error:"definitive next move requires evidence"});
 if(next.type==="INVESTIGATE"&&!nextIds.length&&!clean(next.whyNow))errors.push({error:"investigation next move requires evidence or explicit rationale"});
 return {ok:errors.length===0,errors};
}

export function deterministicSignalFindings(signals={}){
 const strengths=(signals.strengths||[]).map(x=>({type:"LEVERAGE",headline:x.headline,whyItMatters:"GO observed public discovery presence. Do not spend effort fixing visibility that is already working without stronger evidence.",evidenceIds:x.evidenceIds||[],contradictionIds:[],confidence:"HIGH",actionBoundary:"Preserve and measure this strength; do not infer conversion or revenue from rank alone.",economicBoundary:"Revenue impact requires first-party traffic, booking and attribution data."}));
 const investigations=(signals.anomalies||[]).map(x=>({type:"INVESTIGATE",headline:x.headline,whyItMatters:x.reason,evidenceIds:x.evidenceIds||[],contradictionIds:[],confidence:"MEDIUM",actionBoundary:"Verify entity identity and intent before recommending any listing change or consolidation.",economicBoundary:"Do not assign revenue impact until the anomaly is verified and exposure/conversion effects are measured."}));
 return {strengths,investigations};
}
