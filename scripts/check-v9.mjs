import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lessons} from '../public/content.js';
import {workedExamples} from '../public/worked-examples.js';
const html=await readFile('public/index.html','utf8');
assert(html.includes('src="enhance.js"'));
assert(html.includes('id="question-image"'));
assert(html.includes('aria-label="上传题目图片"'));
assert(!html.includes('static-backend'));
for(const lesson of lessons){
 const example=workedExamples[lesson.id];
 assert(example?.q&&example.ans&&example.tip,lesson.id);
 assert(example.steps.length,lesson.id);
 if(example.fig){const svg=typeof example.fig==='function'?example.fig():example.fig;assert(svg.includes('<svg'));assert(!/NaN|undefined/.test(svg),lesson.id);}
}
const community=await readFile('public/community.js','utf8');
assert(community.includes('image:sentImage'));
assert(community.includes('data.recognizedText'));
assert(community.includes('quantityTable(data.quantities)'));
assert(!community.includes('window.fetch='));
console.log('V9 examples complete; hosted upload, recognition and server API preserved; static shim not loaded.');
