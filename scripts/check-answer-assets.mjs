import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
for(const [path,type] of [['vendor/marked.js','text/javascript'],['vendor/dompurify.js','text/javascript'],['vendor/katex.js','text/javascript'],['vendor/katex.css','text/css']]){
 const r=await worker.fetch(new Request('https://physics.example/'+path),{});
 assert.equal(r.status,200);assert(r.headers.get('content-type').startsWith(type));assert((await r.text()).length>1000);
}
const font=await worker.fetch(new Request('https://physics.example/vendor/fonts/KaTeX_Main-Regular.woff2'),{});
assert.equal(font.status,200);assert.equal(font.headers.get('content-type'),'font/woff2');assert.equal(new TextDecoder().decode((await font.arrayBuffer()).slice(0,4)),'wOF2');
const html=await worker.fetch(new Request('https://physics.example/'),{}),csp=html.headers.get('content-security-policy');
assert(csp.includes("script-src 'self'"));assert(csp.includes("style-src-attr 'unsafe-inline'"));assert(!(await html.text()).includes('cdn.jsdelivr'));
console.log('Locally served open-source modules, binary fonts, correct MIME and script-safe math CSP pass.');
