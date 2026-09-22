const ENDPOINT="https://serpapi.com/search.json";

export async function collectSearchSurfaces({query,location="",apiKey,timeoutMs=9000}){
  if(!apiKey)throw new Error("SERPAPI_KEY is not configured");
  if(!query)throw new Error("query is required");
  const organicParams={engine:"google",q:query,gl:"us",hl:"en",device:"desktop",api_key:apiKey};
  if(location)organicParams.location=location;
  const localParams={engine:"google_local",q:query,gl:"us",hl:"en",device:"desktop",api_key:apiKey};
  if(location)localParams.location=location;
  const [organic,local]=await Promise.allSettled([search(organicParams,timeoutMs),search(localParams,timeoutMs)]);
  const organicPayload=organic.status==="fulfilled"?organic.value:{};
  const localPayload=local.status==="fulfilled"?local.value:{};
  const embedded=extractLocal(organicPayload);
  const dedicated=extractLocal(localPayload);
  return {
    provider:"SerpApi",query,location,
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
function dedupeLocal(rows){const seen=new Set();return rows.filter(row=>{const key=String(row.place_id||row.data_id||"").trim()||[row.title||row.name,row.address,row.phone].map(x=>String(x||"").toLowerCase().trim()).join("|");if(!key||seen.has(key))return false;seen.add(key);return true})}
function message(error){return error instanceof Error?error.message:String(error||"provider error")}
