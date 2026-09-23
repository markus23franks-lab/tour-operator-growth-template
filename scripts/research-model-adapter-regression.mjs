import {validateModelCitations,validatePlanCitations,validateBusinessDossier} from '../netlify/functions/lib/research-model-adapter.mjs';
let fail=0;const check=(n,a,e)=>{if(JSON.stringify(a)!==JSON.stringify(e)){fail++;console.error('FAIL',n,{a,e})}else console.log('PASS',n)};
const valid=new Set(['ev1','ev2']);
const dossier={products:[{evidenceIds:['ev1']}],positioning:[{evidenceIds:['ev2']}],travelerIntents:[{evidenceIds:['ev1','ev2']}]};
check('accepts only real evidence citations',validateModelCitations(dossier,valid).ok,true);
const invented={...dossier,products:[{evidenceIds:['ev_fake']}]};
check('rejects hallucinated evidence citation',validateModelCitations(invented,valid).ok,false);
check('reports hallucinated id',validateModelCitations(invented,valid).invalidIds,['ev_fake']);
check('planner accepts evidence-bound question',validatePlanCitations({questions:[{evidenceIds:['ev1']}]},valid).ok,true);
check('planner rejects invented evidence',validatePlanCitations({questions:[{evidenceIds:['ev999']}]},valid).ok,false);

const fp=[{id:'ev1',surface:'FIRST_PARTY_RENDERED',status:'OBSERVED',subject:{label:'Raft Co'},observation:{title:'Raft Co',headings:['Self-Guided River Rafting Rentals'],text:'Raft Co offers self-guided river rafting rentals in Tahoe City. Choose the 5 mile rafting rental.'}},{id:'ev2',surface:'FIRST_PARTY_RENDERED',status:'OBSERVED',subject:{label:'Raft Co'},observation:{title:'Prices',headings:['Rafting Rental'],text:'Book a rafting rental.'}}];
const grounded={businessName:'Raft Co',operatingMarket:'Tahoe City',summary:'Self-guided rafting rental operator.',businessModel:'rental',products:[{name:'River Rafting Rental',family:'rafting rental',transactionType:'rental',priceText:'',evidenceIds:['ev1']}],positioning:[],travelerIntents:[{query:'Tahoe City rafting rentals',productFamily:'rafting rental',reason:'core product',evidenceIds:['ev1']}],unknowns:[]};
check('grounded business dossier passes semantic evidence gate',validateBusinessDossier(grounded,fp).ok,true);
check('invented product name fails semantic evidence gate',validateBusinessDossier({...grounded,products:[{...grounded.products[0],name:'Private Snorkeling Charter'}]},fp).ok,false);
check('known model without evidenced products fails',validateBusinessDossier({...grounded,products:[]},fp).ok,false);

if(fail)process.exit(1);console.log('\nResearch model evidence-binding regression passed');
