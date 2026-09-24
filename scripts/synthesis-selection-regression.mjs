import assert from 'node:assert/strict';
import {buildSynthesisInput} from '../netlify/functions/lib/research-model-adapter.mjs';

const evidence=[];
for(let i=0;i<6;i++)evidence.push({id:'first-'+i,surface:'FIRST_PARTY_RENDERED',status:'OBSERVED',subject:{label:'Operator'},observation:{text:'Product details '.repeat(800),url:'https://operator.example/'+i},source:{url:'https://operator.example/'+i}});
for(let q=0;q<5;q++)for(const surface of ['ORGANIC_SERP','LOCAL_MAPS'])for(let rank=1;rank<=20;rank++)evidence.push({id:`${surface}-${q}-${rank}`,surface,status:'OBSERVED',subject:{label:rank===5?'Operator':'Rival '+rank},observation:{position:rank,snippet:'Result text '.repeat(150),url:`https://rival.example/${q}/${rank}`},source:{query:'market query '+q,url:`https://rival.example/${q}/${rank}`},operatorMatch:{likely:rank===5}});
evidence.push({id:'competitor',surface:'COMPETITOR_SITE',status:'OBSERVED',subject:{label:'Rival'},observation:{text:'Competitor products '.repeat(2000)},source:{url:'https://rival.example'}});
const signals={entities:{targetEntities:evidence,groups:[evidence]},presence:[{query:'market query 0',state:'OBSERVED_PRESENT',surfaces:['ORGANIC_SERP'],evidenceIds:['ORGANIC_SERP-0-5']}],competitorCandidates:[{name:'Rival',domain:'rival.example',queries:['market query 0'],bestPosition:1,evidenceIds:evidence.map(x=>x.id)}]};
const input=buildSynthesisInput({dossier:{businessName:'Operator'},evidence,signals,plan:{questions:[{question:'Where is demand?',seedQueries:['market query 0']}]}});
assert.ok(JSON.stringify(input).length<90000);
assert.ok(input.evidence.length<=48);
assert.ok(input.evidence.some(x=>x.id==='ORGANIC_SERP-0-5'),'target presence retained even when rank is lower');
assert.ok(input.evidence.some(x=>x.id==='competitor'),'competitor site retained');
assert.ok(input.evidence.some(x=>x.surface==='LOCAL_MAPS'));
assert.ok(!JSON.stringify(input.signals).includes('targetEntities'),'raw signals do not reintroduce hundreds of records');
assert.equal(input.sampling.totalRecords,evidence.length);
console.log('Synthesis selection regression passed');
