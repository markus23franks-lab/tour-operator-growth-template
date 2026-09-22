(()=>{
'use strict';
const badName=v=>{const s=String(v||'').trim();return !s||/https?:|\]\(|undefined|null/i.test(s)||s.length>90};
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
function inspect({dossier,brain,actionPlan}={}){
 const issues=[];
 const b=dossier?.business||{};
 if(badName(b.name))issues.push('business identity is malformed or unresolved');
 if(!clean(b.location))issues.push('operating market is unresolved');
 if(!(dossier?.products||[]).length)issues.push('commercial inventory is unresolved');
 for(const p of dossier?.products||[]){if(badName(p.name))issues.push('a product name is malformed');if(p.transactionType&&b.transactionType&&clean(p.transactionType).toLowerCase()!==clean(b.transactionType).toLowerCase())issues.push('product transaction model conflicts with business model')}
 const strings=[brain?.headline,brain?.summary,brain?.primary?.finding,brain?.primary?.action,...(actionPlan?.moves||[]).flatMap(x=>[x.headline,x.why,x.action,x.proof])].filter(Boolean).map(String);
 if(strings.some(x=>/\b(undefined|null|nan|\[object Object\])\b/i.test(x)))issues.push('operator-facing judgment contains a raw sentinel');
 if(actionPlan?.moves?.some(x=>x.state==='VALIDATED_OPPORTUNITY')&&!brain?.opportunities?.length)issues.push('action plan promotes an opportunity the Brain did not validate');
 return {version:'GO-PRESENTATION-GATE-V1',pass:issues.length===0,issues,headline:issues.length?'GO held this result because the operator-facing story is not trustworthy yet.':'Operator-facing integrity checks passed.'};
}
window.GOPresentationGate={inspect};
})();