(()=>{
'use strict';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
function signalSet(intel){return new Map((intel?.signals||[]).map(s=>[s.id,s]))}
function build({operator,competitors=[]}={}){
 const own=signalSet(operator),rows=[];
 for(const rival of competitors.slice(0,5)){
  const intel=rival?.positioning||rival?.positioningIntelligence||null;if(!intel)continue;
  const set=signalSet(intel);rows.push({name:rival.name||'Competitor',shared:[...own.keys()].filter(k=>set.has(k)),rivalOnly:[...set.keys()].filter(k=>!own.has(k)),operatorOnly:[...own.keys()].filter(k=>!set.has(k))});
 }
 const compared=rows.length,uniqueCounts=new Map();
 for(const id of own.keys())uniqueCounts.set(id,rows.filter(r=>r.operatorOnly.includes(id)).length);
 const differentiated=[...own.values()].filter(s=>compared&&uniqueCounts.get(s.id)===compared);
 let state='INSUFFICIENT_EVIDENCE',headline='GO has not compared positioning against enough qualified competitors yet.',summary='First-party messaging is observed, but GO will not call it differentiated until relevant competitors are read.';
 if(compared>=2&&differentiated.length){state='POTENTIAL_DIFFERENTIATION';headline=`GO found ${differentiated.length} positioning theme${differentiated.length===1?'':'s'} not observed on the qualified competitor pages it compared.`;summary=`The clearest public positioning lead${differentiated.length===1?' is':'s are'}: ${differentiated.map(x=>x.label).join(', ')}. This is evidence of relative messaging difference, not proof of customer preference.`;}
 else if(compared>=2&&own.size){state='CATEGORY_PARITY';headline='The operator’s main positioning themes are also common among the qualified competitors GO compared.';summary='GO should not recommend louder generic claims. A stronger growth move would need product, proof, access, packaging or customer-specific differentiation.';}
 return {version:'GO-POSITIONING-COMPARISON-V1',state,headline,summary,comparedCompetitors:compared,differentiated:differentiated.map(x=>({id:x.id,label:x.label,evidence:x.evidence})),comparisons:rows,action:state==='POTENTIAL_DIFFERENTIATION'?'Test the strongest relatively distinctive proof closer to high-intent product and booking moments.':state==='CATEGORY_PARITY'?'Look for differentiation in actual product structure, proof, access or packaging rather than rewriting generic claims.':'Read positioning from at least two qualified direct competitors before recommending a messaging change.',evidenceNote:'Relative positioning only compares positively observed first-party claims. Missing competitor text is not proof they lack the underlying capability.'};
}
window.GOPositioningComparison={build};
})();