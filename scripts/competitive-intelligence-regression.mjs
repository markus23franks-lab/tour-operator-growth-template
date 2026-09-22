import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/competitive-intelligence.js',import.meta.url),'utf8');const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(source,sandbox);const build=sandbox.window.GOCompetitiveIntelligence.build;
const row=(state,q)=>({query:q,evidenceState:state});
const player=(name,appearances,category='direct')=>({name,appearances,queries:Array.from({length:appearances},(_,i)=>'q'+i),category,bestLocalPosition:1});
const cases=[
 ['single appearance is not strategic competitor',()=>build({market:{queryResults:[row('OBSERVED_GAP','q1'),row('OBSERVED_GAP','q2'),row('OBSERVED_WIN','q3')],players:[player('One Off Tours',1)]}}).state,'INSUFFICIENT_EVIDENCE'],
 ['repeated direct player plus target gaps creates pressure',()=>build({market:{queryResults:[row('OBSERVED_GAP','q1'),row('OBSERVED_GAP','q2'),row('OBSERVED_WIN','q3')],players:[player('Real Rival',2)]}}).state,'REPEATED_COMPETITOR_PRESSURE'],
 ['healthy target keeps repeated rival as context',()=>build({market:{queryResults:[row('OBSERVED_WIN','q1'),row('OBSERVED_WIN','q2'),row('OBSERVED_WIN','q3')],players:[player('Real Rival',3)]}}).state,'COMPETITOR_CONTEXT'],
 ['marketplace is never direct competitor',()=>build({market:{queryResults:[row('OBSERVED_GAP','q1'),row('OBSERVED_GAP','q2'),row('OBSERVED_WIN','q3')],players:[player('Viator',3,'marketplace')]}}).market.qualifiedDirect,0],
 ['authority is never direct competitor',()=>build({market:{queryResults:[row('OBSERVED_GAP','q1'),row('OBSERVED_GAP','q2'),row('OBSERVED_WIN','q3')],players:[player('Visit Louisville',3,'authority')]}}).market.qualifiedDirect,0]
];
let fail=0;for(const [name,fn,expected] of cases){const actual=fn();if(actual!==expected){fail++;console.error('FAIL '+name+': expected '+expected+', got '+actual)}else console.log('PASS '+name+': '+actual)}if(fail)process.exit(1);console.log('\n'+cases.length+'/'+cases.length+' competitive-intelligence checks passed');