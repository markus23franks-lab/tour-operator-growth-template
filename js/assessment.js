"use strict";

const PILLARS = [
  ["Visibility","⌖","Across the discovery surfaces GO has checked, can the right travelers find this business when they are ready to book?"],
  ["Trust","★","Does public proof make the operator feel like the obvious safe choice?"],
  ["Conversion","↗","Does the website make the next booking step clear and easy?"],
  ["Operations","⚡","Can GO verify the operating systems that protect and fulfill demand?"],
  ["Intelligence","◎","Can GO see what actually creates traffic, bookings and revenue?"],
  ["Growth","✦","Is there enough evidence to know what deserves attention next?"]
];
const fallback={businessName:"Cayman Ocean Adventures",website:"",growthScore:68,scores:{Visibility:76,Trust:72,Conversion:66,Operations:63,Intelligence:58,Growth:68},analysisConfidence:"Medium",summary:"GO has enough public evidence to establish a directional baseline, but first-party data is still required to prove revenue impact.",opportunities:[]};
const prospect=read("growthOperatorProspectProfile",null), review=read("growthOperatorBusinessReviewProfile",null), profile=prospect||review||fallback;
const connected=Boolean(profile.connectedData||profile.dataConnections?.verified);

const displayBusinessName = canonicalDisplayBusinessName(profile.businessName || fallback.businessName);

function canonicalDisplayBusinessName(value){
  let name=String(value||"").replace(/\s+/g," ").trim();
  const embedded=[
    /\b(?:with|from|by)\s+(.{3,64}?)\s+(?:today|online|official(?:\s+site)?|now)$/i,
    /^(?:book|explore|discover|experience)\s+(.{3,64}?)\s+(?:today|online|now)$/i
  ];
  for(const pattern of embedded){
    const m=name.match(pattern);
    if(m?.[1]){name=m[1].trim();break;}
  }
  return name||fallback.businessName;
}

document.addEventListener("DOMContentLoaded",render);

function render(){
  const name=displayBusinessName, scores=normalizeScores(profile.scores||fallback.scores), areas=buildAreas(scores), baseline=calculateBaseline(areas,profile.growthScore), priority=choosePriority(areas,profile.opportunities||[]), evidence=collectEvidence(priority,areas), model=buildEconomicModel(priority,evidence);
  set("business-heading",`${name}'s Growth Score`); set("score-number",baseline); set("baseline-number",baseline); document.getElementById("score-ring").style.setProperty("--score",baseline);
  set("score-label",connected?"VERIFIED GROWTH BASELINE":"PUBLIC GROWTH BASELINE"); set("score-read",scoreRead(baseline)); set("score-summary",profile.summary||fallback.summary);
  set("score-confidence",connected?"Connected business data contributes to this baseline.":`${profile.analysisConfidence||"Medium"} confidence in the public read. GO separates what it observed from what still needs first-party proof.`);
  set("constraint-name",priority.pillar); set("constraint-copy",constraintCopy(priority,areas)); set("priority-title",conciseTitle(priority)); set("priority-copy",conciseProblem(priority));
  set("evidence-level",connected?"Verified baseline":"Public baseline"); set("evidence-copy",`${evidence.observed.length} public signals support the current priority; ${evidence.unknown.length} important inputs still need verification.`);
  renderEconomics(model); renderProof(evidence,areas); renderDiscovery(evidence); document.getElementById("area-grid").innerHTML=areas.map(a=>areaCard(a,evidence)).join("");
  set("priority-pillar",priority.pillar.toUpperCase()); set("priority-confidence",`${String(priority.confidence||profile.analysisConfidence||"Medium").toUpperCase()} CONFIDENCE`); set("mission-title",conciseTitle(priority)); set("mission-problem",conciseProblem(priority)); set("mission-why",priority.rankExplanation||priority.priorityReason||defaultWhy(priority.pillar)); set("mission-action",priority.action||defaultAction(priority.pillar)); set("mission-metric",priority.metric||defaultMetric(priority.pillar)); set("action-revenue",model.label); set("modeled-opportunity",model.label);
  renderMath(model); set("connection-copy",connected?"GO can now replace public assumptions with actual traffic, conversion, bookings and revenue. Each completed mission should write measured impact back into the score.":"Connect Search Console, Google Business Profile, analytics and booking data. GO will replace each public assumption with the operator's actual traffic, conversion, booking value and revenue, then measure what changed after execution.");
  document.getElementById("open-mission").addEventListener("click",()=>{localStorage.setItem("growthOperatorActiveMission",JSON.stringify({businessName:name,website:profile.website||"",growthScore:baseline,scores:Object.fromEntries(areas.map(a=>[a.name,Number.isFinite(a.score)?a.score:0])),revenueOpportunity:model.midpoint,mission:{pillar:priority.pillar,title:conciseTitle(priority),reason:conciseProblem(priority),description:priority.action||defaultAction(priority.pillar),confidence:confidenceNumber(priority.confidence||profile.analysisConfidence),revenueLow:model.low,revenueHigh:model.high,revenueModel:model.assumptions}}));window.location.href="mission.html?source=growth-score";});
}

