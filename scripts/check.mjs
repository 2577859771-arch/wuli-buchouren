import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lessons,visibleLessons,formulaList} from '../public/content.js';
import {models,modelScene} from '../public/models.js';
import {sample,duration,initialParameters,controls,validateParameters} from '../public/physics.js';
import {mechanicalScene,electricalScene} from '../public/scenes.js';
for(const l of lessons){assert(l.demo,'missing demo '+l.id);assert(controls[l.id],l.id);assert(l.example);for(const level of l.levels)assert(formulaList(l,level).length>=2,l.id);for(const c of controls[l.id])for(const value of c.options?c.options.map(x=>x.value):[c.min,c.max]){const p={...initialParameters[l.id],[c.key]:value};validateParameters(l.id,p);const total=duration(l.id,p);for(const t of [0,total/2,total]){const s=sample(l.id,p,t);for(const[k,v]of Object.entries(s))if(typeof v==='number')assert(Number.isFinite(v),l.id+' '+k);for(const v of s.values||[])assert(v[1]===null||Number.isFinite(v[1]),l.id+' '+v);const svg=models[l.id]?modelScene(l.id,p,s):['projectile','harmonic'].includes(l.id)?mechanicalScene(l.id,p,s,true,true):electricalScene(l.id,p,s,true,true);assert(!/NaN|Infinity|undefined/.test(svg),l.id+' SVG');}}}
assert.equal(sample('projectile',initialParameters.projectile,2).x,20);assert.equal(sample('projectile',initialParameters.projectile,2).y,0);assert.equal(sample('newton',initialParameters.newton,0).values[0][1],3);assert.equal(sample('interference',initialParameters.interference).values[0][1],2);
console.log('All lesson models render finite boundary results');
