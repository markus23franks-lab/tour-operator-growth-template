/* Turns a completed Investigation Lab judgment into the existing operator dashboard.
   The dashboard remains usable without research data; when present, this is the
   source-first path from claim ledger → Snapshot language → Mission. */
(() => {
  const read = () => {
    try {
      const value=JSON.parse(localStorage.getItem("growthOperatorResearchJudgment"));
      if(value?.state!=='PROOF_JUDGED'||value.actionPlan?.state!=='READY'||!Array.isArray(value.actionPlan.moves)||!value.actionPlan.moves.length||!String(value.dossier?.businessName||'').trim())return null;
      const url=new URL(value.website),captured=new Date(value.capturedAt);
      if(url.protocol!=='https:'||typeof value.capturedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value.capturedAt)||!Number.isFinite(captured.getTime())||captured>new Date()||!['LIVE_LAB','ARCHIVED_EVALUATION'].includes(value.sourceType))return null;
      if(!value.actionPlan.moves.every(move=>String(move.headline||'').trim()&&move.evidenceIds?.length&&Array.isArray(move.scope?.pages)&&move.scope.pages.length&&Array.isArray(move.supportQuotes)))return null;
      return value;
    } catch { return null; }
  };
  const systems = new Set(['Visibility','Trust','Conversion','Operations','Intelligence','Growth']);
  const pillar = system => systems.has(system) ? system : 'Growth';
  window.GOResearchBridge = {
    read,
    selectMission(expected) {
      const current=read();
      if(!current||!expected||JSON.stringify(current)!==JSON.stringify(expected))throw new Error('The saved investigation changed. Reload this page before opening its Mission.');
      const profile=this.apply({},current);
      const workspace={businessName:profile.businessName,ownerName:profile.ownerName,website:profile.website,bookingPlatform:profile.bookingPlatform,growthScore:null,scores:null,revenueOpportunity:null,mission:profile.mission,researchBacked:true,claim:current.actionPlan.moves[0],researchCapturedAt:current.capturedAt,researchSourceType:current.sourceType,mode:'start',startedAt:new Date().toISOString()};
      try { localStorage.setItem('growthOperatorActiveMission',JSON.stringify(workspace)); }
      catch { throw new Error('This browser could not save the Mission selection. Check browser storage and try again.'); }
      return workspace;
    },
    apply(profile, research=read()) {
      if (!research) return profile;
      const plan = research.actionPlan;
      const primary = plan.moves[0];
      const dossier = research.dossier || {};
      const findings = plan.moves.map((move, index) => ({
        id: move.claimId || `research-${index}`,
        pillar: pillar(move.system),
        icon: move.state === "VALIDATED_OPPORTUNITY" ? "→" : move.state === "LEVERAGE" ? "✓" : "?",
        title: move.headline,
        summary: `${move.why || "GO found a supported signal."} ${move.proof ? `Before acting: ${move.proof}` : ""}`.trim(),
        found: move.headline,
        why: move.why || "GO found a supported public signal worth evaluating.",
        recommendation: move.action || plan.next,
        expected: move.proof || "Connect outcome data and measure the result before calling this proven.",
        evidence: `${(move.evidenceIds || []).length} cited evidence record${(move.evidenceIds || []).length === 1 ? "" : "s"}`,
        status: move.state === "VALIDATED_OPPORTUNITY" ? "Evidence-backed opportunity" : "Investigation",
        tone: move.state === "VALIDATED_OPPORTUNITY" ? "opportunity" : move.state === "LEVERAGE" ? "strength" : "investigation",
        source: "GO model + claim ledger",
        claimId: move.claimId,
        scope: move.scope,
        provenance: move.provenance
      }));
      const primaryPillar = pillar(primary.system);
      return {
        ...profile,
        // Public research does not identify the owner or measure a Growth Score.
        ownerName: "Operator not connected",
        firstName: "Operator",
        initials: "GO",
        businessName: dossier.businessName || profile.businessName,
        website: research.website || profile.website,
        bookingPlatform: "Not connected",
        scores: null,
        growthScore: null,
        percentile: null,
        scoreChange: null,
        intelligence: null,
        researchBacked: true,
        researchState: plan.state,
        researchSource: "MODEL-LED INVESTIGATION · CLAIM LEDGER",
        findings,
        mission: {
          pillar: primaryPillar,
          title: primary.headline,
          reason: primary.why || "GO found a supported public signal worth evaluating.",
          confidence: primary.confidence || "Unverified",
          description: primary.action || plan.next
        },
        revenueOpportunity: null,
        revenueLabel: "Needs connected data"
      };
    }
  };
})();
