const STORAGE_KEY = "research-desk-v1";

const state = loadState();
let activeFilter = "all";
let noteTimer = null;

const els = {
  navItems: [...document.querySelectorAll(".nav-item")],
  views: [...document.querySelectorAll(".view")],
  pageTitle: document.getElementById("pageTitle"),
  todayEyebrow: document.getElementById("todayEyebrow"),
  priorityList: document.getElementById("priorityList"),
  priorityCount: document.getElementById("priorityCount"),
  priorityForm: document.getElementById("priorityForm"),
  priorityInput: document.getElementById("priorityInput"),
  taskList: document.getElementById("taskList"),
  doneList: document.getElementById("doneList"),
  doneCount: document.getElementById("doneCount"),
  openCount: document.getElementById("openCount"),
  projectCount: document.getElementById("projectCount"),
  filters: [...document.querySelectorAll(".filter")],
  quickNote: document.getElementById("quickNote"),
  noteSaved: document.getElementById("noteSaved"),
  add任务TopBtn: document.getElementById("add任务TopBtn"),
  add任务InlineBtn: document.getElementById("add任务InlineBtn"),
  taskDialog: document.getElementById("taskDialog"),
  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskCategory: document.getElementById("taskCategory"),
  taskProject: document.getElementById("taskProject"),
  taskDue: document.getElementById("taskDue"),
  save任务Btn: document.getElementById("save任务Btn"),
  projectGrid: document.getElementById("projectGrid"),
  addProjectBtn: document.getElementById("addProjectBtn"),
  projectDialog: document.getElementById("projectDialog"),
  projectForm: document.getElementById("projectForm"),
  projectName: document.getElementById("projectName"),
  projectDesc: document.getElementById("projectDesc"),
  projectStatus: document.getElementById("projectStatus"),
  saveProjectBtn: document.getElementById("saveProjectBtn"),
  logProject: document.getElementById("logProject"),
  logForm: document.getElementById("logForm"),
  logTopic: document.getElementById("logTopic"),
  logProgress: document.getElementById("logProgress"),
  logFinding: document.getElementById("logFinding"),
  logNext: document.getElementById("logNext"),
  logList: document.getElementById("logList"),
  weekLabel: document.getElementById("weekLabel"),
  weekDone: document.getElementById("weekDone"),
  weekLogs: document.getElementById("weekLogs"),
  weekProjects: document.getElementById("weekProjects"),
  weekDoneList: document.getElementById("weekDoneList"),
  carryList: document.getElementById("carryList"),
  copyReviewBtn: document.getElementById("copyReviewBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  focusModeBtn: document.getElementById("focusModeBtn"),
  toast: document.getElementById("toast")
};

init();

function defaultState(){
  return {
    priorities: [],
    tasks: [],
    projects: [],
    logs: [],
    notes: {},
    settings: { focusMode: false }
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    return {...defaultState(), ...JSON.parse(raw)};
  }catch(e){
    console.warn("Could not load saved data", e);
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix="id"){
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function localDateKey(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function fmtDate(date = new Date()){
  return new Intl.DateTimeFormat("zh-CN",{
    weekday:"long", month:"long", day:"numeric", year:"numeric"
  }).format(date);
}

function shortDate(dateString){
  if(!dateString) return "";
  const d = new Date(dateString + "T12:00:00");
  return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric"}).format(d);
}

function startOfWeek(date = new Date()){
  const d = new Date(date);
  const day = (d.getDay()+6)%7; // Monday = 0
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-day);
  return d;
}

function isThisWeek(iso){
  const d = new Date(iso);
  return d >= startOfWeek() && d <= new Date();
}

function projectName(id){
  return state.projects.find(p=>p.id===id)?.name || "未归属项目";
}

function init(){
  els.todayEyebrow.textContent = fmtDate();
  els.quickNote.value = state.notes[localDateKey()] || "";
  bindEvents();
  renderAll();
  if(state.settings.focusMode){
    document.body.classList.add("focus-mode");
  }
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  }
}

function bindEvents(){
  els.navItems.forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));

  document.addEventListener("keydown", e=>{
    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) return;
    if(e.key==="1") switchView("today");
    if(e.key==="2") switchView("projects");
    if(e.key==="3") switchView("log");
    if(e.key==="4") switchView("review");
    if(e.key.toLowerCase()==="n") open任务Dialog();
  });

  els.priorityForm.addEventListener("submit", e=>{
    e.preventDefault();
    const title = els.priorityInput.value.trim();
    if(!title) return;
    if(todayPriorities().filter(x=>!x.done).length >= 3){
      toast("今日重点最多保留三项。");
      return;
    }
    state.priorities.push({
      id:uid("priority"),
      title,
      date:localDateKey(),
      done:false,
      completedAt:null
    });
    els.priorityInput.value="";
    saveState(); renderToday();
  });

  els.add任务TopBtn.addEventListener("click",open任务Dialog);
  els.add任务InlineBtn.addEventListener("click",open任务Dialog);

  els.save任务Btn.addEventListener("click", e=>{
    e.preventDefault();
    const title=els.taskTitle.value.trim();
    if(!title){els.taskTitle.focus();return;}
    state.tasks.push({
      id:uid("task"),
      title,
      category:els.taskCategory.value,
      projectId:els.taskProject.value || null,
      due:els.taskDue.value || null,
      createdAt:new Date().toISOString(),
      done:false,
      completedAt:null
    });
    saveState();
    els.taskForm.reset();
    els.taskDialog.close();
    renderAll();
    toast("任务已添加");
  });

  els.filters.forEach(btn=>btn.addEventListener("click",()=>{
    activeFilter=btn.dataset.filter;
    els.filters.forEach(x=>x.classList.toggle("active",x===btn));
    render任务s();
  }));

  els.quickNote.addEventListener("input",()=>{
    clearTimeout(noteTimer);
    noteTimer=setTimeout(()=>{
      state.notes[localDateKey()]=els.quickNote.value;
      saveState();
      els.noteSaved.classList.add("show");
      setTimeout(()=>els.noteSaved.classList.remove("show"),900);
    },350);
  });

  els.addProjectBtn.addEventListener("click",()=>els.projectDialog.showModal());

  els.saveProjectBtn.addEventListener("click", e=>{
    e.preventDefault();
    const name=els.projectName.value.trim();
    if(!name){els.projectName.focus();return;}
    state.projects.push({
      id:uid("project"),
      name,
      description:els.projectDesc.value.trim(),
      status:els.projectStatus.value,
      createdAt:new Date().toISOString()
    });
    saveState();
    els.projectForm.reset();
    els.projectDialog.close();
    renderAll();
    toast("项目已创建");
  });

  els.logForm.addEventListener("submit",e=>{
    e.preventDefault();
    const topic=els.logTopic.value.trim();
    if(!topic){els.logTopic.focus();return;}
    state.logs.unshift({
      id:uid("log"),
      projectId:els.logProject.value || null,
      topic,
      progress:els.logProgress.value.trim(),
      finding:els.logFinding.value.trim(),
      next:els.logNext.value.trim(),
      createdAt:new Date().toISOString()
    });
    els.logForm.reset();
    saveState(); renderAll(); toast("科研日志已保存");
  });

  els.copyReviewBtn.addEventListener("click",async()=>{
    const text=makeReviewText();
    try{
      await navigator.clipboard.writeText(text);
      toast("本周总结已复制");
    }catch{
      toast("复制失败，可使用导出备份。");
    }
  });

  els.exportBtn.addEventListener("click",exportData);
  els.importInput.addEventListener("change",importData);

  els.focusModeBtn.addEventListener("click",()=>{
    document.body.classList.toggle("focus-mode");
    state.settings.focusMode=document.body.classList.contains("focus-mode");
    saveState();
  });
}

