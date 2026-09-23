#!/usr/bin/env node
// Private Actions diagnostic: no OpenAI call and no search response text in logs.
import {writeFile} from 'node:fs/promises';
import {collectSearchSurfaces} from '../netlify/functions/lib/serpapi-investigation-adapter.mjs';

const [outputPath]=process.argv.slice(2);
if(!outputPath||!process.env.SERPAPI_KEY)throw new Error('Output path and SERPAPI_KEY are required');
const result=await collectSearchSurfaces({query:'Chicago architecture boat tour tickets',location:'Chicago, IL, USA',apiKey:process.env.SERPAPI_KEY});
const diagnostic={location:result.location,surfaceStatus:result.surfaceStatus,errors:result.errors,organicCount:result.payload.organic_results.length,localCount:result.payload.local_results.places.length};
await writeFile(outputPath,JSON.stringify(diagnostic,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify(diagnostic));
if(diagnostic.errors.length||diagnostic.organicCount===0||diagnostic.localCount===0)process.exitCode=1;
