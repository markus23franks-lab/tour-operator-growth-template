(()=>{
'use strict';
const patterns=[
 ['LOCAL_OWNERSHIP',/\b(locally owned|local family|family owned|family-run|family run|locally operated)\b/i,'local / family ownership'],
 ['SMALL_GROUP',/\b(small groups?|intimate groups?|limited group size|personalized|personal attention)\b/i,'small-group / personal experience'],
 ['PRIVATE',/\b(private tours?|private charters?|private experience|exclusive tour|exclusive charter)\b/i,'private / exclusive options'],
 ['EXPERTISE',/\b(expert guides?|professional guides?|certified guides?|experienced guides?|local guides?|knowledgeable guides?)\b/i,'guide expertise'],
 ['LONGEVITY',/\b(over |more than )?\d{1,3}\+? years?\b|\bsince (?:19|20)\d{2}\b/i,'operating history'],
 ['AWARDS',/\b(award[- ]winning|travelers.? choice|travellers.? choice|certificate of excellence|best of)\b/i,'awards / recognition'],
 ['DIRECT_VALUE',/\b(best price|lowest price|book direct|direct booking|no booking fees?|save .*book direct)\b/i,'direct-booking value'],
 ['ACCESS',/\b(exclusive access|private access|skip the line|behind the scenes|off the beaten path|hidden gems?)\b/i,'special access / itinerary'],
 ['SAFETY',/\b(safety first|certified|licensed|insured|coast guard|uscg)\b/i,'safety / credentials']
];
function build(acq){
 const pages=(acq?.pages||[]).filter(p=>p?.source==='direct-html'||!p?.source),signals=[];
 for(const [id,re,label] of patterns){const hits=[];for(const p of pages){const text=String(p.markdown||p.text||'');const m=text.match(re);if(m)hits.push({page:p.url||'',evidence:m[0]})}if(hits.length)signals.push({id,label,evidence:hits.slice(0,3)})}
 let state='LIMITED',headline='GO recovered the offer, but public positioning evidence is still thin.',summary='GO will not invent a differentiator from generic tourism copy.';
 if(signals.length>=3){state='POSITIONING_OBSERVED';headline='GO found several positioning assets the business already uses publicly.';summary=`GO verified ${signals.length} positioning themes. These are assets to compare against competitors and move closer to the booking decision when they are genuinely distinctive.`;}
 else if(signals.length){state='PARTIAL_POSITIONING';headline='GO found some public positioning language, but not enough to call it differentiated.';summary=`GO verified ${signals.length} positioning theme${signals.length===1?'':'s'}. The next question is whether competitors make the same claims.`;}
 return {version:'GO-POSITIONING-INTELLIGENCE-V1',state,headline,summary,signals,action:signals.length?'Compare these claims with qualified direct competitors before deciding which deserve stronger merchandising.':'Recover rendered product-page copy or operator context before making a positioning recommendation.',evidenceNote:'GO only records positioning claims positively observed on first-party pages. Presence is evidence of messaging; it is not proof that the claim is unique or persuasive.'};
}
window.GOPositioningIntelligence={build};
})();