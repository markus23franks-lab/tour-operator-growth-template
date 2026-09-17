import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/zero-input-operator-flow.js',import.meta.url),'utf8');
const sandbox={
  window:{GOColdStartV3:{validQuery:q=>!/(book now|learn more|various packages)/i.test(q)}},
  console,
  URLSearchParams,
  location:{search:''},
  localStorage:{getItem:()=>null,removeItem:()=>{},setItem:()=>{}},
  document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,body:{classList:{add:()=>{}}}},
  setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'zero-input-operator-flow.js'});
const {extractSearches}=sandbox.window.GOZeroInputFlow;

const cases=[
 {name:'prefers selected queries and caps at five',profile:{pipelineDebug:{selectedQueries:['Moab canyoneering','Moab rock climbing','Canyonlands hiking tours','Moab rafting tours','Moab jeep tours','Moab ATV tours']}},expect:['Moab canyoneering','Moab rock climbing','Canyonlands hiking tours','Moab rafting tours','Moab jeep tours']},
 {name:'normalizes checked-search objects',profile:{marketEvidence:{checkedSearches:[{query:'Sedona ATV tours'},{query:'Sedona jeep tours'}]}},expect:['Sedona ATV tours','Sedona jeep tours']},
 {name:'dedupes case-insensitively',profile:{discoveryIntelligence:{searches:[{query:'Key West jet ski rentals'},{query:'key west jet ski rentals'},{query:'Key West boat rentals'}]}},expect:['Key West jet ski rentals','Key West boat rentals']},
 {name:'rejects leaked CTA phrases',profile:{pipelineDebug:{selectedQueries:['Book Now Learn More hiking tours','Boston walking tours']}},expect:['Boston walking tours']}
];
let failures=0;
for(const c of cases){const actual=extractSearches(c.profile);const ok=JSON.stringify(actual)===JSON.stringify(c.expect);if(!ok){failures++;console.error(`FAIL ${c.name}:`,actual,'expected',c.expect);}else console.log(`PASS ${c.name}`);}
if(failures){console.error(`\n${failures}/${cases.length} zero-input handoff checks failed`);process.exit(1);}
console.log(`\n${cases.length}/${cases.length} zero-input handoff checks passed`);
