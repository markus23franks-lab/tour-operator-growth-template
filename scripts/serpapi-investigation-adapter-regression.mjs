import {collectSearchSurfaces} from '../netlify/functions/lib/serpapi-investigation-adapter.mjs';
let calls=[];global.fetch=async url=>{calls.push(String(url));const u=new URL(url);const engine=u.searchParams.get('engine');return {ok:true,status:200,json:async()=>engine==='google'?{organic_results:[{position:1,title:'Operator',link:'https://operator.example'}],local_results:{places:[{position:2,title:'Operator',place_id:'a'}]}}:{local_results:[{position:1,title:'Operator',place_id:'a'},{position:3,title:'Operator',place_id:'b'}]}}};
const result=await collectSearchSurfaces({query:'sample tours',location:'Sample, UT',apiKey:'test'});
let fail=0;const check=(n,a,e)=>{if(JSON.stringify(a)!==JSON.stringify(e)){fail++;console.error('FAIL',n,{a,e})}else console.log('PASS',n)};
check('queries organic and local independently',calls.length,2);
check('preserves organic evidence',result.payload.organic_results.length,1);
check('merges and dedupes local entities',result.payload.local_results.places.map(x=>x.place_id),['a','b']);
check('both surfaces observed',result.surfaceStatus,{organic:'OBSERVED',local:'OBSERVED'});
if(fail)process.exit(1);console.log('\nSerpApi Investigation adapter regression passed');