function buildAreas(scores){const support={Visibility:true,Trust:true,Conversion:true,Operations:connected,Intelligence:connected,Growth:true};return PILLARS.map(([name,icon,description])=>({name,icon,description,score:support[name]&&Number.isFinite(scores[name])?clamp(scores[name]):null,evidence:support[name]?(connected?"Verified + public":"Public evidence"):"Needs connected data"}));}
function calculateBaseline(areas,legacy){const scored=areas.filter(a=>Number.isFinite(a.score)),w={Visibility:.32,Trust:.23,Conversion:.23,Growth:.22};let n=0,d=0;scored.forEach(a=>{if(w[a.name]){n+=a.score*w[a.name];d+=w[a.name];}});return d?Math.round(n/d):(Number.isFinite(Number(legacy))?clamp(legacy):0);}
function choosePriority(areas,ops){const usable=Array.isArray(ops)?ops.filter(Boolean):[];if(usable.length){const f=usable[0];return{pillar:normalizePillar(f.pillar),title:f.title||"Resolve the highest-value growth constraint",problem:f.problem||"",action:f.action||"",metric:f.metric||"",confidence:f.confidence||profile.analysisConfidence||"Medium",rankExplanation:f.rankExplanation||f.priorityReason||"",sources:f.sources||[],raw:f};}const weak=areas.filter(a=>Number.isFinite(a.score)).sort((a,b)=>a.score-b.score)[0]||{name:"Growth"};return{pillar:weak.name,title:defaultTitle(weak.name),problem:defaultProblem(weak.name),action:defaultAction(weak.name),metric:defaultMetric(weak.name),confidence:profile.analysisConfidence||"Medium",sources:[],raw:{}};}

function collectEvidence(priority,areas){
  const raw=priority.raw||{}, observed=[], inferred=[], unknown=[];
  const add=(arr,label,detail,impact=0,source="Public scan")=>{if(detail&&String(detail).trim())arr.push({label,detail:clean(detail),impact,source});};
  (raw.sources||priority.sources||[]).forEach(s=>add(observed,s.label||"Public source",s.detail||s.value||"Public evidence observed",0,s.source||s.type||"Public market"));
  const fields=[
    ["Market demand",raw.marketDemand||raw.demandEvidence||raw.searchEvidence,-8,"Public search"],
    ["Search / market position",raw.marketPosition||raw.visibilityEvidence||raw.localizedGoogleCheck,-10,"Public market"],
    ["Competitor evidence",raw.competitorEvidence||raw.directMarketLeaders||raw.competitorPricing,-6,"Public competitor"],
    ["Trust evidence",raw.trustEvidence||raw.publicTrustEvidence,-5,"Public reviews"],
    ["Booking path",raw.bookingEvidence||raw.bookingAction||raw.bookingTechnology,-8,"Website"],
    ["Public pricing",raw.pricingEvidence||raw.publicPricing,-3,"Website / market"]
  ]; fields.forEach(([l,v,i,s])=>add(observed,l,v,i,s));
  if(priority.problem)add(inferred,"GO judgment",priority.problem,0,"GO inference"); if(priority.rankExplanation)add(inferred,"Priority rationale",priority.rankExplanation,0,"GO inference");
  const summary=String(profile.summary||""); if(/pricing|price/i.test(summary))add(observed,"Pricing detected",extractPrices(summary).join(" · ")||"Public pricing detected",-2,"Website");
  if(/review|rating|testimonial/i.test(summary))add(observed,"Trust proof detected","Reviews, ratings or testimonial language were observed in the public scan.",-2,"Website / public market");
  if(/experience|tour|charter|div|snorkel|ride|activity/i.test(summary))add(observed,"Product inventory","GO identified bookable experience/product signals on the operator website.",0,"Website");
  if(priority.pillar==="Visibility") unknown.push({label:"Actual search traffic",detail:"Search Console impressions, clicks and average position (organic search only)",source:"Search Console"},{label:"True booking conversion",detail:"Qualified organic visit → completed booking rate",source:"Analytics + booking"},{label:"Average booking value",detail:"Actual revenue per completed booking",source:"Booking / OBP"});
  else if(priority.pillar==="Conversion") unknown.push({label:"Booking funnel",detail:"Experience view → checkout start → completed booking",source:"Analytics + booking"},{label:"Average booking value",detail:"Actual revenue per booking",source:"Booking / OBP"});
  else unknown.push({label:"Traffic + conversion",detail:"Actual qualified demand and booking performance",source:"Analytics + booking"},{label:"Revenue",detail:"Actual booking value and revenue attribution",source:"Booking / OBP"});
  if(!observed.length){add(observed,"Public business context",profile.summary||"GO established the operator, product and market context from public evidence.",0,"Public scan");}
  return{observed:dedupe(observed).slice(0,8),inferred:dedupe(inferred).slice(0,3),unknown};
}

