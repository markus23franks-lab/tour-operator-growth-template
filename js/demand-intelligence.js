(function(global){
  const clean=v=>String(v??'').trim(), low=v=>clean(v).toLowerCase();
  const pages=a=>Array.isArray(a?.pages)?a.pages:[];
  const corpus=a=>pages(a).map(p=>`${p.url||''}\n${p.markdown||''}`).join('\n').toLowerCase();
  const families=[
    {id:'boat-tours',query:'boat tours',rx:/\bboat(s|ing)?\b|\bcruise(s)?\b|\bcatamaran(s)?\b/,why:'Broad category discovery for operators selling boat/cruise experiences.',breadth:'BROAD'},
    {id:'snorkeling',query:'snorkeling tours',rx:/\bsnorkel(l?ing)?\b|\breef\b/,why:'Broad traveler language for snorkeling inventory; avoids overfitting to a specific reef/site.',breadth:'BROAD'},
    {id:'catamaran',query:'catamaran tours',rx:/\bcatamaran(s)?\b/,why:'High-intent category language when catamaran inventory is prominent.',breadth:'BROAD'},
    {id:'excursions',query:'excursions',rx:/\bexcursion(s)?\b|\btour(s)?\b|\bactivities\b/,why:'Broad destination activity discovery before a traveler knows the exact product.',breadth:'BROAD'},
    {id:'sunset',query:'sunset cruise',rx:/\bsunset\b/,why:'Broad experience intent; deliberately avoids combining sunset with unrelated modifiers.',breadth:'HIGH-INTENT'},
    {id:'private-charter',query:'private boat charter',rx:/\bprivate\b.{0,30}\b(charter|boat|cruise)\b|\bcharter(s)?\b/,why:'High-value, high-intent private experience language when the operator actually offers it.',breadth:'HIGH-INTENT'},
    {id:'adults',query:'adults only boat cruise',rx:/\badults?[\s-]?only\b/,why:'Specialty demand probe; lower breadth than core category searches.',breadth:'SPECIALTY'}
  ];
  function build({acquisition,location,websiteQueries=[]}){
    const text=corpus(acquisition), loc=clean(location);
    const detected=families.filter(f=>f.rx.test(text)).map(f=>({...f,query:`${loc} ${f.query}`.trim()}));
    if(!detected.some(x=>x.id==='excursions')) detected.push({...families[3],query:`${loc} excursions`.trim(),why:'Broad destination discovery probe; included because the operator sells bookable activities.'});
    const order={BROAD:0,'HIGH-INTENT':1,SPECIALTY:2}; detected.sort((a,b)=>order[a.breadth]-order[b.breadth]);
    const chosen=[]; for(const x of detected){if(!chosen.some(c=>low(c.query)===low(x.query)))chosen.push(x);if(chosen.length===5)break;}
    return {version:'GO-DEMAND-INTELLIGENCE-V1',caveat:'GO has not proven search volume in this build. These are broader traveler-intent probes selected from the operator’s actual inventory and tested against live search results.',probes:chosen,websiteQueries:websiteQueries.map(query=>({query,source:'OPERATOR-LANGUAGE'}))};
  }
  global.GODemandIntelligence={build};
})(window);