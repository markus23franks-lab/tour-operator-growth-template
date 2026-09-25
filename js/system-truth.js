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
    growth.state = 'UNKNOWN';
    growth.label = 'Execution and outcome unverified';
    growth.detail = 'GO selected a priority, but an approved action and comparable outcome are needed to evaluate this system.';
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
    let missionDetail='Review the evidence and approve scoped work before execution.';
    let measurementDetail='Connect or record a real baseline before reporting a change.';
    if(outcome?.baseline){
      const base=outcome.baseline;
      const unit=String(base.unit||'').replaceAll('_',' ');
      const observation=entry=>`${Number(entry.value).toLocaleString('en-US')} ${unit} (${entry.startedAt||'start unknown'} to ${entry.observedAt||'end unknown'}; source: ${entry.source||'not recorded'})`;
      measurementDetail=`${base.metric}: baseline ${observation(base)}.`;
      mission=mission || 'Baseline recorded · action pending';
      missionDetail='A baseline is recorded. No performed action has been reported.';
      if(outcome.action?.approvalAttested===true){
        mission='Operator reports approved action';
        missionDetail=`${outcome.action.description} Reported by ${outcome.action.reportedBy} for ${outcome.action.performedAt}. Execution has not been independently verified.`;
        growth.detail='An operator-reported action is recorded. Its effect on business growth has not been established.';
      }
      const latest=outcome.followUps?.at(-1);
      if(latest){
        mission='Reported action · outcome under review';
        measurementDetail+=` Follow-up ${observation(latest)}. Cause is not established.`;
      }
    }
    return {systems,primary:first,mission:mission || 'Proposed Mission · no approved execution',missionDetail,measurement,measurementDetail,
      capturedAt:research.capturedAt,sourceType:research.sourceType,businessName:research.dossier?.businessName || 'This operator'};
  }
  window.GOSystemTruth={build};
})();
