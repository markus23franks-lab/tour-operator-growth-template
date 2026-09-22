import fs from 'node:fs';import vm from 'node:vm';
const box={window:{}};vm.createContext(box);vm.runInContext(fs.readFileSync(new URL('../js/offer-evidence.js',import.meta.url),'utf8'),box);
const enrich=box.window.GOOfferEvidence.enrich;
const pages=[{url:'https://example.com/private-food-tour',markdown:'# Private Food Tour\nEnjoy a private 3 hour culinary walk through downtown. From $129 per person. Book now.'}];
const base=[{name:'Private Food Tour',family:'food tour',transactionType:'tour',urls:['https://example.com/private-food-tour']}];
const x=enrich({products:base,pages})[0];const cases=[['price',x.price,129],['duration',x.duration,'3 hours'],['format',x.format,'private'],['source',x.sourceUrl,'https://example.com/private-food-tour'],['unrelated product not fabricated',enrich({products:[{name:'Ghost Tour'}],pages})[0].price,undefined]];
let fail=0;for(const [n,a,e] of cases){if(a!==e){fail++;console.error('FAIL '+n+': '+a+' != '+e)}else console.log('PASS '+n)}if(fail)process.exit(1);console.log('\n'+cases.length+'/'+cases.length+' offer-evidence checks passed');