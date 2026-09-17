import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/opportunity-brain.js',import.meta.url),'utf8');
const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'opportunity-brain.js'});
const build=sandbox.window.GOOpportunityBrain.build;

const UNKNOWN='UNKNOWN',WIN='OBSERVED_WIN',GAP='OBSERVED_GAP';
const rows=states=>states.map((evidenceState,i)=>({query:`q${i+1}`,evidenceState}));
const baseline={pricing:{state:'INSUFFICIENT_EVIDENCE'},trust:{state:'INSUFFICIENT_EVIDENCE'},conversion:{state:'INSUFFICIENT_EVIDENCE'}};
const discoveryState=(states,legacy=null)=>build({market:{queries:rows(states)},discoveryOpportunity:legacy,...baseline}).candidates.find(x=>x.sense==='DISCOVERY');

const cases=[
 {name:'provider unknown never becomes gap',actual:()=>discoveryState([UNKNOWN,UNKNOWN,UNKNOWN]).state,expected:'UNKNOWN'},
 {name:'single gap stays unresolved',actual:()=>discoveryState([WIN,WIN,GAP,UNKNOWN]).state,expected:'UNKNOWN'},
 {name:'mixed 2 wins 1 gap stays unresolved',actual:()=>discoveryState([WIN,WIN,GAP]).state,expected:'UNKNOWN'},
 {name:'repeated gaps become opportunity',actual:()=>discoveryState([WIN,GAP,GAP,GAP]).state,expected:'OPPORTUNITY'},
 {name:'strong visibility is healthy',actual:()=>discoveryState([WIN,WIN,WIN,GAP]).state,expected:'HEALTHY'},
 {name:'insufficient verified coverage stays unresolved',actual:()=>discoveryState([GAP,GAP,UNKNOWN,UNKNOWN,UNKNOWN]).state,expected:'UNKNOWN'},
 {name:'pricing opportunity can lead when evidence supports it',actual:()=>build({market:{queries:rows([WIN,WIN,WIN])},discoveryOpportunity:null,pricing:{state:'PRICING_POWER_CANDIDATE',operator:{median:120},market:{median:180},deltaPct:50,research:{verified:5}},trust:{state:'INSUFFICIENT_EVIDENCE'},conversion:{state:'INSUFFICIENT_EVIDENCE'}}).primary.sense,expected:'PRICING'},
 {name:'conversion unknown is not labeled a problem',actual:()=>build({market:{queries:rows([WIN,WIN,WIN])},discoveryOpportunity:null,pricing:{state:'INSUFFICIENT_EVIDENCE'},trust:{state:'INSUFFICIENT_EVIDENCE'},conversion:{state:'INSUFFICIENT_EVIDENCE'}}).candidates.find(x=>x.sense==='CONVERSION').state,expected:'UNKNOWN'}
];

let failures=0;
for(const c of cases){const actual=c.actual();if(actual!==c.expected){failures++;console.error(`FAIL ${c.name}: expected ${c.expected}, got ${actual}`);}else console.log(`PASS ${c.name}: ${actual}`);}
if(failures){console.error(`\n${failures}/${cases.length} judgment checks failed`);process.exit(1);}
console.log(`\n${cases.length}/${cases.length} judgment checks passed`);
