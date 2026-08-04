"use strict";
const assessment = read("growthOperatorAssessment", {});
const form = document.getElementById("audit-form");
const urlInput = document.getElementById("audit-url");
const workspace = document.getElementById("analysis-workspace");
const results = document.getElementById("results");
const errorPanel = document.getElementById("error-panel");
const log = document.getElementById("run-log");
const masterBar = document.getElementById("master-bar");
const runTitle = document.getElementById("run-title");
const runState = document.getElementById("run-state");
let latestAudit = null;

urlInput.value = assessment.website || "";
form.addEventListener("submit", async (event) => { event.preventDefault(); await runAudit(urlInput.value); });
document.getElementById("try-again").addEventListener("click", () => { errorPanel.hidden=true; urlInput.focus(); });
document.getElementById("send-dashboard").addEventListener("click", () => { if(latestAudit){ localStorage.setItem("growthOperatorLiveAudit", JSON.stringify(latestAudit)); window.location.href="dashboard.html"; }});

async function runAudit(rawUrl){
  const url=normalizeUrl(rawUrl); if(!url){ showError("Enter a complete public website address, such as https://example.com."); return; }
  reset(); workspace.hidden=false; runTitle.textContent="Connecting to the website";
  const steps=["Confirming the public website","Running a mobile Lighthouse test","Measuring performance and SEO","Reviewing accessibility and best practices","Translating technical audits into business findings"];
  steps.forEach((step,index)=>setTimeout(()=>addLog(step,index),index*460));
  try{
    const endpoint=new URL("https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url",url); endpoint.searchParams.set("strategy","mobile");
    ["performance","seo","accessibility","best-practices"].forEach(c=>endpoint.searchParams.append("category",c));
    const response=await fetch(endpoint.toString());
    if(!response.ok){ const body=await response.json().catch(()=>({})); throw new Error(body?.error?.message || `Google returned ${response.status}.`); }
    const data=await response.json();
    latestAudit=translateAudit(url,data);
    completeRun(latestAudit);
  }catch(error){ showError(`${error.message} PageSpeed can occasionally rate-limit requests without an API key. Try again in a moment or test another public URL.`); }
}
function reset(){latestAudit=null;results.hidden=true;errorPanel.hidden=true;log.innerHTML="";masterBar.style.width="0%";document.querySelectorAll("[data-score]").forEach(row=>{row.querySelector("strong").textContent="--";row.querySelector("b").style.width="0%";});}
function addLog(text,index){const row=document.createElement("div");row.className="log-row";row.innerHTML=`<span>${index+1}</span><strong>${text}</strong><small>Working…</small>`;log.appendChild(row);masterBar.style.width=`${Math.min(82,(index+1)*16)}%`;setTimeout(()=>{row.classList.add("complete");row.querySelector("span").textContent="✓";row.querySelector("small").textContent="Complete";},520);}
function completeRun(audit){masterBar.style.width="100%";runTitle.textContent="Live website check complete";runState.innerHTML="✓ COMPLETE";renderScores(audit.categories);renderResults(audit);results.hidden=false;results.scrollIntoView({behavior:"smooth",block:"start"});}
function renderScores(categories){Object.entries(categories).forEach(([key,value])=>{const row=document.querySelector(`[data-score="${key}"]`);if(!row)return;row.querySelector("strong").textContent=value;row.querySelector("b").style.width=`${value}%`;});}
function renderResults(audit){document.getElementById("results-summary").textContent=`We measured ${audit.url} on mobile and translated the strongest signals into plain-English business findings.`;document.getElementById("metric-strip").innerHTML=[['Largest contentful paint',audit.metrics.lcp],['Total blocking time',audit.metrics.tbt],['Layout shift',audit.metrics.cls],['Speed index',audit.metrics.speedIndex]].map(([label,value])=>`<article class="metric"><small>${label.toUpperCase()}</small><strong>${value}</strong></article>`).join("");document.getElementById("live-findings").innerHTML=audit.findings.map((f,i)=>`<article class="live-finding"><span class="number">${String(i+1).padStart(2,'0')}</span><div><small>${f.pillar.toUpperCase()} • ${f.source}</small><h3>${f.title}</h3><p>${f.summary}</p></div><span class="status">${f.status}</span><div class="finding-more"><div><strong>WHAT WE FOUND</strong><p>${f.found}</p></div><div><strong>WHAT WE'D DO</strong><p>${f.recommendation}</p></div><div><strong>EXPECTED RESULT</strong><p>${f.expected}</p></div></div></article>`).join("");}
function translateAudit(url,data){const cats=data.lighthouseResult?.categories||{};const audits=data.lighthouseResult?.audits||{};const categories={performance:score(cats.performance),seo:score(cats.seo),accessibility:score(cats.accessibility),bestPractices:score(cats['best-practices'])};const candidates=[];
  addCategoryFinding(candidates,"Conversion","➤","Mobile performance is slowing the customer journey",categories.performance,`The mobile performance score is ${categories.performance}/100.`,"A slow or unstable page creates friction before a traveler ever reaches booking.","Start with the largest performance opportunities, especially heavy images, blocking resources, and unused code.","A faster path from landing page to booking action.","Lighthouse performance");
  addCategoryFinding(candidates,"Visibility","◎","Strengthen the website's search foundation",categories.seo,`The measured SEO fundamentals score is ${categories.seo}/100.`,"Search engines need clear, crawlable page signals before they can consistently send qualified travelers.","Fix failed SEO audits first, then build location and activity pages around high-intent searches.","More qualified organic visibility over time.","Lighthouse SEO");
  addCategoryFinding(candidates,"Trust","★","Remove accessibility barriers from the experience",categories.accessibility,`The accessibility score is ${categories.accessibility}/100.`,"Readable, usable pages build confidence and help more travelers complete the journey.","Correct contrast, labels, image text alternatives, and navigation issues identified by the audit.","A clearer experience for more guests and stronger overall usability.","Lighthouse accessibility");
  addCategoryFinding(candidates,"Operations","⚙","Clean up website best-practice issues",categories.bestPractices,`The best-practices score is ${categories.bestPractices}/100.`,"Technical warnings can create reliability, security, or experience problems that staff cannot easily see.","Resolve the highest-impact failed best-practice audits and retest after deployment.","A more reliable website with fewer hidden technical risks.","Lighthouse best practices");
  const failed=Object.values(audits).filter(a=>a && a.scoreDisplayMode!=="notApplicable" && typeof a.score==="number" && a.score<.9 && a.title).sort((a,b)=>(a.score??1)-(b.score??1));
  failed.slice(0,3).forEach((a,index)=>{const map=auditToFinding(a,index);if(map)candidates.push(map)});
  const findings=dedupe(candidates).sort((a,b)=>a.score-b.score).slice(0,5);
  return {url,categories,metrics:{lcp:display(audits['largest-contentful-paint']),tbt:display(audits['total-blocking-time']),cls:display(audits['cumulative-layout-shift']),speedIndex:display(audits['speed-index'])},findings,completedAt:new Date().toISOString(),source:"Google PageSpeed Insights / Lighthouse",strategy:"mobile"};}
