import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {question3DModels,validateQuestion3D,normalizeQuestion3D,question3DURL,sceneFromSimulation} from '../public/question-3d.js';
import {normalizeSimulation} from '../dist/server/index.js';
const cases={projectile:{v0:12.345,h:19.6,g:9.8},incline:{th:30,ms:.3,mk:.2,v0:0,m:1,g:9.8},collision:{m1:2,m2:1,v1:3,v2:0,e:1},conical:{L:1.5,th:35,m:.5,g:9.8},pendulum:{L:1,a:8,g:9.8},spring:{m:.5,k:20,A:.21},loop:{h:3,R:1},induction:{mode:1,B:1,L:1,R:1,m:.5,v0:3},generator:{B:.5,N:100,S:.04,n:.5},lens:{kind:1,f:.2,u:.4,h:.05},doubleslit:{lam:550,d:.25,L:1.2},refraction:{n1:1.5,n2:1,i:50}};
assert.equal(Object.keys(question3DModels).length,12);
const runtime=await readFile('public/physics-lab/lib/question-runtime.js','utf8'),loader=await readFile('public/physics-lab/lib/question-loader.js','utf8');
for(const[experiment,parameters]of Object.entries(cases)){
 const safe=validateQuestion3D({experiment,parameters});
 const url=question3DURL(safe,'https://physics.example/');
 const html=await readFile(`public/physics-lab/experiments/${experiment}.html`,'utf8');
 assert(html.includes('Lab.applyQuestion(P)'),experiment);
 const {document,window}=parseHTML(html);const Lab={};
 const context=vm.createContext({document,window,Lab,URLSearchParams,location:url});
 new vm.Script(runtime).runInContext(context);new vm.Script(loader).runInContext(context);
 const P={};Lab.applyQuestion(P);
 assert.equal(document.body.dataset.questionMode,'ready',experiment);
 for(const f of question3DModels[experiment].fields){
  if(!Object.hasOwn(safe.parameters,f.key)||!f.control)continue;
  assert.equal(Number(document.getElementById(f.control).value),safe.parameters[f.key]*f.scale,experiment+':'+f.key);
 }
 if(experiment==='lens'){assert.equal(P.f,2);assert.equal(P.u,4);assert.equal(P.s,4);}
 if(experiment==='induction'){assert.equal(P.mode,'V');assert.equal(document.getElementById('rowV').hidden,false);}
 if(experiment==='refraction'){assert.equal(P.mode,'B');assert.equal(P.n,1.5);}
 const tamper=new URL(url);tamper.searchParams.set('scene',JSON.stringify({experiment,parameters:{...parameters,poison:'<script>alert(1)</script>'},assumptions:[]}));
 const checked=validateQuestion3D(JSON.parse(tamper.searchParams.get('scene')));assert(!('poison'in checked.parameters));
}
assert.throws(()=>validateQuestion3D({experiment:'projectile',parameters:{v0:1e6,h:10,g:9.8}}),/范围/);
assert.throws(()=>validateQuestion3D({experiment:'lens',parameters:{kind:0,f:.2,u:.4}}),/范围/);
assert.throws(()=>validateQuestion3D({experiment:'induction',parameters:{mode:1,B:1,L:1,R:1,m:.5}}),/初速度/);
assert.throws(()=>validateQuestion3D({experiment:'refraction',parameters:{n1:1.3,n2:1.5,i:30}}),/仅支持空气/);
assert.throws(()=>validateQuestion3D({experiment:'__proto__',parameters:{}}));
const wrong=normalizeQuestion3D({experiment:'lens',parameters:[{key:'f',value:20,unit:'cm'},{key:'u',value:.4,unit:'m'}]});assert(wrong.errors.length);assert(!('f'in wrong.parameters));
const duplicate=normalizeQuestion3D({experiment:'projectile',parameters:[{key:'h',value:10,unit:'m'},{key:'h',value:20,unit:'m'}]});assert(duplicate.errors.length);assert(!('h'in duplicate.parameters));
assert.equal(sceneFromSimulation({model:'projectile',parameters:{angle:30}}).experiment,'none');
assert.equal(normalizeSimulation({model:'projectile',parameters:[{key:'v_0',value:10,unit:'米/秒'}]}).parameters.v0,10);
const privacyLink=question3DURL({experiment:'projectile',parameters:cases.projectile,assumptions:['学生姓名和题目全文不应进入链接']},'https://physics.example/');assert(!privacyLink.href.includes('学生'));assert.deepEqual(JSON.parse(privacyLink.searchParams.get('scene')).assumptions,[]);
// Frontend form creates an inline scene only after complete validated input.
const {document,window}=parseHTML('<html data-theme="dark"><body><div id="answer"></div></body></html>');
globalThis.document=document;globalThis.window=window;globalThis.location={href:'https://physics.example/'};
globalThis.Option=function(text,value){const option=document.createElement('option');option.textContent=text;option.value=value;return option;};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this.getAttribute('data-test-value')||'';},set(value){this.setAttribute('data-test-value',value);}});
const {attachQuestion3D}=await import('../public/question-3d-card.js');
const stop=attachQuestion3D(document.querySelector('#answer'),{experiment:'projectile',parameters:cases.projectile,assumptions:[]});
const card=document.querySelector('.question-3d-card');assert(card.querySelector('.question-3d-stage').hidden);
card.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(card.querySelector('.question-3d-stage').hidden,false);
const frameURL=new URL(card.querySelector('iframe').src);assert.equal(JSON.parse(frameURL.searchParams.get('scene')).parameters.v0,12.345);
const input=card.querySelector('[data-scene-key="h"]');input.value='';input.dispatchEvent(new window.Event('input',{bubbles:true}));assert(card.querySelector('.question-3d-stage').hidden);assert(!card.querySelector('iframe').hasAttribute('src'));
card.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));assert.match(card.querySelector('.question-3d-error').textContent,/补充/);stop();
console.log('PASS: 12 question-driven 3D contracts, actual control injection, unit/scale/mode conversion, missing/range/tamper/duplicate rejection and stale iframe invalidation.');
