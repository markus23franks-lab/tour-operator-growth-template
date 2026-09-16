(()=>{
 const num=v=>Number.isFinite(Number(v))?Number(v):null;
 const med=a=>{a=a.filter(v=>v!=null).sort((x,y)=>x-y);if(!a.length)return null;const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2};
 const key=s=>String(s||'').toLowerCase().replace(/^https?:\/\/(www\.)?/,'').replace(/[^a-z0-9]/g,'');
 const host=u=>{try{return new URL(/^https?:/i.test(u)?u:`https://${u}`).hostname.replace(/^www\./,'')}catch{return ''}};
 function plan({businessName,location}){
   return [...new Set([
     `${businessName} ${location}`,
     `${businessName} reviews ${location}`,
     `best tours ${location}`
   ])].slice(0,3);
 }
 function isTarget(r,businessName,website){
   const bn=key(businessName), rn=key(r.name||r.title), wh=host(website), rh=host(r.website||r.link);
   return Boolean((bn&&rn&&(rn.includes(bn)||bn.includes(rn)))||(wh&&rh&&wh===rh));
 }
 function build({trustMarket,businessName,website}){
   const rows=trustMarket?.queries||[];
   const targetCandidates=[], competitors=new Map();
   for(const row of rows){
     if(row.evidenceState==='UNKNOWN') continue;
     for(const r of row.localResults||[]){
       const rating=num(r.rating),reviews=num(r.reviews);
       if(!rating&&!reviews) continue;
       if(isTarget(r,businessName,website)){
         targetCandidates.push({name:r.name||r.title||businessName,rating,reviews,website:r.website||r.link||'',query:row.query,position:r.position});
       } else {
         const k=key(r.name||r.title);
         if(!k) continue;
         const item={name:r.name||r.title,rating,reviews,website:r.website||r.link||'',query:row.query};
         const prev=competitors.get(k);
         if(!prev||(reviews||0)>(prev.reviews||0)) competitors.set(k,item);
       }
     }
   }
   const target=targetCandidates.sort((a,b)=>(b.reviews||0)-(a.reviews||0))[0]||null;
   const comps=[...competitors.values()].sort((a,b)=>(b.reviews||0)-(a.reviews||0));
   const tr=target?.rating||null,tv=target?.reviews||null,mr=med(comps.map(x=>x.rating)),mv=med(comps.map(x=>x.reviews));
   let state='INSUFFICIENT_EVIDENCE',headline='GO investigated reputation directly, but the operator record is still not verified.',summary='GO will not infer the operator’s reputation from competitor evidence.',action='Retry or connect a reputation source before Trust can compete for priority.';
   if(tr&&tv&&comps.length>=2){
     const ratio=mv?tv/mv:null;
     if(tr>=4.7&&ratio>=1.25){state='TRUST_ADVANTAGE';headline='Your public reputation appears to be a competitive advantage.';summary=`GO verified ${tr.toFixed(1)}★ with ${Math.round(tv).toLocaleString()} reviews. Review volume is ${ratio.toFixed(1)}× the observed competitor median${mv?` of ${Math.round(mv).toLocaleString()}`:''}.`;action='Investigate whether this reputation advantage is being converted into bookings on high-intent product and booking pages.'}
     else if((mr&&tr<mr-.15)||(ratio!=null&&ratio<.6)){state='REPUTATION_GAP';headline='Your public reputation may be weaker than the observed market.';summary=`GO verified ${tr.toFixed(1)}★ with ${Math.round(tv).toLocaleString()} reviews against a competitor median of ${mr?mr.toFixed(1)+'★':'—'} and ${mv?Math.round(mv).toLocaleString()+' reviews':'—'}.`;action='Investigate review acquisition and guest friction before deciding whether reputation deserves a mission.'}
     else{state='MARKET_COMPETITIVE';headline='Your public reputation appears competitive, but not clearly dominant.';summary=`GO verified ${tr.toFixed(1)}★ with ${Math.round(tv).toLocaleString()} reviews against ${comps.length} observed reputation competitors.`;action='Test whether stronger trust merchandising or review growth can improve conversion before creating a mission.'}
   }
   return {version:'GO-TRUST-INTELLIGENCE-V2',state,headline,summary,action,target:target||{rating:null,reviews:null},market:{competitors:comps.length,medianRating:mr,medianReviews:mv,sample:comps.slice(0,5)},research:{planned:rows.length,verified:rows.filter(x=>x.evidenceState!=='UNKNOWN').length,targetMatches:targetCandidates.length},evidenceNote:'Trust V2 runs dedicated reputation searches and requires a matched operator record. Review velocity, response rate and review-text themes remain future review-engine evidence.'};
 }
 window.GOTrustIntelligence={plan,build};
})();