import {validateCommercialSynthesis,deterministicSignalFindings} from '../netlify/functions/lib/commercial-synthesis.mjs';
let fail=0;const check=(n,a,e)=>{if(JSON.stringify(a)!==JSON.stringify(e)){fail++;console.error('FAIL',n,{a,e})}else console.log('PASS',n)};
const observed={id:'ev1',surface:'LOCAL_MAPS',claimType:'BUSINESS_ENTITY_OBSERVED',subject:{label:'Raft Co'},observation:{},source:{provider:'fixture',query:'rafting'},observedAt:'2026-09-22',confidence:'HIGH',status:'OBSERVED'};
const unknown={...observed,id:'ev2',status:'UNKNOWN'};
const investigation={type:'INVESTIGATE',headline:'Resolve entities',whyItMatters:'Potential fragmentation',evidenceIds:['ev1'],contradictionIds:[],confidence:'MEDIUM',actionBoundary:'Verify ownership',economicBoundary:'Revenue effect unknown'};
const base={executiveRead:'Visible already; investigate entity integrity.',strengths:[],opportunities:[],investigations:[investigation],doNotPrioritize:[],nextMove:{findingHeadline:'Resolve entities',type:'INVESTIGATE',headline:'Resolve entities',whyNow:'Potential fragmentation',evidenceIds:['ev1'],proofNeeded:['entity identity'],connectedDataNeeded:[]}};
check('valid synthesis passes',validateCommercialSynthesis(base,[observed]).ok,true);
check('fake evidence rejected',validateCommercialSynthesis({...base,nextMove:{...base.nextMove,evidenceIds:['fake']}},[observed]).ok,false);
const fakeGap={...base,opportunities:[{type:'VALIDATED_OPPORTUNITY',headline:'Fix visibility',whyItMatters:'x',evidenceIds:['ev2'],contradictionIds:[],confidence:'HIGH',actionBoundary:'fix',economicBoundary:'unknown'}]};
check('unknown cannot become validated opportunity',validateCommercialSynthesis(fakeGap,[observed,unknown]).ok,false);
const signals={strengths:[{headline:'Presence observed',evidenceIds:['ev1']}],anomalies:[{headline:'Two entities may represent one operator',reason:'identity overlap',evidenceIds:['ev1'],questions:[]}]};
const deterministic=deterministicSignalFindings(signals);
check('observed presence preserved as strength',deterministic.strengths[0].type,'LEVERAGE');
check('entity anomaly remains investigation',deterministic.investigations[0].type,'INVESTIGATE');

const tooMany={...base,strengths:Array.from({length:5},(_,i)=>({type:'LEVERAGE',headline:'Strength '+i,whyItMatters:'x',evidenceIds:['ev1'],contradictionIds:[],confidence:'HIGH',actionBoundary:'preserve',economicBoundary:'unknown'}))};
check('synthesis cannot flood operator with findings',validateCommercialSynthesis(tooMany,[observed]).ok,false);
const duplicate={...base,strengths:[{type:'LEVERAGE',headline:'Same thing',whyItMatters:'x',evidenceIds:['ev1'],contradictionIds:[],confidence:'HIGH',actionBoundary:'preserve',economicBoundary:'unknown'}],investigations:[{type:'INVESTIGATE',headline:'Same thing',whyItMatters:'x',evidenceIds:['ev1'],contradictionIds:[],confidence:'MEDIUM',actionBoundary:'verify',economicBoundary:'unknown'}]};
check('duplicate commercial findings rejected',validateCommercialSynthesis(duplicate,[observed]).ok,false);
const donation={...observed,id:'donation',observation:{text:'Tickets cost $46; charity donation $1,000.',prices:['$46','$1','$1,000']}};
const badPrice={...base,nextMove:{...base.nextMove,headline:'Reconcile $12 vs $1 dog fee',evidenceIds:['donation']}};
check('truncated donation cannot ground fictitious dog fee',validateCommercialSynthesis(badPrice,[donation]).ok,false);
const citedPrice={...base,nextMove:{...base.nextMove,headline:'Verify $46 ticket listing',evidenceIds:['ev1','donation']}};
check('source text supports a cited amount',validateCommercialSynthesis(citedPrice,[observed,donation]).ok,true);
check('action type cannot promote an investigation',validateCommercialSynthesis({...base,nextMove:{...base.nextMove,type:'QUICK_WIN'}},[observed]).ok,false);
check('next move must link a real finding',validateCommercialSynthesis({...base,nextMove:{...base.nextMove,findingHeadline:'Unlisted fix'}},[observed]).ok,false);

if(fail)process.exit(1);console.log('\nCommercial synthesis truth regression passed');
