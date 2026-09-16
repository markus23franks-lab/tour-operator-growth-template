(function(global){
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  function prices(acq){
    const text=(acq?.pages||[]).map(p=>p.markdown||'').join('\n');
    const vals=[...text.matchAll(/(?:US\s*)?\$\s*([0-9]{2,5}(?:\.[0-9]{1,2})?)/g)]
      .map(m=>Number(m[1])).filter(v=>v>=20&&v<=10000);
    return [...new Set(vals)].sort((a,b)=>a-b).slice(0,12);
  }
  function build({market,opportunity,acquisition}){
    const rows=market?.queries||[];
    const coverage=opportunity?.coverage||{planned:rows.length,verified:rows.filter(r=>r.evidenceState!=='UNKNOWN'&&!r.providerError).length,sufficient:true};
    const demandRows=rows.filter(r=>r.portfolioSource==='TRAVELER-DEMAND');
    const gaps=demandRows.filter(r=>r.evidenceState!=='UNKNOWN'&&!r.providerError&&!r.targetLocalPosition&&!r.targetOrganicPosition);
    const publicPrices=prices(acquisition);
    const hasDemandVolume=false; // V1: no defensible volume provider or connected Search Console.
    const hasConversion=false;
    const hasCapacity=false;
    const hasBookingValue=publicPrices.length>0;
    const coreGap=(opportunity?.opportunities||[]).find(x=>x.type==='CAPTURE'&&x.commercialImportance==='CORE'&&demandRows.some(r=>r.query===x.query));
    const meaningful=Boolean(coreGap||gaps.length);
    let state='UNKNOWN',label='Needs more evidence',headline='GO cannot responsibly price this opportunity yet.';
    if(!coverage.sufficient){state='UNKNOWN';label='Evidence incomplete';headline='GO needs sufficient verified evidence before it can size this opportunity.'}
    else if(meaningful){state='DIRECTIONAL';label='Directional opportunity';headline='A discovery opportunity may exist, but a dollar range is not yet defensible.'}
    const missing=[];
    if(!hasDemandVolume)missing.push('actual demand / impressions');
    if(!hasConversion)missing.push('conversion rate');
    if(!hasBookingValue)missing.push('booking value');
    if(!hasCapacity)missing.push('capacity / availability');
    return {
      version:'GO-ECONOMICS-V1',state,label,headline,range:null,
      publicPrices,meaningful,
      inputs:[
        {name:'Observed search position',status:'PUBLICLY OBSERVED',available:rows.length>0},
        {name:'Public product pricing',status:hasBookingValue?'PUBLICLY OBSERVED':'UNKNOWN',available:hasBookingValue},
        {name:'Demand volume',status:'UNKNOWN',available:false},
        {name:'Conversion',status:'UNKNOWN',available:false},
        {name:'Capacity',status:'UNKNOWN',available:false}
      ],
      missing,
      explanation: !coverage.sufficient ? `GO verified ${coverage.verified||0} of ${coverage.planned||rows.length} planned discovery checks. Unverified searches are not treated as lost demand or economic loss.` : hasBookingValue
        ? `GO found public price points, but price alone cannot establish recoverable revenue. It still needs ${missing.filter(x=>x!=='booking value').join(', ')}.`
        : `Observed rankings alone do not establish revenue. GO still needs ${missing.join(', ')}.`,
      connectionPath:[
        ['Search Console','Replace guessed demand with actual impressions and clicks.'],
        ['Analytics','See qualified traffic and conversion behavior.'],
        ['Booking system','Use actual booking value, completed bookings and capacity.']
      ]
    };
  }
  global.GOEconomics={build};
})(window);