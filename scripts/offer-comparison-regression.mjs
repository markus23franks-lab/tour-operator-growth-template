import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('../js/offer-comparison.js',import.meta.url),'utf8'),box={window:{}};vm.createContext(box);vm.runInContext(src,box);const build=box.window.GOOfferComparison.build;
const dossier={products:[{name:'Private Food Tour',family:'food tour',transactionType:'tour',price:100,duration:'3 hours',format:'private'}]};
const market=sample=>({market:{sample}});
const cases=[
 ['wrong transaction is not comparable',()=>build({dossier,pricing:market([{name:'Food Bike Rental',query:'food tour',value:150,transactionType:'rental',duration:'3 hours',format:'private',link:'a.com'}])}).matches.length,0],
 ['wrong duration is not comparable',()=>build({dossier,pricing:market([{name:'Food Tour',query:'food tour',value:150,transactionType:'tour',duration:'90 min',format:'private',link:'a.com'}])}).matches.length,0],
 ['single match stays directional',()=>build({dossier,pricing:market([{name:'Food Tour',query:'food tour',value:150,transactionType:'tour',duration:'3 hours',format:'private',link:'a.com'}])}).state,'DIRECTIONAL_MATCHES'],
 ['three matches from one source are not verified',()=>build({dossier,pricing:market([130,140,150].map(value=>({name:'Food Tour',query:'food tour',value,transactionType:'tour',duration:'3 hours',format:'private',link:'same.com'})))}).state,'DIRECTIONAL_MATCHES'],
 ['multiple independent comparable offers verify set',()=>build({dossier,pricing:market([{name:'Food Tour A',query:'food tour',value:130,transactionType:'tour',duration:'3 hours',format:'private',link:'a.com'},{name:'Food Tour B',query:'food tour',value:140,transactionType:'tour',duration:'3 hours',format:'private',link:'b.com'},{name:'Food Tour C',query:'food tour',value:150,transactionType:'tour',duration:'3 hours',format:'private',link:'c.com'}])}).state,'COMPARABLE_SET_VERIFIED']
];
let fail=0;for(const [n,fn,e] of cases){const a=fn();if(a!==e){fail++;console.error('FAIL '+n+': '+a+' != '+e)}else console.log('PASS '+n)}if(fail)process.exit(1);console.log('\n'+cases.length+'/'+cases.length+' offer-comparison checks passed');