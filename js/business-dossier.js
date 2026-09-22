(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const transaction=(ctx={})=>clean(ctx.transactionType||ctx.businessContext?.transactionType||'');
function dominantTransaction(products=[],ctx={}){const counts={};for(const p of products){const t=clean(p.transactionType).toLowerCase();if(t)counts[t]=(counts[t]||0)+1}const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);if(ranked.length&&(!ranked[1]||ranked[0][1]>ranked[1][1]))return ranked[0][0];return transaction(ctx)}
function productRows(ctx={}){
 const raw=[...(ctx.commercialTruth?.primaryProducts||[]),...(ctx.products||[]),...(ctx.offers||[])],seen=new Set(),out=[];
 for(const item of raw){const name=clean(typeof item==='string'?item:item?.name||item?.label);if(!name)continue;const k=name.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push({name,transactionType:clean(item?.transactionType||transaction(ctx)),family:clean(item?.family||item?.activity||item?.intent||''),price:item?.price||null,duration:item?.duration||null,format:clean(item?.format||''),urls:Array.isArray(item?.urls)?item.urls.filter(Boolean):[],evidence:item?.evidence||'first-party public page'});}
 return out.slice(0,12);
}
function build(ctx={}){
 let products=productRows(ctx);products=window.GOOfferEvidence?.enrich?.({products,pages:ctx.pages||[]})||products;const commercialTransaction=dominantTransaction(products,ctx);products=products.map(p=>({...p,transactionType:p.transactionType||commercialTransaction}));const location=clean(ctx.businessContext?.location||ctx.location),businessName=clean(ctx.businessName),booking=ctx.bookingProvider||{},pages=(ctx.pages||[]).map(p=>({url:p.url||'',source:p.source||'first-party'}));
 const confidence={identity:businessName?'VERIFIED':'UNKNOWN',location:location&&location!=='Location needs verification'?'VERIFIED':'UNKNOWN',products:products.length?'VERIFIED':'UNKNOWN',transactionType:commercialTransaction?'INFERRED':'UNKNOWN',bookingProvider:booking.provider||booking.label&&booking.label!=='Not detected'?'OBSERVED':'UNKNOWN'};
 const blockers=[];if(confidence.identity==='UNKNOWN')blockers.push('business identity');if(confidence.products==='UNKNOWN')blockers.push('commercial inventory');if(confidence.location==='UNKNOWN')blockers.push('operating market');
 const ready=blockers.length===0;
 return {version:'GO-BUSINESS-DOSSIER-V4',business:{name:businessName,website:ctx.url||ctx.website||'',location,businessType:clean(ctx.businessContext?.businessType),transactionType:commercialTransaction},products,booking:{provider:booking.label||booking.provider||'',status:confidence.bookingProvider},positioning:ctx.positioning||null,sources:pages,confidence,readyForMarketJudgment:ready,blockers,evidenceNote:'The dossier separates observed first-party facts, GO inference and unresolved fields. Market judgment should stop when identity, commercial inventory or operating market is unresolved.'};
}
window.GOBusinessDossier={build};
})();