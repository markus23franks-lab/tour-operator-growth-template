import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context={window:{},URL,Date};
vm.createContext(context);
vm.runInContext(readFileSync('js/research-artifact-import.js','utf8'),context);
const extract=context.window.GOResearchArtifactImport.extract;
const row={id:'page1',surface:'FIRST_PARTY_RENDERED',subject:{label:'Canine Cruise'},observation:{url:'https://operator.example/canine',title:'Canine Cruise',mainText:'Canine Cruise tickets start at $46. Buy Tickets.'}};
const claim={claimId:'claim_0',type:'QUICK_WIN',system:'Conversion',headline:'Promote canine cruise',evidenceIds:['page1'],supportQuotes:[{evidenceId:'page1',quote:'Canine Cruise tickets start at $46'}],scope:{pages:['https://operator.example/canine']},provenance:{hasDetailPage:true,verifiedQuoteCount:1}};
const move={...claim,state:'VALIDATED_OPPORTUNITY',why:'Bookable offer is buried.',action:'Confirm seats before promotion.',proof:'Booking pace',scope:{pages:['https://operator.example/canine']}};
const artifact={startedAt:'2026-09-20T12:00:00.000Z',results:[{summary:{httpStatus:200,website:'https://operator.example/'},response:{ok:true,state:'PROOF_JUDGED',dossier:{businessName:'Canine Cruise Co',summary:'River business'},judgment:{executiveRead:'Review the canine offer.'},actionPlan:{state:'READY',moves:[move]},claimLedger:[claim],evidence:[row],telemetry:{private:'do not retain'}}}]};
const reject=(result,label)=>{try{extract(result);throw new Error(`Unexpected success: ${label}`)}catch(error){if(error.message.startsWith('Unexpected success'))throw error}};
const read=extract(artifact);
if(read.sourceType!=='ARCHIVED_EVALUATION'||read.capturedAt!==artifact.startedAt||read.actionPlan.moves[0].system!=='Conversion'||read.actionPlan.moves[0].supportQuotes[0].quote!==claim.supportQuotes[0].quote||JSON.stringify(read).includes('private'))throw new Error('The dated read lost provenance or retained private raw material.');
reject({...artifact,results:[{...artifact.results[0],response:{...artifact.results[0].response,actionPlan:{state:'READY',moves:[{...move,system:'Trust'}]}}}]},'claim and move system disagree');
reject({...artifact,results:[...artifact.results,...artifact.results]},'multiple operator results');
reject({...artifact,results:[{...artifact.results[0],summary:{...artifact.results[0].summary,httpStatus:502}}]},'failed run');
reject({...artifact,results:[{...artifact.results[0],response:{...artifact.results[0].response,evidence:[]}}]},'missing cited evidence');
reject({...artifact,results:[{...artifact.results[0],response:{...artifact.results[0].response,evidence:[{...row,observation:{...row.observation,mainText:'Different page content'}}]}}]},'unverified quote');
reject({...artifact,results:[{...artifact.results[0],response:{...artifact.results[0].response,actionPlan:{state:'READY',moves:[{...move,evidenceIds:['other']}]}}}]},'claim and move disagree');
reject({...artifact,results:[{...artifact.results[0],response:{...artifact.results[0].response,actionPlan:{state:'READY',moves:[{...move,scope:{pages:['https://other.example/']}}]}}}]},'claim and move source pages disagree');
reject({...artifact,results:[{...artifact.results[0],response:{...artifact.results[0].response,evidence:[{...row,surface:'ORGANIC_SERP'}]}}]},'search-only evidence promoted to action-ready');

// Drive the imported shape through the real product adapters with one browser
// storage scope, rather than only asserting the importer returns an object.
const storage=new Map([['growthOperatorResearchJudgment',JSON.stringify(read)]]);
const nodes=new Map(),element=()=>({textContent:'',classList:{add(){}},append(){},replaceChildren(){}});
const document={body:element(),getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},querySelector(){return element()},createElement:element};
const product={window:{},URL,Date,document,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
vm.createContext(product);
for(const path of ['js/research-backed-dashboard.js','js/research-scope.js','js/mission-outcomes.js','js/research-experience.js'])vm.runInContext(readFileSync(path,'utf8'),product);
const profile=product.window.GOResearchBridge.apply({businessName:'Preview',ownerName:'Preview person',website:'https://preview.example/',findings:[{title:'Invented finding'}]});
product.window.GOResearchExperience.render(profile);
if(profile.businessName!=='Canine Cruise Co'||profile.findings.some(f=>f.title==='Invented finding')||!nodes.get('today-label').textContent.includes('ARCHIVED EVALUATION · 2026-09-20')||nodes.get('opportunity-title').textContent!==move.headline)throw new Error('Imported research did not reach the real dated dashboard.');
const scoped={website:profile.website,capturedAt:read.capturedAt,...read.actionPlan.moves[0]};
product.window.GOMissionOutcomes.baseline(scoped,{metric:'Bookings',unit:'bookings',value:12,period:'3-day window',startedAt:'2026-09-18',observedAt:'2026-09-20',source:'Booking system'});
product.window.GOMissionOutcomes.reportAction(scoped,{description:'Operator changed page',performedAt:'2026-09-21',reportedBy:'Owner',approved:true});
product.window.GOMissionOutcomes.followUp(scoped,{value:19,period:'3-day window',startedAt:'2026-09-22',observedAt:'2026-09-24',source:'Booking system'});
product.window.GOResearchExperience.render(profile);
if(!nodes.get('brief-summary-line').textContent.includes('Cause is not established.'))throw new Error('The measured result was lost or attributed to GO.');
console.log('Research artifact handoff regression passed');
