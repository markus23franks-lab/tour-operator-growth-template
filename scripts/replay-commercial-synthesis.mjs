import {readFileSync,writeFileSync} from 'node:fs';
import {buildSynthesisInput,synthesizeCommercialJudgmentWithModel} from '../netlify/functions/lib/research-model-adapter.mjs';
import {buildOperatorActionPlan} from '../netlify/functions/lib/claim-ledger.mjs';

const [inputPath,outputPath]=process.argv.slice(2);
if(!inputPath||!outputPath)throw new Error('Usage: node replay-commercial-synthesis.mjs <private-corpus-json> <private-output-json>');
const corpus=JSON.parse(readFileSync(inputPath,'utf8'));
const source=(corpus.results||[]).find(x=>x.response?.coverage?.state==='READY_FOR_JUDGMENT'&&x.response?.dossier&&x.response?.evidence?.length);
if(!source)throw new Error('No complete evidence-ready operator in source artifact');
const {dossier,evidence,signals,followUpPlan}=source.response;
const selected=buildSynthesisInput({dossier,evidence,signals,plan:followUpPlan});
if(process.env.GO_REPLAY_DRY_RUN==='1'){
 console.log(JSON.stringify({state:'DRY_RUN',website:source.summary.website,sourceRecords:evidence.length,visibleRecords:selected.evidence.length,inputCharacters:JSON.stringify(selected).length}));
 process.exit(0);
}
if(process.env.GO_ALLOW_PAID_SYNTHESIS!=='1'||!process.env.OPENAI_API_KEY)throw new Error('Paid replay requires GO_ALLOW_PAID_SYNTHESIS=1 and OPENAI_API_KEY');
const usage=[];
let output;
try{
 const result=await synthesizeCommercialJudgmentWithModel({dossier,evidence,signals,plan:followUpPlan,apiKey:process.env.OPENAI_API_KEY,onUsage:x=>usage.push({model:x.model,usage:x.usage})});
 output={state:'PROOF_JUDGED',website:source.summary.website,sourceEvidenceRecords:evidence.length,visibleEvidenceRecords:selected.evidence.length,judgment:result.synthesis,claimLedger:result.claimLedger,actionPlan:buildOperatorActionPlan({ledger:result.claimLedger}),discardedQuotes:result.discardedQuotes,normalizedQuotes:result.normalizedQuotes,usage};
}catch(error){
 output={state:'JUDGMENT_REJECTED',website:source.summary.website,sourceEvidenceRecords:evidence.length,visibleEvidenceRecords:selected.evidence.length,error:error instanceof Error?error.message:String(error),...(error?.draftJudgment?{draftJudgment:error.draftJudgment}:{}),discardedQuotes:error?.discardedQuotes||[],normalizedQuotes:error?.normalizedQuotes||[],usage};
}
writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({state:output.state,website:output.website,visibleEvidenceRecords:output.visibleEvidenceRecords,usage:output.usage.map(x=>x.usage)}));
if(output.state!=='PROOF_JUDGED')process.exitCode=1;
