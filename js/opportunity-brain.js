(function(global){
 const n=v=>Number.isFinite(Number(v))?Number(v):null;
 const level=(value,high=.8,medium=.55)=>value>=high?'HIGH':value>=medium?'MEDIUM':'LOW';

 function discovery(market,legacy){
  // Build 055 keeps the representative query strings in market.queries and the scoped
  // provider evidence in market.queryResults. Prefer evidence rows; only fall back to
  // legacy object-shaped market.queries so strings can never masquerade as verified rows.
  const evidenceRows=Array.isArray(market?.queryResults)?market.queryResults:[];
  const legacyRows=Array.isArray(market?.queries)?market.queries.filter(r=>r&&typeof r==='object'):[];
  const rows=evidenceRows.length?evidenceRows:legacyRows;
  const verified=rows.filter(r=>r?.evidenceState&&r.evidenceState!=='UNKNOWN');
  const gaps=verified.filter(r=>r.evidenceState==='OBSERVED_GAP');
  const visible=verified.filter(r=>r.evidenceState==='OBSERVED_WIN');
  const coverage=rows.length?verified.length/rows.length:0;
  const gapRate=verified.length?gaps.length/verified.length:0;
  const visibleRate=verified.length?visible.length/verified.length:0;
  const enoughCoverage=verified.length>=3&&coverage>=.6;
  const repeatedGap=enoughCoverage&&gaps.length>=2&&gapRate>=.4;
  const strongLegacy=legacy?.confidence==='High'&&legacy?.evidenceStrength>=4&&legacy?.priorityScore>=14;
  let state='UNKNOWN',finding='GO needs a little more search evidence before judging visibility.',action='Finish checking how customers find this business.',importance='MEDIUM';
  if(enoughCoverage){
   if(visibleRate>=.7){
    state='HEALTHY';
    finding=`You are showing up well: GO found the business in ${visible.length} of ${verified.length} verified searches.`;
    action='Keep the visibility you already have. Do not make broad SEO the first investment.';
    importance='LOW';
   }else if(repeatedGap||strongLegacy){
    state='OPPORTUNITY';
    finding=`GO found a repeated visibility gap across ${gaps.length} of ${verified.length} verified searches.`;
    action=legacy?.action||'Investigate the commercially important visibility gaps before deciding on SEO work.';
    importance='MEDIUM';
   }else{
    state='UNKNOWN';
    finding=`GO found mixed visibility: ${visible.length} verified win${visible.length===1?'':'s'} and ${gaps.length} verified gap${gaps.length===1?'':'s'}. That is not enough to call visibility a growth problem yet.`;
    action='Keep this on the watchlist and verify whether the gaps are commercially important before creating work.';
    importance='LOW';
   }
  }
  return {sense:'DISCOVERY',label:'Visibility',state,finding,evidenceStrength:level(coverage),commercialImportance:importance,confidence:state==='OPPORTUNITY'?(strongLegacy?'HIGH':'MEDIUM'):level(coverage),economicImportance:state==='OPPORTUNITY'?'POTENTIAL':'UNSIZED',actionability:state==='OPPORTUNITY'?'INVESTIGATE':state==='HEALTHY'?'MONITOR':'NEEDS_VALIDATION',requiredNextEvidence:state==='UNKNOWN'?'Commercial importance and stronger repeated search evidence':'Traffic and booking attribution',action,diagnostics:{planned:rows.length,verified:verified.length,visible:visible.length,gaps:gaps.length,coverage:Number(coverage.toFixed(2)),gapRate:Number(gapRate.toFixed(2)),visibleRate:Number(visibleRate.toFixed(2)),repeatedGap,strongLegacy}}
 }

 function pricing(p,offerComparison){
  if(!p||p.state==='INSUFFICIENT_EVIDENCE')return {sense:'PRICING',label:'Pricing',state:'UNKNOWN',finding:'GO does not have enough comparable pricing yet.',evidenceStrength:'LOW',commercialImportance:'HIGH',confidence:'LOW',economicImportance:'POTENTIALLY_HIGH',actionability:'NEEDS_VALIDATION',requiredNextEvidence:'Comparable products, duration, inclusions and fees',action:'Finish comparing like-for-like products before recommending a price change.'};
  const rawCandidate=p.state==='PRICING_POWER_CANDIDATE',candidate=rawCandidate&&offerComparison?.state==='COMPARABLE_SET_VERIFIED';
  if(rawCandidate&&!candidate)return {sense:'PRICING',label:'Pricing',state:'UNKNOWN',finding:'GO found a directional price gap, but has not verified that the public offers are truly like-for-like.',evidenceStrength:'MEDIUM',commercialImportance:'HIGH',confidence:'LOW',economicImportance:'POTENTIALLY_HIGH',actionability:'NEEDS_VALIDATION',requiredNextEvidence:'Matching product family, transaction type, duration, format and independent competitor sources',action:'Keep the price signal on the investigation list; do not recommend a price move yet.',diagnostics:{operatorMedian:p.operator?.median,marketMedian:p.market?.median,deltaPct:p.deltaPct,verified:p.research?.verified}};
  return {sense:'PRICING',label:'Pricing',state:candidate?'OPPORTUNITY':'HEALTHY_OR_POSITIONED',finding:candidate?'Your public prices may have room to move higher.':'Your public pricing looks competitive with the market GO observed.',evidenceStrength:p.research?.verified>=3?'HIGH':'MEDIUM',commercialImportance:'HIGH',confidence:'MEDIUM',economicImportance:candidate?'POTENTIALLY_HIGH':'UNSIZED',actionability:candidate?'INVESTIGATE':'MONITOR',requiredNextEvidence:candidate?'Like-for-like product comparison plus booking and margin data':'Booking, conversion and margin data',action:candidate?'Check whether comparable products support a profitable price increase.':'Do not change prices from public evidence alone; look for product-level pricing opportunities.',diagnostics:{operatorMedian:p.operator?.median,marketMedian:p.market?.median,deltaPct:p.deltaPct,verified:p.research?.verified}}
 }

 function trust(t){
  if(!t||t.state==='INSUFFICIENT_EVIDENCE')return {sense:'TRUST',label:'Reviews',state:'UNKNOWN',finding:t?.target?.rating?'GO verified your reviews but still needs a clean competitor comparison.':'GO has not verified your public review profile yet.',evidenceStrength:t?.target?.rating?'MEDIUM':'LOW',commercialImportance:'MEDIUM',confidence:'LOW',economicImportance:'UNSIZED',actionability:'NEEDS_DATA',requiredNextEvidence:t?.target?.rating?'Qualified competitor review sample':'Verified operator review profile',action:'Complete the review comparison before treating reputation as a growth opportunity.'};
  const gap=t.state==='REPUTATION_GAP',adv=t.state==='TRUST_ADVANTAGE';
  return {sense:'TRUST',label:'Reviews',state:gap?'OPPORTUNITY':'HEALTHY_OR_ADVANTAGE',finding:gap?'Your review position may be costing trust versus competitors.':adv?'Your reviews are a real competitive advantage.':'Your reviews look competitive with the market GO observed.',evidenceStrength:'HIGH',commercialImportance:'MEDIUM',confidence:'MEDIUM',economicImportance:'POTENTIAL',actionability:gap?'INVESTIGATE':'LEVERAGE_OR_MONITOR',requiredNextEvidence:'Review growth, themes and booking-page placement',action:gap?'Investigate review generation and guest friction.':'Use your review strength more aggressively where customers decide to book.',diagnostics:{operatorRating:t.target?.rating,operatorReviews:t.target?.reviews,competitors:t.market?.competitors,medianRating:t.market?.medianRating,medianReviews:t.market?.medianReviews}}
 }

 function conversion(c){
  if(!c||c.state==='INSUFFICIENT_EVIDENCE')return {sense:'CONVERSION',label:'Website sales',state:'UNKNOWN',finding:'GO cannot yet tell how well the website turns visitors into bookings.',evidenceStrength:'LOW',commercialImportance:'HIGH',confidence:'LOW',economicImportance:'POTENTIALLY_HIGH',actionability:'NEEDS_DATA',requiredNextEvidence:'Rendered booking path and/or first-party analytics',action:'Connect booking and website performance data before calling conversion weak.'};
  return {sense:'CONVERSION',label:'Website sales',state:'FOUNDATION_OBSERVED',finding:'GO found the main public ingredients customers need to make a booking decision.',evidenceStrength:'MEDIUM',commercialImportance:'HIGH',confidence:'MEDIUM',economicImportance:'POTENTIALLY_HIGH',actionability:'INVESTIGATE_DEEPER',requiredNextEvidence:'Visits, booking starts, abandonment, mobile behavior and completed bookings',action:'Find out whether the traffic you already have can produce more bookings.',diagnostics:{present:c.present,total:c.total,pages:c.pages}}
 }

 function build({market,discoveryOpportunity,pricing:price,offerComparison,trust:trustIntel,conversion:conv,bookingJourney,productArchitecture,competition,positioningComparison}){
  const candidates=[discovery(market,discoveryOpportunity),pricing(price,offerComparison),trust(trustIntel),conversion(conv)],opportunities=candidates.filter(x=>x.state==='OPPORTUNITY'),unknown=candidates.filter(x=>x.state==='UNKNOWN'),d=candidates[0],p=candidates[1],t=candidates[2],c=candidates[3];
  let primary,headline,summary,mode='INVESTIGATION';
  if(opportunities.length){
   const priority={CONVERSION:4,PRICING:3,TRUST:2,DISCOVERY:1};
   primary=[...opportunities].sort((a,b)=>(priority[b.sense]||0)-(priority[a.sense]||0))[0];
   headline=`GO found a growth opportunity in ${primary.label.toLowerCase()}.`;
   summary=`${primary.finding} GO wants to validate the money behind it before recommending a mission.`;
  }else if(d.state==='HEALTHY'&&c.state==='FOUNDATION_OBSERVED'){
   primary={...c,actionability:'GROWTH_EDGE',action:'Find out if the demand you already have can produce more revenue before spending more to acquire traffic.',requiredNextEvidence:'Website traffic, booking starts, completed bookings, product mix and margins'};
   headline='You are already doing many of the obvious things right. GO is looking for the next layer of growth.';
   summary=`${d.finding} ${p.finding} ${t.finding} The next opportunity is more likely to come from monetizing existing demand better than from simply chasing more traffic.`;
  }else if(candidates.some(x=>x.state!=='UNKNOWN')){
   const known=candidates.filter(x=>x.state!=='UNKNOWN');
   primary=known.find(x=>x.state==='HEALTHY_OR_ADVANTAGE')||known.find(x=>x.state==='HEALTHY')||known.find(x=>x.state==='FOUNDATION_OBSERVED')||known[0];
   headline='GO found evidence of what is already working — and will use that advantage to look for the next growth edge.';
   summary=`${primary.finding} GO will preserve proven strengths instead of manufacturing a weakness; unresolved areas stay on the research list until the evidence is strong enough to change a business decision.`;
  }else if(unknown.some(x=>x.commercialImportance==='HIGH')){
   primary=unknown.find(x=>x.commercialImportance==='HIGH');
   headline='GO has not found a defensible public growth move yet.';
   summary=`${primary.finding} GO will keep the result unresolved rather than invent work from weak evidence.`;
  }else{
   primary=unknown[0]||d;
   headline='GO has not found an obvious weakness yet — so it is looking for the next growth edge.';
   summary='GO will keep investigating where more bookings, better pricing or stronger economics may be hiding.';
  }
  const strategicContext=[];
  if(competition?.state==='REPEATED_COMPETITOR_PRESSURE')strategicContext.push({type:'COMPETITOR_PRESSURE',headline:competition.headline,summary:competition.summary,action:competition.action,evidenceStrength:'MEDIUM'});
  if(positioningComparison?.state==='POTENTIAL_DIFFERENTIATION')strategicContext.push({type:'POSITIONING_LEAD',headline:positioningComparison.headline,summary:positioningComparison.summary,action:positioningComparison.action,evidenceStrength:'MEDIUM'});
  if(positioningComparison?.state==='CATEGORY_PARITY')strategicContext.push({type:'POSITIONING_PARITY',headline:positioningComparison.headline,summary:positioningComparison.summary,action:positioningComparison.action,evidenceStrength:'MEDIUM'});
  if(offerComparison?.state==='COMPARABLE_SET_VERIFIED')strategicContext.push({type:'COMPARABLE_OFFERS',headline:offerComparison.headline,summary:`GO verified ${offerComparison.matches?.length||0} like-for-like public offer matches across ${offerComparison.sources||0} independent sources.`,action:offerComparison.action,evidenceStrength:'HIGH'});
  if(bookingJourney?.state==='BOOKING_PATH_OBSERVED')strategicContext.push({type:'BOOKING_PATH',headline:bookingJourney.headline,summary:`GO positively observed ${bookingJourney.observed?.join(', ')||'the public booking path'}. Actual funnel performance remains unknown.`,action:bookingJourney.action,evidenceStrength:'MEDIUM'});
  if(productArchitecture?.state==='ADJACENT_OFFER_PATTERN')strategicContext.push({type:'PRODUCT_ARCHITECTURE',headline:productArchitecture.headline,summary:`Multiple qualified direct competitors repeat an adjacent public offer pattern. This is a research lead, not proof the operator should add it.`,action:productArchitecture.action,evidenceStrength:'MEDIUM'});
  if(productArchitecture?.state==='DIFFERENTIATION_INVESTIGATION')strategicContext.push({type:'PRODUCT_DIFFERENTIATION',headline:productArchitecture.headline,summary:'Repeated competitor pressure plus category-parity positioning makes product differentiation worth investigating.',action:productArchitecture.action,evidenceStrength:'MEDIUM'});
  const roi={state:'NEEDS_CONNECTED_DATA',headline:'GO needs your real booking data to put a reliable dollar value on the next opportunity.',needs:['website traffic','booking starts and completed bookings','product-level revenue or booking value','margin or capacity where relevant']};
  return {version:'GO-OPPORTUNITY-BRAIN-V2.6',mode,headline,summary,primary,opportunities,unresolved:unknown,candidates,strategicContext,roi,decisionPrinciple:'GO promotes a public finding into an opportunity only when the evidence shows a repeated, commercially meaningful pattern. UNKNOWN and mixed evidence stay unresolved instead of becoming work.'}
 }
 global.GOOpportunityBrain={build};
})(window);