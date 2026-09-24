import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const dir=mkdtempSync(join(tmpdir(),'go-replay-'));
try{
 const source=join(dir,'source.json'),output=join(dir,'result.json');
 writeFileSync(source,JSON.stringify({results:[{summary:{website:'https://fixture.example'},response:{coverage:{state:'READY_FOR_JUDGMENT'},dossier:{businessName:'Fixture'},evidence:[{id:'page',surface:'FIRST_PARTY_RENDERED',observation:{url:'https://fixture.example/tour',text:'Actual product detail.'}}],signals:{},followUpPlan:{questions:[]}}}]}));
 const command=[new URL('./replay-commercial-synthesis.mjs',import.meta.url).pathname,source,output];
 const dry=spawnSync(process.execPath,command,{encoding:'utf8',env:{...process.env,GO_REPLAY_DRY_RUN:'1',GO_ALLOW_PAID_SYNTHESIS:'0',OPENAI_API_KEY:''}});
 assert.equal(dry.status,0,dry.stderr);
 assert.equal(JSON.parse(dry.stdout).state,'DRY_RUN');
 const blocked=spawnSync(process.execPath,command,{encoding:'utf8',env:{...process.env,GO_REPLAY_DRY_RUN:'0',GO_ALLOW_PAID_SYNTHESIS:'0',OPENAI_API_KEY:''}});
 assert.notEqual(blocked.status,0,'paid replay needs an explicit gate and key');
 assert.match(blocked.stderr,/GO_ALLOW_PAID_SYNTHESIS=1/);
 console.log('Archived-evidence replay cost guard passed');
}finally{rmSync(dir,{recursive:true,force:true})}
