/* Turns a completed Investigation Lab judgment into the existing operator dashboard.
   The dashboard remains usable without research data; when present, this is the
   source-first path from claim ledger → Snapshot language → Mission. */
(() => {
  const read = () => { try { return JSON.parse(localStorage.getItem("growthOperatorResearchJudgment")) || null; } catch { return null; } };
  const pillar = type => ({QUICK_WIN:"Conversion",VALIDATED_OPPORTUNITY:"Growth",INVESTIGATE:"Intelligence",LEVERAGE:"Trust",MEASURE:"Growth"}[type] || "Growth");
  const confidence = value => ({HIGH:88,MEDIUM:70,LOW:48}[String(value || "MEDIUM").toUpperCase()] || 60);
  window.GOResearchBridge = {
    read,
    apply(profile) {
      const research = read();
      const plan = research?.actionPlan;
      if (!research || research.state !== "PROOF_JUDGED" || !plan?.moves?.length) return profile;
      const primary = plan.moves[0];
      const dossier = research.dossier || {};
      const findings = plan.moves.map((move, index) => ({
        id: move.claimId || `research-${index}`,
        pillar: pillar(move.state || move.type),
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
      const primaryPillar = pillar(primary.state || primary.type);
      return {
        ...profile,
        businessName: dossier.businessName || profile.businessName,
        website: research.website || profile.website,
        researchBacked: true,
        researchState: plan.state,
        researchSource: "MODEL-LED INVESTIGATION · CLAIM LEDGER",
        findings,
        mission: {
          pillar: primaryPillar,
          title: primary.headline,
          reason: primary.why || "GO found a supported public signal worth evaluating.",
          confidence: confidence(primary.confidence),
          description: primary.action || plan.next
        },
        revenueOpportunity: null,
        revenueLabel: "Needs connected data"
      };
    }
  };
})();
