/* Trusted adapter: validated numbers drive the original model, never AI code. */
(function(){
 'use strict';
 Lab.applyQuestion=function(parameters){
  const raw=new URLSearchParams(location.search).get('scene');if(!raw)return;
  const aside=document.querySelector('aside');const note=document.createElement('section');note.className='question-config';
  const title=document.createElement('h2');title.textContent='本题条件 · 已带入';note.append(title);aside?.prepend(note);
  try{
   if(raw.length>9000)throw Error('参数链接过长。');
   const candidate=JSON.parse(raw),actual=location.pathname.split('/').pop().replace(/\.html$/,'');
   if(candidate.experiment!==actual)throw Error('参数与当前实验不匹配。');
   const safe=window.PhysicsQuestion3D.validate(candidate),model=window.PhysicsQuestion3D.models[safe.experiment];
   for(const field of model.fields){
    if(!Object.hasOwn(safe.parameters,field.key))continue;
    const value=safe.parameters[field.key]*field.scale;parameters[field.property]=value;
    const control=field.control&&document.getElementById(field.control);
    if(control){control.step='any';control.value=String(value);}
   }
   if(safe.experiment==='induction'){
    parameters.mode=safe.parameters.mode===0?'F':'V';
    for(const id of ['F','V']){document.getElementById('m'+id).setAttribute('aria-pressed',String(parameters.mode===id));document.getElementById('row'+id).hidden=parameters.mode!==id;}
   }
   if(safe.experiment==='refraction'){
    parameters.mode=safe.parameters.n1===1?'A':'B';parameters.n=Math.max(safe.parameters.n1,safe.parameters.n2);
    const n=document.getElementById('n');n.step='any';n.value=String(parameters.n);
    for(const id of ['A','B'])document.getElementById('m'+id).setAttribute('aria-pressed',String(parameters.mode===id));
   }
   if(safe.experiment==='lens'){
    for(const[id,kind]of [['kV',1],['kC',-1]])document.getElementById(id).setAttribute('aria-pressed',String(parameters.kind===kind));
    const f=parameters.f*parameters.kind,v=f*parameters.u/(parameters.u-f);
    if(Number.isFinite(v)&&v>=.5&&v<=9){parameters.s=v;const s=document.getElementById('s');s.step='any';s.value=String(v);}
   }
   const summary=document.createElement('p');summary.textContent=model.fields.filter(f=>Object.hasOwn(safe.parameters,f.key)).map(f=>f.label+' = '+Number(safe.parameters[f.key].toPrecision(6))+' '+f.unit).join('；');note.append(summary);
   const conditions=document.createElement('p');conditions.textContent=model.note;note.append(conditions);
   for(const text of safe.assumptions){const line=document.createElement('p');line.textContent='约定 / 示意：'+text;note.append(line);}
   document.body.dataset.questionMode='ready';
   // Changing the lab controls changes the experiment; do not keep claiming it matches the question.
   aside?.addEventListener('input',()=>{title.textContent='参数已修改 · 自定义实验';document.body.dataset.questionMode='edited';},{once:true});
   aside?.addEventListener('click',event=>{if(event.target.closest('[data-e],[data-u],[data-l],[data-n],#kV,#kC,#mA,#mB,#mF,#mV')){title.textContent='条件已修改 · 自定义实验';document.body.dataset.questionMode='edited';}});
  }catch(error){
   title.textContent='无法按此题驱动 3D';const line=document.createElement('p');line.textContent=error.message+' 当前只显示默认参考场景，不代表原题。';note.append(line);document.body.dataset.questionMode='invalid';
   for(const button of document.querySelectorAll('aside input, aside select, aside button'))button.disabled=true;
  }
 };
})();
