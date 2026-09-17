import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/cold-start-judgment-v1.js',import.meta.url),'utf8');
const sandbox={window:{},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'cold-start-judgment-v1.js'});
const {assess,scope}=sandbox.window.GOColdStartJudgment;
const row=evidenceState=>({evidenceState});
const finding=()=>({kind:'opportunity',title:'legacy title',problem:'legacy problem',action:'legacy action',moneyLabel:'legacy money',severity:3,evidenceStrength:4,revenueProximity:3,actionability:4,uncertainty:0});

const cases=[
 {name:'single gap is unresolved',rows:['OBSERVED_WIN','OBSERVED_WIN','OBSERVED_GAP','UNKNOWN'],check:r=>!r.repeatedGap&&!r.healthy&&scope(finding(),{queryResults:r.__rows}).kind==='investigation'},
 {name:'healthy portfolio is investigation not SEO mission',rows:['OBSERVED_WIN','OBSERVED_WIN','OBSERVED_WIN','OBSERVED_GAP'],check:r=>r.healthy&&scope(finding(),{queryResults:r.__rows}).kind==='investigation'},
 {name:'repeated gap remains actionable',rows:['OBSERVED_WIN','OBSERVED_GAP','OBSERVED_GAP','OBSERVED_GAP'],check:r=>r.repeatedGap&&scope(finding(),{queryResults:r.__rows}).kind==='opportunity'},
 {name:'provider unknown never becomes gap',rows:['UNKNOWN','UNKNOWN','UNKNOWN'],check:r=>r.gaps===0&&scope(finding(),{queryResults:r.__rows}).moneyLabel==='Unresolved · no revenue claim'}
];
let failures=0;
for(const c of cases){const raw=c.rows.map(row),r=assess(raw);r.__rows=raw;const ok=c.check(r);if(!ok){failures++;console.error(`FAIL ${c.name}`,r);}else console.log(`PASS ${c.name}`);}
if(failures){console.error(`\n${failures}/${cases.length} Analyzer judgment checks failed`);process.exit(1);}
console.log(`\n${cases.length}/${cases.length} Analyzer judgment checks passed`);
