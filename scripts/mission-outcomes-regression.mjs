import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const memory=new Map();
const context={window:{},URL,localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)}};
vm.createContext(context);
vm.runInContext(readFileSync('js/mission-outcomes.js','utf8'),context);
const api=context.window.GOMissionOutcomes;
const claim={website:'https://operator-one.example/tours/',claimId:'claim_0',headline:'Improve a booking path',evidenceIds:['page-a']};
const other={...claim,website:'https://operator-two.example/'};
const baseline={metric:'Direct bookings',unit:'bookings',value:'12',period:'7-day window',observedAt:'2026-09-10',source:'Booking system report'};
const reject=(fn,label)=>{try{fn();throw new Error(`Unexpected success: ${label}`)}catch(e){if(e.message.startsWith('Unexpected success'))throw e}};

reject(()=>api.reportAction(claim,{description:'Changed page',performedAt:'2026-09-12',reportedBy:'Owner',approved:true}),'action without a baseline');
api.baseline(claim,baseline);
if(api.read(other)!==null)throw new Error('another business inherited the first baseline');
reject(()=>api.reportAction(claim,{description:'Changed page',performedAt:'2026-09-12',reportedBy:'Owner'}),'action without approval attestation');
reject(()=>api.reportAction(claim,{description:'Changed page',performedAt:'2026-09-09',reportedBy:'Owner',approved:true}),'action before baseline');
api.reportAction(claim,{description:'Changed page',performedAt:'2026-09-12',reportedBy:'Owner',approved:true});
reject(()=>api.baseline(claim,{...baseline,value:'900'}),'silently changing a baseline after action');
reject(()=>api.followUp(claim,{value:'19',period:'30-day window',observedAt:'2026-09-20',source:'Booking system report'}),'comparing incompatible periods');
reject(()=>api.followUp(claim,{value:'19',period:'7-day window',observedAt:'2026-09-11',source:'Booking system report'}),'follow-up before action');
const measured=api.followUp(claim,{value:'19',period:'7-day window',observedAt:'2026-09-20',source:'Booking system report'});
if(measured.state!=='FOLLOW_UP_RECORDED'||measured.action.origin!=='OPERATOR_REPORTED'||measured.followUps[0].difference!==7||measured.followUps[0].source!=='Booking system report')throw new Error('observation lost provenance or difference');
if(Object.values(measured).some(value=>value==='GO_EXECUTED'||value==='ATTRIBUTED_REVENUE'))throw new Error('record invented GO execution or attribution');
api.baseline(other,{...baseline,value:'3'});
if(api.read(other).baseline.value!==3||api.read(claim).baseline.value!==12)throw new Error('operator records crossed');
console.log('Mission outcome regression passed');
