(()=>{
'use strict';
const out=document.getElementById('regression-results');
const summary=document.getElementById('regression-summary');
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const fixtures=[
 {name:'Moab adventure operator',location:'Moab, Utah',text:'Moab Canyon Tours offers canyoneering adventures, rock climbing guides, guided hiking in Canyonlands National Park, rappelling and climbing trips.',must:['canyoneering','rock climbing'],forbid:['gravity','book now','learn more','various packages']},
 {name:'Caribbean water operator',location:'Providenciales, Turks and Caicos',text:'Private boat charters, snorkeling tours, sunset cruises and sailing trips. Guests can book private charters and reef snorkeling experiences.',must:['private boat charters','snorkeling tours'],forbid:['learn more','groups']},
 {name:'Food tour operator',location:'New Orleans, Louisiana',text:'Guided food tours and culinary tours through New Orleans neighborhoods. Book a walking food tour with local guides.',must:['food tours'],forbid:['book now','walking food tour with local guides']},
 {name:'Desert motor operator',location:'Sedona, Arizona',text:'ATV tours, UTV adventures and jeep tours through Sedona. Guided off-road tours available daily.',must:['ATV tours','jeep tours'],forbid:['available daily']},
 {name:'Wildlife operator',location:'Monterey, California',text:'Whale watching tours, dolphin watching and sailing tours in Monterey Bay.',must:['whale watching'],forbid:['monterey bay whale watching tours in monterey bay']}
];
function ctx(f){return {combined:f.text,offers:[f.text],businessContext:{location:f.location},commercialTruth:{geography:f.location,primaryProducts:[],segments:[]}}}
function card(f,plan,portfolio,checks){
 const ok=checks.every(x=>x.ok);
 const el=document.createElement('article'); el.className=`regression-card ${ok?'pass':'fail'}`;
 el.innerHTML=`<div><strong>${f.name}</strong><span>${ok?'PASS':'FAIL'}</span></div><p><b>Plan:</b> ${plan.map(x=>x.query).join(' · ')||'none'}</p><p><b>Portfolio:</b> ${portfolio.join(' · ')||'none'}</p>${checks.filter(x=>!x.ok).map(x=>`<p class="failure">${x.message}</p>`).join('')}`;
 out.appendChild(el); return ok;
}
function run(){
 if(typeof window.buildDemandPlan!=='function'||typeof window.buildRepresentativeSearchPortfolio!=='function'){summary.textContent='Regression engine unavailable.';return}
 let pass=0;
 fixtures.forEach(f=>{
  const c=ctx(f); const plan=window.buildDemandPlan(c)||[]; const portfolio=window.buildRepresentativeSearchPortfolio(c,plan[0]||null,plan)||[]; const joined=portfolio.join(' | ').toLowerCase();
  const checks=[
   {ok:portfolio.length>0&&portfolio.length<=5,message:`Expected 1–5 representative searches, got ${portfolio.length}.`},
   {ok:new Set(portfolio.map(x=>x.toLowerCase())).size===portfolio.length,message:'Portfolio contains duplicate searches.'},
   ...f.must.map(term=>({ok:joined.includes(term.toLowerCase()),message:`Missing expected family: ${term}`})),
   ...f.forbid.map(term=>({ok:!joined.includes(term.toLowerCase()),message:`Leaked page-copy/junk phrase: ${term}`})),
   {ok:portfolio.every(q=>window.GOColdStartV3?.validQuery?.(q)!==false),message:'At least one query failed the natural-query gate.'}
  ];
  if(card(f,plan,portfolio,checks))pass++;
 });
 summary.textContent=`${pass}/${fixtures.length} cold-start fixtures passed`;
 summary.dataset.state=pass===fixtures.length?'pass':'fail';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();