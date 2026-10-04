// Opt-in real-provider acceptance; consumes a small amount of model quota.
// Run against your configured server, never put a provider key in this script.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {validateQuestion3D} from '../public/question-3d.js';
const base=process.argv[2];const origin=process.argv[3];const fixture=process.argv[4];
if(!base||!origin||!fixture)throw Error('Usage: node scripts/check-qwen-live.mjs SERVER_URL PUBLIC_ORIGIN FIXTURE.png');
const session=await(await fetch(base+'/api/session')).json();
assert(session.aiConfigured&&session.visionConfigured&&session.aiProvider==='qwen');
const response=await fetch(base+'/api/register',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:`acceptance-${randomUUID()}@physics.example`,password:randomUUID()+'-QA'})});
assert.equal(response.status,200,'Test registration');
const cookie=response.headers.get('set-cookie').split(';')[0];
const post=async body=>{const res=await fetch(base+'/api/ask',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(110000)});const data=await res.json();assert.equal(res.status,200,data.error||'AI request');assert.equal(data.mode,'ai');assert.equal(typeof data.answer,'string');assert(data.answer.length>20);return data;};
try{
 const text=await post({question:'从19.6米高处以10米每秒水平抛出小球，忽略空气阻力，g=9.8 m/s²。求落地时间和射程，并生成本题演示。',topic:'projectile'});
 console.log(JSON.stringify({textSimulation:text.simulation,scene3d:text.scene3d}));
 assert.equal(text.simulation.model,'projectile');assert.equal(text.simulation.parameters.v0,10);assert.equal(text.simulation.parameters.h,19.6);
 assert.equal(validateQuestion3D(text.scene3d).experiment,'projectile');assert.equal(text.scene3d.parameters.v0,10);
 const image='data:image/png;base64,'+(await readFile(fixture)).toString('base64');
 const vision=await post({question:'识别这张题目图片并解答，生成本题演示。',image,topic:'projectile'});
 assert(/19\.6/.test(vision.recognizedText));assert(/10/.test(vision.recognizedText));assert.equal(vision.simulation.model,'projectile');assert.equal(vision.simulation.parameters.v0,10);assert.equal(vision.simulation.parameters.h,19.6);
 assert.equal(validateQuestion3D(vision.scene3d).experiment,'projectile');assert.equal(vision.scene3d.parameters.h,19.6);
 console.log(JSON.stringify({text:'PASS',vision:'PASS',recognizedText:vision.recognizedText,parameters:vision.simulation.parameters,scene3d:vision.scene3d},null,2));
}finally{await fetch(base+'/api/logout',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:'{}'});}
