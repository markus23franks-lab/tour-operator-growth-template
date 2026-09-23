import assert from 'node:assert/strict';
import {buildBusinessDossierWithModel} from '../netlify/functions/lib/research-model-adapter.mjs';

const originalFetch=globalThis.fetch;
let requests=0,usage=null;
try{
  globalThis.fetch=async (_url,options)=>{
    requests++;
    const body=JSON.parse(options.body);
    assert.equal(body.model,'gpt-5');
    assert.equal(body.max_output_tokens,6000);
    assert.equal(body.reasoning.effort,'low');
    assert.equal(body.store,false);
    assert.ok(body.input[0].content[0].text.length<=100000);
    return new Response(JSON.stringify({id:'resp_fixture',model:'gpt-5',usage:{input_tokens:1200,output_tokens:200},output:[{content:[{type:'output_text',text:'not JSON'}]}]}),{status:200});
  };
  await assert.rejects(buildBusinessDossierWithModel({apiKey:'fixture',evidence:[],onUsage:value=>{usage=value}}),/invalid JSON/);
  assert.equal(requests,1);
  assert.equal(usage.usage.output_tokens,200,'usage survives output parsing failure');
  await assert.rejects(buildBusinessDossierWithModel({apiKey:'fixture',evidence:[{id:'x',observation:{text:'a'.repeat(200000)}}]}),/invalid JSON/);
  assert.equal(requests,2,'long page text is compacted before model dispatch');
}finally{globalThis.fetch=originalFetch}
console.log('Research cost guard regression passed');
