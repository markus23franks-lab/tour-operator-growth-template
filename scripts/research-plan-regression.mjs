import fs from 'node:fs';
import vm from 'node:vm';

const sandbox={window:{},console,URL};
vm.createContext(sandbox);
for(const file of ['pricing-intelligence.js','trust-intelligence.js']){
  vm.runInContext(fs.readFileSync(new URL('../js/'+file,import.meta.url),'utf8'),sandbox,{filename:file});
}
let failures=0;
const check=(ok,msg)=>{if(!ok){failures++;console.error('FAIL '+msg)}else console.log('PASS '+msg)};

const pricing=sandbox.window.GOPricingIntelligence.plan({
  businessName:'Louisville Food Tours',
  location:'Louisville, Kentucky',
  websiteQueries:['Louisville food tours','Louisville walking food tours']
});
check(pricing.some(q=>/Louisville Food Tours food tours price/i.test(q)),'pricing plan uses operator + verified product');
check(pricing.some(q=>/^Louisville, Kentucky food tours price$/i.test(q)),'pricing plan uses destination + verified product');
check(!pricing.some(q=>/Louisville food tours Louisville/i.test(q)),'pricing plan does not duplicate destination');

const trust=sandbox.window.GOTrustIntelligence.plan({
  businessName:'Louisville Food Tours',
  location:'Louisville, Kentucky',
  websiteQueries:['Louisville food tours']
});
check(trust.some(q=>/Louisville food tours reviews/i.test(q)),'trust plan benchmarks relevant product demand');
check(!trust.some(q=>/^best tours/i.test(q)),'trust plan avoids generic best-tours benchmark');

if(failures){console.error('\n'+failures+' research-plan regression(s) failed');process.exit(1)}
console.log('\nResearch-plan regressions passed');
