#!/usr/bin/env node
// A private Actions issue or manual dispatch supplies one public operator URL.
// Never interpolate issue text into a shell command or use it as a filesystem path.
import {writeFile} from 'node:fs/promises';
import {isIP} from 'node:net';

const destination=process.argv[2];
const input=process.env.GO_OPERATOR_URL?.trim();
if (!destination || !input) throw new Error('Supply a destination and one public operator URL');
if (/\s/.test(input)) throw new Error('The operator input must contain only one URL');
const url=new URL(input);
const host=url.hostname.toLowerCase();
if (url.protocol!=='https:' || url.username || url.password || url.port || isIP(host) ||
    !host.includes('.') || host==='localhost' || /\.(local|internal|localhost|test|invalid|example)$/.test(host)) {
  throw new Error('The operator must be a public HTTPS website without credentials or a custom port');
}
url.hash='';
await writeFile(destination,JSON.stringify([url.href])+'\n',{mode:0o600});
console.log(`Prepared one public operator: ${url.hostname}`);
