(function(global){
  const clean=v=>String(v??'').trim();
  const finite=v=>Number.isFinite(Number(v))?Number(v):null;
  const STOP=new Set('turks caicos islands island the and with for from tours tour experience experiences activity activities day today'.split(' '));
  const tokens=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(x=>x.length>2&&!STOP.has(x));
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const INTENT=new Set(['private','shared','public','adults','adult','sunset','snorkel','shipwrecks','floating','charters','charter','sand','bar']);

  function pages(acq){ return acq?.pages||[]; }
  function textOf(p){return `${p?.url||''}\n${p?.markdown||''}`.toLowerCase();}
  function count(text,word){
    if(!word)return 0;
    const e=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return (text.match(new RegExp(`\\b${e}\\b`,'g'))||[]).length;
  }
  function profile(query,acq){
    const ts=tokens(query), intent=ts.filter(t=>INTENT.has(t)), descriptive=ts.filter(t=>!INTENT.has(t));
    const ps=pages(acq), home=textOf(ps[0]), all=ps.map(textOf);
    const phrase=ts.slice(-Math.min(4,ts.length)).join(' ');
    const pageScores=all.map((t,i)=>{
      const tokenHits=ts.filter(x=>count(t,x)>0).length;
      const intentHits=intent.filter(x=>count(t,x)>0).length;
      const exact=phrase.length>5 && t.includes(phrase);
      const urlHits=ts.filter(x=>(ps[i]?.url||'').toLowerCase().includes(x)).length;
      return {i,tokenHits,intentHits,exact,urlHits,score:tokenHits+(intentHits*1.4)+(exact?4:0)+(urlHits*1.2)};
    });
    const strong=pageScores.filter(x=>x.score>=Math.max(4,ts.length*.65));
    const dedicated=pageScores.filter(x=>x.urlHits>0 && x.intentHits>0);
    const homeIntent=intent.reduce((n,t)=>n+Math.min(3,count(home,t)),0);
    const allIntent=intent.reduce((n,t)=>n+all.reduce((s,p)=>s+Math.min(4,count(p,t)),0),0);
    const privateQ=/\bprivate\b/i.test(query);
    const sharedSignals=['shared','public','per person','half day','half-day','adults only','snorkel cruise','catamaran'].reduce((n,x)=>n+all.reduce((s,p)=>s+(p.includes(x)?1:0),0),0);
    const privateSignals=all.reduce((s,p)=>s+Math.min(4,count(p,'private')),0);
    let raw=strong.length*1.4 + dedicated.length*1.7 + Math.min(5,homeIntent*.7) + Math.min(5,allIntent*.18);
    if(privateQ && sharedSignals>=6 && privateSignals < sharedSignals*.8) raw-=3;
    return {query,raw,signals:{strongPages:strong.length,dedicatedPages:dedicated.length,homepageIntentSignals:homeIntent,siteIntentSignals:allIntent,privateQ,privateSignals,sharedSignals},terms:ts};
  }

  function assignRelative(profiles){
    const vals=profiles.map(x=>x.raw);
    const max=Math.max(...vals,0), min=Math.min(...vals,0);
    return profiles.map(p=>{
      const rel=max? p.raw/max:0;
      let importance='UNKNOWN';
      if(rel>=.82 && p.raw>=5) importance='CORE';
      else if(rel>=.52 && p.raw>=3) importance='SECONDARY';
      else if(p.raw>0) importance='ANCILLARY';
      // A specialized private variant should not become CORE merely because global nav/cross-sell repeats it
      // when the same public site contains materially broader shared/public excursion signals.
      if(p.signals.privateQ && p.signals.sharedSignals>=8 && p.signals.privateSignals < p.signals.sharedSignals && importance==='CORE') importance='SECONDARY';
      return {...p,importance,relativeProminence:rel};
    });
  }

  function gapSeverity(row){
    const lp=finite(row?.targetLocalPosition),op=finite(row?.targetOrganicPosition);
    if(!lp&&!op)return 'HIGH';
    if((lp&&lp>5)||(op&&op>8))return 'MEDIUM';
    return 'LOW';
  }
  const weight={CORE:4,SECONDARY:2.5,ANCILLARY:1,UNKNOWN:1.5};

  function build(market,acquisition){
    const rows=market?.queries||[];
    const profiles=assignRelative(rows.map(r=>profile(r.query,acquisition)));
    const candidates=rows.map((r,i)=>{
      const commercial=profiles[i], visible=Boolean(finite(r.targetLocalPosition)||finite(r.targetOrganicPosition));
      const severity=gapSeverity(r), evidence=market?.provider?'HIGH':'MEDIUM';
      let type='DO NOTHING',priority='LOW',reason='Current observed search evidence does not justify action.';
      if(!visible){
        type=commercial.importance==='CORE'?'CAPTURE':'INVESTIGATE';
        priority=commercial.importance==='CORE'?'HIGH':commercial.importance==='SECONDARY'?'MEDIUM':'LOW';
        reason=`A real discovery gap was observed. GO weights it as ${commercial.importance.toLowerCase()} because first-party evidence suggests that level of commercial prominence.`;
      } else if(commercial.importance==='CORE' && ((finite(r.targetLocalPosition)&&r.targetLocalPosition<=3)||(finite(r.targetOrganicPosition)&&r.targetOrganicPosition<=3))){
        type='DEFEND';priority='MEDIUM';reason='Strong observed discovery on a commercially prominent offering is an advantage to protect, not a weakness to manufacture.';
      }
      const rank=weight[commercial.importance]*10 + ({HIGH:6,MEDIUM:3,LOW:0}[severity]||0) + (type==='CAPTURE'?5:type==='DEFEND'?2:0);
      return {query:r.query,type,priority,rank,commercialImportance:commercial.importance,commercialScore:commercial.raw,evidenceConfidence:evidence,gapSeverity:severity,reason,signals:commercial.signals,observation:{localPosition:finite(r.targetLocalPosition),organicPosition:finite(r.targetOrganicPosition)}};
    }).sort((a,b)=>b.rank-a.rank);

    const coreGaps=candidates.filter(c=>c.type==='CAPTURE'&&c.commercialImportance==='CORE');
    const defended=candidates.filter(c=>c.type==='DEFEND');
    const lowerGaps=candidates.filter(c=>c.type==='INVESTIGATE');

    let priority={type:'DO NOTHING',headline:'No new search mission is justified from this sample.',reason:'GO found meaningful search strength and no core-product discovery gap strong enough to outrank it.',candidate:null};
    if(coreGaps.length){
      const c=coreGaps[0];
      priority={type:'CAPTURE',headline:'A core offering has a discovery gap worth acting on.',reason:`“${c.query}” is both commercially prominent in first-party evidence and weak in the observed search sample.`,candidate:c};
    } else if(defended.length){
      priority={type:'DEFEND',headline:'Protect the discovery territory already working.',reason:'GO sees meaningful search strength around commercially prominent offerings. The evidence does not justify manufacturing a broad SEO problem.',candidate:defended[0]};
    }

    let investigation={type:'INVESTIGATE',headline:'Find the next dollar outside obvious search fixes.',reason:'Because core search performance looks healthy, GO should next compare unanswered opportunities affecting the core business: pricing, conversion, AI discovery, product-demand whitespace, distribution and competitor momentum.',candidate:null};
    if(lowerGaps.length){
      const c=lowerGaps[0];
      investigation.reason += ` The “${c.query}” gap remains real, but GO currently weights it ${c.commercialImportance.toLowerCase()} and will not promote it simply because it is the cleanest gap.`;
    }

    return {version:'GO-OPPORTUNITY-INTELLIGENCE-V2',productHierarchy:profiles,opportunities:candidates,priority,investigation,acquisition:{available:Boolean(pages(acquisition).length),pages:pages(acquisition).length,directChars:acquisition?.directChars||0,note:acquisition?.note||'First-party evidence was used only as public prominence evidence, not revenue share.'}};
  }
  global.GOOpportunityIntelligence={build};
})(window);