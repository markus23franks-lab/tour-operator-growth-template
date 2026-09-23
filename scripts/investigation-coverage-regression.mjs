import {buildResearchCoverage} from '../netlify/functions/lib/investigation-core.mjs';
let fail=0;const check=(n,a,e)=>{if(a!==e){fail++;console.error('FAIL',n,{a,e})}else console.log('PASS',n)};
const mk=(id,surface,query='')=>({id,surface,status:'OBSERVED',source:{query}});
const shallow=[mk('fp','FIRST_PARTY_RENDERED'),mk('o','ORGANIC_SERP','rafting tours')];
const full=[mk('fp','FIRST_PARTY_RENDERED'),mk('o1','ORGANIC_SERP','rafting tours'),mk('l1','LOCAL_MAPS','rafting tours'),mk('o2','ORGANIC_SERP','river rafting'),mk('l2','LOCAL_MAPS','river rafting'),mk('o3','ORGANIC_SERP','family rafting'),mk('l3','LOCAL_MAPS','family rafting'),mk('c','COMPETITOR_SITE')];
check('one-query research is blocked',buildResearchCoverage({records:shallow,signals:{presence:[]}}).state,'INCOMPLETE');
check('shallow research names query blocker',buildResearchCoverage({records:shallow,signals:{presence:[]}}).blockers.includes('TOO_FEW_MARKET_QUERIES'),true);
check('multi-surface market + competitor evidence can reach judgment',buildResearchCoverage({records:full,signals:{presence:[]}}).state,'READY_FOR_JUDGMENT');
if(fail)process.exit(1);console.log('\nResearch coverage gate passed');