function buildEconomicModel(priority,evidence){
  const explicit=Number(priority.raw?.amount||priority.raw?.revenueOpportunity||0); if(explicit>0)return{low:Math.round(explicit*.75),high:Math.round(explicit*1.25),midpoint:explicit,label:moneyRange(explicit*.75,explicit*1.25),confidence:"Medium–High",basis:"Existing GO opportunity model",assumptions:[`GO already modeled this opportunity at approximately ${money(explicit)} annually.`,`Range shown adds a ±25% public-evidence uncertainty band.`],defensible:true};
  const prices=extractPrices(JSON.stringify(profile)); const avgPrice=prices.length?median(prices):0;
  const p=priority.pillar; let visitsLow=0,visitsHigh=0,rateLow=.018,rateHigh=.032;
  if(p==="Visibility"){visitsLow=360;visitsHigh=900;} else if(p==="Conversion"){visitsLow=500;visitsHigh=1200;rateLow=.008;rateHigh=.018;} else if(p==="Trust"){visitsLow=450;visitsHigh=1000;rateLow=.006;rateHigh=.014;} else {visitsLow=0;visitsHigh=0;}
  if(!avgPrice||!visitsLow)return{low:0,high:0,midpoint:0,label:"Needs connected data",confidence:"Not modeled",basis:"Insufficient economic inputs",assumptions:["GO has not found enough defensible public inputs to attach dollars yet.","Connect traffic, conversion and booking revenue to produce the model."],defensible:false};
  const low=Math.round(visitsLow*rateLow*avgPrice), high=Math.round(visitsHigh*rateHigh*avgPrice), midpoint=Math.round((low+high)/2);
  return{low,high,midpoint,label:moneyRange(low,high),confidence:"Directional",basis:`Public price signal + conservative ${p.toLowerCase()} assumptions`,assumptions:[`Public price signal used: ~${money(avgPrice)} median detected price.`,`Modeled incremental qualified visits / influenced visits: ${visitsLow.toLocaleString()}–${visitsHigh.toLocaleString()} per year.`,`Modeled incremental booking yield: ${(rateLow*100).toFixed(1)}%–${(rateHigh*100).toFixed(1)}%.`,`Formula: incremental qualified demand × incremental booking yield × detected booking value.`],defensible:true};
}


const DISCOVERY_CHANNELS = [
  {key:"organic",label:"Organic search",detail:"Commercial web searches and public result evidence",state:"checked"},
  {key:"local",label:"Local discovery",detail:"Maps, local packs and destination-level presence",state:"not-checked"},
  {key:"ai",label:"AI / answer discovery",detail:"Recommendation and answer engines such as ChatGPT and Google AI",state:"not-checked"},
  {key:"social",label:"Social discovery",detail:"Instagram, TikTok, YouTube, Facebook and relevant creator surfaces",state:"not-checked"},
  {key:"marketplace",label:"Marketplace discovery",detail:"Viator, GetYourGuide, Tripadvisor and relevant distribution surfaces",state:"not-checked"},
  {key:"authority",label:"Authority discovery",detail:"Reviews, tourism boards, destination authorities and third-party mentions",state:"partial"}
];

