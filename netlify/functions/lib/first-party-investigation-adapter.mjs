const MAX_PAGES=6;
const clean=v=>String(v??"").replace(/\s+/g," ").trim();
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};

export async function collectFirstPartyEvidence({website,timeoutMs=8000}){
  const root=new URL(website);const home=await fetchHtml(root.href,timeoutMs);
  const links=rankInternalLinks(home,root).slice(0,MAX_PAGES-1);
  const pages=[{url:root.href,html:home},...(await Promise.all(links.map(async url=>{try{return {url,html:await fetchHtml(url,timeoutMs)}}catch{return null}}))).filter(Boolean)];
  const observedAt=new Date().toISOString();
  const records=pages.map((page,index)=>{
    const observation=htmlToObservation(page.html,page.url);
    return {id:"ev_fp_"+hash(page.url+"|"+observation.title+"|"+index),surface:"FIRST_PARTY_RENDERED",claimType:index===0?"FIRST_PARTY_HOME":"FIRST_PARTY_PAGE",subject:{entityId:null,label:observation.title||root.hostname},observation,source:{provider:"GO Direct Fetch",url:page.url,providerRef:""},observedAt,confidence:"HIGH",status:"OBSERVED"};
  });
  return {website:root.href,records,pagesRead:pages.length};
}

async function fetchHtml(url,timeoutMs){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{const res=await fetch(url,{redirect:"follow",headers:{Accept:"text/html,application/xhtml+xml","User-Agent":"Mozilla/5.0 (compatible; GrowthOperatorResearch/1.0)"},signal:controller.signal});if(!res.ok)throw new Error("Website returned "+res.status);const html=await res.text();if(html.length<200)throw new Error("Website returned too little content");return html}finally{clearTimeout(timer)}}
function htmlToObservation(html,url){
  const title=clean(decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/<[^>]+>/g," ")));
  const headings=[...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(x=>clean(decode(x[1].replace(/<[^>]+>/g," ")))).filter(Boolean).slice(0,30);
  const bookingLinks=[];for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){const label=clean(decode(m[2].replace(/<[^>]+>/g," ")));if(/book|reserve|availability|ticket|rent/i.test(label)||/peek|fareharbor|bokun|rezdy|xola|checkfront|bookeo|rezgo|rocketrez/i.test(m[1])){try{bookingLinks.push({label,url:new URL(decode(m[1]),url).href})}catch{}}}
  const prices=[...new Set((decode(html.replace(/<[^>]+>/g," ")).match(/\$\s?\d{1,5}(?:\.\d{2})?/g)||[]))].slice(0,30);
  const text=clean(decode(html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<svg[\s\S]*?<\/svg>/gi," ").replace(/<[^>]+>/g," "))).slice(0,30000);
  return {url,title,headings,bookingLinks:dedupe(bookingLinks,x=>x.url),prices,text};
}
function rankInternalLinks(html,root){const rows=[];const seen=new Set();for(const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)){try{const u=new URL(decode(m[1]),root);if(u.origin!==root.origin||seen.has(u.href))continue;const label=clean(decode(m[2].replace(/<[^>]+>/g," "))),v=(u.pathname+" "+label).toLowerCase();if(!label||/privacy|terms|blog|news|contact|about|login|cart|faq|gallery/.test(v))continue;let score=0;if(/tour|trip|raft|rental|charter|experience|activity|admission|ticket|book|price|product/.test(v))score+=5;if(u.pathname.split("/").filter(Boolean).length<=2)score+=2;if(score){seen.add(u.href);rows.push({url:u.href,score})}}catch{}}return rows.sort((a,b)=>b.score-a.score).map(x=>x.url)}
function decode(v){return String(v||"").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&nbsp;/gi," ").replace(/&lt;/gi,"<").replace(/&gt;/gi,">")}
function dedupe(rows,key){const s=new Set();return rows.filter(x=>{const k=key(x);if(s.has(k))return false;s.add(k);return true})}
