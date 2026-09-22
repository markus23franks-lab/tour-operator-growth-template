(()=>{
 const rx=/\$\s?(\d{2,4}(?:\.\d{1,2})?)/g;
 const norm=s=>String(s||'').toLowerCase().replace(/^https?:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/g,' ').trim();
 const host=u=>{try{return new URL(/^https?:/i.test(u)?u:`https://${u}`).hostname.replace(/^www\./,'')}catch{return norm(u).split(' ')[0]}};
 function prices(t){const a=[];let m;while((m=rx.exec(String(t||'')))){const v=+m[1];if(v>=20&&v<=5000)a.push(v)}rx.lastIndex=0;return a}
 function median(a){if(!a.length)return null;a=[...a].sort((x,y)=>x-y);const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2}
 function family(q,location=''){let s=String(q||'').replace(/\b(price|pricing|cost|rates?|tickets?)\b/ig,'').replace(/\s+/g,' ').trim();const city=String(location||'').split(',')[0].trim();if(city&&s.toLowerCase().startsWith(city.toLowerCase()+' '))s=s.slice(city.length+1).trim();return s}
 function plan({businessName,location,websiteQueries=[]}){
   const core=websiteQueries.slice(0,3).map(q=>family(q,location)).filter(Boolean);
   const qs=[];
   core.forEach(q=>qs.push(`${businessName} ${q} price`));
   core.slice(0,2).forEach(q=>qs.push(`${location} ${q} price`));
   return [...new Set(qs)].slice(0,5);
 }
 function collect(pricingMarket,{businessName,website}){
   const own=[],comp=[],siteHost=host(website),bn=norm(businessName);
   for(const q of pricingMarket?.queries||[]){
     if(q.evidenceState==='UNKNOWN')continue;
     for(const r of [...(q.organicResults||[]),...(q.localResults||[])]){
       const title=r.title||r.name||'',link=r.link||r.website||'',blob=`${title} ${r.snippet||''} ${r.price||''}`;
       const isOwn=(siteHost&&host(link).includes(siteHost))||(bn&&norm(title).includes(bn));
       for(const value of prices(blob))(isOwn?own:comp).push({value,query:q.query,name:title,link});
     }
   }
   return {own,comp};
 }
 function build({pricingMarket,businessName,website}){
   const {own,comp}=collect(pricingMarket,{businessName,website}),ov=[...new Set(own.map(x=>x.value))],cv=comp.map(x=>x.value),om=median(ov),cm=median(cv);
   let state='INSUFFICIENT_EVIDENCE',headline='GO investigated pricing directly, but comparable evidence is still incomplete.',recommendation='No pricing move yet. GO needs an operator price and multiple comparable market prices before proposing a test.',delta=null;
   if(om&&cm&&comp.length>=3){delta=Math.round((cm-om)/om*100);if(delta>=10){state='PRICING_POWER_CANDIDATE';headline=`GO found a possible pricing-power gap: comparable public signals are about ${delta}% above the recovered operator price.`;recommendation='Verify that the products match on format, duration and inclusions. If they do, this deserves a controlled pricing mission.'}else if(delta<=-10){state='PREMIUM_POSITION';headline=`GO found the operator priced about ${Math.abs(delta)}% above the comparable public signal.`;recommendation='Do not discount automatically. Validate conversion and trust strength to determine whether the premium is working.'}else{state='MARKET_ALIGNED';headline='GO found the recovered operator price broadly aligned with comparable public pricing.';recommendation='Pricing does not currently outrank other growth investigations on public evidence alone.'}}
   return {version:'GO-PRICING-INTELLIGENCE-V2',state,headline,recommendation,deltaPct:delta,operator:{signals:own.length,median:om,sample:own.slice(0,6)},market:{signals:comp.length,median:cm,sample:comp.slice(0,8)},research:{planned:pricingMarket?.queries?.length||0,verified:(pricingMarket?.queries||[]).filter(x=>x.evidenceState!=='UNKNOWN').length},evidenceNote:'GO ran dedicated pricing searches. Public prices remain directional until product format, duration, inclusions and group structure are matched apples-to-apples.'};
 }
 window.GOPricingIntelligence={plan,build};
})();