function renderDiscovery(evidence){
  const intel=profile.discoveryIntelligence||null;
  if(intel&&Array.isArray(intel.searches)&&intel.searches.length){
    const searches=intel.searches;
    const measurable=searches.filter(x=>Number(x.localResultsChecked)>0||Number(x.organicResultsChecked)>0);
    const gaps=measurable.filter(x=>!x.visible&&(Number(x.localResultsChecked)>=3||Number(x.organicResultsChecked)>=5));
    const visible=measurable.filter(x=>x.visible);

    if(measurable.length){
      set("discovery-baseline",`${measurable.length} commercial searches investigated`);
      set("discovery-summary",`${displayBusinessName} appeared in ${visible.length} of ${measurable.length} representative Google search sets GO checked. ${gaps.length?`${gaps.length} measurable visibility gap${gaps.length===1?"":"s"} deserve attention.`:"GO did not find a clear absence gap in this portfolio."}`);
      document.getElementById("discovery-channels").innerHTML=measurable.slice(0,6).map(row=>{
        const rank=row.operatorLocalPosition?`Maps #${row.operatorLocalPosition}`:row.operatorOrganicPosition?`Google #${row.operatorOrganicPosition}`:`Not found in ${Math.max(row.localResultsChecked||0,row.organicResultsChecked||0)} results checked`;
        const leaders=(row.competitors||[]).slice(0,2).map(c=>`${c.name}${c.localPosition?` · Maps #${c.localPosition}`:c.organicPosition?` · Google #${c.organicPosition}`:""}${c.rating?` · ${Number(c.rating).toFixed(1)}★`:""}`).join(" / ");
        return `<article class="discovery-channel ${row.visible?"checked":"partial"}"><div><strong>${esc(row.query)}</strong><span>${esc(leaders?`${rank} · Competitors: ${leaders}`:rank)}</span></div><b>${row.visible?"VISIBLE":"GAP"}</b></article>`;
      }).join("");
      const strongestGap=gaps[0]||measurable[0];
      set("discovery-looked",`${intel.source||"Google"} · ${measurable.length} searches tied to experiences this operator sells`);
      set("discovery-found",strongestGap?`${strongestGap.query}: ${strongestGap.operatorLocalPosition?`Maps #${strongestGap.operatorLocalPosition}`:strongestGap.operatorOrganicPosition?`Google #${strongestGap.operatorOrganicPosition}`:`not found in the ${Math.max(strongestGap.localResultsChecked||0,strongestGap.organicResultsChecked||0)} results GO checked`}. ${(strongestGap.competitors||[]).length?`GO did find ${strongestGap.competitors.slice(0,2).map(c=>c.name).join(" and ")} around the same demand.`:""}`:intel.conclusion);
      set("discovery-means",intel.conclusion||"GO found a measurable discovery pattern tied to bookable demand, not a generic website observation.");
      set("discovery-next",intel.nextAction||"Strengthen the page and authority signals tied to the strongest commercial gap, then rerun the same search portfolio and measure movement.");
      return;
    }

    // Analyzer completed, but only fallback/public evidence was available. Never tell the
    // operator to rerun a scan that already happened.
    set("discovery-baseline",`${searches.length} commercial searches attempted`);
    set("discovery-summary",`GO completed the market investigation, but the structured Google/Maps position layer did not return enough ranking evidence to make exact position claims.`);
    document.getElementById("discovery-channels").innerHTML=searches.slice(0,5).map(row=>`<article class="discovery-channel partial"><div><strong>${esc(row.query)}</strong><span>Market investigated · exact position evidence unavailable in this run</span></div><b>LIMITED</b></article>`).join("");
    set("discovery-looked",`${intel.source||"Public web"} · representative commercial demand`);
    set("discovery-found","GO completed the scan; the missing piece is structured rank/Maps evidence, not another Analyzer run.");
    set("discovery-means",intel.conclusion||"The public scan found relevant market context, but GO is withholding exact ranking claims until the structured search provider returns them.");
    set("discovery-next",intel.nextAction||"Use the strongest verified market evidence now, then restore structured search-position evidence before partner-facing use.");
    return;
  }

  set("discovery-baseline","No structured discovery evidence in this saved profile");
  set("discovery-summary","This profile does not contain a discovery portfolio yet. GO will not invent search positions.");
  document.getElementById("discovery-channels").innerHTML=`<article class="discovery-channel partial"><div><strong>Discovery evidence unavailable</strong><span>No structured market portfolio was saved with this profile.</span></div><b>NO DATA</b></article>`;
  set("discovery-looked","No structured market portfolio saved");
  set("discovery-found","No ranking claim.");
  set("discovery-means","Growth Score is preserving evidence integrity rather than filling this section with status labels.");
  set("discovery-next","Restore the structured discovery handoff before design-partner use.");
}
function renderEconomics(m){set("revenue-range",m.label);set("revenue-confidence",m.confidence);set("revenue-copy",m.defensible?"A transparent public model — not a promise. Open the math below to see every assumption.":"GO is refusing to invent revenue. The missing inputs are explicit below.");set("revenue-confidence-copy",m.defensible?m.basis:"No dollar claim until the evidence supports one.");set("verify-title",m.defensible?"Replace assumptions":"Supply missing inputs");set("verify-copy",m.defensible?"Connect first-party traffic, conversion and booking value so GO can replace the public model with actual economics.":"Connect Search Console, analytics and booking revenue.");}
function renderProof(e,a){const total=e.observed.length+e.inferred.length+e.unknown.length;document.getElementById("proof-summary").innerHTML=`<div><strong>${total}</strong><span>signals exposed</span></div><div><strong>${e.observed.length}</strong><span>publicly observed</span></div><div><strong>${e.inferred.length}</strong><span>GO judgments</span></div><div><strong>${e.unknown.length}</strong><span>inputs still needed</span></div>`;document.getElementById("evidence-ledger").innerHTML=[...e.observed.map(x=>ledger(x,"observed")),...e.inferred.map(x=>ledger(x,"inferred")),...e.unknown.map(x=>ledger(x,"unknown"))].join("");}
function ledger(x,type){const labels={observed:"PUBLICLY VERIFIED",inferred:"GO INFERENCE",unknown:"NEEDS CONNECTED DATA"};return`<article class="ledger-row ${type}"><div><small>${labels[type]}</small><strong>${esc(x.label)}</strong></div><p>${esc(x.detail)}</p><span>${esc(x.source||"")}</span></article>`;}
function areaCard(a,e){if(!Number.isFinite(a.score))return`<article class="area-card needs-data"><div class="area-head"><span>${a.icon}</span><div><small>${a.name.toUpperCase()}</small><strong>Needs data</strong></div></div><p>${a.description}</p><div class="data-line"><i></i><span>GO will not score this system until the evidence exists.</span></div></article>`;const count=a.name==="Visibility"?e.observed.filter(x=>/search|market|competitor|product/i.test(x.label)).length:a.name==="Trust"?e.observed.filter(x=>/trust|review/i.test(x.label)).length:a.name==="Conversion"?e.observed.filter(x=>/booking|product|pricing/i.test(x.label)).length:Math.max(1,Math.round(e.observed.length/3));return`<article class="area-card"><div class="area-head"><span>${a.icon}</span><div><small>${a.name.toUpperCase()}</small><strong>${a.score}<em>/100</em></strong></div></div><div class="bar"><i style="width:${a.score}%"></i></div><p>${a.description}</p><div class="data-line observed"><i></i><span>${count} supporting public signal${count===1?"":"s"} · ${a.evidence}</span></div></article>`;}
function renderMath(m){document.getElementById("math-lines").innerHTML=m.assumptions.map((x,i)=>`<div><b>${i+1}</b><span>${esc(x)}</span></div>`).join("");set("math-note",m.defensible?"This is an opportunity model, not guaranteed revenue. Connected data replaces assumptions; measured results replace the model.":"GO intentionally withholds a revenue estimate when the public evidence cannot support the math.");}

function conciseTitle(p){const raw=String(p.title||"");if(p.pillar==="Visibility")return "Capture more high-intent demand for the experiences you already sell";if(p.pillar==="Conversion")return "Turn more existing demand into booking starts";if(p.pillar==="Trust")return "Close the trust gap where travelers decide who to book";return raw.length>95?defaultTitle(p.pillar):raw||defaultTitle(p.pillar);}
function conciseProblem(p){const raw=clean(p.problem||"");if(p.pillar==="Visibility")return "GO found public evidence that relevant demand and competing operators exist around this business. The opportunity is to improve how often the operator earns visibility when travelers are actively choosing an experience.";if(p.pillar==="Conversion")return "GO sees enough buying-path evidence to make conversion worth testing before lower-confidence work.";return raw.length>360?raw.slice(0,357)+"…":raw||defaultProblem(p.pillar);}
function constraintCopy(p,areas){const area=areas.find(a=>a.name===p.pillar);if(area&&area.score>=85)return`${p.pillar} is not the weakest score. GO chose it because the current evidence suggests it contains the largest addressable commercial opportunity.`;return`GO chose ${p.pillar.toLowerCase()} because it is the strongest addressable constraint supported by the current evidence — not simply because it has the lowest number.`;}
function scoreRead(s){return s>=80?"Strong foundation. GO is looking for the highest-value upside.":s>=65?"Good foundation. GO found a constraint worth working.":s>=50?"Meaningful upside. GO should resolve the biggest constraint first.":"Several growth constraints deserve prioritization.";}
function defaultTitle(p){return{Visibility:"Capture more high-intent discovery",Trust:"Strengthen the proof that makes travelers choose",Conversion:"Make the path to booking easier",Operations:"Protect more demand with stronger systems",Intelligence:"Connect the data GO needs to make better decisions",Growth:"Turn the strongest opportunity into measurable work"}[p]||"Turn the strongest opportunity into measurable work";}
function defaultProblem(p){return{Visibility:"GO sees a public discovery gap around demand relevant to the operator.",Trust:"GO sees a public trust gap worth testing.",Conversion:"GO sees friction between product interest and booking action.",Operations:"GO needs verified operating data to improve demand protection.",Intelligence:"Attribution requires first-party data.",Growth:"The business needs one measurable growth priority."}[p]||"";}
function defaultAction(p){return{Visibility:"Strengthen the highest-value existing experience pages and market signals tied to commercial demand, establish a baseline, then measure qualified visibility and bookings.",Trust:"Strengthen trust proof closest to the buying decision and measure booking behavior.",Conversion:"Simplify the booking path and measure checkout starts and completions.",Operations:"Connect operating systems, identify leakage and automate the highest-value workflow.",Intelligence:"Connect sources needed to replace assumptions with traffic, booking and revenue evidence.",Growth:"Turn the highest-confidence opportunity into a mission with a baseline, action and measured result."}[p]||"";}
function defaultMetric(p){return{Visibility:"Discovery visibility → qualified visits → bookings",Trust:"Trust exposure → booking starts → bookings",Conversion:"Experience visits → checkout starts → bookings",Operations:"Demand → response / fulfillment → bookings",Intelligence:"Source → booking → revenue attribution",Growth:"Priority → action → measured business result"}[p]||"Measured result";}
function defaultWhy(p){return{Visibility:"The public evidence ties this opportunity to products the operator already sells and demand travelers already express.",Trust:"Public proof is the clearest addressable constraint in the current evidence.",Conversion:"The buying experience shows the clearest actionable constraint.",Operations:"Connected evidence makes this operating constraint measurable.",Intelligence:"Better measurement is required before lower-confidence execution.",Growth:"GO found enough evidence to choose this before lower-confidence work."}[p]||"";}
function extractPrices(v){const m=String(v||"").match(/\$\s?([0-9]{2,4})(?:\.\d{1,2})?/g)||[];return[...new Set(m.map(x=>Number(x.replace(/[^0-9.]/g,""))).filter(n=>n>=20&&n<=5000))];}
function median(a){const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function normalizeScores(input){const o={};PILLARS.forEach(([n])=>{const x=Number(input?.[n]??input?.[n.toLowerCase()]);o[n]=Number.isFinite(x)?x:NaN;});return o;}
function normalizePillar(v){const r=String(v||"Growth").toLowerCase(),m=PILLARS.find(([n])=>n.toLowerCase()===r);return m?m[0]:"Growth";}
function confidenceNumber(v){const t=String(v||"").toLowerCase();return t.includes("high")?88:t.includes("medium")?74:t.includes("low")?58:(Number(v)||74);}
function clean(v){return String(v||"").replace(/https?:\/\/\S+/g,"").replace(/\s+/g," ").trim();} function dedupe(a){const s=new Set;return a.filter(x=>{const k=(x.label+"|"+x.detail).toLowerCase();if(s.has(k))return false;s.add(k);return true;});}
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Math.round(n));} function moneyRange(l,h){return`${money(l)}–${money(h)}/yr`;}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)));} function set(id,v){const n=document.getElementById(id);if(n)n.textContent=v??"";} function read(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}} function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}