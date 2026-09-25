import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const store=new Map([['growthOperatorResearchJudgment',JSON.stringify({state:'PROOF_JUDGED',sourceType:'ARCHIVED_EVALUATION',capturedAt:'2026-09-20T12:00:00Z',website:'https://operator.example',dossier:{businessName:'Canine Cruise'},actionPlan:{state:'READY',next:'Review connected booking data.',moves:[{claimId:'claim_0',type:'QUICK_WIN',state:'VALIDATED_OPPORTUNITY',headline:'Promote canine cruise',why:'The product page exposes a bookable offer.',action:'Move the offer closer to high-intent discovery.',proof:'Connect bookings before calling impact proven.',confidence:'HIGH',evidenceIds:['page'],supportQuotes:[{evidenceId:'page',quote:'Book now'}],scope:{pages:['https://operator.example/tour'],products:['Canine Cruise']},provenance:{hasDetailPage:true,verifiedQuoteCount:1}}]}})]]);
const context={window:{},localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},console,URL,Date};vm.createContext(context);vm.runInContext(readFileSync('js/research-backed-dashboard.js','utf8'),context);
const profile=context.window.GOResearchBridge.apply({businessName:'Old',ownerName:'Preview Founder',website:'',bookingPlatform:'FareHarbor',growthScore:83,scores:{Growth:83},intelligence:{mode:'preview'},findings:[{title:'Preview claim'}],mission:{title:'Old'}});
if(!profile.researchBacked||profile.businessName!=='Canine Cruise'||profile.mission.title!=='Promote canine cruise'||profile.revenueOpportunity!==null)throw new Error('research dashboard bridge did not preserve grounded mission boundary');
if(profile.mission.pillar!=='Growth'||profile.findings[0].pillar!=='Growth')throw new Error('An unclassified action state was mistaken for a six-system topic');
store.set('growthOperatorResearchJudgment',JSON.stringify({...JSON.parse(store.get('growthOperatorResearchJudgment')),actionPlan:{state:'READY',moves:[{...JSON.parse(store.get('growthOperatorResearchJudgment')).actionPlan.moves[0],system:'Visibility'}]}}));
const classified=context.window.GOResearchBridge.apply({businessName:'Old',mission:{title:'Old'}});
if(classified.mission.pillar!=='Visibility'||classified.findings[0].pillar!=='Visibility')throw new Error('An explicit claim system was lost in the dashboard bridge');
if(profile.growthScore!==null||profile.scores!==null||profile.intelligence!==null||profile.ownerName!=='Operator not connected'||profile.bookingPlatform!=='Not connected'||profile.findings[0].title!=='Promote canine cruise')throw new Error('research handoff leaked preview facts or findings');
const complete=JSON.parse(store.get('growthOperatorResearchJudgment'));
for(const incomplete of [{...complete,website:undefined},{...complete,capturedAt:undefined},{...complete,capturedAt:null},{...complete,actionPlan:{...complete.actionPlan,moves:[{...complete.actionPlan.moves[0],scope:{pages:[]}}]}}]){
  store.set('growthOperatorResearchJudgment',JSON.stringify(incomplete));
  if(context.window.GOResearchBridge.read()!==null||context.window.GOResearchBridge.apply({businessName:'Preview'}).researchBacked)throw new Error('An incomplete saved read entered research mode');
}
store.set('growthOperatorResearchJudgment',JSON.stringify(complete));
const selected=context.window.GOResearchBridge.selectMission(complete);
if(selected.website!==complete.website||selected.claim.headline!==complete.actionPlan.moves[0].headline||selected.growthScore!==null||selected.researchCapturedAt!==complete.capturedAt)throw new Error('Mission selection lost its exact investigation or fabricated a score');
const previous=store.get('growthOperatorActiveMission');
store.set('growthOperatorResearchJudgment',JSON.stringify({...complete,actionPlan:{...complete.actionPlan,moves:[{...complete.actionPlan.moves[0],action:'A changed recommendation'}]}}));
let rejected=false;try{context.window.GOResearchBridge.selectMission(complete)}catch{rejected=true}
if(!rejected||store.get('growthOperatorActiveMission')!==previous)throw new Error('A stale page selected changed research or overwrote the saved Mission');
console.log('Research-backed dashboard regression passed');
