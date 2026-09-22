(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
function build({dossier,brain,offerComparison,bookingJourney,productArchitecture,competition,positioningComparison}={}){
 const moves=[];
 const push=(type,state,headline,why,action,proof,confidence='MEDIUM')=>moves.push({type,state,headline,why,action,proof,confidence});
 const primary=brain?.primary;
 if(primary?.state==='OPPORTUNITY')push(primary.sense,'VALIDATED_OPPORTUNITY',primary.finding,'Public evidence crossed GO’s opportunity threshold.',primary.action,primary.requiredNextEvidence,primary.confidence||'MEDIUM');
 if(offerComparison?.state==='COMPARABLE_SET_VERIFIED'&&primary?.sense!=='PRICING')push('PRICING','INVESTIGATE',offerComparison.headline,'GO verified a structured like-for-like public offer set.',offerComparison.action,'Connect booking volume, margin, capacity and demand response before changing price.','HIGH');
 if(productArchitecture?.state==='ADJACENT_OFFER_PATTERN')push('PRODUCT','INVESTIGATE',productArchitecture.headline,'The pattern repeats across multiple qualified direct competitors, but demand and economics are not yet proven.',productArchitecture.action,'Verify traveler demand, operational fit, margin and cannibalization.','MEDIUM');
 if(productArchitecture?.state==='DIFFERENTIATION_INVESTIGATION')push('POSITIONING','INVESTIGATE',productArchitecture.headline,'Repeated competitor pressure and category-parity positioning make differentiation worth studying.',productArchitecture.action,'Compare product mix, proof points and direct-booking reasons with qualified rivals.','MEDIUM');
 if(competition?.state==='REPEATED_COMPETITOR_PRESSURE'&&!moves.some(x=>x.type==='POSITIONING'))push('COMPETITION','INVESTIGATE',competition.headline,competition.summary,competition.action,'Determine which repeated rival advantage changes traveler choice.','MEDIUM');
 if(positioningComparison?.state==='POTENTIAL_DIFFERENTIATION')push('POSITIONING','LEVERAGE',positioningComparison.headline,'GO found a public claim that is not repeated in the qualified comparison set.',positioningComparison.action,'Test whether the differentiator is prominent near high-intent booking decisions.','MEDIUM');
 if(bookingJourney?.state==='BOOKING_PATH_OBSERVED')push('CONVERSION','MEASURE',bookingJourney.headline,'The public booking foundation is present, so missing markup is not being mislabeled as friction.',bookingJourney.action,'Connect visits, booking starts, abandonment and completed bookings.','MEDIUM');
 const unique=[];for(const m of moves){const key=m.type+'|'+clean(m.headline).toLowerCase();if(!unique.some(x=>x.key===key))unique.push({...m,key})}
 const ranked=unique.sort((a,b)=>({VALIDATED_OPPORTUNITY:5,INVESTIGATE:4,LEVERAGE:3,MEASURE:2}[b.state]||0)-({VALIDATED_OPPORTUNITY:5,INVESTIGATE:4,LEVERAGE:3,MEASURE:2}[a.state]||0)).slice(0,3).map(({key,...x})=>x);
 const first=ranked[0]||null;
 return {version:'GO-ACTION-PLAN-V2',state:first?'READY':'KEEP_RESEARCHING',headline:first?first.headline:'GO has not found a business move strong enough to recommend yet.',moves:ranked,next:first?first.action:'Keep investigating until public evidence changes a business decision.',evidenceNote:'GO separates validated opportunities, investigations, assets to leverage and areas that require connected measurement. An investigation is not presented as a proven defect.'};
}
window.GOActionPlan={build};
})();