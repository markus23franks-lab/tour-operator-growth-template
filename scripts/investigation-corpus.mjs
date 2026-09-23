#!/usr/bin/env node
// Run the backend proof against unfamiliar public operators and retain complete replayable responses.
// Usage: node scripts/investigation-corpus.mjs <function-url|local> <websites.json> <output.json>
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';

const [endpoint,inputPath,outputPath]=process.argv.slice(2);
if(!endpoint||!inputPath||!outputPath){console.error('Usage: node scripts/investigation-corpus.mjs <function-url|local> <websites.json> <output.json>');process.exit(2)}
const local=endpoint==='local',url=local?null:new URL(endpoint);
if(url&&url.protocol!=='https:'&&url.hostname!=='localhost'&&url.hostname!=='127.0.0.1')throw new Error('The function endpoint must use HTTPS outside localhost');
const websites=JSON.parse(await readFile(inputPath,'utf8'));
if(!Array.isArray(websites)||!websites.length||websites.length>10||websites.some(x=>typeof x!=='string'||!/^https?:\/\//.test(x)))throw new Error('Input must be an array of 1–10 public website URLs');
const localHandler=local?(await import('../netlify/functions/investigation-lab.mjs')).default:null;
if(local)process.env.GO_LAB_TOKEN=randomBytes(32).toString('hex');
const startedAt=new Date().toISOString(),results=[];
// Frozen estimate for gpt-5 standard text tokens, USD per million; update when pricing changes.
const GPT5_PRICES={input:1.25,cachedInput:0.125,output:10};
function priceModelUsage(rows=[]){
  return rows.map(row=>{
    const usage=row.usage||{},input=usage.input_tokens,output=usage.output_tokens,cached=usage.input_tokens_details?.cached_tokens||0;
    const estimatedUsd=/^gpt-5(?:-\d{4}-\d{2}-\d{2})?$/.test(row.name||'')&&Number.isFinite(input)&&Number.isFinite(output)
      ?((input-cached)*GPT5_PRICES.input+cached*GPT5_PRICES.cachedInput+output*GPT5_PRICES.output)/1e6:null;
    return {stage:row.stage,model:row.name,inputTokens:input??null,cachedInputTokens:cached,outputTokens:output??null,estimatedUsd};
  });
}
for(const website of websites){
  const started=Date.now();let status=0,payload;
  try{
    const request=new Request(local?'http://localhost/.netlify/functions/investigation-lab':url,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.GO_LAB_TOKEN?{'Authorization':'Bearer '+process.env.GO_LAB_TOKEN}:{})},body:JSON.stringify({action:'run-proof',website})});
    const res=local?await localHandler(request):await fetch(request,{signal:AbortSignal.timeout(180000)});
    status=res.status;payload=await res.json();
  }catch(error){payload={ok:false,state:'REQUEST_FAILED',error:error instanceof Error?error.message:String(error)}}
  const modelUsage=priceModelUsage(payload.telemetry?.model);
  const summary={website,httpStatus:status,state:payload.state||'UNKNOWN',durationMs:Date.now()-started,evidenceRecords:payload.evidence?.length||0,coverage:payload.coverage?.state||null,blockers:payload.coverage?.blockers||[],findingCount:['strengths','opportunities','investigations'].reduce((n,key)=>n+(payload.judgment?.[key]?.length||0),0),providerFailures:(payload.surfaceStatus||[]).flatMap(x=>x.errors||[]).length,modelUsage,estimatedOpenAIUsd:modelUsage.length&&modelUsage.every(x=>x.estimatedUsd!==null)?modelUsage.reduce((sum,x)=>sum+x.estimatedUsd,0):null};
  results.push({summary,response:payload});
  console.log(JSON.stringify(summary));
  // Save every completed run so a later provider failure does not erase earlier evidence.
  await writeFile(outputPath,JSON.stringify({startedAt,endpoint:local?'local':url.origin+url.pathname,pricing:{model:'gpt-5',usdPerMillionTokens:GPT5_PRICES,kind:'estimate; verify against OpenAI billing'},results},null,2)+'\n',{mode:0o600});
}
const failed=results.filter(({summary,response})=>summary.httpStatus<200||summary.httpStatus>=300||response.ok!==true);
if(failed.length){
  console.error(`${failed.length}/${results.length} investigations failed; inspect the saved artifact for details.`);
  process.exitCode=1;
}
