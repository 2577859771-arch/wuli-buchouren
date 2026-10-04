import {labExperiments, labCategories, labById as experiments} from './lab3d-registry.js';
import {validateQuestion3D} from './question-3d.js';
const $ = selector => document.querySelector(selector);
const frame = $('#lab3d-frame');
const themeControl = $('#lab3d-theme');
const systemDark = matchMedia('(prefers-color-scheme: dark)');
let questionScene=null,questionSceneError='';
const rawScene=new URL(location.href).searchParams.get('scene');
if(rawScene){try{if(rawScene.length>9000)throw Error('链接过长');questionScene=validateQuestion3D(JSON.parse(rawScene));}catch{questionSceneError='题目参数链接无效，当前只显示默认参考实验，不代表原题。';}}
let selected = 'projectile';
let category = 'mechanics';
const categoryNav = $('#lab3d-categories');
const experimentNav = $('#lab3d-tabs');
for (const group of labCategories) {
  const button = document.createElement('button');
  button.type='button';button.dataset.category=group.id;
  button.textContent=`${group.name} · ${labExperiments.filter(lab=>lab.category===group.id).length}`;
  button.addEventListener('click',()=>selectExperiment(labExperiments.find(lab=>lab.category===group.id).id));
  categoryNav.append(button);
}
for (const lab of labExperiments) {
  const button=document.createElement('button');button.type='button';button.dataset.experiment=lab.id;
  button.textContent=lab.title;button.addEventListener('click',()=>selectExperiment(lab.id));experimentNav.append(button);
}
let theme = new URL(location.href).searchParams.get('theme');
if (!['light', 'dark', 'auto'].includes(theme)) {
  try { theme = JSON.parse(localStorage.getItem('wlbcr:theme')); } catch { /* optional local preference */ }
}
if (!['light', 'dark', 'auto'].includes(theme)) theme = 'auto';
const effectiveTheme = () => theme === 'auto' ? (systemDark.matches ? 'dark' : 'light') : theme;
function updateAddress() {
  const url = new URL(location.href);
  url.searchParams.set('experiment', selected);
  url.searchParams.set('theme', theme);
  history.replaceState(null, '', url);
}
function experimentAddress() {
  const url = new URL(`./physics-lab/experiments/${selected}.html`, location.href);
  url.searchParams.set('theme', effectiveTheme());
  if(questionScene?.experiment===selected)url.searchParams.set('scene',JSON.stringify(questionScene));
  if(selected==='projectile')for(const key of ['v0','h','g']){const value=new URL(location.href).searchParams.get(key);if(value!==null&&Number.isFinite(Number(value)))url.searchParams.set(key,value);}
  const returnTopic=new URL(location.href).searchParams.get('returnTopic');
  if(returnTopic&&/^[a-z][a-z0-9-]*$/.test(returnTopic))url.searchParams.set('returnTopic',returnTopic);
  return url;
}
function applyTheme() {
  document.documentElement.dataset.theme = effectiveTheme();
  themeControl.value = theme;
  $('#lab3d-open').href = experimentAddress().href;
  if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'lab-theme', theme: effectiveTheme() }, location.origin);
  updateAddress();
}
function selectExperiment(id) {
  if (!Object.hasOwn(experiments, id)) id = 'projectile';
  selected = id;
  const {title, description} = experiments[id];
  category = experiments[id].category;
  const group=labCategories.find(group=>group.id===category);
  $('#lab3d-category-note').textContent=group.caption;
  for (const button of categoryNav.querySelectorAll('button')) button.setAttribute('aria-pressed',String(button.dataset.category===category));
  $('#lab3d-title').textContent = title;
  $('#lab3d-description').textContent = description;
  for (const button of document.querySelectorAll('[data-experiment]')) {
    button.hidden=experiments[button.dataset.experiment].category!==category;
    button.setAttribute('aria-pressed', String(button.dataset.experiment === id));
  }
  frame.title = `${title} 3D 实验`;
  $('#lab3d-status').textContent = questionSceneError||'正在加载实验…';
  frame.src = experimentAddress().href;
  $('#lab3d-open').href = frame.src;
  updateAddress();
}
frame.addEventListener('load', () => {
  // A loaded document alone does not prove that its WebGL engine initialized.
  $('#lab3d-status').textContent = questionSceneError||(questionScene&&questionScene.experiment!==selected?'已切换为参考实验；没有带入原题参数。':'实验页面已加载；引擎状态以实验内的提示为准。');
  applyTheme();
});
themeControl.addEventListener('change', () => {
  theme = themeControl.value;
  try {
    if (theme === 'auto') localStorage.removeItem('wlbcr:theme');
    else localStorage.setItem('wlbcr:theme', JSON.stringify(theme));
  } catch { /* theme selection still works without persistence */ }
  applyTheme();
});
systemDark.addEventListener('change', () => { if (theme === 'auto') applyTheme(); });
const initialExperiment = new URL(location.href).searchParams.get('experiment');
const returnTopic=new URL(location.href).searchParams.get('returnTopic');
if(returnTopic&&/^[a-z][a-z0-9-]*$/.test(returnTopic)){const back=new URL('./',location.href);back.hash=returnTopic;if(returnTopic==='projectile'&&new URL(location.href).searchParams.get('g')==='9.8'){back.searchParams.set('lesson','projectile');for(const key of ['v0','h']){const value=new URL(location.href).searchParams.get(key);if(value!==null&&Number.isFinite(Number(value)))back.searchParams.set(key,value);}}$('#lab3d-return').href=back.href;$('#lab3d-return').textContent='返回原题条件';}
selectExperiment(initialExperiment || 'projectile');
applyTheme();
