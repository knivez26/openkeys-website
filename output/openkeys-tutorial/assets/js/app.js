const guideLayout=new URLSearchParams(location.search).get('layout');
const appVersion=new URLSearchParams(location.search).get('version');
if(appVersion){document.querySelectorAll('[data-app-version]').forEach((element)=>{element.textContent=`OpenKeys v${appVersion}`})}
if(guideLayout==='tablet'){
  document.body.classList.add('tablet-mode');
  document.querySelectorAll('img[src^="assets/screenshots/"]').forEach((image)=>{
    const filename=image.getAttribute('src').split('/').pop();
    image.src=`assets/screenshots/tablet/${filename}`;
    image.alt=image.alt.replace('phone','tablet');
  });
}
const sections=[...document.querySelectorAll('.chapter[id]')];
const links=[...document.querySelectorAll('.toc a')];
const progress=document.querySelector('.progress');
const menu=document.querySelector('.menu-btn');
const search=document.querySelector('.search');
const setActive=()=>{let current=sections[0]?.id;for(const s of sections){if(s.getBoundingClientRect().top<160)current=s.id}links.forEach(a=>a.classList.toggle('active',a.hash===`#${current}`));const h=document.documentElement;progress.style.width=`${100*h.scrollTop/(h.scrollHeight-h.clientHeight)}%`};
addEventListener('scroll',setActive,{passive:true});setActive();
menu?.addEventListener('click',()=>{document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',document.body.classList.contains('nav-open'))});
links.forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('nav-open')));
search?.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();links.forEach(a=>a.classList.toggle('hidden-search',q&&!a.textContent.toLowerCase().includes(q))) });
document.querySelector('[data-text]')?.addEventListener('click',()=>{const n=parseFloat(getComputedStyle(document.documentElement).fontSize);document.documentElement.style.fontSize=(n>=20?16:n+1)+'px'});

const courseSteps=[...document.querySelectorAll('[data-course-step]')];
const courseStatus=document.querySelector('[data-course-status]');
const courseMeter=document.querySelector('[data-course-meter]');
const courseProgress=courseMeter?.parentElement;
const courseFinish=document.querySelector('[data-course-finish]');
const courseKey='openkeys-first-performance-v1';
const readCourse=()=>{try{return JSON.parse(localStorage.getItem(courseKey)||'[]')}catch{return[]}};
const saveCourse=()=>{try{localStorage.setItem(courseKey,JSON.stringify(courseSteps.map(step=>step.checked)))}catch{}};
const renderCourse=()=>{
  const complete=courseSteps.filter(step=>step.checked).length;
  const total=courseSteps.length;
  if(courseStatus)courseStatus.textContent=complete===total?'Course complete':`${complete} of ${total} complete`;
  if(courseMeter)courseMeter.style.width=`${total?100*complete/total:0}%`;
  courseProgress?.setAttribute('aria-valuenow',String(complete));
  if(courseFinish)courseFinish.hidden=complete!==total;
};
const savedCourse=readCourse();
courseSteps.forEach((step,index)=>{
  step.checked=Boolean(savedCourse[index]);
  step.addEventListener('change',()=>{saveCourse();renderCourse()});
});
document.querySelector('.course-reset')?.addEventListener('click',()=>{
  courseSteps.forEach(step=>{step.checked=false});
  saveCourse();renderCourse();
});
renderCourse();
