// Trusted model contracts only. Model responses never supply executable code.
const field=(key,label,unit,min,max,control=key,property=key,scale=1,extra={})=>({key,label,unit,min,max,control,property,scale,...extra});
// Only alternate spellings of the SAME unit; never silently reinterpret cm as m.
export function canonicalPhysicsUnit(value){
 if(typeof value!=='string')return null;const unit=value.trim().replace(/\s+/g,'');
 const aliases={'米':'m','米/秒':'m/s','m/s^2':'m/s²','米/秒²':'m/s²','米/秒^2':'m/s²','m·s⁻¹':'m/s','m·s⁻²':'m/s²','千克':'kg','度':'°','rad':'rad','N*m':'N·m','N/m':'N/m','N*s/m':'N·s/m','N·s/m':'N·s/m','欧姆':'Ω','ohm':'Ω','m^2':'m²','m²':'m²','无量纲':'','1':'','无单位':'','牛/米':'N/m','牛顿/米':'N/m'};
 return Object.hasOwn(aliases,unit)?aliases[unit]:unit;
}
export function canonicalParameterKey(key){const aliases={'v_0':'v0','v₀':'v0','v_1':'v1','v₁':'v1','v_2':'v2','v₂':'v2','m_1':'m1','m₁':'m1','m_2':'m2','m₂':'m2'};return Object.hasOwn(aliases,key)?aliases[key]:key;}
export const question3DModels={
 projectile:{title:'平抛运动',note:'恒定重力、水平抛出、忽略空气阻力。斜抛不能带入这个平抛实验。',fields:[field('v0','水平初速度','m/s',.5,25),field('h','释放高度','m',1,50),field('g','重力加速度','m/s²',1,25,'g','g',1,{defaultValue:9.8,defaultNote:'题目未给 g，暂取 9.8 m/s²，请核对。'})]},
 incline:{title:'斜面物块',note:'直斜面、库仑摩擦、无额外拉力，g=9.8；v0 为沿斜面向上的初速度。斜面长与末端位置为示意，不用于求原题的全程时间。',fields:[field('th','斜面倾角','°',5,60),field('ms','静摩擦系数','',0,1),field('mk','动摩擦系数','',0,1),field('v0','沿斜面向上初速度','m/s',0,7),field('m','物体质量','kg',.2,5),field('g','重力加速度','m/s²',9.8,9.8,null,'g',1,{defaultValue:9.8,defaultNote:'此实验固定采用 g=9.8 m/s²。'})]},
 collision:{title:'一维碰撞',note:'无外力冲量，物体1在物体2左侧。按本题质量、速度、恢复系数计算碰后量；车体大小和初始间距只作接触演示，不是原题初始位置或碰撞时间。',fields:[field('m1','质量 m₁','kg',.2,5),field('m2','质量 m₂','kg',.2,5),field('v1','碰前速度 v₁','m/s',-4,4),field('v2','碰前速度 v₂','m/s',-4,4),field('e','恢复系数','',0,1)]},
 conical:{title:'圆锥摆',note:'轻绳质点、恒定重力、无阻力；初速取该摆角对应的匀速圆锥摆速度，不支持额外的任意初速度。',fields:[field('L','绳长','m',.5,3),field('th','与竖直夹角','°',10,75),field('m','摆球质量','kg',.1,2),field('g','重力加速度','m/s²',1,25,'g','g',1,{defaultValue:9.8,defaultNote:'题目未给 g，暂取 9.8 m/s²。'}),field('dv','初速偏差','%',0,0,'dv','dv',1,{defaultValue:0,defaultNote:'从满足匀速圆锥摆条件的速度开始。'})]},
 pendulum:{title:'单摆',note:'轻绳质点，从最大正摆角静止释放；三维使用非线性单摆数值积分，不能把大角度周期当小角度公式。',fields:[field('L','摆长','m',.2,3),field('a','初始最大摆角','°',2,80),field('m','摆球质量','kg',.05,2,'m','m',1,{defaultValue:.2,defaultNote:'未给质量：取 0.2 kg 仅用于受力/能量示意；原题的摆角与周期不依赖质量。'}),field('g','重力加速度','m/s²',1,25,'g','g',1,{defaultValue:9.8,defaultNote:'题目未给 g，暂取 9.8 m/s²。'}),field('b','空气阻尼','s⁻¹',0,.5,'b','b',1,{defaultValue:0,defaultNote:'按无阻力理想摆演示，b=0。'})]},
 spring:{title:'弹簧振子',note:'水平弹簧，从最大正位移静止释放；不支持竖直弹簧或任意初相位。',fields:[field('m','物体质量','kg',.1,2),field('k','劲度系数','N/m',5,100),field('A','初始振幅','m',.05,.45),field('c','阻尼系数','N·s/m',0,2,'damp','c',1,{defaultValue:0,defaultNote:'按理想无阻尼弹簧演示，c=0。'})]},
 loop:{title:'竖直圆周运动',note:'质点沿无摩擦轨道从高度 h 静止释放；不是滚动小球，固定 g=9.8。',fields:[field('h','相对底部释放高度','m',.5,6),field('R','回环半径','m',.6,1.6),field('g','重力加速度','m/s²',9.8,9.8,null,'g',1,{defaultValue:9.8,defaultNote:'此回环实验固定 g=9.8 m/s²。'})]},
 induction:{title:'导体棒切割磁感线',note:'水平导轨、无摩擦、忽略自感，匀强磁场垂直导轨。模式0为恒力从静止拉动，模式1为给初速后自由滑行。',fields:[field('mode','模式（0恒力、1自由滑行）','',0,1,null,'mode',1,{values:[0,1]}),field('B','磁感应强度','T',.2,2),field('L','导轨间距','m',.5,1.5),field('R','总电阻','Ω',.5,5),field('m','棒质量','kg',.1,2),field('F','恒定拉力（模式0）','N',.2,3,'F','F',1,{when:{mode:0}}),field('v0','初速度（模式1）','m/s',.5,6,'v0','v0',1,{when:{mode:1}})]},
 generator:{title:'交流发电机',note:'线圈在匀强磁场中匀速旋转，纯电阻负载；起始磁通量最大。不支持其他初相位或复杂负载。',fields:[field('B','磁感应强度','T',.1,1),field('N','线圈匝数','',10,200,'N','N',1,{integer:true}),field('S','线圈面积','m²',.01,.08),field('n','转速（每秒转数）','r/s',.2,2),field('R','负载电阻','Ω',2,50,'R','R',1,{defaultValue:10,defaultNote:'未给负载：取 10 Ω 仅展示电流与功率；这些量不是原题的定量结果。'})]},
 lens:{title:'薄透镜成像',note:'近轴薄透镜，物体在左侧；场景中的长度数值 ×10 cm。物高未给时箭头高度只作示意。',fields:[field('kind','透镜（1凸、-1凹）','',-1,1,null,'kind',1,{values:[1,-1]}),field('f','焦距绝对值','m',.06,.25,'f','f',10),field('u','物距','m',.03,.6,'u','u',10),field('h','物高','m',.03,.08,'hh','h',10,{defaultValue:.06,defaultNote:'未给物高：取 6 cm 仅绘制物/像箭头；本题像距和放大率不依赖这个值。'})]},
 doubleslit:{title:'杨氏双缝干涉',note:'同相相干单色光、等宽双缝；波面尺寸仅示意，光屏条纹按题目尺寸计算。',fields:[field('lam','波长','nm',400,700),field('d','缝间距','mm',.1,1),field('L','缝屏距离','m',.5,3),field('a','单缝宽','mm',.02,.1,'a','a',1,{defaultValue:.05,defaultNote:'未给单缝宽：取 0.05 mm 仅绘制衍射包络；条纹间距使用题目给定的 λ、d、L。'})]},
 refraction:{title:'折射与全反射',note:'一侧为空气（n=1），另一侧均匀介质；入射角从法线量起。不支持两侧都不是空气的题目。',fields:[field('n1','入射侧折射率','',1,2.2,null),field('n2','透射侧折射率','',1,2.2,null),field('i','入射角','°',0,85)]}
};
const own=(object,key)=>Object.hasOwn(object,key);
const active=(f,p)=>!f.when||Object.entries(f.when).every(([key,value])=>p[key]===value);
export function validateQuestion3D(candidate){
 if(!candidate||!own(question3DModels,candidate.experiment))throw Error('暂未匹配到可按本题参数驱动的 3D 实验。');
 const model=question3DModels[candidate.experiment],input=candidate.parameters;
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('题目参数无效。');
 const parameters={},assumptions=Array.isArray(candidate.assumptions)?candidate.assumptions.filter(x=>typeof x==='string').slice(0,8).map(x=>x.slice(0,300)):[];
 // Selectors first so conditional fields are validated against the actual mode.
 for(const f of [...model.fields.filter(f=>f.values),...model.fields.filter(f=>!f.values)]){
  if(!active(f,{...input,...parameters}))continue;
  let value=own(input,f.key)?input[f.key]:undefined;
  if(value===undefined&&f.defaultValue!==undefined){value=f.defaultValue;if(f.defaultNote)assumptions.push(f.defaultNote);}
  if(typeof value!=='number'||!Number.isFinite(value))throw Error('请补充'+f.label+'（'+(f.unit||'无量纲')+'）。');
  if(value<f.min||value>f.max||(f.values&&!f.values.includes(value))||(f.integer&&!Number.isInteger(value)))throw Error(f.label+'不在本站 3D 实验范围内：'+f.min+'–'+f.max+' '+f.unit+'。不会用默认值替换原题。');
  parameters[f.key]=value;
 }
 if(candidate.experiment==='incline'&&parameters.mk>parameters.ms)throw Error('动摩擦系数不能大于静摩擦系数。');
 if(candidate.experiment==='collision'&&parameters.v1<=parameters.v2)throw Error('在该初始左右位置下，v₁ 必须大于 v₂ 才会相撞。');
 if(candidate.experiment==='doubleslit'&&parameters.a>=parameters.d)throw Error('单缝宽必须小于缝间距。');
 if(candidate.experiment==='refraction'&&!((parameters.n1===1&&parameters.n2>=1.1)||(parameters.n2===1&&parameters.n1>=1.1)))throw Error('本站折射实验仅支持空气与 n=1.1–2.2 的介质之间的光路。');
 return {experiment:candidate.experiment,parameters,assumptions:[...new Set(assumptions)].slice(0,12)};
}
export function normalizeQuestion3D(value){
 const none={experiment:'none',parameters:{},assumptions:[],reason:'这道题暂未匹配可带入条件的 3D 实验。',errors:[]};
 if(!value||!own(question3DModels,value.experiment))return {...none,reason:typeof value?.reason==='string'?value.reason.slice(0,600):none.reason};
 const model=question3DModels[value.experiment],parameters={},errors=[],seen=new Set();
 for(const entry of Array.isArray(value.parameters)?value.parameters:[]){
  const f=entry&&model.fields.find(f=>f.key===canonicalParameterKey(entry.key));
  if(!f){errors.push('模型返回了未支持的参数。');continue;}
  if(seen.has(f.key)){delete parameters[f.key];errors.push('模型返回了重复参数：'+f.label);continue;}
  seen.add(f.key);
  if(typeof entry.value!=='number'||!Number.isFinite(entry.value)||canonicalPhysicsUnit(entry.unit)!==f.unit){errors.push('请核对'+f.label+'的数值与单位（'+(f.unit||'无量纲')+'）。');continue;}
  parameters[f.key]=entry.value;
 }
 return {experiment:value.experiment,parameters,assumptions:Array.isArray(value.assumptions)?value.assumptions.filter(x=>typeof x==='string').slice(0,8).map(x=>x.slice(0,300)):[],reason:typeof value.reason==='string'?value.reason.slice(0,600):model.note,errors};
}
export function sceneFromSimulation(simulation){
 const p=simulation?.parameters||{};let experiment,parameters;
 if(simulation?.model==='projectile'&&p.angle===0){experiment='projectile';parameters={v0:p.v0,h:p.h,g:p.g};}
 if(simulation?.model==='harmonic'){experiment='spring';parameters={m:p.m,k:p.k,A:p.amplitude,c:0};}
 if(simulation?.model==='pendulum'){experiment='pendulum';parameters={L:p.length,a:p.angle,g:p.g,b:0};}
 if(simulation?.model==='collision'){experiment='collision';parameters={m1:p.m1,m2:p.m2,v1:p.v1,v2:p.v2,e:p.e};}
 if(!experiment)return {experiment:'none',parameters:{},assumptions:[],reason:'没有与当前二维过程完全对应的可驱动三维实验。',errors:[]};
 return {experiment,parameters,assumptions:simulation.assumptions||[],reason:'参数来自本次题目解析，请先核对。',errors:[]};
}
export function question3DURL(candidate,base,wrapper=false){
 const safe=validateQuestion3D(candidate);
 const url=new URL(wrapper?'./lab3d.html':`./physics-lab/experiments/${safe.experiment}.html`,base);
 if(wrapper)url.searchParams.set('experiment',safe.experiment);
 const allowedNotes=new Set(question3DModels[safe.experiment].fields.map(f=>f.defaultNote).filter(Boolean));allowedNotes.add('参数经用户核对修改，以本次参数卡数值为准。');
 // Do not put arbitrary model/student text in a shareable query string.
 url.searchParams.set('scene',JSON.stringify({experiment:safe.experiment,parameters:safe.parameters,assumptions:safe.assumptions.filter(text=>allowedNotes.has(text))}));
 return url;
}
