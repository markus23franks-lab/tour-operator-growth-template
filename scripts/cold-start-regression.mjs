import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../js/cold-start-intelligence-v3.js',import.meta.url),'utf8');
const sandbox={window:{},console,fetch:async()=>{throw new Error('Network is disabled in regression');}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'cold-start-intelligence-v3.js'});
const {buildDemandPlan,buildRepresentativeSearchPortfolio,GOColdStartV3}=sandbox.window;

const fixtures=[
 {name:'Moab adventure',location:'Moab, Utah',text:'Canyoneering adventures, rock climbing guides, guided hiking in Canyonlands National Park. Book now and learn more.',must:['canyoneering','rock climbing'],forbid:['book now','learn more','gravity']},
 {name:'Caribbean water',location:'Providenciales, Turks and Caicos',text:'Private boat charters, snorkeling tours, sunset cruises and sailing trips.',must:['private boat charters','snorkeling tours'],forbid:['groups']},
 {name:'Food',location:'New Orleans, Louisiana',text:'Guided food tours and culinary tours. Book a walking food tour with local guides.',must:['food tours'],forbid:['book now','with local guides']},
 {name:'Off-road',location:'Sedona, Arizona',text:'ATV tours, UTV adventures and jeep tours. Guided off-road tours available daily.',must:['ATV tours','jeep tours'],forbid:['available daily']},
 {name:'Wildlife',location:'Monterey, California',text:'Whale watching tours, dolphin watching and sailing tours in Monterey Bay.',must:['whale watching'],forbid:['in monterey bay']},
 {name:'Museum',location:'Savannah, Georgia',text:'Museum tickets and general admission to our historic museum. View details and reserve now.',must:['museum tickets'],forbid:['view details','reserve now']},
 {name:'Bus sightseeing',location:'Nashville, Tennessee',text:'Hop-on hop-off sightseeing bus tours and city tours. Learn more about each stop.',must:['sightseeing bus tours'],forbid:['learn more']},
 {name:'Rentals',location:'Key West, Florida',text:'Jet ski rentals, boat rentals and e-bike rentals. Available daily with online booking.',must:['jet ski rentals','boat rentals','e-bike rentals'],forbid:['available daily','online booking']},
 {name:'Rental transaction beats incidental activities',location:'Virgin Islands',text:'Rent a powerboat for the day and explore at your own pace. Boat rental guests can snorkel, sail between beaches and enjoy the water. Comfort and style on your rental boat.',must:['boat rentals'],forbid:['snorkeling tours','sailing tours']},
 {name:'Walking history',location:'Boston, Massachusetts',text:'Walking tours, history tours and guided historic tours through downtown Boston.',must:['walking tours'],forbid:['through downtown']}
];

let failures=0;
for(const f of fixtures){
 const ctx={combined:f.text,offers:[f.text],businessContext:{location:f.location},commercialTruth:{geography:f.location,primaryProducts:[],segments:[]}};
 const plan=buildDemandPlan(ctx)||[];
 const portfolio=buildRepresentativeSearchPortfolio(ctx,plan[0]||null,plan)||[];
 const joined=portfolio.join(' | ').toLowerCase();
 const checks=[
  [portfolio.length>0&&portfolio.length<=5,`expected 1-5 queries, got ${portfolio.length}`],
  [new Set(portfolio.map(x=>x.toLowerCase())).size===portfolio.length,'duplicate query'],
  [portfolio.every(q=>GOColdStartV3.validQuery(q)),'natural-query gate failed'],
  ...f.must.map(term=>[joined.includes(term.toLowerCase()),`missing ${term}`]),
  ...f.forbid.map(term=>[!joined.includes(term.toLowerCase()),`leaked ${term}`])
 ];
 const bad=checks.filter(([ok])=>!ok).map(([,msg])=>msg);
 if(bad.length){failures++;console.error(`FAIL ${f.name}: ${bad.join('; ')}\n  ${portfolio.join(' | ')}`);}else console.log(`PASS ${f.name}: ${portfolio.join(' | ')}`);
}
if(failures){console.error(`\n${failures}/${fixtures.length} fixtures failed`);process.exit(1);}
console.log(`\n${fixtures.length}/${fixtures.length} fixtures passed`);
