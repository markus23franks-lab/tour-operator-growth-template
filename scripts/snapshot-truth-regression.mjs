import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('js/growth-snapshot.js','utf8');
function render(values){
  const store=new Map(Object.entries(values).map(([key,value])=>[key,JSON.stringify(value)]));
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',style:{setProperty(){}},addEventListener(){},classList:{add(){},remove(){}}});return nodes.get(id)};
  let ready;
  const document={addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')ready=fn},getElementById:node,querySelector:()=>node('hero-action'),querySelectorAll:()=>[]};
  const ctx={document,localStorage:{getItem:key=>store.get(key)||null},setTimeout(){},console};vm.createContext(ctx);vm.runInContext(source,ctx);ready();
  return node;
}
let node=render({});
if(node('growth-score').textContent!=='—'||node('opportunity-count').textContent!==0||node('modeled-total').textContent!=='Needs connected data'||node('opportunity-list').innerHTML!=='')throw new Error('Empty Snapshot showed sample score, revenue or opportunities');
if(node('hero-action').href!=='operator-analyzer.html')throw new Error('Empty Snapshot did not lead to analysis');
const prospect={businessName:'Example Operator',website:'https://example.test/',growthScore:91,revenueOpportunity:123456,scores:{Visibility:91},opportunities:[{pillar:'Visibility',title:'Find guests',problem:'An observed gap',action:'Investigate',metric:'Qualified visits',amount:123456,sources:[]}]};
node=render({growthOperatorProspectProfile:prospect});
if(node('growth-score').textContent!=='—'||node('modeled-total').textContent!=='Needs connected data'||node('pace-estimate').textContent!=='Not modeled yet'||/\$123,456|\/100/.test(node('opportunity-list').innerHTML))throw new Error('Prospect Snapshot leaked a derived score or unsupported dollars');
if(!node('opportunity-list').innerHTML.includes('Find guests'))throw new Error('Prospect finding was lost');
const bridge=readFileSync('js/operator-opportunity-brief.js','utf8');
if(!bridge.includes('new URL(profile.website).origin===new URL(handoff.website).origin'))throw new Error('A stale Opportunity Brain could cross into another operator Snapshot');
console.log('Snapshot truth regression passed');
