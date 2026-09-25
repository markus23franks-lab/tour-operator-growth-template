/* Import one completed private evaluation as a small dashboard read. The file
   stays in the browser; evidence is checked before the private raw artifact is
   reduced to the claim-scoped presentation fields. */
(() => {
  const text = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const same = (a, b) => JSON.stringify([...new Set(a || [])].sort()) === JSON.stringify([...new Set(b || [])].sort());
  function extract(artifact,{sourceType='ARCHIVED_EVALUATION'}={}) {
    if(!['ARCHIVED_EVALUATION','LIVE_LAB'].includes(sourceType))throw new Error('Unknown research source.');
    const results = artifact?.results;
    if (!Array.isArray(results) || results.length !== 1) throw new Error('Choose a single-operator evaluation artifact.');
    const {summary, response} = results[0] || {};
    if (summary?.httpStatus !== 200 || response?.ok !== true || response.state !== 'PROOF_JUDGED') throw new Error('The evaluation did not finish with a judged result.');
    const website = new URL(summary.website);
    if (website.protocol !== 'https:' || !website.hostname) throw new Error('The operator website is invalid.');
    const capturedAt = new Date(artifact.startedAt);
    if (!Number.isFinite(capturedAt.getTime()) || capturedAt > new Date()) throw new Error('The evaluation date is missing or invalid.');
    const moves = response.actionPlan?.moves;
    if (response.actionPlan?.state !== 'READY' || !Array.isArray(moves) || !moves.length || !Array.isArray(response.claimLedger) || !Array.isArray(response.evidence)) throw new Error('The result lacks a claim-scoped decision or evidence.');
    const byId = new Map(response.evidence.map(row => [row.id, row]));
    const claims = new Map(response.claimLedger.map(claim => [claim.claimId, claim]));
    for (const move of moves) {
      const claim = claims.get(move.claimId);
      if (move.system && claim?.system && move.system !== claim.system) throw new Error('A decision no longer matches its claim system.');
      const quoteKeys = quotes => (quotes || []).map(q => `${q.evidenceId}\u0000${text(q.quote)}`);
      if (!claim || !same(move.evidenceIds, claim.evidenceIds) || !same(quoteKeys(move.supportQuotes), quoteKeys(claim.supportQuotes)) || !same(move.scope?.pages, claim.scope?.pages) || !move.evidenceIds?.length || text(move.headline) !== text(claim.headline) || !text(response.dossier?.businessName)) throw new Error('A decision no longer matches its cited claim.');
      if (!move.evidenceIds.every(id => byId.has(id))) throw new Error('A cited evidence record is missing.');
      for (const quote of move.supportQuotes || []) {
        const row = byId.get(quote.evidenceId);
        const source = [row?.subject?.label,row?.observation?.title,...(row?.observation?.headings || []),row?.observation?.mainText,row?.observation?.text,row?.observation?.snippet,row?.observation?.priceText].map(text).join(' ');
        if (!move.evidenceIds.includes(quote.evidenceId) || !text(quote.quote) || !source.includes(text(quote.quote))) throw new Error('A source passage could not be verified.');
      }
      if (move.state === 'VALIDATED_OPPORTUNITY') {
        const detail = move.evidenceIds.some(id => {
          const row = byId.get(id);
          if (row?.surface !== 'FIRST_PARTY_RENDERED') return false;
          try { return new URL(row.observation?.url || row.source?.url).pathname.replace(/\/+$/, '').length > 0; } catch { return false; }
        });
        if (!['QUICK_WIN','VALIDATED_OPPORTUNITY'].includes(claim.type) || !detail || !move.supportQuotes?.length || !claim.provenance?.hasDetailPage) throw new Error('An action-ready claim lacks verified page evidence.');
      }
    }
    return {
      state:'PROOF_JUDGED', sourceType, capturedAt:capturedAt.toISOString(),
      website:website.href, dossier:{businessName:text(response.dossier?.businessName),summary:text(response.dossier?.summary)},
      judgment:{executiveRead:text(response.judgment?.executiveRead)},
      actionPlan:{state:'READY',moves:moves.map(move => ({
        claimId:move.claimId,state:move.state,system:move.system && move.system === claims.get(move.claimId)?.system ? move.system : 'Unknown',headline:text(move.headline),why:text(move.why),action:text(move.action),proof:text(move.proof),confidence:move.confidence,
        evidenceIds:[...move.evidenceIds],supportQuotes:(move.supportQuotes || []).map(q => ({evidenceId:q.evidenceId,quote:text(q.quote)})),
        scope:{pages:[...(move.scope?.pages || [])]},provenance:move.provenance
      }))}
    };
  }
  window.GOResearchArtifactImport = {extract};
})();
