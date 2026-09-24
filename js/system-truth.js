/* Evidence-first six-system read for a completed, dated research investigation.
   A claim type is a topic, never a numeric score or proof of business performance. */
(() => {
  const names = ['Visibility','Trust','Conversion','Operations','Intelligence','Growth'];
  const unknown = {
    Visibility:'Discovery channels and qualified traffic are not established for this system.',
    Trust:'Customer reputation and its effect on booking decisions are not established.',
    Conversion:'Booking starts and completed bookings need connected funnel data.',
    Operations:'Response, capacity and fulfillment need operating data.',
    Intelligence:'Source-to-booking and revenue attribution need connected data.',
    Growth:'An outcome requires an approved action and a comparable follow-up.'
  };
  const readJSON = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  function build(research) {
    if (research?.state !== 'PROOF_JUDGED' || !research.actionPlan?.moves?.length) return null;
    const first = research.actionPlan.moves[0];
    const systems = names.map(name => ({name,state:'UNKNOWN',label:'Needs evidence',detail:unknown[name],move:null}));
    for (const target of systems.filter(row => row.name !== 'Growth')) {
      const moves=research.actionPlan.moves.filter(move => move.system === target.name && move.evidenceIds?.length && move.supportQuotes?.length);
      if (!moves.length) continue;
      if (moves.length > 1 && new Set(moves.map(move => move.state)).size > 1) {
        Object.assign(target,{state:'UNKNOWN',label:'Mixed evidence',detail:'GO has different signals in this system. Review the cited findings before treating it as healthy or constrained.',move:null});
        continue;
      }
      const move=moves[0];target.move=move;
      if (move.state === 'LEVERAGE') Object.assign(target,{state:'HEALTH',label:'Observed strength',detail:move.why || move.headline});
      else if (move.state === 'VALIDATED_OPPORTUNITY') Object.assign(target,{state:'CONCERN',label:'Evidence-backed opportunity',detail:move.why || move.headline});
      else Object.assign(target,{state:'UNKNOWN',label:'Question to verify',detail:move.proof || move.why || unknown[target.name]});
    }
    const growth = systems.at(-1);
    growth.state = first.state === 'VALIDATED_OPPORTUNITY' ? 'CONCERN' : 'UNKNOWN';
    growth.label = first.state === 'VALIDATED_OPPORTUNITY' ? 'Priority selected' : 'Investigation selected';
    growth.detail = first.headline;
    growth.move = first;
    const scope = {website:research.website,capturedAt:research.capturedAt,...first};
    let mission=null,outcome=null;
    try {
      const saved=readJSON('growthOperatorLastCompletedMission');
      const fingerprint=window.GOResearchScope?.identity({website:research.website,capturedAt:research.capturedAt,claim:first}).fingerprint;
      if (saved?.fingerprint === fingerprint && saved.state === 'RESEARCH_PREPARED') mission='Investigation saved · approval pending';
      outcome=window.GOMissionOutcomes?.read(scope) || null;
    } catch { /* incomplete scope cannot claim progress */ }
    const measurement = outcome?.state === 'FOLLOW_UP_RECORDED' ? 'Operator observation recorded · impact unverified'
      : outcome?.state === 'ACTION_REPORTED' ? 'Operator-reported action · follow-up needed'
      : outcome?.state === 'BASELINE_RECORDED' ? 'Operator baseline recorded'
      : 'No measured outcome';
    return {systems,primary:first,mission:mission || 'Proposed Mission · no approved execution',measurement,
      capturedAt:research.capturedAt,sourceType:research.sourceType,businessName:research.dossier?.businessName || 'This operator'};
  }
  window.GOSystemTruth={build};
})();
