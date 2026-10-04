import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {labExperiments,labCategories,labById,labByTopic} from '../public/lab3d-registry.js';
import {experimentLink} from '../public/experiment-links.js';
import {validateQuestion3D} from '../public/question-3d.js';
const html=await readFile('public/lab3d.html','utf8');
const js=(await readFile('public/lab3d.js','utf8')).replace(/^import[^\n]+\n/gm,'');
assert.equal(new Set(labExperiments.map(x=>x.id)).size,18);
assert.deepEqual(labCategories.map(g=>labExperiments.filter(x=>x.category===g.id).length),[8,5,3,2]);
assert.deepEqual((await readdir('public/physics-lab/experiments')).filter(x=>x.endsWith('.html')).sort(),labExperiments.map(x=>x.id+'.html').sort());
for(const lab of labExperiments){
 const source=await readFile(`public/physics-lab/experiments/${lab.id}.html`,'utf8');
 const {document}=parseHTML(source);
 assert(document.querySelector('canvas'),lab.id);
 assert(!/https?:\/\/(?:fonts\.|cdnjs\.|cdn\.jsdelivr)/.test(source),`External dependency in ${lab.id}`);
 for(const script of document.querySelectorAll('script'))if(!script.src&&script.textContent.trim())new vm.Script(script.textContent,{filename:lab.id+'.html'});
 assert(source.includes('../lib/lab.js')&&source.includes('../lib/three.min.js'),lab.id);
 const {document:outer}=parseHTML(html);let address=new URL(`https://physics.example/lab3d.html?experiment=${lab.id}&theme=dark`);
 const context=vm.createContext({document:outer,URL,location:address,labExperiments,labCategories,experiments:labById,validateQuestion3D,matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem(){return null;},setItem(){},removeItem(){}},history:{replaceState(_a,_b,value){address=new URL(value);}}});
 new vm.Script(js).runInContext(context);
 assert.equal(outer.querySelector('#lab3d-title').textContent,lab.title);
 assert.equal(outer.querySelector('#lab3d-frame').getAttribute('src'),`https://physics.example/physics-lab/experiments/${lab.id}.html?theme=dark`);
 assert.equal(outer.querySelectorAll('[data-experiment][aria-pressed="true"]').length,1);
 assert.equal([...outer.querySelectorAll('[data-experiment]')].filter(b=>!b.hidden).length,labExperiments.filter(x=>x.category===lab.category).length);
 outer.querySelector('[data-category="thermal"]').click();
 assert.equal(outer.querySelector('#lab3d-title').textContent,'理想气体');
}
for(const[topic,id]of Object.entries(labByTopic)){
 const link=experimentLink(topic,{v:20,h:19.6},'https://physics.example/');
 assert.equal(link.searchParams.get('experiment'),id);
 if(topic!=='projectile')assert(!link.searchParams.has('v0'),'Independent experiments must not inherit incompatible units');
}
const shared=await readFile('public/physics-lab/lib/lab.js','utf8');
for(const helper of ['setXRange','bindShadow','player','waveColor','beam','polyline','floor'])assert(shared.includes(helper),helper);
assert(shared.includes('e.origin!==location.origin||e.source!==window.parent'));
console.log('PASS: 18 experiment scripts parse, four categories, iframe and theme routing, local dependencies, compatible course links and shared helpers. DOM checks are not browser/WebGL acceptance.');
