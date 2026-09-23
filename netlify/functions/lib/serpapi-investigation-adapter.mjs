const ENDPOINT="https://serpapi.com/search.json";
const LOCATIONS_ENDPOINT="https://serpapi.com/locations.json";
const resolvedLocations=new Map();
const US_STATES=Object.fromEntries("AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|DC:District of Columbia".split("|").map(x=>x.split(":")));

async function resolveLocation(location,timeoutMs){
  const requested=String(location||"").trim();
  if(!requested)return "";
  if(!resolvedLocations.has(requested))resolvedLocations.set(requested,lookupLocation(requested,timeoutMs));
  try{return await resolvedLocations.get(requested)}catch(error){resolvedLocations.delete(requested);throw error}
}

async function lookupLocation(requested,timeoutMs){
  const [city,region]=requested.split(",").map(x=>x.trim());
  if(!city)throw new Error("Search location has no city");
  const url=new URL(LOCATIONS_ENDPOINT);url.searchParams.set("q",city);url.searchParams.set("limit","10");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{headers:{Accept:"application/json"},signal:controller.signal});
    if(!response.ok)throw new Error("SerpApi location lookup returned "+response.status);
    const rows=await response.json();
    if(!Array.isArray(rows))throw new Error("SerpApi location lookup returned invalid data");
    const sameCity=rows.filter(x=>x.target_type==="City"&&String(x.name||"").toLowerCase()===city.toLowerCase());
    const wantedRegion=(US_STATES[region?.toUpperCase()]||region||"").toLowerCase();
    const regionMatches=x=>!region||x.canonical_name?.toLowerCase().split(",").some(part=>part.trim()===wantedRegion)||String(x.name||"").toLowerCase().endsWith(", "+region.toLowerCase());
    const match=sameCity.find(regionMatches);
    if(!match?.canonical_name)throw new Error("Unsupported or ambiguous search location: "+requested);
    return match.canonical_name;
  }catch(error){if(error?.name==="AbortError")throw new Error("SerpApi location lookup timed out");throw error}
  finally{clearTimeout(timer)}
}

export async function collectSearchSurfaces({query,location="",apiKey,timeoutMs=20000}){
  if(!apiKey)throw new Error("SERPAPI_KEY is not configured");
  if(!query)throw new Error("query is required");
  const canonicalLocation=await resolveLocation(location,timeoutMs);
  const organicParams={engine:"google",q:query,gl:"us",hl:"en",device:"desktop",api_key:apiKey};
  if(canonicalLocation)organicParams.location=canonicalLocation;
  const localParams={engine:"google_local",q:query,gl:"us",hl:"en",device:"desktop",api_key:apiKey};
  if(canonicalLocation)localParams.location=canonicalLocation;
  const [organic,local]=await Promise.allSettled([search(organicParams,timeoutMs),search(localParams,timeoutMs)]);
  const organicPayload=organic.status==="fulfilled"?organic.value:{};
  const localPayload=local.status==="fulfilled"?local.value:{};
  const embedded=extractLocal(organicPayload);
  const dedicated=extractLocal(localPayload);
  return {
    provider:"SerpApi",query,location:canonicalLocation,
    payload:{organic_results:Array.isArray(organicPayload.organic_results)?organicPayload.organic_results:[],local_results:{places:dedupeLocal([...embedded,...dedicated])}},
    surfaceStatus:{organic:organic.status==="fulfilled"?"OBSERVED":"UNKNOWN",local:local.status==="fulfilled"?"OBSERVED":"UNKNOWN"},
    errors:[organic.status==="rejected"?"organic: "+message(organic.reason):"",local.status==="rejected"?"local: "+message(local.reason):""].filter(Boolean)
  };
}

async function search(params,timeoutMs){
  const url=new URL(ENDPOINT);Object.entries(params).forEach(([k,v])=>v!==""&&v!=null&&url.searchParams.set(k,String(v)));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(url,{headers:{Accept:"application/json"},signal:controller.signal});
    const body=await res.json().catch(()=>({}));
    if(!res.ok||body.error)throw new Error(body.error||"SerpApi returned "+res.status);
    return body;
  }catch(error){
    if(error?.name==="AbortError")throw new Error("SerpApi request exceeded "+Math.round(timeoutMs/1000)+"s");
    throw error;
  }finally{clearTimeout(timer)}
}
function extractLocal(payload){const x=payload?.local_results;if(Array.isArray(x))return x;if(Array.isArray(x?.places))return x.places;return[]}
function dedupeLocal(rows){
  const byKey=new Map();
  for(const row of rows){
    const key=String(row.place_id||row.data_id||"").trim()||[row.title||row.name,row.address,row.phone].map(x=>String(x||"").toLowerCase().trim()).join("|");
    if(!key)continue;
    const prior=byKey.get(key);
    if(!prior){byKey.set(key,row);continue}
    const merged={...prior};
    for(const [field,value] of Object.entries(row)){
      if((merged[field]===undefined||merged[field]===null||merged[field]==="")&&value!==undefined&&value!==null&&value!=="")merged[field]=value;
    }
    byKey.set(key,merged);
  }
  return [...byKey.values()];
}
function message(error){return error instanceof Error?error.message:String(error||"provider error")}
