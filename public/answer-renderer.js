import {Marked} from './vendor/marked.js';
import DOMPurify from './vendor/dompurify.js';
import katex from './vendor/katex.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// AI output is data, never executable HTML. Parse math before Markdown so TeX
// backslashes and subscripts survive. Sanitize HTML before rendering safe math.
export function renderAnswer(element,text){
 const formulas=[];
 const extension=(name,level,pattern,display)=>({name,level,
  start:src=>{const a=src.indexOf(display?'$$':'$'),b=src.indexOf(display?'\\[':'\\(');return a<0?b:b<0?a:Math.min(a,b);},
  tokenizer(src){const match=pattern.exec(src);if(match)return{type:name,raw:match[0],formula:match[1]??match[2]};},
  renderer(token){const id=formulas.push({source:token.formula,display})-1;return `<${display?'div':'span'} data-formula-slot="${id}"></${display?'div':'span'}>`;}
 });
 const parser=new Marked({gfm:true,breaks:true,renderer:{html:token=>escape(token.text),image:token=>escape(token.text||'配图')}});
 parser.use({extensions:[
  extension('blockFormula','block',/^(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])(?:\n|$)/,true),
  extension('inlineFormula','inline',/^(?:\$(?!\$)([^\n$]+?)\$|\\\(([\s\S]+?)\\\))/,false)
 ]});
 try{
  element.innerHTML=DOMPurify.sanitize(parser.parse(String(text)),{USE_PROFILES:{html:true},FORBID_TAGS:['img','style','form','input','button'],FORBID_ATTR:['style']});
  for(const slot of element.querySelectorAll('[data-formula-slot]')){
   const formula=formulas[Number(slot.dataset.formulaSlot)];if(!formula)continue;
   katex.render(formula.source,slot,{displayMode:formula.display,throwOnError:false,trust:false,strict:'ignore',maxExpand:500,maxSize:20,output:'htmlAndMathml'});
  }
  for(const link of element.querySelectorAll('a')){
   const href=link.getAttribute('href')||'';
   if(!/^https:\/\//i.test(href)&&!href.startsWith('#'))link.removeAttribute('href');
   link.rel='noopener noreferrer';link.target='_blank';
  }
  element.classList.add('answer-rich');
 }catch{element.replaceChildren(document.createTextNode(String(text)));}
}

export function quantityTable(quantities){
 const wrapper=document.createElement('div');wrapper.className='quantity-table-scroll';
 const table=document.createElement('table');table.className='quantity-table';
 const caption=document.createElement('caption');caption.textContent='题目数据与依据';table.append(caption);
 const head=document.createElement('thead'),row=document.createElement('tr');
 for(const title of ['物理量','数值与单位','识别／计算依据']){const cell=document.createElement('th');cell.scope='col';cell.textContent=title;row.append(cell);}head.append(row);table.append(head);
 const body=document.createElement('tbody');
 for(const q of quantities){const row=document.createElement('tr');for(const value of [q.label,q.value===null?'待核对':`${q.value} ${q.unit}`,q.evidence]){const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);}body.append(row);}table.append(body);wrapper.append(table);return wrapper;
}
