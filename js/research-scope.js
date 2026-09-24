/* A saved investigation's identity follows the dated evidence, not a reusable claim ID. */
(() => {
  function identity({website, claim, capturedAt}) {
    const origin = new URL(website).origin.toLowerCase();
    const evidenceIds = [...new Set((claim.evidenceIds || []).map(String))].sort();
    if (!evidenceIds.length) throw new Error('The claim needs cited evidence before saving progress.');
    const quotes = (claim.supportQuotes || []).map(item => [String(item.evidenceId || ''), String(item.quote || '').replace(/\s+/g, ' ').trim()]).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const fingerprint = JSON.stringify([origin, String(claim.claimId || ''), evidenceIds, String(claim.headline || ''), quotes, String(capturedAt || '')]);
    let hash = 2166136261;
    for (const character of fingerprint) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return {fingerprint, key:(hash >>> 0).toString(16), website:origin, claimId:String(claim.claimId || ''), evidenceIds};
  }
  window.GOResearchScope = {identity};
})();
