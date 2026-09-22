import fs from 'node:fs';
const src=fs.readFileSync(new URL('../js/operator-analyzer.js',import.meta.url),'utf8');
const build=src.indexOf('const websiteContext = buildWebsiteContext');
const gate=src.indexOf('!websiteContext.dossier.readyForMarketJudgment',build);
const market=src.indexOf('const market = await investigatePublicMarket(websiteContext)',build);
const research=src.indexOf('runDedicatedOperatorResearch(websiteContext, market, acquisition)',build);
const failures=[];
if(build<0)failures.push('website context missing');
if(!(gate>build&&gate<market))failures.push('dossier integrity gate must precede market research');
if(!(market>gate&&research>market))failures.push('pipeline order must be dossier -> market -> synthesis');
if(!src.includes('namesLikelyMatch(name,x.name)'))failures.push('competitor positioning must reconcile names');
if(failures.length){console.error('FAIL research pipeline:',failures.join('; '));process.exit(1)}
console.log('PASS research pipeline: UNDERSTAND -> RESEARCH -> COMPARE/JUDGE ordering is enforced');