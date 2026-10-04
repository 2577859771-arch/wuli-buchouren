import {models,modelSample} from './models.js';
export const G=9.8, EPS0=8.8541878128e-12, KE=1/(4*Math.PI*EPS0), E_CHARGE=1.602176634e-19, ELECTRON_MASS=9.1093837139e-31;
export const initialParameters={projectile:{v:10,h:19.6},harmonic:{m:1,k:10,a:.8},field:{q:1,r:1},gauss:{q:5,R:50,r:70},capacitor:{area:100,gap:1,u:10,er:1},lorentz:{v:1,b:1,sign:-1},rc:{r:10,c:100,u:10}};
export const controls={
 projectile:[{key:'v',label:'水平初速度 v₀',min:2,max:25,step:.1,unit:'m/s'},{key:'h',label:'释放高度 h',min:5,max:50,step:.1,unit:'m'}],
 harmonic:[{key:'m',label:'物体质量 m',min:.5,max:3,step:.1,unit:'kg'},{key:'k',label:'劲度系数 k',min:2,max:30,step:1,unit:'N/m'},{key:'a',label:'振幅 A',min:.2,max:1.2,step:.1,unit:'m'}],
 field:[{key:'q',label:'源电荷 Q',min:-10,max:10,step:.5,unit:'nC'},{key:'r',label:'观察距离 r',min:.3,max:3,step:.1,unit:'m'}],
 gauss:[{key:'q',label:'总电荷 Q',min:-10,max:10,step:.5,unit:'nC'},{key:'R',label:'带电球半径 R',min:20,max:80,step:5,unit:'cm'},{key:'r',label:'高斯面半径 r',min:0,max:150,step:5,unit:'cm'}],
 capacitor:[{key:'area',label:'极板面积 S',min:50,max:500,step:10,unit:'cm²'},{key:'gap',label:'极板间距 d',min:1,max:5,step:.2,unit:'mm'},{key:'u',label:'电源电压 U',min:1,max:50,step:1,unit:'V'},{key:'er',label:'相对介电常数 εᵣ',min:1,max:8,step:.5,unit:''}],
 lorentz:[{key:'v',label:'初速度 v',min:.2,max:5,step:.1,unit:'×10⁶ m/s'},{key:'b',label:'磁感应强度 B',min:.5,max:5,step:.1,unit:'mT'},{key:'sign',label:'电荷符号（质量固定）',unit:'',options:[{value:-1,label:'负电荷 −e（电子）'},{value:1,label:'正电荷 +e（同质量）'}]}],
 rc:[{key:'r',label:'电阻 R',min:1,max:30,step:1,unit:'kΩ'},{key:'c',label:'电容 C',min:10,max:200,step:10,unit:'μF'},{key:'u',label:'电源电动势 ℰ',min:1,max:20,step:1,unit:'V'}]
};
export const animated=new Set(['projectile','harmonic','lorentz','rc']);
export function validateParameters(kind,values){if(!controls[kind]||!values||typeof values!=='object'||Array.isArray(values))throw new Error('无效的实验参数。');for(const[key,value]of Object.entries(values)){const c=controls[kind].find(c=>c.key===key);if(!c||typeof value!=='number'||!Number.isFinite(value)||(c.options?!c.options.some(o=>o.value===value):value<c.min||value>c.max))throw new Error('参数超出允许范围：'+key);}return values;}
export function duration(kind,p){if(models[kind]){const t=models[kind].total;return typeof t==='function'?t(p):t;}switch(kind){case 'projectile':return Math.sqrt(2*p.h/G);case 'harmonic':return 4*Math.PI*Math.sqrt(p.m/p.k);case 'lorentz':return 4*Math.PI*ELECTRON_MASS/(E_CHARGE*p.b*1e-3);case 'rc':return 5*p.r*1e3*p.c*1e-6;default:return 0;}}
export function sample(kind,p,t=0){if(models[kind])return modelSample(kind,p,t);const total=duration(kind,p);t=Math.max(0,Math.min(t,total));
 switch(kind){
 case 'projectile':return {t,x:p.v*t,y:Math.max(0,p.h-G*t*t/2),vx:p.v,vy:-G*t,total,range:p.v*total};
 case 'harmonic':{const omega=Math.sqrt(p.k/p.m),x=p.a*Math.cos(omega*t),v=-p.a*omega*Math.sin(omega*t);return {t,x,v,acc:-omega*omega*x,omega,period:2*Math.PI/omega,energy:p.k*p.a*p.a/2,total};}
 case 'field':{const q=p.q*1e-9;return {t,total,e:KE*q/(p.r*p.r),potential:KE*q/p.r,r:p.r,q};}
 case 'gauss':{const q=p.q*1e-9,R=p.R/100,r=p.r/100,enclosed=r>=R?q:q*(r/R)**3;return {t,total,r,R,enclosed,flux:enclosed/EPS0,e:r===0?0:KE*enclosed/(r*r),q};}
 case 'capacitor':{const area=p.area*1e-4,gap=p.gap*1e-3,c=EPS0*p.er*area/gap;return {t,total,c,q:c*p.u,e:p.u/gap,energy:.5*c*p.u*p.u,area,gap};}
 case 'lorentz':{const b=p.b*1e-3,v=p.v*1e6,omega=E_CHARGE*b/ELECTRON_MASS,r=v/omega,angle=omega*t,sgn=p.sign;return {t,total,omega,r,period:2*Math.PI/omega,v,x:r*Math.sin(angle),y:sgn*r*(Math.cos(angle)-1),vx:v*Math.cos(angle),vy:-sgn*v*Math.sin(angle),force:E_CHARGE*v*b,energy:.5*ELECTRON_MASS*v*v,angle};}
 case 'rc':{const r=p.r*1e3,c=p.c*1e-6,tau=r*c,f=Math.exp(-t/tau),uc=p.u*(1-f),i=p.u/r*f;return {t,total,tau,uc,i,q:c*uc,energy:.5*c*uc*uc,fraction:1-f};}
 default:throw new Error('这个知识点没有交互模型。');
 }}

for(const[id,m]of Object.entries(models)){initialParameters[id]={...m.p};controls[id]=m.controls;if(m.total)animated.add(id);}
initialParameters.projectile={v:10,h:19.6};