function switchView(name){
  els.navItems.forEach(x=>x.classList.toggle("active",x.dataset.view===name));
  els.views.forEach(x=>x.classList.toggle("active",x.id===`view-${name}`));
  const titles={today:"今日",projects:"科研项目",log:"科研日志",review:"本周总结"};
  els.pageTitle.textContent=titles[name]||"科研工作台";
  if(name==="review") renderReview();
}

function todayPriorities(){
  return state.priorities.filter(p=>p.date===localDateKey());
}

function todayDone任务s(){
  return state.tasks.filter(t=>t.done && t.completedAt && localDateKey(new Date(t.completedAt))===localDateKey());
}

function renderAll(){
  renderToday();
  renderProjects();
  renderProjectOptions();
  renderLogs();
  renderReview();
}

function renderToday(){
  renderPriorities();
  render任务s();
  renderDone();
  els.doneCount.textContent=todayDone任务s().length;
  els.openCount.textContent=state.tasks.filter(t=>!t.done).length;
  els.projectCount.textContent=state.projects.filter(p=>p.status==="active").length;
}

function renderPriorities(){
  const items=todayPriorities();
  els.priorityCount.textContent=`${items.filter(x=>x.done).length} / 3`;
  if(!items.length){
    els.priorityList.innerHTML=`<div class="empty">还没有设置今日重点。建议只保留最重要的三件事。</div>`;
    return;
  }
  els.priorityList.innerHTML=items.map(p=>`
    <div class="priority-item">
      <input class="check" type="checkbox" ${p.done?"checked":""} onchange="togglePriority('${p.id}')">
      <div class="item-text">
        <div class="item-title ${p.done?"done":""}">${escapeHtml(p.title)}</div>
      </div>
      <button class="delete-btn" onclick="deletePriority('${p.id}')" title="Delete">×</button>
    </div>`).join("");
}

