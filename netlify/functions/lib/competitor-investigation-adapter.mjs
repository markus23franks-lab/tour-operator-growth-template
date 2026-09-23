import {collectFirstPartyEvidence} from "./first-party-investigation-adapter.mjs";

export async function collectCompetitorEvidence({candidates=[],maxCompetitors=3}={}){
 const selected=(candidates||[]).filter(x=>x.domain).slice(0,maxCompetitors);
 const batches=await Promise.all(selected.map(async candidate=>{
   const website="https://"+candidate.domain+"/";
   try{
     const firstParty=await collectFirstPartyEvidence({website});
     const records=firstParty.records.map(row=>({...row,surface:"COMPETITOR_SITE",claimType:"COMPETITOR_PUBLIC_PAGE",subject:{entityId:candidate.domain,label:candidate.name||candidate.domain},observation:{...row.observation,competitorDomain:candidate.domain,discoveryEvidenceIds:candidate.evidenceIds||[]},source:{...row.source,discoveredFrom:(candidate.evidenceIds||[]).join(",")}}));
     return {candidate,website,records,pagesRead:firstParty.pagesRead};
   }catch(error){return {candidate,website,records:[],error:error instanceof Error?error.message:String(error)}}
 }));
 return {batches,records:batches.flatMap(x=>x.records),competitorsRead:batches.filter(x=>x.records.length).length};
}
