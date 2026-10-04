import {question3DModels,validateQuestion3D,question3DURL} from './question-3d.js';
const element=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};
export function attachQuestion3D(parent,candidate){
 const card=element('section','question-3d-card');card.append(element('p','section-kicker','YOUR QUESTION / IN THREE DIMENSIONS'),element('h3',null,'让这道题，在 3D 中发生'));
 if(!candidate||!Object.hasOwn(question3DModels,candidate.experiment)){
  card.append(element('p','question-3d-note',candidate?.reason||'这道题暂未匹配可带入题目条件的 3D 实验。'),element('p','question-3d-note','目前 12 类实验支持按参数驱动；其他题目仍可查看解答和适用的二维过程。不自动编造三维场景。'));
  const link=element('a','text-link','浏览 18 个 3D 参考实验 ↗');link.href='./lab3d.html';card.append(link);parent.append(card);return ()=>{};
 }
 const model=question3DModels[candidate.experiment];
 card.append(element('p','question-3d-note','匹配实验：'+model.title+'。'+model.note));
 if(candidate.assumptions?.length)card.append(element('p','question-3d-note','解析时采用的条件：'+candidate.assumptions.join('；')));
 const form=element('form','question-3d-form'),fields=element('div','question-3d-fields'),notice=element('p','question-3d-note'),error=element('p','question-3d-error');error.setAttribute('role','alert');
 const button=element('button','primary','核对数据，生成本题 3D 演示');button.type='submit';
 const stage=element('div','question-3d-stage');stage.hidden=true;
 const status=element('p','question-3d-note');status.setAttribute('role','status');
 const frame=element('iframe');frame.title=model.title+' · 本题数据的三维演示';frame.setAttribute('allow','fullscreen');frame.setAttribute('referrerpolicy','no-referrer');frame.loading='lazy';
 const standalone=element('a','text-link','全屏实验室中打开本题 ↗');standalone.target='_blank';standalone.rel='noopener noreferrer';
 stage.append(status,frame,standalone);form.append(fields,notice,button,error);card.append(form,stage);parent.append(card);
 const draft={...candidate.parameters};let assumptions=[];let initialErrors=candidate.errors||[];const defaultNotes=new Map();let edited=false;
 const selectorName=(f,v)=>f.key==='kind'?(v===1?'凸透镜':'凹透镜'):f.key==='mode'?(v===0?'恒力从静止拉动':'给初速后自由滑行'):String(v);
 function renderFields(){
  fields.replaceChildren();assumptions=[...(candidate.assumptions||[])];defaultNotes.clear();
  for(const f of model.fields){
   if(f.when&&!Object.entries(f.when).every(([key,value])=>draft[key]===value))continue;
   const label=element('label');label.append(element('span',null,f.label+' / '+(f.unit||'无量纲')));
   const input=element(f.values?'select':'input');input.dataset.sceneKey=f.key;input.setAttribute('aria-label','3D · '+f.label);input.required=true;
   if(f.values){input.append(new Option('请选择',''));for(const v of f.values)input.append(new Option(selectorName(f,v),String(v)));}
   else{input.type='number';input.step=f.integer?'1':'any';input.min=String(f.min);input.max=String(f.max);input.placeholder='待补充';}
   if(Number.isFinite(draft[f.key]))input.value=String(draft[f.key]);
   else if(f.defaultValue!==undefined){input.value=String(f.defaultValue);defaultNotes.set(f.key,f.defaultNote);label.append(element('small',null,f.defaultNote));}
   label.append(input);fields.append(label);
  }
  notice.textContent='缺少的数据会留空；带“示意 / 约定”的值不是识图得到的题目数据。生成后可旋转视角，并用实验内的开始/释放按钮观察。';
  error.textContent=initialErrors.join(' ');
 }
 fields.addEventListener('input',event=>{
  const key=event.target.dataset.sceneKey;if(!key)return;draft[key]=event.target.value===''?undefined:Number(event.target.value);
  edited=true;defaultNotes.delete(key);event.target.closest('label')?.querySelector('small')?.remove();initialErrors=[];error.textContent='';stage.hidden=true;frame.removeAttribute('src');status.textContent='数据已改变，请重新生成。';
 });
 fields.addEventListener('change',event=>{if(model.fields.find(f=>f.key===event.target.dataset.sceneKey)?.values)renderFields();});
 form.addEventListener('submit',event=>{
  event.preventDefault();error.textContent='';
  try{
   if(initialErrors.length)throw Error('请先核对并修改存在单位/格式问题的参数。'+initialErrors.join(' '));
   const parameters={};for(const input of fields.querySelectorAll('[data-scene-key]'))if(input.value!=='')parameters[input.dataset.sceneKey]=Number(input.value);
   const safe=validateQuestion3D({experiment:candidate.experiment,parameters,assumptions:[...assumptions,...defaultNotes.values(),...(edited?['参数经用户核对修改，以本次参数卡数值为准。']:[])]});
   const src=question3DURL(safe,location.href),link=question3DURL(safe,location.href,true),theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
   src.searchParams.set('theme',theme);link.searchParams.set('theme',theme);
   frame.src=src.href;standalone.href=link.href;stage.hidden=false;status.textContent='正在把本题数值带入本站原有三维实验…';stage.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  }catch(e){stage.hidden=true;frame.removeAttribute('src');error.textContent=e.message;}
 });
 frame.addEventListener('load',()=>{if(frame.hasAttribute('src'))status.textContent='实验页面已加载。请核对实验内“本题条件”卡；引擎状态以实验内提示为准。';});
 renderFields();
 return ()=>{frame.removeAttribute('src');card.remove();};
}