function addCategoryFinding(arr,pillar,icon,title,value,found,why,recommendation,expected,source){arr.push({id:`${pillar.toLowerCase()}-live`,pillar,icon,title,summary:why,found,why,recommendation,expected,evidence:`${source}: ${value}/100`,score:value,status:value>=90?"Strength":value>=70?"Opportunity":"Needs attention",tone:value>=90?"strength":"opportunity",source});}
function auditToFinding(a,index){const id=a.id||`audit-${index}`;const title=a.title||"Website improvement";const desc=strip(a.description||a.displayValue||"");let pillar="Conversion",icon="➤";if(/seo|crawl|meta|title|link|robots|canonical/i.test(id+title)){pillar="Visibility";icon="◎"}else if(/contrast|aria|alt|label|access/i.test(id+title)){pillar="Trust";icon="★"}else if(/https|security|error|deprecated|console/i.test(id+title)){pillar="Operations";icon="⚙"}return{id,pillar,icon,title,summary:desc||"The live audit identified a measurable website issue worth reviewing.",found:`Lighthouse flagged “${title}” during the mobile test${a.displayValue?` (${a.displayValue})`:""}.`,why:desc||"This can create friction, reduce confidence, or weaken search performance.",recommendation:`Review the affected page elements, correct the issue, publish the change, and rerun this check.`,expected:`A cleaner customer journey and a stronger measured website signal.`,evidence:`Lighthouse audit: ${id}`,score:Math.round((a.score??0)*100),status:"Live finding",tone:"opportunity",source:"Lighthouse audit"};}
function dedupe(items){const seen=new Set();return items.filter(item=>{const key=item.title.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});}
function score(cat){return Math.round((cat?.score??0)*100)}function display(a){return a?.displayValue||"Not available"}function strip(value){return value.replace(/\[([^\]]+)\]\([^\)]+\)/g,"$1").replace(/<[^>]*>/g,"").trim()}function normalizeUrl(value){try{const v=/^https?:\/\//i.test(value.trim())?value.trim():`https://${value.trim()}`;const u=new URL(v);return u.hostname.includes('.')?u.toString():null}catch{return null}}function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}function showError(message){workspace.hidden=true;results.hidden=true;errorPanel.hidden=false;document.getElementById("error-message").textContent=message;errorPanel.scrollIntoView({behavior:"smooth"});}