const ACTION_TYPES=new Set(["QUICK_WIN","VALIDATED_OPPORTUNITY"]);
const clean=value=>String(value??"").replace(/\s+/g," ").trim();
const money=text=>[...String(text||"").matchAll(/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/g)].map(x=>Number(x[1].replaceAll(",","")));
const rowText=row=>[row?.subject?.label,row?.observation?.title,...(row?.observation?.headings||[]),row?.observation?.mainText,row?.observation?.text,row?.observation?.snippet,row?.observation?.priceText].filter(Boolean).map(clean).join(" ");
const detail=row=>{if(row?.surface!=="FIRST_PARTY_RENDERED")return false;try{return new URL(row.observation?.url||row.source?.url).pathname.replace(/\/+$/,"").length>0}catch{return false}};

export function buildClaimLedger({synthesis={},records=[]}={}){
 const byId=new Map(records.map(row=>[row.id,row])),claims=[];
 for(const bucket of ["strengths","opportunities","investigations","doNotPrioritize"]){
  for(const finding of synthesis[bucket]||[]){
   const rows=(finding.evidenceIds||[]).map(id=>byId.get(id)).filter(Boolean);
   const quotes=(finding.supportQuotes||[]).map(q=>({evidenceId:q.evidenceId,quote:clean(q.quote)}));
   const sourceRows=rows.filter(row=>row.surface==="FIRST_PARTY_RENDERED");
   const text=rows.map(rowText).join(" ");
   claims.push({claimId:"claim_"+claims.length.toString(36),bucket,type:finding.type,headline:finding.headline,why:finding.why||finding.rationale||"GO found a supported public signal worth evaluating.",action:finding.action||finding.nextMove||"Review this claim with connected operating data before acting.",proof:finding.requiredNextEvidence||finding.proof||"Connect outcome, capacity and demand data before treating this as proven.",confidence:finding.confidence||"MEDIUM",evidenceIds:[...new Set(finding.evidenceIds||[])],supportQuotes:quotes,scope:{products:[...new Set(sourceRows.map(row=>clean(row.subject?.label||row.observation?.title)).filter(Boolean))],pages:[...new Set(rows.map(row=>row.observation?.url||row.source?.url).filter(Boolean))],domains:[...new Set(rows.map(row=>{try{return new URL(row.observation?.url||row.source?.url).hostname}catch{return ""}}).filter(Boolean))],amounts:[...new Set(money(text))],bookingLinks:[...new Set(sourceRows.flatMap(row=>(row.observation?.bookingLinks||[]).map(x=>x.url).filter(Boolean)))],contactEmails:[...new Set(sourceRows.flatMap(row=>row.observation?.contactEmails||[]))]},provenance:{hasDetailPage:sourceRows.some(detail),verifiedQuoteCount:quotes.filter(q=>{const row=byId.get(q.evidenceId);return row&&rowText(row).includes(q.quote)}).length}});
  }
 }
 return claims;
}

export function buildOperatorActionPlan({ledger=[]}={}){
 const rank={VALIDATED_OPPORTUNITY:5,QUICK_WIN:5,INVESTIGATE:4,LEVERAGE:3,MEASURE:2};
 const moves=ledger.filter(c=>c?.headline&&c?.evidenceIds?.length).map(c=>{
  const actionReady=ACTION_TYPES.has(c.type)&&c.provenance?.hasDetailPage&&c.provenance?.verifiedQuoteCount>0;
  const state=actionReady?"VALIDATED_OPPORTUNITY":(c.type||"INVESTIGATE");
  return {claimId:c.claimId,type:c.type||"INVESTIGATION",state,headline:c.headline,why:c.why,action:c.action,proof:c.proof,confidence:c.confidence,evidenceIds:c.evidenceIds,scope:c.scope,provenance:c.provenance};
 }).sort((a,b)=>(rank[b.state]||1)-(rank[a.state]||1)).slice(0,3);
 const first=moves[0]||null;
 return {version:"GO-CLAIM-LEDGER-PLAN-V1",state:first?"READY":"KEEP_RESEARCHING",headline:first?first.headline:"GO has not found a supported business move yet.",moves,next:first?.action||"Keep investigating until public evidence changes a business decision.",evidenceNote:"Claims retain product scope, source pages, exact quotes and provenance; action-ready claims still require connected outcome data."};
}

export function validateClaimLedger(ledger=[],records=[]){
 const byId=new Map(records.map(row=>[row.id,row])),errors=[];
 for(const claim of ledger){
  const rows=(claim.evidenceIds||[]).map(id=>byId.get(id));
  if(!claim.claimId||!claim.headline)errors.push("claim identity required");
  if(!claim.evidenceIds?.length||rows.some(row=>!row))errors.push(`claim ${claim.claimId||"unknown"} has missing evidence`);
  if(!claim.scope?.pages?.length||!claim.scope?.domains?.length)errors.push(`claim ${claim.claimId} lacks source scope`);
  for(const quote of claim.supportQuotes||[]){const row=byId.get(quote.evidenceId);if(!row||!rowText(row).includes(quote.quote))errors.push(`claim ${claim.claimId} has unverifiable quote`)}
  if(ACTION_TYPES.has(claim.type)&&(!claim.provenance?.hasDetailPage||!(claim.provenance?.verifiedQuoteCount>0)))errors.push(`action claim ${claim.claimId} lacks verified detail-page provenance`);
 }
 return {ok:errors.length===0,errors};
}
