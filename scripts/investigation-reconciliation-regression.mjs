import {normalizeSerpEvidence,reconcileBusinessEntities,reconcileSearchPresence,buildInvestigationSignals} from '../netlify/functions/lib/investigation-core.mjs';
let fail=0;const check=(n,a,e)=>{if(JSON.stringify(a)!==JSON.stringify(e)){fail++;console.error('FAIL',n,{actual:a,expected:e})}else console.log('PASS',n)};
const operator={name:'Truckee River Raft Company',website:'https://truckeeriverraft.com/'};
const payload={organic_results:[{position:2,title:'Truckee River Raft Company - Tahoe City',link:'https://truckeeriverraft.com/'}],local_results:{places:[
 {position:3,title:'Truckee River Rafting',place_id:'place_a',website:'https://truckeeriverraft.com/',phone:'530-555-1212',address:'185 River Rd, Tahoe City',rating:4.8,reviews:120},
 {position:4,title:'Truckee River Raft Co.',place_id:'place_b',website:'https://truckeeriverraft.com/',phone:'530-555-1212',address:'185 River Rd, Tahoe City',rating:4.7,reviews:80},
 {position:5,title:'Different Rafting Co',place_id:'place_c',website:'https://different.example/',phone:'530-555-9999',address:'1 Other Rd',rating:4.9,reviews:200}
]}};
const records=normalizeSerpEvidence({query:'Tahoe City rafting tours',payload,operator,observedAt:'2026-09-22T00:00:00Z'});
check('normalizes organic + local surfaces',records.length,4);
const presence=reconcileSearchPresence(records,operator)[0];
check('local or organic observation resolves presence',presence.state,'OBSERVED_PRESENT');
check('presence reconciles both surfaces',presence.surfaces.sort(),['LOCAL_MAPS','ORGANIC_SERP']);
const entities=reconcileBusinessEntities(records,operator);
check('distinct provider ids trigger entity investigation',entities.anomalies[0]?.type,'POSSIBLE_ENTITY_FRAGMENTATION');
check('competitor excluded from target entities',entities.targetEntities.length,2);
const signals=buildInvestigationSignals({records,operator});
check('anomaly creates follow-up questions',signals.followUpQuestions.length>0,true);
check('observed presence becomes strength, not gap',signals.strengths[0]?.state,'LEVERAGE');
const unknownOnly=[{...records[0],id:'unknown',status:'UNKNOWN',operatorMatch:{likely:false}}];
check('unresolved evidence never becomes absence',reconcileSearchPresence(unknownOnly,operator)[0].state,'UNRESOLVED');
if(fail){console.error('\n'+fail+' reconciliation checks failed');process.exit(1)}console.log('\nCross-surface reconciliation regression passed');
