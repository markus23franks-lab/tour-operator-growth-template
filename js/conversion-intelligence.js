(()=>{
 const txt=s=>String(s||'').toLowerCase();
 const has=(t,re)=>re.test(txt(t));
 function build(acq){
  const pages=acq?.pages||[], home=pages[0]||{}, all=pages.map(p=>p.text||'').join(' ');
  const signals={
   bookingCTA:has(all,/\b(book now|book online|check availability|reserve now|book your|view availability)\b/i),
   pricing:has(all,/\$\s?\d{2,4}|\b(from|starting at)\s+\$|\bprice\b/i),
   reviews:has(all,/\breviews?\b|★|⭐|tripadvisor|google reviews/i),
   trust:has(all,/\baward|rated|rating|years? of experience|locally owned|family owned|certified|licensed|safe|safety\b/i),
   urgency:has(all,/\blimited|sell out|sold out|availability|spots? left|popular\b/i),
   productDepth:pages.filter(p=>has(p.text,/\b(book|reserve|duration|hours?|includes?|what.?s included|from \$|per person)\b/i)).length,
   faq:has(all,/\bfaq|frequently asked|what to bring|cancellation|cancel|weather\b/i)
  };
  const score=Object.values(signals).filter(Boolean).length;
  let state='CONVERSION_FOUNDATION',headline='The public website shows a workable booking foundation.',summary='GO found several conversion fundamentals in the first-party site evidence. The next question is whether the strongest trust and product proof appear close enough to the booking decision.';
  if(!signals.bookingCTA){state='CTA_RISK';headline='GO could not verify a strong booking call-to-action in the acquired site evidence.';summary='If travelers cannot move quickly from interest to availability, traffic can leak before the booking engine.'}
  else if(!signals.reviews&&!signals.trust){state='TRUST_MERCHANDISING_GAP';headline='Booking paths are visible, but GO sees weak trust merchandising in the acquired evidence.';summary='The site appears able to ask for the booking without clearly surfacing enough reputation or authority proof around the decision.'}
  else if(score>=6){state='STRONG_FOUNDATION';headline='The website shows a strong public conversion foundation.';summary='GO found booking intent, trust and decision-support signals. Conversion may still hide deeper leakage, but public evidence does not justify manufacturing a redesign mission.'}
  const missing=Object.entries(signals).filter(([,v])=>!v).map(([k])=>k);
  return {version:'GO-CONVERSION-INTELLIGENCE-V1',state,headline,summary,signals,score,total:7,pages:pages.length,missing,action:state==='STRONG_FOUNDATION'?'Protect the foundation and investigate booking-engine friction or connected conversion data before prescribing changes.':'Inspect the missing decision signals on core product pages before deciding whether website conversion outranks other growth opportunities.',evidenceNote:'V1 evaluates first-party public website evidence. It does not yet measure real conversion rate, booking-engine abandonment, mobile interaction or page analytics.'};
 }
 window.GOConversionIntelligence={build};
})();