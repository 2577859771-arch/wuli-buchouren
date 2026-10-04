import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import katex from '../public/vendor/katex.js';
import {mathModules,mathPrerequisites,derivativeSample,integralSample} from '../public/math-content.js';
import {mechanicsReference,mechanicsNotes} from '../public/mechanics-notes.js';
import {lessons,references} from '../public/content.js';
import {mechanicsExtensionHTML,mathDiagram} from '../public/math-foundations.js';
import {videoLibrary} from '../public/video-library.js';
assert.equal(lessons.length,42);assert.equal(lessons.reduce((n,l)=>n+l.details.length,0),126);
assert.equal(mathModules.length,8);assert.equal(new Set(mathModules.map(m=>m.id)).size,8);
assert.equal(Object.keys(mechanicsNotes).length,14);assert.equal(Object.values(mechanicsNotes).reduce((n,m)=>n+m.notes.length,0),28);
assert.equal(references.mechanics,mechanicsReference);assert.equal(mechanicsReference.isbn,'7-04-015201-0');assert.equal(mechanicsReference.chapters.length,11);
for(const m of mathModules){for(const f of m.formulas)assert(!katex.renderToString(f,{throwOnError:true,trust:false}).includes('katex-error'));assert(m.example.steps.length>=3);assert.equal(m.check.length,2);for(const id of m.related)assert(lessons.some(l=>l.id===id));if(!['derivative','integral'].includes(m.id)){const diagram=mathDiagram(m.id);assert(diagram.includes('<title>'));assert(!/NaN|undefined|Infinity/.test(diagram));}}
for(const [id,ids]of Object.entries(mathPrerequisites)){assert(lessons.some(l=>l.id===id));assert(ids.every(id=>mathModules.some(m=>m.id===id)));}
for(const l of lessons){assert.equal(mechanicsExtensionHTML(l,'high'),'');if(l.mechanics){assert(mechanicsExtensionHTML(l,'uni').includes(l.mechanics.pages));assert.equal(l.mechanics.notes.length,2);}}
for(const t of [0,0.5,2,3])for(const dt of [0.05,0.5,1]){const s=derivativeSample(t,dt);assert.equal(s.velocity,4*t);assert.equal(s.acceleration,4);assert(Math.abs((s.nextPosition-s.position)/dt-s.secant)<1e-10);}
assert.throws(()=>derivativeSample(NaN,0.5));assert.throws(()=>derivativeSample(2,0));assert.throws(()=>derivativeSample(4,1));
for(const x of [0,0.1,0.2,0.4])for(const n of [2,8,80]){const s=integralSample(x,n);const dx=x/n;let left=0,right=0;for(let i=0;i<n;i++){left+=100*(i*dx)*dx;right+=100*((i+1)*dx)*dx;}assert(Math.abs(s.left-left)<1e-10);assert(Math.abs(s.right-right)<1e-10);assert(s.left<=s.work&&s.right>=s.work);}
assert.equal(integralSample(0.2,8).work,2);assert.throws(()=>integralSample(0.2,0));assert.throws(()=>integralSample(0.2,2.5));
const {document,window}=parseHTML(await readFile('public/index.html','utf8'));globalThis.document=document;globalThis.window=window;let hash='';globalThis.location={get hash(){return hash;},set hash(v){hash=v.startsWith('#')?v:'#'+v;}};globalThis.requestAnimationFrame=()=>{};
await import('../public/app.js');
assert.equal(document.querySelectorAll('.math-module').length,8);assert.equal(document.querySelectorAll('.math-diagram').length,8);assert.equal(document.querySelectorAll('.math-equation').length,24);assert.equal(document.querySelectorAll('.math-worked').length,8);
assert.equal(document.querySelector('#math-sidebar-entry').hidden,true);
hash='#math-integral';window.dispatchEvent(new window.Event('hashchange'));assert.equal(document.querySelector('#math-view').hidden,false);assert.equal(document.querySelector('#home-view').hidden,true);assert.equal(window.physicsApp.getState().level,'uni');assert.equal(document.querySelector('#math-sidebar-entry').hidden,false);
function input(id,value){const el=document.getElementById(id);el.value=String(value);el.dispatchEvent(new window.Event('input',{bubbles:true}));}
input('math-delta',0.05);assert(document.querySelector('#derivative-reading').textContent.includes('8.10 m/s'));
input('math-time',0);assert(document.querySelector('#derivative-reading').textContent.includes('0.00 m/s'));
input('math-extension',0);assert(document.querySelector('#integral-reading').textContent.includes('0.0000 J'));assert(!/NaN|Infinity/.test(document.querySelector('#integral-plot').innerHTML));
input('math-extension',0.4);input('math-parts',80);assert(document.querySelector('#integral-reading').textContent.includes('8.0000 J'));assert.equal(document.querySelectorAll('.math-rectangle').length,80);
hash='#energy';window.dispatchEvent(new window.Event('hashchange'));assert.equal(document.querySelector('#math-view').hidden,true);assert.equal(document.querySelectorAll('.mechanics-extra').length,2);assert(document.querySelector('#demo-details').textContent.includes('势能曲线'));
document.querySelector('[data-level="high"]').dispatchEvent(new window.Event('click',{bubbles:true}));assert.equal(document.querySelectorAll('.mechanics-extension').length,0);
hash='#math';window.dispatchEvent(new window.Event('hashchange'));document.querySelector('[data-level="high"]').dispatchEvent(new window.Event('click',{bubbles:true}));assert.equal(document.querySelector('#math-view').hidden,true);assert.equal(document.querySelector('#catalog-view').hidden,false);
assert(document.querySelector('#sources-content').textContent.includes('赵凯华、罗蔚茵'));assert(document.querySelector('#sources-content').textContent.includes('417–443'));assert(document.querySelector('#sources-content').textContent.includes('451–455'));
assert.equal(videoLibrary.filter(v=>v.status==='ready').length,4);assert.equal(videoLibrary.filter(v=>v.status==='coming').length,0);
console.log('PASS: 8 math modules, 24 validated TeX formulas, 8 independent SVGs, 2 interactive calculus tools, 14 mechanics topics / 28 notes, source mapping, university-only extensions, deep links, boundary values, unchanged courses and video slots.');
