import {validateModelCitations} from '../netlify/functions/lib/research-model-adapter.mjs';
let fail=0;const check=(n,a,e)=>{if(JSON.stringify(a)!==JSON.stringify(e)){fail++;console.error('FAIL',n,{a,e})}else console.log('PASS',n)};
const valid=new Set(['ev1','ev2']);
const dossier={products:[{evidenceIds:['ev1']}],positioning:[{evidenceIds:['ev2']}],travelerIntents:[{evidenceIds:['ev1','ev2']}]};
check('accepts only real evidence citations',validateModelCitations(dossier,valid).ok,true);
const invented={...dossier,products:[{evidenceIds:['ev_fake']}]};
check('rejects hallucinated evidence citation',validateModelCitations(invented,valid).ok,false);
check('reports hallucinated id',validateModelCitations(invented,valid).invalidIds,['ev_fake']);
if(fail)process.exit(1);console.log('\nResearch model evidence-binding regression passed');
