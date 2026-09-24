/* Growth Score: a visible six-system read without synthetic numbers. */
(() => {
  const el=(name,text) => { const node=document.createElement(name);node.textContent=String(text ?? '');return node; };
  document.addEventListener('DOMContentLoaded',() => {
    const researchTruth=window.GOSystemTruth?.build(window.GOResearchBridge?.read());
    const names=['Visibility','Trust','Conversion','Operations','Intelligence','Growth'];
    const truth=researchTruth || {
      businessName:'Growth Operator',
      primary:{headline:'No verified priority loaded'},mission:'No research Mission loaded',measurement:'No measured outcome',
      systems:names.map(name=>({name,state:'UNKNOWN',label:'Needs evidence',detail:'No completed, claim-scoped investigation is loaded for this system.'}))
    };
    document.body.classList.add('research-score-mode');
    const status=document.querySelector('.topbar .status');if(status)status.textContent='SIX-SYSTEM READ · SCORE NOT YET SUPPORTED';
    const main=document.querySelector('main.score-shell');
    const section=el('section','');section.className='research-score-view';
    const source=researchTruth ? (truth.sourceType==='ARCHIVED_EVALUATION'?'ARCHIVED PUBLIC RESEARCH':'SAVED PUBLIC RESEARCH') : 'NO COMPLETED RESEARCH READ';
    section.append(el('p',researchTruth ? `${source} · ${truth.capturedAt?.slice(0,10)||'DATE UNKNOWN'}` : source),el('h1',`${truth.businessName}: six-system read`),el('p',researchTruth ? 'GO has a cited priority. It does not yet have the breadth of verified evidence or connected operating data needed for a defensible overall Growth Score.' : 'A public analysis or preview score is not enough for a calibrated Growth Score. Complete and review a cited investigation before GO assigns system states.'));
    const summary=el('div','');summary.className='research-score-summary';
    for (const [label,value] of [['GROWTH SCORE','Not scored'],['CURRENT PRIORITY',truth.primary.headline],['MISSION',truth.mission],['MEASUREMENT',truth.measurement]]) {
      const cell=el('article','');cell.append(el('small',label),el('strong',value));summary.append(cell);
    }
    section.append(summary,el('h2','What the six systems actually show'));
    const grid=el('div','');grid.className='research-score-grid';
    for (const system of truth.systems) {
      const card=el('article','');card.className=`research-score-system ${system.state.toLowerCase()}`;
      card.append(el('small',system.name.toUpperCase()),el('strong',system.label),el('p',system.detail));
      for (const sourceUrl of system.move?.scope?.pages?.slice(0,2)||[]) {
        try { const url=new URL(sourceUrl);if(!['https:','http:'].includes(url.protocol))continue;const link=el('a','View cited page →');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';card.append(link); } catch { /* skip invalid source */ }
      }
      grid.append(card);
    }
    section.append(grid,el('p',researchTruth ? 'Observed public signals are scoped to cited pages and the dated investigation. Unknown systems require more evidence; booking impact requires a connected baseline and comparable follow-up.' : 'GO will not fill missing evidence with sample scores, rankings or a revenue projection.'));
    const footer=main.querySelector('.footer-actions');main.insertBefore(section,footer);
    const snapshot=footer.querySelector('a[href="growth-snapshot.html"]');
    if(snapshot&&researchTruth){snapshot.href='dashboard.html';snapshot.textContent='← Dashboard';}
    else if(snapshot){snapshot.href='operator-analyzer.html';snapshot.textContent='← Analyze a business';}
  });
})();
