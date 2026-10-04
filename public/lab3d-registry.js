// One registry for the site navigation, lesson links and integration tests.
export const labCategories = [
  {id:'mechanics', name:'力学', caption:'运动、受力与守恒'},
  {id:'electromagnetism', name:'电磁学', caption:'看见场与电荷的作用'},
  {id:'optics', name:'光学', caption:'追踪光线，观察条纹'},
  {id:'thermal', name:'热学', caption:'从微观运动理解宏观量'}
];
export const labExperiments = [
  {id:'projectile', category:'mechanics', title:'平抛运动', description:'水平方向匀速与竖直自由落体同时发生。', topics:['projectile']},
  {id:'incline', category:'mechanics', title:'斜面物块', description:'改变斜面角度与摩擦，观察从静止到滑动的条件。', topics:['newton']},
  {id:'collision', category:'mechanics', title:'碰撞与动量', description:'改变质量和速度，对照碰撞前后的动量与动能。', topics:['momentum']},
  {id:'loop', category:'mechanics', title:'竖直圆周运动', description:'小球什么时候脱轨？对照最高点速度、支持力与脱轨角。', topics:['circular','energy']},
  {id:'conical', category:'mechanics', title:'圆锥摆', description:'从三维轨迹和投影理解向心力、半径与周期。', topics:[]},
  {id:'kepler', category:'mechanics', title:'开普勒定律', description:'观察椭圆轨道、等时扇形面积与周期的关系。', topics:['gravitation']},
  {id:'pendulum', category:'mechanics', title:'单摆', description:'比较小角度近似、精确周期和数值测量。', topics:[]},
  {id:'spring', category:'mechanics', title:'弹簧振子', description:'改变质量、弹簧与阻尼，观察位移、周期和机械能。', topics:['harmonic']},
  {id:'efield', category:'electromagnetism', title:'点电荷电场', description:'调整电荷，观察电场线、电势和叠加关系。', topics:['field','coulomb','potential']},
  {id:'deflect', category:'electromagnetism', title:'示波管', description:'改变电压，看电子束如何偏转并落在荧光屏上。', topics:[]},
  {id:'lorentz', category:'electromagnetism', title:'带电粒子与磁场', description:'观察圆周与螺旋轨迹，对照半径、周期和漂移速度。', topics:['lorentz']},
  {id:'induction', category:'electromagnetism', title:'切割磁感线', description:'运动的导体棒产生电流，反过来影响运动与能量。', topics:['induction']},
  {id:'generator', category:'electromagnetism', title:'交流发电机', description:'转动线圈，观察磁通量、感应电动势和输出功率。', topics:['ac']},
  {id:'refraction', category:'optics', title:'折射与全反射', description:'调整介质与入射角，寻找全反射发生的临界条件。', topics:['optics']},
  {id:'lens', category:'optics', title:'透镜成像', description:'移动物体与光屏，看实像、虚像和清晰度如何变化。', topics:['lens']},
  {id:'doubleslit', category:'optics', title:'双缝干涉', description:'改变波长、缝距与屏距，测量明暗条纹的间距。', topics:['interference']},
  {id:'gas', category:'thermal', title:'理想气体', description:'观察分子碰撞，统计压强、温度与速率分布。', topics:['thermal','thermodynamics']},
  {id:'brownian', category:'thermal', title:'布朗运动', description:'追踪被分子碰撞推动的微粒，理解随机运动与能量均分。', topics:[]}
];
export const labById = Object.fromEntries(labExperiments.map(lab=>[lab.id,lab]));
export const labByTopic = Object.fromEntries(labExperiments.flatMap(lab=>lab.topics.map(topic=>[topic,lab.id])));
