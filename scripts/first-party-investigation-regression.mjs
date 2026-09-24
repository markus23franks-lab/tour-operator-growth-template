import {collectFirstPartyEvidence} from '../netlify/functions/lib/first-party-investigation-adapter.mjs';
let calls=[];global.fetch=async (url,opts={})=>{calls.push({url:String(url),opts});if(String(url).includes('firecrawl'))return {ok:true,status:200,json:async()=>({success:true,data:{markdown:'# Raft Co\nBook our self-guided rafting rental from $99.\n[Book now](https://book.example)\n'.repeat(12),links:['https://book.example'],screenshot:'https://shot.example/a.png',metadata:{title:'Raft Co',sourceURL:'https://raft.example'}}})};return {ok:true,status:200,text:async()=>'<html><title>Fallback Tours</title><body><h1>Fallback Tour Company</h1><p>Book our guided tour for $50. This fixture contains enough first-party content to exercise the direct HTML acquisition fallback when a rendered provider is not configured. Explore our experiences, availability, departure information and traveler details before booking.</p><a href="/tour">View Tour</a></body></html>'}};
let fail=0;const check=(n,a,e)=>{if(JSON.stringify(a)!==JSON.stringify(e)){fail++;console.error('FAIL',n,{a,e})}else console.log('PASS',n)};
const rendered=await collectFirstPartyEvidence({website:'https://raft.example',firecrawlApiKey:'test'});
check('prefers rendered provider when configured',rendered.provider,'Firecrawl');
check('preserves screenshot as evidence observation',rendered.records[0].observation.screenshot,'https://shot.example/a.png');
check('rendered page remains normalized evidence',rendered.records[0].surface,'FIRST_PARTY_RENDERED');
const fallback=await collectFirstPartyEvidence({website:'https://fallback.example',firecrawlApiKey:''});
check('direct fetch remains fallback',fallback.records[0].source.provider,'GO Direct Fetch');
global.fetch=async url=>String(url).includes('firecrawl')?{ok:true,status:200,json:async()=>({success:true,data:{markdown:('# Canine tickets start at $46; a $1,000 charity donation is separate.\n').repeat(8),metadata:{title:'Canine'}}})}:{ok:true,status:200,text:async()=>'<html><title>Canine</title><p>Canine tickets start at $46; a $1,000 charity donation is separate. '.repeat(5)+'</p></html>'};
for(const [name,key] of [['rendered','test'],['direct','']]){
 const result=await collectFirstPartyEvidence({website:'https://canine.example',firecrawlApiKey:key});
 check(name+' preserves thousands separator',result.records[0].observation.prices.includes('$1,000'),true);
 check(name+' does not fabricate $1 price',result.records[0].observation.prices.includes('$1'),false);
}
const navigation=['/cruises/architecture','/cruises/night','/cruises/canine','/cruises/creepy','/cruises/sightseeing','/private-events','/weddings'].map(x=>`<a href="${x}">${x.slice(1).replaceAll('-',' ')}</a>`).join('');
global.fetch=async url=>({ok:true,status:200,text:async()=>'<html><title>Multi-product operator</title>'+navigation+'<p>'+String(url)+' Product details and booking information for a guided operator. '.repeat(4)+'</p></html>'});
const diverse=await collectFirstPartyEvidence({website:'https://multi.example',firecrawlApiKey:''});
check('bounded crawler retains cross-family private events page',diverse.records.some(x=>x.observation.url==='https://multi.example/private-events'),true);
check('bounded crawler retains cross-family weddings page',diverse.records.some(x=>x.observation.url==='https://multi.example/weddings'),true);
check('bounded crawler remains within six pages',diverse.pagesRead,6);
global.fetch=async()=>({ok:true,status:200,text:async()=>'<html><title>Private Events</title><p>Contact our charter sales team at chartersales@operator.example for availability. '.repeat(5)+'</p><a href="mailto:bookings@vendor.example">bookings@vendor.example</a></html>'});
const contact=await collectFirstPartyEvidence({website:'https://operator.example/private-events',firecrawlApiKey:''});
check('sales contact retained as typed evidence',contact.records[0].observation.contactEmails.includes('chartersales@operator.example'),true);
check('vendor mailto is not labeled a booking link',contact.records[0].observation.bookingLinks.length,0);
if(fail)process.exit(1);console.log('\nFirst-party rendered acquisition regression passed');
