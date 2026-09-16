(function(global){
  const clean = v => String(v ?? '').trim();
  const norm = v => clean(v).toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/$/,'');
  const finite = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const uniq = arr => [...new Set(arr.filter(Boolean))];
  const evidenceState=r=>r?.evidenceState || (r?.providerError?'UNKNOWN':(finite(r?.targetLocalPosition)||finite(r?.targetOrganicPosition)?'OBSERVED_WIN':'OBSERVED_GAP'));

  function isTargetResult(row, target, website){
    const name = clean(row?.name || row?.title).toLowerCase();
    const url = norm(row?.website || row?.link || '');
    const targetName = clean(target?.name).toLowerCase();
    const targetSite = norm(website || target?.website || '');
    return Boolean((targetName && name.includes(targetName)) || (targetSite && url.includes(targetSite)));
  }

  function resultCompetitors(queryRow, target, website){
    const all = [
      ...(queryRow?.localResults || []).map(x => ({...x, surface:'Local'})),
      ...(queryRow?.organicResults || []).map(x => ({...x, surface:'Organic'}))
    ];
    return all.filter(x => !isTargetResult(x, target, website));
  }

  function queryScore(row){
    let score = 0;
    const lp = finite(row?.targetLocalPosition);
    const op = finite(row?.targetOrganicPosition);
    if (!lp) score += 4; else if (lp > 3) score += Math.min(3, Math.ceil((lp-3)/2));
    if (!op) score += 3; else if (op > 3) score += Math.min(3, Math.ceil((op-3)/2));
    const competitors = [...(row?.localResults||[]), ...(row?.organicResults||[])].filter(Boolean);
    score += Math.min(3, competitors.length / 6);
    return score;
  }

  function competitorSummary(rows, target, website){
    const map = new Map();
    for (const row of rows){
      for (const x of resultCompetitors(row,target,website)){
        const name = clean(x.name || x.title);
        if (!name) continue;
        const key = norm(x.website || x.link || name);
        const rec = map.get(key) || {name, website:x.website||x.link||'', appearances:0, localPositions:[], organicPositions:[], rating:null, reviews:null, queries:[]};
        rec.appearances++;
        rec.queries.push(row.query);
        if (x.surface === 'Local' && finite(x.position)) rec.localPositions.push(Number(x.position));
        if (x.surface === 'Organic' && finite(x.position)) rec.organicPositions.push(Number(x.position));
        if (finite(x.rating) && (!rec.rating || Number(x.rating) > rec.rating)) rec.rating = Number(x.rating);
        if (finite(x.reviews) && (!rec.reviews || Number(x.reviews) > rec.reviews)) rec.reviews = Number(x.reviews);
        map.set(key,rec);
      }
    }
    return [...map.values()].map(x => ({
      ...x,
      queries: uniq(x.queries),
      bestLocal: x.localPositions.length ? Math.min(...x.localPositions) : null,
      bestOrganic: x.organicPositions.length ? Math.min(...x.organicPositions) : null
    })).sort((a,b) => b.appearances-a.appearances || (b.reviews||0)-(a.reviews||0));
  }

  function formatPosition(row){
    const bits=[];
    if (finite(row?.targetLocalPosition)) bits.push(`Local #${row.targetLocalPosition}`);
    if (finite(row?.targetOrganicPosition)) bits.push(`Organic #${row.targetOrganicPosition}`);
    return bits.join(' · ') || 'not observed in the returned Local or organic results';
  }

  function strongestCompetitorsForQuery(row,target,website){
    return resultCompetitors(row,target,website)
      .filter(x => finite(x.position))
      .sort((a,b) => Number(a.position)-Number(b.position))
      .slice(0,3)
      .map(x => ({name: clean(x.name||x.title), surface:x.surface, position:Number(x.position), rating:finite(x.rating), reviews:finite(x.reviews)}));
  }

  function buildJudgment(market, website, opportunity){
    const rows = market?.queries || [];
    const verifiedRows=rows.filter(r=>evidenceState(r)!=='UNKNOWN');
    const unknownRows=rows.filter(r=>evidenceState(r)==='UNKNOWN');
    const coverage=opportunity?.coverage || {planned:rows.length,verified:verifiedRows.length,unknown:unknownRows.length,ratio:rows.length?verifiedRows.length/rows.length:0,sufficient:verifiedRows.length>=3&&verifiedRows.length/Math.max(rows.length,1)>=.6};
    const target = market?.target || {};
    const competitors = competitorSummary(verifiedRows,target,website);
    const failures = unknownRows.length;
    const visibleRows = verifiedRows.filter(r => evidenceState(r)==='OBSERVED_WIN');
    const localVisible = verifiedRows.filter(r => finite(r.targetLocalPosition));
    const organicVisible = verifiedRows.filter(r => finite(r.targetOrganicPosition));
    const top3 = verifiedRows.filter(r => (finite(r.targetLocalPosition) && Number(r.targetLocalPosition)<=3) || (finite(r.targetOrganicPosition) && Number(r.targetOrganicPosition)<=3));
    const ranked = [...verifiedRows].sort((a,b)=>queryScore(b)-queryScore(a));
    const rawPrimary = ranked[0] || null;
    const primary = opportunity?.priority?.candidate ? rows.find(r=>r.query===opportunity.priority.candidate.query) || rawPrimary : rawPrimary;
    const primaryCompetitors = primary ? strongestCompetitorsForQuery(primary,target,website) : [];

    const visibilityRatio = verifiedRows.length ? visibleRows.length/verifiedRows.length : 0;
    const localRatio = verifiedRows.length ? localVisible.length/verifiedRows.length : 0;
    const organicRatio = verifiedRows.length ? organicVisible.length/verifiedRows.length : 0;
    const targetReviews = finite(target.reviews);
    const targetRating = finite(target.rating);
    const strongestTrust = competitors.filter(c=>c.reviews).sort((a,b)=>(b.reviews||0)-(a.reviews||0))[0] || null;
    const trustGap = Boolean(targetReviews && strongestTrust?.reviews && strongestTrust.reviews >= targetReviews*2);

    let constraint = 'Discovery position';
    let headline = 'GO sees a qualified direct-discovery opportunity.';
    let summary = '';
    if (!rows.length || !coverage.sufficient){
      constraint='Insufficient evidence'; headline='Evidence incomplete — GO is not ready to make a search decision yet.';
      summary=`GO verified ${coverage.verified||0} of ${coverage.planned||rows.length} planned discovery checks. ${coverage.unknown||unknownRows.length} could not be verified, and GO is not treating those searches as ranking gaps.`;
    } else if (visibilityRatio <= .4 || localRatio <= .2){
      constraint='Qualified direct discovery';
      headline='The product appears stronger than its current direct-discovery position.';
      summary=`Across ${verifiedRows.length} verified commercial searches tied to this operator, GO observed the business in ${visibleRows.length}. The clearest gap is “${primary?.query || 'the highest-priority search'},” where the operator was ${primary ? formatPosition(primary) : 'not consistently visible'}.`;
    } else if (trustGap){
      constraint='Public trust advantage';
      headline='Discovery exists, but competitor trust may be doing more of the selling.';
      summary=`The operator is visible in ${visibleRows.length} of ${verifiedRows.length} verified searches, so pure visibility is not the only issue. A repeated competitor carries materially more public review proof, which may matter more than simply creating additional search exposure.`;
    } else if (top3.length >= Math.ceil(verifiedRows.length*.6)){
      constraint='No dominant search constraint';
      headline='Search visibility does not look like the obvious first problem.';
      summary=`GO observed top-three visibility in ${top3.length} of ${verifiedRows.length} verified commercial searches. That is counter-evidence against making SEO/search the default mission; GO should investigate conversion, trust, distribution or operations before prescribing more visibility work.`;
    } else {
      constraint='Selective discovery gap';
      headline='The discovery weakness is selective, not universal.';
      summary=`The operator is visible in ${visibleRows.length} of ${verifiedRows.length} verified searches, but the evidence is uneven. GO should attack the highest-commercial-intent gap instead of treating the entire site as an SEO problem.`;
    }

    const facts=[];
    facts.push(`GO planned ${rows.length} commercial searches, verified ${verifiedRows.length}, and observed the operator in ${visibleRows.length}; ${unknownRows.length} remained unverified.`);
    if (primary) facts.push(`Highest-priority observed gap: “${primary.query}” — ${formatPosition(primary)}.`);
    if (primaryCompetitors.length) facts.push(`That search surfaced ${primaryCompetitors.map(c=>`${c.name} ${c.surface} #${c.position}`).join(', ')}.`);
    if (strongestTrust?.reviews) facts.push(`${strongestTrust.name} carries ${strongestTrust.rating ? `${strongestTrust.rating}★ and ` : ''}${strongestTrust.reviews.toLocaleString()} public reviews in the returned evidence${targetReviews ? ` versus ${targetReviews.toLocaleString()} for ${target.name || 'the operator'}` : ''}.`);

    const counter=[];
    if (visibleRows.length) counter.push(`The operator was visible in ${visibleRows.length} of ${verifiedRows.length} verified searches, so this is not evidence of zero search presence.`);
    if (top3.length) counter.push(`GO observed top-three placement on ${top3.length} search${top3.length===1?'':'es'}.`);
    if (targetRating) counter.push(`Public rating evidence is already strong at ${targetRating}★${targetReviews ? ` across ${targetReviews.toLocaleString()} reviews` : ''}.`);
    if (failures) counter.push(`${failures} planned search${failures===1?'':'es'} could not be verified. GO excludes them from gap reasoning.`);
    if (!counter.length) counter.push('No strong counter-evidence was observed in this evidence set; connected first-party data is still required before GO assigns revenue impact.');

    let confidence=coverage.sufficient?'MEDIUM':'LOW';
    if (coverage.sufficient && verifiedRows.length>=4 && failures===0 && (visibilityRatio<=.4 || top3.length>=Math.ceil(verifiedRows.length*.6) || trustGap)) confidence='HIGH';
    if (!coverage.sufficient) confidence='LOW';

    let action=coverage.sufficient?'Investigate the highest-value discovery gap before changing the entire website.':'Retry the missing discovery checks before choosing a search mission.';
    if (coverage.sufficient && primary){
      action=`Build the first mission around “${primary.query}”: compare the operator’s relevant experience/landing page, Google Business Profile signals and public trust against the businesses repeatedly winning that search, then change only the elements the evidence supports.`;
    }
    if (coverage.sufficient && constraint==='No dominant search constraint') action='Do not create a search mission yet. Use this as evidence that GO should investigate conversion, trust, marketplace dependence and connected booking data before deciding what to work on first.';
    if (coverage.sufficient && constraint==='Public trust advantage') action='Prioritize the trust gap before adding more generic visibility work: identify which review surface and proof elements repeatedly separate the operator from the competitors already being discovered.';

    return {
      version:'GO-JUDGMENT-V3',
      coverage,
      opportunityIntelligence: opportunity || null,
      goPriority: opportunity?.priority || null,
      goInvestigation: opportunity?.investigation || null,
      constraint, headline, summary, confidence,
      provider: market?.provider || 'Unknown provider',
      facts: facts.slice(0,4),
      counterEvidence: counter.slice(0,3),
      primaryQuery: primary?.query || null,
      primaryQueryObservation: primary ? formatPosition(primary) : null,
      primaryCompetitors,
      repeatedCompetitors: competitors.slice(0,5),
      action,
      measurement:['Observed search position / presence','Qualified organic or local visits','Booking starts','Completed bookings','Measured revenue'],
      connectedDataNeeded:['Google Search Console','Google Business Profile / local performance','Analytics','Booking / reservation data'],
      diagnostics:{queries:rows.length,verified:verifiedRows.length,unknown:unknownRows.length,visible:visibleRows.length,localVisible:localVisible.length,organicVisible:organicVisible.length,top3:top3.length,providerFailures:failures,visibilityRatio:Number(visibilityRatio.toFixed(2))}
    };
  }

  global.GOJudgment = { build: buildJudgment };
})(window);