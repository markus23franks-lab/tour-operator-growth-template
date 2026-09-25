import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const claim={claimId:'claim_0',state:'INVESTIGATE',headline:'Verify booking path',action:'Review the source and baseline',evidenceIds:['page'],supportQuotes:[{evidenceId:'page',quote:'Reserve online'}],scope:{pages:['https://operator.example/tour']}};
const research={state:'PROOF_JUDGED',sourceType:'ARCHIVED_EVALUATION',capturedAt:'2026-09-20T12:00:00Z',website:'https://operator.example/',dossier:{businessName:'Current operator'},actionPlan:{state:'READY',moves:[claim]}};
const saved={researchBacked:true,businessName:'Old display name',website:research.website,claim,researchCapturedAt:research.capturedAt};
function enter(active,read=research,search=''){
 const store=new Map([['growthOperatorActiveMission',JSON.stringify(active)],['growthOperatorResearchJudgment',JSON.stringify(read)]]);
 let ready;
 const element=()=>({children:[],classList:{values:new Set(['mission-pending']),add(x){this.values.add(x)},remove(x){this.values.delete(x)}},append(...children){this.children.push(...children)}});
 const document={body:element(),createElement:element,addEventListener:(_,fn)=>{ready=fn}};
 const location={search},context={window:{location},location,URL,URLSearchParams,document,localStorage:{getItem:key=>store.get(key)||null,setItem(){throw new Error('Entry must not overwrite saved work')}}};
 vm.createContext(context);
 for(const file of ['js/research-backed-dashboard.js','js/research-scope.js','js/mission.js'])vm.runInContext(readFileSync(file,'utf8'),context);
 const state=vm.runInContext('state',context);
 if(!state){ready();if(!document.body.classList.values.has('mission-empty')||document.body.classList.values.has('mission-pending')||!document.body.children.length)throw new Error('Missing Mission did not render a recoverable empty state');}
 return state;
}
if(enter(null)!==null||enter({mission:{title:'Old demo'}})!==null)throw new Error('Default Mission entry exposed a synthetic workspace');
if(!enter(null,null,'?demo=1')?.mission)throw new Error('Explicit sample preview is unavailable');
if(enter(saved)?.businessName!=='Current operator'||!enter(saved)?.researchBacked)throw new Error('Matching Mission did not use the current research identity');
for(const stale of [{...saved,website:'https://other.example/'},{...saved,researchCapturedAt:'2026-09-19T12:00:00Z'},{...saved,claim:{...claim,supportQuotes:[{evidenceId:'page',quote:'A different passage'}]}}]){
 if(enter(stale)!==null)throw new Error('A different operator, run or evidence passage opened the saved Mission');
}
if(enter(saved,null)!==null)throw new Error('Saved Mission opened without a valid current investigation');
console.log('Mission entry regression passed');
