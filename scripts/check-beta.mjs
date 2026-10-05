import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import worker,{betaLimits} from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');
for(const name of ['0000_careful_black_panther.sql','0001_account_recovery.sql','0002_feedback.sql'])sql.exec(await readFile('drizzle/'+name,'utf8'));
const DB={prepare(text){let args=[];return{bind(...values){args=values;return this;},async first(){return sql.prepare(text).get(...args)||null;},async run(){return sql.prepare(text).run(...args);}};}};
assert.deepEqual(betaLimits({}),{user:5,ip:15,global:20});
assert.deepEqual(betaLimits({AI_DAILY_USER_LIMIT:-1,AI_DAILY_IP_LIMIT:'bad',AI_DAILY_GLOBAL_LIMIT:1001}),{user:5,ip:15,global:20});
const origin='https://beta.example',env={DB,AI_PROVIDER:'qwen',QWEN_API_KEY:'fake-test-key',QWEN_BASE_URL:'https://model.example/v1',QWEN_MODEL:'test',QWEN_VISION_MODEL:'test',AI_DAILY_USER_LIMIT:1};
const req=(route,body,cookie)=>new Request(origin+'/api/'+route,{method:body?'POST':'GET',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});
let r=await worker.fetch(req('health'),env);assert.equal(r.status,200);let data=await r.json();assert.equal(data.database,'ok');assert.equal(data.upstreamTested,false);assert(!JSON.stringify(data).includes('fake-test-key'));
r=await worker.fetch(req('health'),{});assert.equal(r.status,503);
r=await worker.fetch(req('register',{email:'beta@example.com',password:'Strong-beta-password'}),env);assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];
const original=globalThis.fetch;let upstreamCalls=0;
globalThis.fetch=async()=>{upstreamCalls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'测试答案',simulation:{model:'none'}})}}]});};
try{r=await worker.fetch(req('ask',{question:'解释平抛'},cookie),env);assert.equal(r.status,200);r=await worker.fetch(req('session',null,cookie),env);data=await r.json();assert.equal(data.aiQuota.remaining,0);assert.equal(data.aiQuota.dailyLimit,1);r=await worker.fetch(req('ask',{question:'解释平抛'},cookie),env);assert.equal(r.status,429);assert.equal((await r.json()).code,'AI_DAILY_LIMIT');assert.equal(upstreamCalls,1);}finally{globalThis.fetch=original;sql.close();}
const html=await readFile('public/index.html','utf8');assert(html.includes('免费测试版 · BETA'));assert(html.includes('id="beta-quota"'));
console.log('Free beta: health/database failure, non-secret config, safe caps, live quota and upstream blocked after cap pass (mocked provider).');
