import fs from 'node:fs';import vm from 'node:vm';
const s=fs.readFileSync(new URL('../js/business-dossier.js',import.meta.url),'utf8'),box={window:{}};vm.createContext(box);vm.runInContext(s,box);const build=box.window.GOBusinessDossier.build;
const base={businessName:'Dockside DVI',url:'https://docksidedvi.com',offers:['Pontoon Boat Rental','Center Console Rental'],businessContext:{location:'St. Thomas, USVI',businessType:'boat rental',transactionType:'rental'},bookingProvider:{label:'FareHarbor',provider:'fareharbor'},pages:[{url:'https://docksidedvi.com',source:'direct-html'}]};
const cases=[
 ['complete operator is ready for market judgment',()=>build(base).readyForMarketJudgment,true],
 ['transaction type is preserved before activity intent',()=>build(base).business.transactionType,'rental'],
 ['products inherit commercial model',()=>build(base).products.every(x=>x.transactionType==='rental'),true],
 ['missing location blocks downstream market judgment',()=>build({...base,businessContext:{businessType:'boat rental',transactionType:'rental'}}).readyForMarketJudgment,false],
 ['missing inventory blocks downstream market judgment',()=>build({...base,offers:[]}).blockers.includes('commercial inventory'),true],
 ['confidence distinguishes inference from observed facts',()=>build(base).confidence.transactionType,'INFERRED'],
 ['commercial truth outranks loose offer inventory',()=>build({...base,commercialTruth:{primaryProducts:[{name:'Premium Pontoon Rental',intent:'pontoon rental',score:40,evidence:['commercial detail page'],urls:['https://docksidedvi.com/pontoon']}]}}).products[0].name,'Premium Pontoon Rental'],
 ['commercial truth provenance survives dossier',()=>build({...base,commercialTruth:{primaryProducts:[{name:'Premium Pontoon Rental',intent:'pontoon rental',score:40,evidence:['commercial detail page'],urls:['https://docksidedvi.com/pontoon']}]}}).products[0].urls[0],'https://docksidedvi.com/pontoon']
];
let fail=0;for(const [name,fn,expected] of cases){const actual=fn();if(actual!==expected){fail++;console.error('FAIL '+name+': expected '+expected+', got '+actual)}else console.log('PASS '+name+': '+actual)}if(fail)process.exit(1);console.log('\n'+cases.length+'/'+cases.length+' business-dossier checks passed');