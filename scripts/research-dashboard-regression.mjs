import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const store=new Map([['growthOperatorResearchJudgment',JSON.stringify({state:'PROOF_JUDGED',website:'https://operator.example',dossier:{businessName:'Canine Cruise'},actionPlan:{state:'READY',next:'Review connected booking data.',moves:[{claimId:'claim_0',type:'QUICK_WIN',state:'VALIDATED_OPPORTUNITY',headline:'Promote canine cruise',why:'The product page exposes a bookable offer.',action:'Move the offer closer to high-intent discovery.',proof:'Connect bookings before calling impact proven.',confidence:'HIGH',evidenceIds:['page'],scope:{products:['Canine Cruise']},provenance:{hasDetailPage:true,verifiedQuoteCount:1}}]}})]]);
const context={window:{},localStorage:{getItem:key=>store.get(key)||null},console};vm.createContext(context);vm.runInContext(readFileSync('js/research-backed-dashboard.js','utf8'),context);
const profile=context.window.GOResearchBridge.apply({businessName:'Old',website:'',mission:{title:'Old'}});
if(!profile.researchBacked||profile.businessName!=='Canine Cruise'||profile.mission.title!=='Promote canine cruise'||profile.revenueOpportunity!==null)throw new Error('research dashboard bridge did not preserve grounded mission boundary');
console.log('Research-backed dashboard regression passed');
