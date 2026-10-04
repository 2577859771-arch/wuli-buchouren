// Development-only same-origin DOM measurements, displayed as visible QA data.
for(const frame of document.querySelectorAll('iframe[data-report]')){
 const report=()=>{const doc=frame.contentDocument;if(!doc?.querySelector('.math-module'))return;const viewport=doc.documentElement.clientWidth,page=doc.documentElement.scrollWidth,modules=doc.querySelectorAll('.math-module').length,errors=doc.querySelectorAll('.katex-error').length;document.getElementById(frame.dataset.report).textContent=`视口 ${viewport}px · 页面 ${page}px · ${modules} 个模块 · ${errors} 个公式错误 · ${page<=viewport?'无页面横向溢出':'存在横向溢出'}`;};
 frame.addEventListener('load',()=>{report();setTimeout(report,500);});report();
}
