import {collectSearchSurfaces} from "./serpapi-investigation-adapter.mjs";
import {normalizeSerpEvidence,buildInvestigationSignals} from "./investigation-core.mjs";

const SUPPORTED=new Set(["ORGANIC_SERP","LOCAL_MAPS","BUSINESS_ENTITY"]);

export async function executeFollowUpPlan({plan,operator,location="",existingRecords=[],apiKey,maxQueries=4}){
 const candidates=[];
 for(const question of plan?.questions||[]){
   if(!(question.capabilities||[]).some(x=>SUPPORTED.has(x)))continue;
   for(const query of question.seedQueries||[]){
     if(!query||candidates.some(x=>x.query.toLowerCase()===query.toLowerCase()))continue;
     candidates.push({query,questionId:question.id,reason:question.commercialReason});
     if(candidates.length>=maxQueries)break;
   }
   if(candidates.length>=maxQueries)break;
 }
 const existingQueries=new Set(existingRecords.map(x=>String(x.source?.query||"").toLowerCase()).filter(Boolean));
 const novel=candidates.filter(x=>!existingQueries.has(x.query.toLowerCase()));
 const batches=await Promise.all(novel.map(async item=>{
   try{
     const collected=await collectSearchSurfaces({query:item.query,location,apiKey});
     return {...item,collected,records:normalizeSerpEvidence({query:item.query,payload:collected.payload,operator,provider:collected.provider})};
   }catch(error){return {...item,error:error instanceof Error?error.message:String(error),records:[]}}
 }));
 const records=batches.flatMap(x=>x.records);
 const combined=[...existingRecords,...records];
 return {attempted:novel,batches,records,signals:buildInvestigationSignals({records:combined,operator})};
}
