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
for(const website of websites){
  const started=Date.now();let status=0,payload;
  try{
    const request=new Request(local?'http://localhost/.netlify/functions/investigation-lab':url,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.GO_LAB_TOKEN?{'Authorization':'Bearer '+process.env.GO_LAB_TOKEN}:{})},body:JSON.stringify({action:'run-proof',website})});
    const res=local?await localHandler(request):await fetch(request,{signal:AbortSignal.timeout(180000)});
    status=res.status;payload=await res.json();
  }catch(error){payload={ok:false,state:'REQUEST_FAILED',error:error instanceof Error?error.message:String(error)}}
  const summary={website,httpStatus:status,state:payload.state||'UNKNOWN',durationMs:Date.now()-started,evidenceRecords:payload.evidence?.length||0,coverage:payload.coverage?.state||null,blockers:payload.coverage?.blockers||[],findingCount:['strengths','opportunities','investigations'].reduce((n,key)=>n+(payload.judgment?.[key]?.length||0),0),providerFailures:(payload.surfaceStatus||[]).flatMap(x=>x.errors||[]).length};
  results.push({summary,response:payload});
  console.log(JSON.stringify(summary));
  // Save every completed run so a later provider failure does not erase earlier evidence.
  await writeFile(outputPath,JSON.stringify({startedAt,endpoint:local?'local':url.origin+url.pathname,results},null,2)+'\n',{mode:0o600});
}
