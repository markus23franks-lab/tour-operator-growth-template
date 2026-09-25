/* Growth Score: a visible six-system read without synthetic numbers. */
(() => {
  const el=(name,text) => { const node=document.createElement(name);node.textContent=String(text ?? '');return node; };
  document.addEventListener('DOMContentLoaded',() => {
    const fromProspect=new URLSearchParams(window.location.search).get('source')==='prospect';
    let prospect=null;
    if(fromProspect)try { prospect=JSON.parse(localStorage.getItem('growthOperatorProspectProfile')); } catch { /* no prospect */ }
    const research=window.GOResearchBridge?.read();
    let sameOperator=false;
    if(fromProspect && prospect?.website && research?.website)try {
      sameOperator=new URL(prospect.website).origin===new URL(research.website).origin;
    } catch { /* invalid website cannot establish operator identity */ }
    const researchTruth=window.GOSystemTruth?.build(fromProspect && !sameOperator ? null : research);
    const names=['Visibility','Trust','Conversion','Operations','Intelligence','Growth'];
    const truth=researchTruth || {
      businessName:fromProspect && prospect?.website ? prospect.businessName || 'This business' : 'Growth Operator',
      primary:{headline:'No verified priority loaded'},mission:'No research Mission loaded',measurement:'No measured outcome',
      systems:names.map(name=>({name,state:'UNKNOWN',label:'Needs evidence',detail:'No completed, claim-scoped investigation is loaded for this system.'}))
    };
    document.body.classList.add('research-score-mode');
    const status=document.querySelector('.topbar .status');if(status)status.textContent='SIX-SYSTEM READ · SCORE NOT YET SUPPORTED';
    const main=document.querySelector('main.score-shell');
    const section=el('section','');section.className='research-score-view';
    const source=researchTruth ? (truth.sourceType==='ARCHIVED_EVALUATION'?'ARCHIVED PUBLIC RESEARCH':'SAVED PUBLIC RESEARCH') : 'NO COMPLETED RESEARCH READ';
    section.append(el('p',researchTruth ? `${source} · ${truth.capturedAt?.slice(0,10)||'DATE UNKNOWN'}` : source),el('h1',`${truth.businessName}: six-system read`),el('p',researchTruth ? 'GO has a cited priority. It does not yet have the breadth of verified evidence or connected operating data needed for a defensible overall Growth Score.' : fromProspect && prospect?.website ? 'This prospect snapshot has no matching completed investigation. Its public analysis does not establish six-system health or a calibrated Growth Score.' : 'A public analysis or preview score is not enough for a calibrated Growth Score. Complete and review a cited investigation before GO assigns system states.'));
    const summary=el('div','');summary.className='research-score-summary';
    for (const [label,value] of [['GROWTH SCORE','Not scored'],['CURRENT PRIORITY',truth.primary.headline],['MISSION',truth.mission],['MEASUREMENT',truth.measurement]]) {
      const cell=el('article','');cell.append(el('small',label),el('strong',value));summary.append(cell);
      const detail=label==='MISSION'?truth.missionDetail:label==='MEASUREMENT'?truth.measurementDetail:null;
      if(detail)cell.append(el('p',detail));
      if(label==='MISSION'&&researchTruth){
        const open=el('button','Review Mission & measurement →');open.type='button';open.className='button';
        const error=el('p','');error.setAttribute('role','status');
        open.addEventListener('click',()=>{
          try { window.GOResearchBridge.selectMission(research);window.location.href='mission.html?mode=start'; }
          catch(problem){error.textContent=problem.message;}
        });
        cell.append(open,error);
      }
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
    else if(snapshot){snapshot.href=fromProspect&&prospect?.website?'growth-snapshot.html':'operator-analyzer.html';snapshot.textContent=fromProspect&&prospect?.website?'← Growth Snapshot':'← Analyze a business';}
    if(fromProspect && !researchTruth){
      const dashboard=footer.querySelector('a[href="dashboard.html"]');
      if(dashboard){dashboard.href='growth-snapshot.html';dashboard.textContent='Review this snapshot →';}
      const brand=document.querySelector('.topbar .brand');if(brand)brand.href='growth-snapshot.html';
    }
  });
})();
