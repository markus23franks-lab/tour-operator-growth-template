import fs from 'node:fs';
const source=fs.readFileSync(new URL('../js/operator-analyzer.js',import.meta.url),'utf8');
const bad=['undefined','null','NaN','[object Object]'];
const liveTemplates=[...source.matchAll(/innerHTML\s*=\s*`([\s\S]*?)`/g)].map(x=>x[1]);
const failures=[];
for(const token of bad){for(const t of liveTemplates){if(t.includes('>'+token+'<')||t.includes(': '+token)||t.includes(`${token}`))failures.push(token)}}
if(!source.includes('GO\'S RESEARCH BRIEF'))failures.push('missing research brief');
if(!source.includes('GO\'s first priority:'))failures.push('research summary not owning headline');
if(!source.includes('researchIntelligence: research'))failures.push('research dossier missing from profile');
if(failures.length){console.error('FAIL presentation integrity:',failures.join(', '));process.exit(1)}
console.log('PASS presentation integrity: live Analyzer templates avoid raw sentinel leakage and research judgment owns the result narrative');