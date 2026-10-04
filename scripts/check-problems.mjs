import assert from 'node:assert/strict';
import{parseTextProblem,validateProblem,problemDuration,problemSample,drawProblem,problemModels}from'../public/problem-physics.js';
import{lessons}from'../public/content.js';
const near=(a,b,tol=1e-8)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const specs=[{model:'projectile',parameters:{v0:10,angle:0,h:19.6,g:9.8}},{model:'linear',parameters:{v0:0,a:2,time:3}},{model:'harmonic',parameters:{m:1,k:10,amplitude:.8}},{model:'pendulum',parameters:{length:1,angle:5,g:9.8}},{model:'rc',parameters:{r:1e4,c:1e-4,u:10}},{model:'collision',parameters:{m1:2,m2:1,v1:3,v2:0,e:.5,distance:3}},{model:'lorentz',parameters:{m:9.1093837e-31,q:-1.602176634e-19,v:1e6,b:.001}}];
const proxy=new Proxy({}, {get:(obj,key)=>{if(key in obj)return obj[key];return(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),'Canvas invalid '+key);};},set:(obj,key,value)=>{obj[key]=value;return true;}});
for(const spec of specs){validateProblem(spec);const total=problemDuration(spec);for(let i=0;i<61;i++){const s=problemSample(spec,total*i/60);assert(s.values.every(a=>Number.isFinite(a[1])));drawProblem(proxy,spec,s.t);}}
near(problemDuration(specs[0]),2);near(problemSample(specs[0],2).x,20);near(problemSample(specs[1],3).x,9);near(problemSample(specs[1],3).vx,6);near(problemSample(specs[4],1).values[0][1],10*(1-Math.exp(-1)));
for(const t of[0,.5,1,2])near(problemSample(specs[5],t).values[2][1],6);near(problemSample(specs[6],0).values[0][1],.0056856301,1e-9);
for(const q of ['从 19.6 m 高处以 10 m/s 水平抛出物体，忽略空气阻力，g=9.8 m/s²。','物体从静止以 2 m/s² 的恒定加速度做直线运动，经过 3 s，求速度与位移。','串联 RC 电路中，R=10 kΩ，C=100 μF，电源电压 U=10 V，电容初始电压为零。'])assert.doesNotThrow(()=>validateProblem(parseTextProblem(q)));
assert.throws(()=>validateProblem(parseTextProblem('水平抛出，速度 10 m/s，求落地时间。')),/高度/);assert.equal(parseTextProblem('平抛，考虑空气阻力，h=20 m，v=10 m/s').model,'none');assert.throws(()=>validateProblem({model:'lorentz',parameters:{...specs[6].parameters,q:0}}));
assert.equal(lessons.reduce((n,l)=>n+l.details.length,0),126);assert(lessons.every(l=>l.details.length===3));
console.log('7 data models, physical conservation, unit conversions, 3 text examples, missing values, resistance rejection and 126 subtopics pass.');
