(()=>{
'use strict';
function build({acquisition,dossier}={}){
 const pages=acquisition?.pages||[],text=pages.map(p=>String(p.markdown||'')).join('\n'),booking=dossier?.booking||{};
 const cta=/\b(book now|reserve now|check availability|buy tickets?)\b/i.test(text);
 const pricing=/(?:US\$|USD\s*|CA\$|CI\$|£|€|\$)\s?\d{1,5}/i.test(text);
 const productDepth=(dossier?.products||[]).filter(p=>(p.urls||[]).length||p.sourceUrl).length;
 const provider=booking.status==='OBSERVED';
 const directPath=provider||/BOOKING LINK:|fareharbor|peekpro|book\.peek|bokun|rezdy|xola|checkfront|bookeo|rezgo/i.test(text);
 const observed=[cta&&'booking CTA',pricing&&'public price',productDepth>=1&&'product detail path',directPath&&'booking destination'].filter(Boolean);
 let state='LIMITED_PUBLIC_PATH',headline='GO can see only part of the public booking journey.',action='Do not call this a conversion problem. Verify the rendered product-to-checkout path and connect funnel data.';
 if(observed.length>=3){state='BOOKING_PATH_OBSERVED';headline='GO verified the public path from product consideration toward booking.';action='Treat the booking foundation as present; use connected funnel data to find actual conversion leakage rather than inventing friction.'}
 return {version:'GO-BOOKING-JOURNEY-V1',state,headline,action,observed,productDepth,provider:booking.provider||'',evidenceNote:'This layer records positive public path evidence only. Missing extracted elements are UNKNOWN, not conversion defects.'};
}
window.GOBookingJourney={build};
})();