(() => {
  const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = String(value ?? ""); };
  const tag = (name, text) => { const node = document.createElement(name); node.textContent = String(text ?? ""); return node; };
  function render(profile) {
    document.body.classList.add("research-mode");
    const research = window.GOResearchBridge.read();
    const truth = window.GOSystemTruth?.build(research);
    const plan = research.actionPlan;
    const first = plan.moves[0];
    const date = research.capturedAt && !Number.isNaN(Date.parse(research.capturedAt)) ? research.capturedAt.slice(0,10) : null;
    const origin = research.sourceType === 'ARCHIVED_EVALUATION' ? 'ARCHIVED EVALUATION' : research.sourceType === 'LIVE_LAB' ? 'SAVED LIVE INVESTIGATION' : 'SAVED INVESTIGATION · DATE UNKNOWN';
    const dated = date ? `${origin} · ${date}` : origin;
    const strength = plan.moves.find(move => move.state === "LEVERAGE");
    const summary = research.judgment?.executiveRead || research.dossier?.summary || "GO investigated this business and selected a question worth pursuing.";
    set("greeting", `GO's read on ${profile.businessName}`);
    set("briefing-line", summary);
    if (truth) {
      const section=document.getElementById('system-truth');
      section.hidden=false;
      const grid=document.getElementById('system-truth-grid');
      grid.replaceChildren();
      for (const system of truth.systems) {
        const card=tag('article',''); card.className=`system-truth-card ${system.state.toLowerCase()}`;
        card.append(tag('small',system.name.toUpperCase()),tag('strong',system.label),tag('p',system.detail));
        if (system.move?.scope?.pages?.length) {
          const source=system.move.scope.pages[0];
          try { const url=new URL(source); if (['https:','http:'].includes(url.protocol)) { const link=tag('a','Read source →');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';card.append(link); } } catch { /* no link */ }
        }
        grid.append(card);
      }
      set('truth-priority',first.headline);set('truth-mission',truth.mission);set('truth-measurement',truth.measurement);
    }
    set("scan-time", `${dated} · verify current facts before acting`);
    set("brief-business-name", profile.businessName);
    set("sidebar-business", profile.businessName);
    set("sidebar-owner", "Operator not connected");
    set("sidebar-avatar", "GO");
    const contextBadge = document.querySelector("#scan-context strong");
    if (contextBadge) contextBadge.textContent = research.sourceType === 'ARCHIVED_EVALUATION' ? 'ARCHIVED RESEARCH' : 'PUBLIC RESEARCH';
    set("today-label", dated);
    set("overall-assessment", summary);
    set("brief-summary-status", first.state === "VALIDATED_OPPORTUNITY" ? "Evidence-backed opportunity" : first.state === "LEVERAGE" ? "Strength worth leveraging" : "Investigation selected");
    set("brief-summary-line", "Public evidence identifies a next move. Booking impact needs your operating data.");
    set("working-title", strength?.headline || "GO is still verifying what works");
    set("working-copy", strength?.why || strength?.whyItMatters || "GO will preserve observed strengths as it investigates.");
    const strengthLabel = document.querySelector(".brief-working small");
    if (strengthLabel) strengthLabel.textContent = strength ? "WHAT'S WORKING" : "STRENGTHS UNDER REVIEW";
    const headline = document.querySelector(".brief-opportunity small");
    if (headline) headline.textContent = first.state === "VALIDATED_OPPORTUNITY" ? "GO OPPORTUNITY" : first.state === "LEVERAGE" ? "GO STRENGTH TO BUILD ON" : "GO INVESTIGATION";
    set("opportunity-title", first.headline);
    set("opportunity-copy", first.why);
    set("recommendation-title", first.action);
    set("recommendation-copy", first.state === "VALIDATED_OPPORTUNITY" ? "Review the evidence and bounded work before approving a change." : "Verify the open question before changing the business.");
    set("recommendation-why", first.why);
    set("expected-result", first.proof || "Connect booking and customer data to measure any impact.");
    const proofLabel = document.querySelector(".brief-why > div:nth-child(2) small");
    if (proofLabel) proofLabel.textContent = 'WHAT STILL NEEDS PROOF';
    const start = document.getElementById("brief-start-mission");
    if (start) start.textContent = first.state === "VALIDATED_OPPORTUNITY" ? "Review GO's proposed work →" : "Open GO investigation →";
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("growthOperatorLastCompletedMission")); } catch { /* no saved investigation */ }
    let fingerprint = null;
    try { fingerprint = window.GOResearchScope.identity({website:profile.website,claim:first,capturedAt:research.capturedAt}).fingerprint; } catch { /* no valid cited claim */ }
    if (fingerprint && saved?.state === "RESEARCH_PREPARED" && saved.fingerprint === fingerprint) {
      set("brief-summary-line", "Investigation saved. Operator approval and outcome measurement are still ahead.");
      set("recommendation-copy", "Review the saved research and decide whether the proposed work should be approved.");
      if (start) start.textContent = "Review saved investigation →";
    }
    let outcome=null;
    try { outcome=window.GOMissionOutcomes?.read({website:profile.website,capturedAt:research.capturedAt,...first}); } catch { /* no valid scoped outcome */ }
    if (outcome?.state === 'FOLLOW_UP_RECORDED') {
      const latest=outcome.followUps.at(-1),unit=outcome.baseline.unit.replaceAll('_',' ');
      set('brief-summary-line',`Operator recorded ${outcome.baseline.value.toLocaleString()} → ${latest.value.toLocaleString()} ${unit} across matching ${latest.period} periods. Cause is not established.`);
      set('recommendation-copy','Review the observation and decide whether this mission should continue, change, or give way to another opportunity.');
      if (start) start.textContent='Review outcome record →';
    } else if (outcome?.state === 'ACTION_REPORTED') {
      set('brief-summary-line','Operator reported an approved action. A comparable follow-up measurement is still needed.');
      if (start) start.textContent='Record follow-up →';
    } else if (outcome?.state === 'BASELINE_RECORDED') {
      set('brief-summary-line','Operator baseline recorded. No action or outcome has been measured.');
      if (start) start.textContent='Review baseline →';
    }
    set("findings-title", `${profile.businessName}: GO's evidence-backed read`);
    set("findings-intro", "Read the source passages and the proof GO still needs before acting.");
    set("findings-source-label", dated);
    set("findings-source-title", "Public pages and market observations");
    set("findings-source-status", `${dated} · current facts require verification`);
    const list = document.getElementById("findings-list");
    list.replaceChildren();
    for (const move of plan.moves) {
      const card = document.createElement("article");
      card.className = "research-finding";
      card.append(tag("small", move.state === "LEVERAGE" ? "WHAT'S WORKING" : move.state === "VALIDATED_OPPORTUNITY" ? "EVIDENCE-BACKED OPPORTUNITY" : "INVESTIGATION"),tag("h3",move.headline),tag("p",move.why),tag("small","WHAT GO WOULD DO"),tag("p",move.action),tag("small","SOURCE PASSAGES"));
      for (const item of move.supportQuotes || []) card.append(tag("blockquote",`“${item.quote}”`));
      for (const url of move.scope?.pages || []) {
        try { const parsed = new URL(url); if (!['http:','https:'].includes(parsed.protocol)) continue; const a=tag("a",parsed.hostname + parsed.pathname); a.href=parsed.href;a.target="_blank";a.rel="noopener noreferrer";card.append(a); } catch { /* malformed source URL is not linked */ }
      }
      card.append(tag("small","WHAT STILL NEEDS PROOF"),tag("p",move.proof || "Connected operating data is needed before claiming impact."));
      list.append(card);
    }
  }
  window.GOResearchExperience = {render};
})();
