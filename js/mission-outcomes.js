/* A local, claim-scoped measurement record. This stores operator-entered facts;
   it never treats a change in a metric as revenue attributable to GO. */
(() => {
  const prefix = 'growthOperatorOutcome:';
  const units = new Set(['bookings', 'inquiries', 'website_visits', 'revenue_usd', 'custom']);
  const requireText = (value, label, max = 240) => {
    const text = String(value ?? '').trim();
    if (!text || text.length > max) throw new Error(`${label} must be 1–${max} characters.`);
    return text;
  };
  const date = (value, label) => {
    const text = requireText(value, label, 10);
    const parsed = new Date(`${text}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) throw new Error(`${label} must be a valid date.`);
    if (text > new Date().toISOString().slice(0, 10)) throw new Error(`${label} cannot be in the future.`);
    return text;
  };
  const amount = (value, unit) => {
    if (String(value ?? '').trim() === '') throw new Error('A measured value is required.');
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 1e12) throw new Error('Enter a nonnegative measured value.');
    if (['bookings', 'inquiries', 'website_visits'].includes(unit) && !Number.isInteger(number)) throw new Error('Count metrics need a whole number.');
    if (unit === 'revenue_usd' && Math.abs(number*100-Math.round(number*100)) > 1e-6) throw new Error('Revenue values may have at most two decimal places.');
    return number;
  };
  const identity = claim => {
    requireText(claim.website, 'Website');
    requireText(claim.claimId, 'Claim ID', 120);
    const scope = window.GOResearchScope.identity({website:claim.website,claim,capturedAt:claim.capturedAt});
    return {...scope,key:prefix+scope.key};
  };
  const read = claim => {
    const scope = identity(claim);
    let record;
    try { record = JSON.parse(localStorage.getItem(scope.key)); } catch { /* ignore corrupt local data */ }
    if (record?.fingerprint !== scope.fingerprint) return null;
    return record;
  };
  const write = (scope, record) => {
    localStorage.setItem(scope.key, JSON.stringify(record));
    return record;
  };
  const baseline = (claim, entry) => {
    const scope = identity(claim), prior = read(claim);
    if (prior?.action) throw new Error('The baseline is locked after an action is reported.');
    const unit = requireText(entry.unit, 'Metric unit', 32);
    if (!units.has(unit)) throw new Error('Choose a supported metric unit.');
    return write(scope, {
      fingerprint:scope.fingerprint, website:scope.website, claimId:scope.claimId,
      evidenceIds:scope.evidenceIds, headline:requireText(claim.headline, 'Claim headline'),
      state:'BASELINE_RECORDED',
      baseline:{metric:requireText(entry.metric, 'Metric name', 100),unit,value:amount(entry.value,unit),period:requireText(entry.period, 'Measurement period', 100),observedAt:date(entry.observedAt, 'Baseline date'),source:requireText(entry.source, 'Data source', 100)},
      action:null, followUps:[]
    });
  };
  const reportAction = (claim, entry) => {
    const scope = identity(claim), record = read(claim);
    if (!record?.baseline) throw new Error('Record a real baseline before reporting an action.');
    if (record.action) throw new Error('An action has already been reported for this measurement.');
    if (entry.approved !== true && entry.approved !== 'on') throw new Error('Confirm the operator approved and performed the action.');
    const performedAt = date(entry.performedAt, 'Action date');
    if (performedAt < record.baseline.observedAt) throw new Error('Action date must follow the baseline date.');
    record.action = {description:requireText(entry.description, 'Action description', 500),performedAt,reportedBy:requireText(entry.reportedBy, 'Person reporting the action', 100),approvalAttested:true,origin:'OPERATOR_REPORTED'};
    record.state='ACTION_REPORTED';
    return write(scope, record);
  };
  const followUp = (claim, entry) => {
    const scope = identity(claim), record = read(claim);
    if (!record?.action) throw new Error('Report the action before recording a later measurement.');
    const observedAt = date(entry.observedAt, 'Follow-up date');
    if (observedAt <= record.action.performedAt || (record.followUps.length && observedAt < record.followUps.at(-1).observedAt)) throw new Error('Follow-up date must follow the action and prior measurements.');
    const period = requireText(entry.period, 'Measurement period', 100);
    if (period !== record.baseline.period) throw new Error('Use the same measurement period as the baseline.');
    const value = amount(entry.value,record.baseline.unit);
    record.followUps.push({value,period,observedAt,source:requireText(entry.source, 'Data source', 100),difference:value-record.baseline.value});
    record.state='FOLLOW_UP_RECORDED';
    return write(scope, record);
  };
  window.GOMissionOutcomes = {read,baseline,reportAction,followUp};
})();
