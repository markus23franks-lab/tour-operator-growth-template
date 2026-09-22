import fs from 'node:fs';import vm from 'node:vm';
function load(path,key){const s=fs.readFileSync(new URL(path,import.meta.url),'utf8'),box={window:{}};vm.createContext(box);vm.runInContext(s,box);return box.window[key]}
const intel=load('../js/positioning-intelligence.js','GOPositioningIntelligence'),compare=load('../js/positioning-comparison.js','GOPositioningComparison');
const acq=text=>({pages:[{url:'https://x.test',source:'direct-html',markdown:text}]});
const own=intel.build(acq('Family owned small group tours with expert local guides.'));
const parityA={name:'A',positioning:intel.build(acq('Family owned small group tours.'))},parityB={name:'B',positioning:intel.build(acq('Family-run intimate groups with local guides.'))};
const distinctA={name:'A',positioning:intel.build(acq('Award-winning tours with professional guides.'))},distinctB={name:'B',positioning:intel.build(acq('Private tours with certified guides.'))};
const cases=[
 ['first party positioning is positively observed',()=>own.signals.length>=3,true],
 ['shared generic claims produce category parity',()=>compare.build({operator:own,competitors:[parityA,parityB]}).state,'CATEGORY_PARITY'],
 ['relative difference requires two compared competitors',()=>compare.build({operator:own,competitors:[distinctA]}).state,'INSUFFICIENT_EVIDENCE'],
 ['relative difference can emerge after two competitor reads',()=>compare.build({operator:own,competitors:[distinctA,distinctB]}).state,'POTENTIAL_DIFFERENTIATION']
];
let fail=0;for(const [name,fn,expected] of cases){const actual=fn();if(actual!==expected){fail++;console.error('FAIL '+name+': expected '+expected+', got '+actual)}else console.log('PASS '+name+': '+actual)}if(fail)process.exit(1);console.log('\n'+cases.length+'/'+cases.length+' positioning checks passed');