function render任务s(){
  let items=state.tasks.filter(t=>!t.done);
  if(activeFilter!=="all") items=items.filter(t=>t.category===activeFilter);
  items.sort((a,b)=>{
    if(a.due && b.due) return a.due.localeCompare(b.due);
    if(a.due) return -1;
    if(b.due) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  if(!items.length){
    els.taskList.innerHTML=`<div class="empty">这里暂时没有待办事项。</div>`;
    return;
  }
  els.taskList.innerHTML=items.map(t=>`
    <div class="task-item">
      <input class="check" type="checkbox" onchange="toggle任务('${t.id}', true)">
      <div class="item-text">
        <div class="item-title">${escapeHtml(t.title)}</div>
        <div class="item-meta">
          <span class="badge ${t.category}">${labelCategory(t.category)}</span>
          ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
          ${t.due?`<span>Due ${shortDate(t.due)}</span>`:""}
        </div>
      </div>
      <button class="delete-btn" onclick="delete任务('${t.id}')" title="Delete">×</button>
    </div>`).join("");
}

function renderDone(){
  const items=todayDone任务s().sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  if(!items.length){
    els.doneList.innerHTML=`<div class="empty">今天还没有完成事项。完成后的任务会记录在这里。</div>`;
    return;
  }
  els.doneList.innerHTML=items.map(t=>`
    <div class="done-item">
      <div class="done-icon">✓</div>
      <div class="item-text">
        <div class="item-title">${escapeHtml(t.title)}</div>
        <div class="item-meta">
          ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
        </div>
      </div>
      <button class="delete-btn" onclick="toggle任务('${t.id}', false)" title="Restore">↶</button>
    </div>`).join("");
}

function renderProjects(){
  const items=[...state.projects].sort((a,b)=>a.name.localeCompare(b.name));
  if(!items.length){
    els.projectGrid.innerHTML=`<div class="panel empty">为每条真正的科研主线建立一个项目，项目数量尽量保持精简。</div>`;
    return;
  }
  els.projectGrid.innerHTML=items.map(p=>{
    const open=state.tasks.filter(t=>t.projectId===p.id&&!t.done).length;
    const done=state.tasks.filter(t=>t.projectId===p.id&&t.done).length;
    const logs=state.logs.filter(l=>l.projectId===p.id).length;
    return `
      <article class="project-card">
        <div class="project-top">
          <div class="status-dot ${p.status}" title="${p.status}"></div>
          <button class="project-delete" onclick="deleteProject('${p.id}')" title="Delete project">×</button>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description || "暂无说明。")}</p>
        <div class="project-bottom">
          <span>${open} open · ${done} done</span>
          <span>${logs} logs</span>
        </div>
      </article>`;
  }).join("");
}

function renderProjectOptions(){
  const options=[`<option value="">未归属项目</option>`]
    .concat(state.projects.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`))
    .join("");
  els.taskProject.innerHTML=options;
  els.logProject.innerHTML=options;
}

function renderLogs(){
  if(!state.logs.length){
    els.logList.innerHTML=`<div class="empty">你的科研过程会记录在这里。建议简洁、客观地记录。</div>`;
    return;
  }
  els.logList.innerHTML=state.logs.slice(0,30).map(l=>`
    <article class="log-entry">
      <div class="log-entry-head">
        <div>
          <div class="log-entry-title">${escapeHtml(l.topic)}</div>
          <div class="log-entry-project">${escapeHtml(projectName(l.projectId))}</div>
        </div>
        <div class="log-entry-date">${new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric",year:"numeric"}).format(new Date(l.createdAt))}</div>
      </div>
      <dl>
        ${l.progress?`<div><dt>Progress</dt><dd>${escapeHtml(l.progress)}</dd></div>`:""}
        ${l.finding?`<div><dt>Finding</dt><dd>${escapeHtml(l.finding)}</dd></div>`:""}
        ${l.next?`<div><dt>Next</dt><dd>${escapeHtml(l.next)}</dd></div>`:""}
      </dl>
      <button class="log-delete" onclick="deleteLog('${l.id}')">Delete</button>
    </article>`).join("");
}

function renderReview(){
  const start=startOfWeek();
  const end=new Date(start); end.setDate(end.getDate()+6);
  const fmt=new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric"});
  els.weekLabel.textContent=`${fmt.format(start)} — ${fmt.format(end)}`;

  const done=state.tasks.filter(t=>t.done&&t.completedAt&&isThisWeek(t.completedAt));
  const logs=state.logs.filter(l=>isThisWeek(l.createdAt));
  const active=state.projects.filter(p=>p.status==="active");
  const open=state.tasks.filter(t=>!t.done);

  els.weekDone.textContent=done.length;
  els.weekLogs.textContent=logs.length;
  els.weekProjects.textContent=active.length;

  els.weekDoneList.innerHTML=done.length
    ? done.map(t=>`<div class="done-item"><div class="done-icon">✓</div><div class="item-text"><div class="item-title">${escapeHtml(t.title)}</div><div class="item-meta">${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}</div></div></div>`).join("")
    : `<div class="empty">本周完成的任务会显示在这里。</div>`;

  els.carryList.innerHTML=open.length
    ? open.slice(0,12).map(t=>`<div class="task-item"><div class="item-text"><div class="item-title">${escapeHtml(t.title)}</div><div class="item-meta">${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}</div></div></div>`).join("")
    : `<div class="empty">没有需要延续到下周的任务。</div>`;
}

function makeReviewText(){
  const done=state.tasks.filter(t=>t.done&&t.completedAt&&isThisWeek(t.completedAt));
  const logs=state.logs.filter(l=>isThisWeek(l.createdAt));
  const open=state.tasks.filter(t=>!t.done);
  const lines=[];
  lines.push(`本周总结 — ${els.weekLabel.textContent}`);
  lines.push("");
  lines.push(`已完成：${done.length}`);
  lines.push(`科研 logs: ${logs.length}`);
  lines.push(`进行中项目：${state.projects.filter(p=>p.status==="active").length}`);
  lines.push("");
  lines.push("本周完成");
  if(done.length) done.forEach(t=>lines.push(`- ${t.title}${t.projectId?` [${projectName(t.projectId)}]`:""}`));
  else lines.push("- 暂无记录");
  lines.push("");
  lines.push("下周继续");
  if(open.length) open.slice(0,15).forEach(t=>lines.push(`- ${t.title}${t.projectId?` [${projectName(t.projectId)}]`:""}`));
  else lines.push("- 无");
  lines.push("");
  lines.push("科研发现");
  if(logs.length) logs.slice(0,10).forEach(l=>lines.push(`- ${l.topic}${l.finding?`: ${l.finding}`:""}`));
  else lines.push("- 暂无记录");
  return lines.join("\n");
}

function open任务Dialog(){
  renderProjectOptions();
  els.taskDialog.showModal();
  setTimeout(()=>els.taskTitle.focus(),50);
}

function labelCategory(c){
  return ({research:"科研",writing:"写作",admin:"事务",other:"其他"})[c]||c;
}

function togglePriority(id){
  const p=state.priorities.find(x=>x.id===id);
  if(!p)return;
  p.done=!p.done;
  p.completedAt=p.done?new Date().toISOString():null;
  saveState(); renderToday();
}
function deletePriority(id){
  state.priorities=state.priorities.filter(x=>x.id!==id);
  saveState(); renderToday();
}
function toggle任务(id,done){
  const t=state.tasks.find(x=>x.id===id);
  if(!t)return;
  t.done=done;
  t.completedAt=done?new Date().toISOString():null;
  saveState(); renderAll();
}
function delete任务(id){
  state.tasks=state.tasks.filter(x=>x.id!==id);
  saveState(); renderAll();
}
function deleteProject(id){
  if(!confirm("确定删除这个项目吗？相关任务和日志会保留，但不再归属该项目。"))return;
  state.projects=state.projects.filter(x=>x.id!==id);
  state.tasks.forEach(t=>{if(t.projectId===id)t.projectId=null});
  state.logs.forEach(l=>{if(l.projectId===id)l.projectId=null});
  saveState(); renderAll();
}
function deleteLog(id){
  state.logs=state.logs.filter(x=>x.id!==id);
  saveState(); renderAll();
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`科研工作台备份-${localDateKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("数据已导出");
}
function importData(e){
  const file=e.target.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      Object.assign(state, defaultState(), parsed);
      saveState(); renderAll();
      els.quickNote.value=state.notes[localDateKey()]||"";
      toast("数据已导入");
    }catch{
      toast("无效的 JSON 文件");
    }
  };
  reader.readAsText(file);
  e.target.value="";
}
function toast(message){
  els.toast.textContent=message;
  els.toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>els.toast.classList.remove("show"),1600);
}
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[ch]);
}

window.togglePriority=togglePriority;
window.deletePriority=deletePriority;
window.toggle任务=toggle任务;
window.delete任务=delete任务;
window.deleteProject=deleteProject;
window.deleteLog=deleteLog;
