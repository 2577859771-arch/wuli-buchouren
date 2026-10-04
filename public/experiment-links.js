import {labByTopic as mapping} from './lab3d-registry.js';
export function experimentLink(topic,parameters={},base=location.href){
  const experiment=mapping[topic];if(!experiment)return null;
  const url=new URL('./lab3d.html',base);url.searchParams.set('experiment',experiment);url.searchParams.set('returnTopic',topic);
  if(topic==='projectile'){
    const v=parameters.v??parameters.v0,h=parameters.h,g=parameters.g??9.8;
    if(parameters.angle!==undefined&&parameters.angle!==0)return null;
    if(![v,h,g].every(Number.isFinite)||v<.5||v>25||h<1||h>50||g<1||g>25)return null;
    for(const[k,value]of Object.entries({v0:v,h,g}))url.searchParams.set(k,String(value));
  }
  return url;
}
