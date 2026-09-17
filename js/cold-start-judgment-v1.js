(()=>{
'use strict';

/* Build 055 — portfolio-level discovery judgment for the public Analyzer.
   A single missing position may be evidence, but it is not automatically a growth problem. */
const prior=window.buildProfessionalMarketFinding;

function assess(rows){
 const all=Array.isArray(rows)?rows:[];
 const verified=all.filter(r=>r?.evidenceState&&r.evidenceState!=='UNKNOWN');
 const wins=verified.filter(r=>r.evidenceState==='OBSERVED_WIN');
 const gaps=verified.filter(r=>r.evidenceState==='OBSERVED_GAP');
 const coverage=all.length?verified.length/all.length:0;
 const gapRate=verified.length?gaps.length/verified.length:0;
 const visibleRate=verified.length?wins.length/verified.length:0;
 const enough=verified.length>=3&&coverage>=.6;
 const repeatedGap=enough&&gaps.length>=2&&gapRate>=.4;
 const healthy=enough&&visibleRate>=.7;
 return {planned:all.length,verified:verified.length,wins:wins.length,gaps:gaps.length,coverage,gapRate,visibleRate,enough,repeatedGap,healthy};
}

function scope(finding,market){
 if(!finding)return finding;
 const a=assess(market?.queryResults||[]);
 finding.portfolioJudgment=a;
 if(a.repeatedGap){
  finding.title=`GO found a repeated visibility gap across ${a.gaps} of ${a.verified} verified searches`;
  finding.problem=`GO verified a repeated pattern rather than relying on one weak result. ${a.wins} of ${a.verified} checked searches showed the business; ${a.gaps} showed an observed gap. ${finding.problem||''}`.trim();
  finding.counterEvidence=`This is still a representative search portfolio, not universal rank or proof of lost revenue. ${finding.counterEvidence||''}`.trim();
  return finding;
 }
 if(a.healthy){
  finding.kind='investigation';
  finding.title=`GO found the business visible in ${a.wins} of ${a.verified} verified searches`;
  finding.problem=`The public search sample looks broadly healthy. GO found ${a.wins} observed visibility win${a.wins===1?'':'s'} and ${a.gaps} observed gap${a.gaps===1?'':'s'} across ${a.verified} verified searches. That does not justify making broad visibility work the first growth mission.`;
  finding.action='Preserve the visibility already working and move the investigation toward pricing, trust, conversion and connected economics before creating SEO work.';
  finding.moneyLabel='Visibility looks healthy · look for a higher-return constraint';
  finding.severity=1;finding.evidenceStrength=4;finding.revenueProximity=1;finding.actionability=2;finding.uncertainty=0;
  return finding;
 }
 finding.kind='investigation';
 finding.title='GO found mixed search visibility — not a proven growth problem yet';
 finding.problem=a.verified
  ? `GO found ${a.wins} verified visibility win${a.wins===1?'':'s'} and ${a.gaps} verified gap${a.gaps===1?'':'s'} across the representative search portfolio. That is useful evidence, but not enough of a repeated pattern to call visibility a business problem.`
  : 'GO could not verify enough of the representative search portfolio to judge visibility. Provider failure or an empty result remains unknown rather than becoming a gap.';
 finding.action='Keep the unresolved searches on the watchlist and continue investigating stronger public or connected evidence before creating visibility work.';
 finding.moneyLabel='Unresolved · no revenue claim';
 finding.confidence='Medium';finding.severity=1;finding.evidenceStrength=a.verified>=2?2:1;finding.revenueProximity=1;finding.actionability=1;finding.uncertainty=2;
 return finding;
}

if(typeof prior==='function'){
 window.buildProfessionalMarketFinding=function(ctx){return scope(prior(ctx),ctx?.market||null)};
}
window.GOColdStartJudgment={version:'B055-JUDGMENT-V1',assess,scope};
})();
