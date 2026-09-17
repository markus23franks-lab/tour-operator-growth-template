(()=>{
'use strict';

const originalBuildDemandPlan = window.buildDemandPlan;
const originalBuildRepresentativeSearchPortfolio = window.buildRepresentativeSearchPortfolio;
const originalReadProfessionalMarket = window.readProfessionalMarket;

const activityFamilies = [
  ['canyoneering', /\bcanyoneering\b/gi],
  ['rock climbing', /\brock climbing\b|\bclimbing tours?\b/gi],
  ['hiking tours', /\bhiking\b|\bguided hikes?\b/gi],
  ['snorkeling tours', /\bsnorkel(?:ing)?\b/gi],
  ['scuba diving', /\bscuba\b|\bdiving tours?\b/gi],
  ['private boat charters', /\bprivate (?:boat )?charters?\b|\bboat charters?\b/gi],
  ['boat tours', /\bboat tours?\b|\bboat trips?\b|\bpowerboat\b/gi],
  ['sunset cruises', /\bsunset (?:cruises?|sails?|tours?)\b/gi],
  ['sailing tours', /\bsailing\b|\bsailboat\b|\bcatamaran\b/gi],
  ['fishing charters', /\bfishing charters?\b|\bsportfishing\b|\bdeep sea fishing\b/gi],
  ['kayak tours', /\bkayak(?:ing)?\b/gi],
  ['rafting tours', /\brafting\b|\bwhitewater\b/gi],
  ['horseback riding', /\bhorseback\b|\bhorse riding\b|\btrail rides?\b/gi],
  ['ATV tours', /\bATV\b|\bUTV\b|\boff[- ]road tours?\b/gi],
  ['jeep tours', /\bjeep tours?\b/gi],
  ['helicopter tours', /\bhelicopter tours?\b/gi],
  ['food tours', /\bfood tours?\b|\bculinary tours?\b/gi],
  ['wine tours', /\bwine tours?\b|\bwinery tours?\b/gi],
  ['bike tours', /\bbike tours?\b|\bcycling tours?\b|\bmountain biking\b/gi],
  ['surf lessons', /\bsurf lessons?\b|\bsurfing lessons?\b/gi],
  ['paddleboard rentals', /\bpaddleboards?\b|\bSUP rentals?\b/gi],
  ['jet ski rentals', /\bjet skis?\b|\bjetski\b/gi],
  ['parasailing', /\bparasail(?:ing)?\b/gi],
  ['whale watching', /\bwhale watching\b/gi],
  ['dolphin tours', /\bdolphin tours?\b|\bdolphin watching\b/gi],
  ['city tours', /\bcity tours?\b|\bsightseeing tours?\b/gi],
  ['ghost tours', /\bghost tours?\b/gi],
  ['zipline tours', /\bzip ?line(?:s| tours?)?\b/gi],
  ['ski tours', /\bski tours?\b|\bskiing\b/gi],
  ['snowmobile tours', /\bsnowmobil(?:e|ing)\b/gi]
];

const junkIntent = /^(?:groups?|gravity|bow|arch|cable arch|adventure|adventures|activities|experiences|tours?|things to do|packages?)$/i;

function countMatches(text, pattern){
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  const re = new RegExp(pattern.source, flags);
  return (String(text || '').match(re) || []).length;
}

function normalizeSpace(v){ return String(v || '').replace(/\s+/g,' ').trim(); }
function titleKey(v){ return normalizeSpace(v).toLowerCase().replace(/[^a-z0-9]+/g,' '); }

function extractDestinationFamilies(text){
  const out=[]; const seen=new Set();
  const patterns=[
    /\b([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,4}\s+National Park)\b/g,
    /\b([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,4}\s+State Park)\b/g,
    /\b([A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,3}\s+National Monument)\b/g
  ];
  for(const re of patterns){
    for(const m of String(text||'').matchAll(re)){
      const value=normalizeSpace(m[1]); const key=value.toLowerCase();
      if(!seen.has(key)){seen.add(key);out.push(value)}
    }
  }
  return out.slice(0,4);
}

function makePlanItem({intent,query,label,score,evidence,role='primary'}){
  const key=titleKey(query||intent).replace(/\s+/g,'-');
  return {
    id:`family-v2-${key}`,
    coverageFamily:`family-v2-${titleKey(intent).replace(/\s+/g,'-')}`,
    label:label||intent,
    intent,
    query,
    aliases:[],
    verifiedProductFamily:true,
    semanticProduct:true,
    commercialRole:role,
    websiteScore:Math.max(20,Math.min(60,score||30)),
    productSignalCount:1,
    websiteMentionCount:0,
    websiteEvidence:evidence||'Repeated first-party commercial family evidence'
  };
}

window.buildDemandPlan = function(ctx){
  const source=String(ctx?.combined||'');
  const location=normalizeSpace(ctx?.businessContext?.location || ctx?.commercialTruth?.geography || '');
  const originals=typeof originalBuildDemandPlan==='function' ? originalBuildDemandPlan(ctx) : [];
  const detected=[];

  for(const [intent,pattern] of activityFamilies){
    const count=countMatches(source,pattern);
    if(count<1) continue;
    detected.push({intent,count,score:42+Math.min(count,6)*3});
  }

  const destinations=extractDestinationFamilies(source);
  const hasHiking=detected.some(x=>x.intent==='hiking tours');
  const candidates=[]; const seen=new Set();
  const add=item=>{
    const key=titleKey(item.query||item.intent);
    if(!key||seen.has(key))return;
    seen.add(key);candidates.push(item);
  };

  detected.sort((a,b)=>b.score-a.score).forEach(d=>{
    const query=location ? `${location} ${d.intent}` : d.intent;
    add(makePlanItem({intent:d.intent,query,label:d.intent,score:d.score,evidence:`Detected ${d.count} first-party signal${d.count===1?'':'s'} for ${d.intent}`}));
  });

  destinations.forEach((destination,index)=>{
    add(makePlanItem({intent:`${destination} tours`,query:`${destination} tours`,label:`${destination} tours`,score:46-index,evidence:`First-party destination repeatedly names ${destination}`,role:'segment'}));
    if(hasHiking) add(makePlanItem({intent:`${destination} hiking tours`,query:`${destination} hiking tours`,label:`${destination} hiking tours`,score:49-index,evidence:`First-party hiking inventory + destination evidence for ${destination}`,role:'segment'}));
  });

  // Preserve an existing first-party candidate only when it maps to a real family GO independently detected.
  for(const item of originals){
    const intent=normalizeSpace(item?.intent||'');
    if(!intent||junkIntent.test(intent)) continue;
    const key=titleKey(intent);
    const supported=detected.some(d=>key.includes(titleKey(d.intent))||titleKey(d.intent).includes(key)) || destinations.some(d=>key.includes(titleKey(d)));
    if(!supported) continue;
    add({...item,query:item.query||`${location} ${intent}`.trim(),verifiedProductFamily:true});
  }

  // If the family extractor cannot establish enough real categories, fail soft into the strongest original evidence.
  if(candidates.length<3){
    for(const item of originals){
      const intent=normalizeSpace(item?.intent||'');
      if(!intent||junkIntent.test(intent)||intent.split(/\s+/).length>6) continue;
      add(item);
      if(candidates.length>=5) break;
    }
  }

  return candidates.sort((a,b)=>(b.websiteScore||0)-(a.websiteScore||0)).slice(0,8);
};

window.buildRepresentativeSearchPortfolio = function(ctx, selectedDemand, demandPlan){
  const plan=Array.isArray(demandPlan)?demandPlan:[];
  const ordered=[selectedDemand,...plan].filter(Boolean);
  const out=[]; const seen=new Set(); const families=new Set();
  const add=(query,intent)=>{
    const clean=normalizeSpace(query); const key=titleKey(clean); const family=titleKey(intent||clean);
    if(!clean||seen.has(key))return;
    // Avoid spending the whole portfolio on reversed word-order variants of the same family.
    if(families.has(family)&&out.length>=3)return;
    seen.add(key);families.add(family);out.push(clean);
  };
  for(const item of ordered){
    if(!item?.verifiedProductFamily||junkIntent.test(item.intent||'')) continue;
    add(item.query||item.intent,item.intent);
    if(out.length>=5) break;
  }
  return out.slice(0,5);
};

function namesMatch(a,b){
  const clean=v=>titleKey(v).replace(/\b(?:llc|inc|company|co|tours?|adventures?)\b/g,' ').replace(/\s+/g,' ').trim();
  const x=clean(a),y=clean(b); if(!x||!y)return false;
  return x===y||x.includes(y)||y.includes(x);
}
function host(v){try{return new URL(v).hostname.replace(/^www\./,'').toLowerCase()}catch{return''}}
function targetPosition(results,businessName,website){
  const targetHost=host(website);
  const match=(results||[]).find(x=>namesMatch(x.title,businessName)||(targetHost&&host(x.website)===targetHost));
  return match?.position||null;
}

window.readProfessionalMarket = async function(ctx){
  const market=typeof originalReadProfessionalMarket==='function' ? await originalReadProfessionalMarket(ctx) : null;
  if(!market?.queryResults?.length) return market;
  const needsRepair=market.queryResults.filter(row=>!(row.localResults||[]).length || row.evidenceState==='UNKNOWN');
  if(!needsRepair.length) return market;

  try{
    const res=await fetch('/.netlify/functions/local-evidence-v2',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({queries:needsRepair.map(x=>x.query),location:ctx?.businessContext?.location||''})
    });
    const payload=await res.json().catch(()=>({}));
    if(!res.ok||!payload.ok)return market;
    const byQuery=new Map((payload.queries||[]).map(x=>[String(x.query||'').toLowerCase(),x]));

    market.queryResults=market.queryResults.map(row=>{
      const fallback=byQuery.get(String(row.query||'').toLowerCase());
      if(!fallback?.localResults?.length)return row;
      const localResults=fallback.localResults;
      const targetLocalPosition=targetPosition(localResults,ctx.businessName,ctx.url);
      const organicVisible=Boolean(row.targetOrganicPosition);
      const targetVisible=Boolean(targetLocalPosition||organicVisible);
      const providerError=targetVisible ? '' : row.providerError;
      const evidenceState=targetVisible?'OBSERVED_WIN':((row.organicResults||[]).length+localResults.length>0&&!providerError?'OBSERVED_GAP':'UNKNOWN');
      return {...row,localResults,localResultsChecked:localResults.length,targetLocalPosition,evidenceState,evidenceVerified:evidenceState!=='UNKNOWN',providerError,localFallbackProvider:payload.provider};
    });

    market.searchPages=(market.queryResults||[]).map(row=>({query:row.query,source:`${market.provider||'SerpApi'} · Google + Maps fallback`,url:'',markdown:''}));
    if(market.pipelineDebug){
      market.pipelineDebug.rawQueryResults=market.queryResults.map(row=>({query:row.query,targetLocalPosition:row.targetLocalPosition,targetOrganicPosition:row.targetOrganicPosition,localResultsChecked:row.localResultsChecked,organicResultsChecked:row.organicResultsChecked,evidenceState:row.evidenceState}));
      market.pipelineDebug.localFallback='SerpApi Google Maps fallback used only where primary local evidence was empty/unknown.';
      market.pipelineDebug.selectedQueries=market.queryResults.map(row=>row.query);
    }
    market.retrievalNote=`GO checked ${market.queryResults.length} commercially relevant searches and used a Google Maps fallback only where the primary provider returned no local evidence.`;
  }catch(error){
    console.warn('GO Maps fallback unavailable; preserving primary evidence state.',error);
  }
  return market;
};

window.GOColdStartV2={version:'B054-COLD-START-V2'};
})();
