(() => {
  function render(scope) {
    const api=window.GOMissionOutcomes;
    if (!api || !scope?.claimId || !(scope.evidenceIds||[]).length) return;
    const tab=document.querySelector('[data-tab="outcome"]');
    const panel=document.querySelector('[data-panel="outcome"]');
    tab.hidden=false;panel.hidden=false;
    const baselineForm=document.getElementById('outcome-baseline');
    const actionForm=document.getElementById('outcome-action');
    const followUpForm=document.getElementById('outcome-followup');
    const status=document.getElementById('outcome-status');
    const error=document.getElementById('outcome-error');
    const history=document.getElementById('outcome-history');
    const line=(heading,detail)=>{const article=document.createElement('article'),strong=document.createElement('strong'),p=document.createElement('p');strong.textContent=heading;p.textContent=detail;article.append(strong,p);history.append(article)};
    const show=()=>{
      const record=api.read(scope);
      error.hidden=true;
      baselineForm.hidden=Boolean(record?.baseline);
      actionForm.hidden=!record?.baseline||Boolean(record.action);
      followUpForm.hidden=!record?.action;
      status.textContent=record?.state==='FOLLOW_UP_RECORDED'?'FOLLOW-UP RECORDED':record?.state==='ACTION_REPORTED'?'AWAITING FOLLOW-UP':record?.state==='BASELINE_RECORDED'?'AWAITING ACTION':'NO BASELINE YET';
      history.replaceChildren();
      if (!record) return;
      const base=record.baseline;
      line('Baseline recorded',`${base.value.toLocaleString()} ${base.unit.replaceAll('_',' ')} · ${base.metric} · ${base.period} ending ${base.observedAt} · Source: ${base.source}`);
      if (record.action) line('Operator-reported action',`${record.action.description} · ${record.action.performedAt} · Reported by ${record.action.reportedBy}. GO execution has not been verified.`);
      for (const later of record.followUps) line('Later observation',`${later.value.toLocaleString()} ${base.unit.replaceAll('_',' ')} · ${later.period} ending ${later.observedAt} · Change from baseline: ${later.difference>=0?'+':''}${later.difference.toLocaleString()} · Source: ${later.source}. Cause not established.`);
      if (record.action) followUpForm.elements.period.value=base.period;
    };
    const submit=(form,method)=>form.addEventListener('submit',event=>{
      event.preventDefault();
      try {
        api[method](scope,Object.fromEntries(new FormData(form).entries()));
        form.reset();show();
      } catch (cause) {error.textContent=cause.message;error.hidden=false;}
    });
    submit(baselineForm,'baseline');submit(actionForm,'reportAction');submit(followUpForm,'followUp');
    show();
  }
  window.GOMissionOutcomeUI={render};
})();
