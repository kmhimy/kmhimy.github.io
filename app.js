const STORAGE_KEY = "research-desk-v1";
const APP_VERSION = 9;

const state = loadState();
let activeFilter = "all";
let noteTimer = null;
let currentProjectId = null;
let currentTaskId = null;
let taskDetailReturnView = "today";
let archiveExpanded = false;
let projectSummaryTimer = null;
let taskDetailsTimer = null;
let taskNoteMode = localStorage.getItem("research-desk-note-mode") || "split";
let sidebarCollapsed = localStorage.getItem("research-desk-sidebar-collapsed")==="true";
let noteSourcePercent = Number(localStorage.getItem("research-desk-note-source-pct") || "58");
if(!Number.isFinite(noteSourcePercent)) noteSourcePercent=58;
noteSourcePercent=Math.min(78,Math.max(28,noteSourcePercent));
let splitDragging=false;
let calendarCursor=new Date();
calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),1);
let searchMatches=[];
let searchActiveIndex=0;

// ---- Supabase / cloud sync state ----
const CLOUD_TABLE = "research_desk_state";
let supabaseClient = null;
let currentUser = null;
let cloudReady = false;
let cloudSaveTimer = null;
let cloudSaveInFlight = false;
let cloudSaveQueued = false;
let lastCloudUpdatedAt = null;
let applyingCloudState = false;
let cloudPollTimer = null;

const els = {
  navItems: [...document.querySelectorAll(".nav-item")],
  views: [...document.querySelectorAll(".view")],
  sidebarCollapseBtn: document.getElementById("sidebarCollapseBtn"),
  pageTitle: document.getElementById("pageTitle"),
  todayEyebrow: document.getElementById("todayEyebrow"),

  priorityList: document.getElementById("priorityList"),
  priorityCount: document.getElementById("priorityCount"),
  priorityStat: document.getElementById("priorityStat"),
  priorityForm: document.getElementById("priorityForm"),
  priorityInput: document.getElementById("priorityInput"),

  taskList: document.getElementById("taskList"),
  doneList: document.getElementById("doneList"),
  todayWorkLogList: document.getElementById("todayWorkLogList"),
  todayWorkLogCount: document.getElementById("todayWorkLogCount"),
  doneCount: document.getElementById("doneCount"),
  openCount: document.getElementById("openCount"),
  projectCount: document.getElementById("projectCount"),
  filters: [...document.querySelectorAll(".filter")],

  quickNote: document.getElementById("quickNote"),
  noteSaved: document.getElementById("noteSaved"),

  addTaskTopBtn: document.getElementById("addTaskTopBtn"),
  addTaskInlineBtn: document.getElementById("addTaskInlineBtn"),
  taskDialog: document.getElementById("taskDialog"),
  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskCategory: document.getElementById("taskCategory"),
  taskProject: document.getElementById("taskProject"),
  taskDue: document.getElementById("taskDue"),
  taskTemplate: document.getElementById("taskTemplate"),
  taskPriorityToday: document.getElementById("taskPriorityToday"),
  closeTaskDialogBtn: document.getElementById("closeTaskDialogBtn"),
  cancelTaskBtn: document.getElementById("cancelTaskBtn"),

  backFromTaskBtn: document.getElementById("backFromTaskBtn"),
  taskExportMarkdownBtn: document.getElementById("taskExportMarkdownBtn"),
  taskCompleteBtn: document.getElementById("taskCompleteBtn"),
  taskRestoreBtn: document.getElementById("taskRestoreBtn"),
  taskDetailMeta: document.getElementById("taskDetailMeta"),
  taskDetailTitle: document.getElementById("taskDetailTitle"),
  taskWorkLogCount: document.getElementById("taskWorkLogCount"),
  taskDetailsInput: document.getElementById("taskDetailsInput"),
  taskDetailsPreview: document.getElementById("taskDetailsPreview"),
  taskDetailsSaved: document.getElementById("taskDetailsSaved"),
  taskNoteWorkspace: document.getElementById("taskNoteWorkspace"),
  noteSplitHandle: document.getElementById("noteSplitHandle"),
  noteModeSplit: document.getElementById("noteModeSplit"),
  noteModeSource: document.getElementById("noteModeSource"),
  noteModePreview: document.getElementById("noteModePreview"),
  noteInsertButtons: [...document.querySelectorAll("[data-note-insert]")],
  taskTemplateApply: document.getElementById("taskTemplateApply"),
  taskWorkLogInput: document.getElementById("taskWorkLogInput"),
  taskWorkLogPreview: document.getElementById("taskWorkLogPreview"),
  saveTaskWorkLogBtn: document.getElementById("saveTaskWorkLogBtn"),
  taskWorkLogList: document.getElementById("taskWorkLogList"),
  markdownToolbars: [...document.querySelectorAll(".markdown-toolbar")],

  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  calendarPrevBtn: document.getElementById("calendarPrevBtn"),
  calendarTodayBtn: document.getElementById("calendarTodayBtn"),
  calendarNextBtn: document.getElementById("calendarNextBtn"),
  upcomingDeadlineCount: document.getElementById("upcomingDeadlineCount"),
  upcomingDeadlineList: document.getElementById("upcomingDeadlineList"),
  overdueDeadlineCount: document.getElementById("overdueDeadlineCount"),
  overdueDeadlineList: document.getElementById("overdueDeadlineList"),

  appearanceResetBtn: document.getElementById("appearanceResetBtn"),
  themeOptionBtns: [...document.querySelectorAll("[data-theme-option]")],
  fontOptionBtns: [...document.querySelectorAll("[data-font-option]")],
  densityOptionBtns: [...document.querySelectorAll("[data-density-option]")],

  projectGrid: document.getElementById("projectGrid"),
  archiveGrid: document.getElementById("archiveGrid"),
  archiveWrap: document.getElementById("archiveWrap"),
  toggleArchiveBtn: document.getElementById("toggleArchiveBtn"),
  currentProjectCount: document.getElementById("currentProjectCount"),
  addProjectBtn: document.getElementById("addProjectBtn"),

  backToProjectsBtn: document.getElementById("backToProjectsBtn"),
  detailArchiveBtn: document.getElementById("detailArchiveBtn"),
  detailRestoreBtn: document.getElementById("detailRestoreBtn"),
  detailStatusBadge: document.getElementById("detailStatusBadge"),
  detailDateMeta: document.getElementById("detailDateMeta"),
  detailProjectName: document.getElementById("detailProjectName"),
  detailProjectDesc: document.getElementById("detailProjectDesc"),
  detailProgressNumber: document.getElementById("detailProgressNumber"),
  detailProgressBar: document.getElementById("detailProgressBar"),
  detailProgressMeta: document.getElementById("detailProgressMeta"),
  detailTaskList: document.getElementById("detailTaskList"),
  detailLogList: document.getElementById("detailLogList"),
  projectSummaryInput: document.getElementById("projectSummaryInput"),
  projectSummarySaved: document.getElementById("projectSummarySaved"),
  projectDialog: document.getElementById("projectDialog"),
  projectForm: document.getElementById("projectForm"),
  projectName: document.getElementById("projectName"),
  projectDesc: document.getElementById("projectDesc"),
  projectStatus: document.getElementById("projectStatus"),
  closeProjectDialogBtn: document.getElementById("closeProjectDialogBtn"),
  cancelProjectBtn: document.getElementById("cancelProjectBtn"),

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

  globalSearchBtn: document.getElementById("globalSearchBtn"),
  searchDialog: document.getElementById("searchDialog"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  searchResults: document.getElementById("searchResults"),
  searchHint: document.getElementById("searchHint"),
  searchResultCount: document.getElementById("searchResultCount"),

  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  focusModeBtn: document.getElementById("focusModeBtn"),
  exitFocusBtn: document.getElementById("exitFocusBtn"),

  appShell: document.getElementById("appShell"),
  authScreen: document.getElementById("authScreen"),
  authLoginView: document.getElementById("authLoginView"),
  authSignupView: document.getElementById("authSignupView"),
  authRecoveryView: document.getElementById("authRecoveryView"),
  authMessage: document.getElementById("authMessage"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  signupForm: document.getElementById("signupForm"),
  signupEmail: document.getElementById("signupEmail"),
  signupPassword: document.getElementById("signupPassword"),
  signupPassword2: document.getElementById("signupPassword2"),
  recoveryForm: document.getElementById("recoveryForm"),
  recoveryPassword: document.getElementById("recoveryPassword"),
  showSignupBtn: document.getElementById("showSignupBtn"),
  showLoginBtn: document.getElementById("showLoginBtn"),
  forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  manualSyncBtn: document.getElementById("manualSyncBtn"),
  accountEmail: document.getElementById("accountEmail"),
  syncStatus: document.getElementById("syncStatus"),
  syncStatusText: document.getElementById("syncStatusText"),

  toast: document.getElementById("toast")
};


function defaultState(){
  return {
    version: APP_VERSION,
    priorities: [],
    tasks: [],
    projects: [],
    logs: [],
    notes: {},
    settings: {
      focusMode:false,
      appearance:{
        theme:"academic",
        font:"mixed",
        density:"comfortable"
      }
    },
    meta: { localUpdatedAt: null }
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = raw ? JSON.parse(raw) : defaultState();
    const merged = {...defaultState(), ...loaded};
    migrateToV2(merged);
    return merged;
  }catch(e){
    console.warn("无法读取旧数据，已创建空白工作台。", e);
    return defaultState();
  }
}

function migrateToV2(s){
  if(!Array.isArray(s.tasks)) s.tasks = [];
  if(!Array.isArray(s.priorities)) s.priorities = [];
  if(!Array.isArray(s.projects)) s.projects = [];
  if(!Array.isArray(s.logs)) s.logs = [];
  if(!s.notes || typeof s.notes !== "object") s.notes = {};
  if(!s.settings || typeof s.settings !== "object") s.settings = {focusMode:false};
  if(!s.settings.appearance || typeof s.settings.appearance !== "object"){
    s.settings.appearance={theme:"academic",font:"mixed",density:"comfortable"};
  }
  if(!["academic","paper","forest","graphite"].includes(s.settings.appearance.theme)){
    s.settings.appearance.theme="academic";
  }
  if(!["mixed","sans","serif","system"].includes(s.settings.appearance.font)){
    s.settings.appearance.font="mixed";
  }
  if(!["comfortable","compact"].includes(s.settings.appearance.density)){
    s.settings.appearance.density="comfortable";
  }
  if(!s.meta || typeof s.meta !== "object") s.meta = {localUpdatedAt:null};
  if(!("localUpdatedAt" in s.meta)) s.meta.localUpdatedAt = null;

  // V5：给旧项目补齐归档与总结字段。
  s.projects.forEach(p=>{
    if(!("archivedAt" in p)) p.archivedAt = null;
    if(!("summary" in p)) p.summary = "";
    if(p.status==="archived" && !p.archivedAt) p.archivedAt = new Date().toISOString();
  });

  // 给旧任务补齐 V2 字段。
  s.tasks.forEach(t=>{
    if(!("priorityDate" in t)) t.priorityDate = null;
    if(!("createdAt" in t)) t.createdAt = new Date().toISOString();
    if(!("done" in t)) t.done = false;
    if(!("completedAt" in t)) t.completedAt = null;
    if(!("detailsMarkdown" in t)) t.detailsMarkdown = "";
    if(!Array.isArray(t.workLogs)) t.workLogs = [];
  });

  // V1 的“今日重点”是独立数据；V2 将其迁移为真正的任务。
  for(const p of s.priorities){
    let match = s.tasks.find(t =>
      t.title === p.title &&
      (t.priorityDate === p.date || t.priorityDate === null) &&
      Boolean(t.done) === Boolean(p.done)
    );

    if(match){
      match.priorityDate = p.date || null;
      if(p.done && !match.completedAt) match.completedAt = p.completedAt || new Date().toISOString();
    }else{
      s.tasks.push({
        id: uidStatic("task"),
        title: p.title || "未命名任务",
        category: "research",
        projectId: null,
        due: null,
        createdAt: p.createdAt || new Date().toISOString(),
        done: Boolean(p.done),
        completedAt: p.completedAt || null,
        priorityDate: p.date || null,
        detailsMarkdown:"",
        workLogs:[]
      });
    }
  }

  s.priorities = [];
  s.version = APP_VERSION;

  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }catch(e){
    console.warn("迁移后的数据暂时无法写入本地存储。", e);
  }
}

function uidStatic(prefix="id"){
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function uid(prefix="id"){ return uidStatic(prefix); }

function saveState(options = {}){
  const { touch = true, cloud = true } = options;

  if(touch && !applyingCloudState){
    if(!state.meta || typeof state.meta !== "object") state.meta = {};
    state.meta.localUpdatedAt = new Date().toISOString();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  if(cloud && cloudReady && currentUser && !applyingCloudState){
    scheduleCloudSave();
  }
}

function localDateKey(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function fmtDate(date = new Date()){
  return new Intl.DateTimeFormat("zh-CN",{
    year:"numeric", month:"long", day:"numeric", weekday:"long"
  }).format(date);
}

function shortDate(dateString){
  if(!dateString) return "";
  const d = new Date(dateString + "T12:00:00");
  return new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric"}).format(d);
}

function startOfWeek(date = new Date()){
  const d = new Date(date);
  const day = (d.getDay()+6)%7;
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-day);
  return d;
}

function isThisWeek(iso){
  if(!iso) return false;
  const d = new Date(iso);
  return d >= startOfWeek() && d <= new Date();
}

function projectName(id){
  return state.projects.find(p=>p.id===id)?.name || "未归属项目";
}

function initWorkspace(){
  cleanupOldOfflineCache();

  els.todayEyebrow.textContent = fmtDate();
  els.quickNote.value = state.notes[localDateKey()] || "";

  if(sidebarCollapsed){
    document.body.classList.add("sidebar-collapsed");
  }
  updateSidebarCollapseButton();
  applyNoteSplitPercent(noteSourcePercent,false);
  applyAppearanceSettings();

  bindEvents();
  renderAll();

  if(state.settings.focusMode){
    document.body.classList.add("focus-mode");
  }
}

function cleanupOldOfflineCache(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.getRegistrations()
      .then(regs=>Promise.all(regs.map(r=>r.unregister())))
      .catch(()=>{});
  }
  if("caches" in window){
    caches.keys()
      .then(keys=>Promise.all(keys.map(k=>caches.delete(k))))
      .catch(()=>{});
  }
}

function bindEvents(){
  els.navItems.forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));

  els.globalSearchBtn.addEventListener("click",openGlobalSearch);
  els.globalSearchInput.addEventListener("input",()=>runGlobalSearch(els.globalSearchInput.value));
  els.globalSearchInput.addEventListener("keydown",handleSearchKeydown);
  els.searchDialog.addEventListener("click",e=>{
    if(e.target===els.searchDialog) closeGlobalSearch();
  });

  els.sidebarCollapseBtn.addEventListener("click",toggleSidebarCollapse);

  els.noteSplitHandle.addEventListener("pointerdown",startNoteSplitDrag);
  els.noteSplitHandle.addEventListener("dblclick",()=>{
    applyNoteSplitPercent(58,true);
  });
  els.calendarPrevBtn.addEventListener("click",()=>{
    calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);
    renderCalendar();
  });
  els.calendarNextBtn.addEventListener("click",()=>{
    calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);
    renderCalendar();
  });
  els.calendarTodayBtn.addEventListener("click",()=>{
    const now=new Date();
    calendarCursor=new Date(now.getFullYear(),now.getMonth(),1);
    renderCalendar();
  });

  els.themeOptionBtns.forEach(btn=>{
    btn.addEventListener("click",()=>setAppearanceOption("theme",btn.dataset.themeOption));
  });
  els.fontOptionBtns.forEach(btn=>{
    btn.addEventListener("click",()=>setAppearanceOption("font",btn.dataset.fontOption));
  });
  els.densityOptionBtns.forEach(btn=>{
    btn.addEventListener("click",()=>setAppearanceOption("density",btn.dataset.densityOption));
  });
  els.appearanceResetBtn.addEventListener("click",resetAppearanceSettings);

  els.noteSplitHandle.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft"){
      e.preventDefault();
      applyNoteSplitPercent(noteSourcePercent-2,true);
    }
    if(e.key==="ArrowRight"){
      e.preventDefault();
      applyNoteSplitPercent(noteSourcePercent+2,true);
    }
    if(e.key==="Home"){
      e.preventDefault();
      applyNoteSplitPercent(28,true);
    }
    if(e.key==="End"){
      e.preventDefault();
      applyNoteSplitPercent(78,true);
    }
  });

  document.addEventListener("keydown", e=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){
      e.preventDefault();
      if(els.searchDialog.open) closeGlobalSearch();
      else openGlobalSearch();
      return;
    }

    if(e.key==="Escape" && els.searchDialog.open){
      closeGlobalSearch();
      return;
    }

    if(e.key==="Escape" && document.body.classList.contains("focus-mode")){
      exitFocusMode();
      return;
    }

    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) return;
    if(e.key==="1") switchView("today");
    if(e.key==="2") switchView("projects");
    if(e.key==="3") switchView("log");
    if(e.key==="4") switchView("review");
    if(e.key==="5") switchView("calendar");
    if(e.key==="6") switchView("appearance");
    if(e.key.toLowerCase()==="n") openTaskDialog();
  });

  els.priorityForm.addEventListener("submit", e=>{
    e.preventDefault();
    const title = els.priorityInput.value.trim();
    if(!title) return;

    if(todayPriorityTasks().length >= 3){
      toast("今日重点已经有 3 项，请先移除一项。");
      return;
    }

    state.tasks.push({
      id:uid("task"),
      title,
      category:"research",
      projectId:null,
      due:null,
      createdAt:new Date().toISOString(),
      done:false,
      completedAt:null,
      priorityDate:localDateKey(),
      detailsMarkdown:"",
      workLogs:[]
    });

    els.priorityInput.value="";
    saveState();
    renderAll();
    toast("已加入今日重点和待办事项");
  });

  els.addTaskTopBtn.addEventListener("click", openTaskDialog);
  els.addTaskInlineBtn.addEventListener("click", openTaskDialog);
  els.closeTaskDialogBtn.addEventListener("click", closeTaskDialog);
  els.cancelTaskBtn.addEventListener("click", closeTaskDialog);

  els.taskForm.addEventListener("submit", e=>{
    e.preventDefault();

    const title=els.taskTitle.value.trim();
    if(!title){
      els.taskTitle.focus();
      return;
    }

    const makePriority = els.taskPriorityToday.checked;
    if(makePriority && todayPriorityTasks().length >= 3){
      toast("今日重点已经有 3 项，请先移除一项。");
      return;
    }

    state.tasks.push({
      id:uid("task"),
      title,
      category:els.taskCategory.value,
      projectId:els.taskProject.value || null,
      due:els.taskDue.value || null,
      createdAt:new Date().toISOString(),
      done:false,
      completedAt:null,
      priorityDate:makePriority ? localDateKey() : null,
      detailsMarkdown:getTaskTemplateContent(els.taskTemplate.value),
      workLogs:[]
    });

    saveState();
    closeTaskDialog();
    renderAll();
    toast(makePriority ? "任务已添加，并设为今日重点" : "任务已添加");
  });

  els.filters.forEach(btn=>btn.addEventListener("click",()=>{
    activeFilter=btn.dataset.filter;
    els.filters.forEach(x=>x.classList.toggle("active",x===btn));
    renderTasks();
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

  els.backFromTaskBtn.addEventListener("click", ()=>{
    if(currentTaskId) saveTaskDetailsNow();
    currentTaskId=null;
    switchView(taskDetailReturnView || "today");
  });

  els.taskCompleteBtn.addEventListener("click", ()=>{
    if(currentTaskId) toggleTask(currentTaskId,true);
  });

  els.taskRestoreBtn.addEventListener("click", ()=>{
    if(currentTaskId) toggleTask(currentTaskId,false);
  });

  els.taskExportMarkdownBtn.addEventListener("click", ()=>{
    if(currentTaskId) exportTaskMarkdown(currentTaskId);
  });

  els.taskDetailsInput.addEventListener("input", ()=>{
    renderMarkdownInto(els.taskDetailsInput.value,els.taskDetailsPreview);
    clearTimeout(taskDetailsTimer);
    taskDetailsTimer=setTimeout(()=>{
      saveTaskDetailsNow();
    },350);
  });

  els.taskWorkLogInput.addEventListener("input", ()=>{
    renderMarkdownInto(els.taskWorkLogInput.value,els.taskWorkLogPreview);
  });

  [els.noteModeSplit,els.noteModeSource,els.noteModePreview].forEach(btn=>{
    btn.addEventListener("click",()=>setTaskNoteMode(btn.dataset.mode));
  });

  els.noteInsertButtons.forEach(btn=>{
    btn.addEventListener("click",()=>insertResearchNoteSyntax(btn.dataset.noteInsert));
  });

  els.taskTemplateApply.addEventListener("change",()=>{
    const template=els.taskTemplateApply.value;
    if(template) applyTemplateToCurrentTask(template);
    els.taskTemplateApply.value="";
  });

  els.taskDetailsInput.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){
      e.preventDefault();
      saveTaskDetailsNow();
      toast("科研笔记已保存");
    }

    if(e.key==="Tab"){
      e.preventDefault();
      const ta=els.taskDetailsInput;
      const start=ta.selectionStart;
      const end=ta.selectionEnd;
      ta.setRangeText("  ",start,end,"end");
      ta.dispatchEvent(new Event("input",{bubbles:true}));
    }
  });

  els.saveTaskWorkLogBtn.addEventListener("click",saveCurrentTaskWorkLog);

  els.markdownToolbars.forEach(toolbar=>{
    toolbar.addEventListener("click",e=>{
      const button=e.target.closest("button[data-md]");
      if(!button) return;
      insertMarkdownSyntax(toolbar.dataset.target,button.dataset.md);
    });
  });

  els.addProjectBtn.addEventListener("click", openProjectDialog);
  els.closeProjectDialogBtn.addEventListener("click", closeProjectDialog);
  els.cancelProjectBtn.addEventListener("click", closeProjectDialog);

  els.toggleArchiveBtn.addEventListener("click", ()=>{
    archiveExpanded = !archiveExpanded;
    els.archiveWrap.hidden = !archiveExpanded;
    els.toggleArchiveBtn.textContent = archiveExpanded ? "收起归档" : "展开归档";
  });

  els.backToProjectsBtn.addEventListener("click", ()=>{
    currentProjectId = null;
    switchView("projects");
  });

  els.detailArchiveBtn.addEventListener("click", ()=>{
    if(currentProjectId) archiveProject(currentProjectId,true);
  });
  els.detailRestoreBtn.addEventListener("click", ()=>{
    if(currentProjectId) restoreProject(currentProjectId,true);
  });

  els.projectSummaryInput.addEventListener("input", ()=>{
    clearTimeout(projectSummaryTimer);
    projectSummaryTimer=setTimeout(()=>{
      const p=state.projects.find(x=>x.id===currentProjectId);
      if(!p) return;
      p.summary=els.projectSummaryInput.value;
      saveState();
      els.projectSummarySaved.classList.add("show");
      setTimeout(()=>els.projectSummarySaved.classList.remove("show"),900);
    },350);
  });

  els.projectForm.addEventListener("submit", e=>{
    e.preventDefault();
    const name=els.projectName.value.trim();
    if(!name){
      els.projectName.focus();
      return;
    }

    state.projects.push({
      id:uid("project"),
      name,
      description:els.projectDesc.value.trim(),
      status:els.projectStatus.value,
      createdAt:new Date().toISOString(),
      archivedAt:null,
      summary:""
    });

    saveState();
    closeProjectDialog();
    renderAll();
    toast("项目已创建");
  });

  els.logForm.addEventListener("submit",e=>{
    e.preventDefault();
    const topic=els.logTopic.value.trim();
    if(!topic){
      els.logTopic.focus();
      return;
    }

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
    saveState();
    renderAll();
    toast("科研日志已保存");
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

  els.exportBtn.addEventListener("click", exportData);
  els.importInput.addEventListener("change", importData);

  els.focusModeBtn.addEventListener("click", enterFocusMode);
  els.exitFocusBtn.addEventListener("click", exitFocusMode);

  // ---- Auth controls ----
  els.loginForm.addEventListener("submit", handleLogin);
  els.signupForm.addEventListener("submit", handleSignup);
  els.recoveryForm.addEventListener("submit", handlePasswordRecoverySubmit);
  els.showSignupBtn.addEventListener("click", ()=>showAuthView("signup"));
  els.showLoginBtn.addEventListener("click", ()=>showAuthView("login"));
  els.forgotPasswordBtn.addEventListener("click", handleForgotPassword);
  els.logoutBtn.addEventListener("click", handleLogout);
  els.manualSyncBtn.addEventListener("click", async ()=>{
    await reconcileWithCloud({manual:true});
  });

  window.addEventListener("focus", ()=>{
    if(cloudReady && currentUser) reconcileWithCloud();
  });

  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState==="visible" && cloudReady && currentUser){
      reconcileWithCloud();
    }
  });

  // 点击对话框灰色背景即可关闭。
  [els.taskDialog, els.projectDialog].forEach(dialog=>{
    dialog.addEventListener("click", e=>{
      if(e.target === dialog) dialog.close();
    });
  });
}


// ============================================================================
// Authentication and cloud synchronization
// ============================================================================

async function boot(){
  try{
    if(!window.RESEARCH_DESK_CONFIG?.supabaseUrl || !window.RESEARCH_DESK_CONFIG?.supabasePublishableKey){
      throw new Error("缺少 Supabase 配置。");
    }
    if(!window.supabase?.createClient){
      throw new Error("Supabase 客户端加载失败，请检查网络连接。");
    }

    supabaseClient = window.supabase.createClient(
      window.RESEARCH_DESK_CONFIG.supabaseUrl,
      window.RESEARCH_DESK_CONFIG.supabasePublishableKey,
      {
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:true
        }
      }
    );

    // Workspace events are bound once; the app itself remains hidden until auth succeeds.
    initWorkspace();

    const { data:{ session }, error } = await supabaseClient.auth.getSession();
    if(error) throw error;

    if(session?.user){
      await handleSignedIn(session.user);
    }else{
      showLoggedOut();
    }

    supabaseClient.auth.onAuthStateChange(async (event, session)=>{
      if(event==="PASSWORD_RECOVERY"){
        showAuthView("recovery");
        return;
      }

      if(event==="SIGNED_IN" && session?.user){
        if(currentUser?.id !== session.user.id || !cloudReady){
          await handleSignedIn(session.user);
        }
      }

      if(event==="SIGNED_OUT"){
        showLoggedOut();
      }
    });

  }catch(err){
    console.error(err);
    showLoggedOut();
    showAuthMessage(`初始化失败：${friendlyError(err)}`, "error");
  }
}

async function handleSignedIn(user){
  currentUser = user;
  cloudReady = false;
  els.accountEmail.textContent = user.email || "已登录";
  els.authScreen.hidden = true;
  els.appShell.hidden = false;
  setSyncStatus("syncing", "正在读取云端数据…");

  await reconcileWithCloud({initial:true});

  clearInterval(cloudPollTimer);
  cloudPollTimer = setInterval(()=>{
    if(document.visibilityState==="visible" && currentUser){
      reconcileWithCloud();
    }
  }, 30000);
}

function showLoggedOut(){
  currentUser = null;
  cloudReady = false;
  lastCloudUpdatedAt = null;
  clearInterval(cloudPollTimer);
  cloudPollTimer = null;

  document.body.classList.remove("focus-mode");
  els.appShell.hidden = true;
  els.authScreen.hidden = false;
  showAuthView("login");
  setSyncStatus("idle", "未登录");
}

function showAuthView(view){
  els.authLoginView.hidden = view!=="login";
  els.authSignupView.hidden = view!=="signup";
  els.authRecoveryView.hidden = view!=="recovery";
  clearAuthMessage();
}

async function handleLogin(e){
  e.preventDefault();
  clearAuthMessage();

  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;

  if(!email || !password) return;

  setAuthBusy(els.loginForm, true);
  try{
    const { error } = await supabaseClient.auth.signInWithPassword({email,password});
    if(error) throw error;
  }catch(err){
    showAuthMessage(friendlyError(err), "error");
  }finally{
    setAuthBusy(els.loginForm, false);
  }
}

async function handleSignup(e){
  e.preventDefault();
  clearAuthMessage();

  const email = els.signupEmail.value.trim();
  const p1 = els.signupPassword.value;
  const p2 = els.signupPassword2.value;

  if(p1 !== p2){
    showAuthMessage("两次输入的密码不一致。", "error");
    return;
  }

  setAuthBusy(els.signupForm, true);
  try{
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password:p1,
      options:{ emailRedirectTo:redirectTo }
    });
    if(error) throw error;

    if(data.session){
      showAuthMessage("账号已创建并登录。", "success");
    }else{
      showAuthMessage("账号已创建。请到邮箱中点击确认链接，然后返回本页面登录。", "success");
    }
  }catch(err){
    showAuthMessage(friendlyError(err), "error");
  }finally{
    setAuthBusy(els.signupForm, false);
  }
}

async function handleForgotPassword(){
  clearAuthMessage();
  const email = els.loginEmail.value.trim();

  if(!email){
    showAuthMessage("请先在邮箱框中填写你的登录邮箱。", "error");
    els.loginEmail.focus();
    return;
  }

  try{
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo});
    if(error) throw error;
    showAuthMessage("密码重置邮件已发送，请检查邮箱。", "success");
  }catch(err){
    showAuthMessage(friendlyError(err), "error");
  }
}

async function handlePasswordRecoverySubmit(e){
  e.preventDefault();
  const password = els.recoveryPassword.value;

  try{
    const { error } = await supabaseClient.auth.updateUser({password});
    if(error) throw error;
    showAuthMessage("密码已经更新，可以继续使用科研工作台。", "success");
    setTimeout(()=>showAuthView("login"),1200);
  }catch(err){
    showAuthMessage(friendlyError(err), "error");
  }
}

async function handleLogout(){
  try{
    await flushCloudSave();
    await supabaseClient.auth.signOut();
  }catch(err){
    console.error(err);
    toast("退出登录时发生错误");
  }
}

function setAuthBusy(form, busy){
  form.querySelectorAll("button,input").forEach(el=>el.disabled=busy);
}

function showAuthMessage(message, type=""){
  els.authMessage.textContent = message;
  els.authMessage.className = `auth-message ${type}`.trim();
  els.authMessage.hidden = false;
}

function clearAuthMessage(){
  els.authMessage.hidden = true;
  els.authMessage.textContent = "";
  els.authMessage.className = "auth-message";
}

function setSyncStatus(stateName, text){
  els.syncStatus.dataset.state = stateName;
  els.syncStatusText.textContent = text;
}

function hasMeaningfulLocalData(s){
  return Boolean(
    s.tasks?.length ||
    s.projects?.length ||
    s.logs?.length ||
    Object.values(s.notes || {}).some(v=>String(v||"").trim())
  );
}

function cloneCloudState(){
  return JSON.parse(JSON.stringify(state));
}

function applyCloudState(cloudData){
  applyingCloudState = true;
  try{
    const restored = {...defaultState(), ...(cloudData || {})};
    migrateToV2(restored);

    Object.keys(state).forEach(k=>delete state[k]);
    Object.assign(state, restored);

    saveState({touch:false,cloud:false});
    els.quickNote.value = state.notes[localDateKey()] || "";
    applyAppearanceSettings();
    renderAll();

    if(state.settings.focusMode){
      document.body.classList.add("focus-mode");
    }else{
      document.body.classList.remove("focus-mode");
    }
  }finally{
    applyingCloudState = false;
  }
}

async function fetchCloudRow(){
  const {data,error} = await supabaseClient
    .from(CLOUD_TABLE)
    .select("data, updated_at")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if(error) throw error;
  return data;
}

async function writeCloudState(){
  if(!currentUser) return;

  if(cloudSaveInFlight){
    cloudSaveQueued = true;
    return;
  }

  cloudSaveInFlight = true;
  setSyncStatus("syncing","正在同步…");

  try{
    const payload = {
      user_id: currentUser.id,
      data: cloneCloudState(),
      updated_at: new Date().toISOString()
    };

    const {data,error} = await supabaseClient
      .from(CLOUD_TABLE)
      .upsert(payload,{onConflict:"user_id"})
      .select("updated_at")
      .single();

    if(error) throw error;

    lastCloudUpdatedAt = data.updated_at;
    setSyncStatus("ok","已同步");
  }catch(err){
    console.error("Cloud save failed",err);
    setSyncStatus(navigator.onLine ? "error" : "offline",
      navigator.onLine ? "同步失败，本地数据已保留" : "离线：等待重新同步");
  }finally{
    cloudSaveInFlight = false;
    if(cloudSaveQueued){
      cloudSaveQueued = false;
      writeCloudState();
    }
  }
}

function scheduleCloudSave(){
  clearTimeout(cloudSaveTimer);
  setSyncStatus("syncing","等待同步…");
  cloudSaveTimer = setTimeout(()=>writeCloudState(),650);
}

async function flushCloudSave(){
  clearTimeout(cloudSaveTimer);
  if(cloudReady && currentUser){
    await writeCloudState();
  }
}

async function reconcileWithCloud(options={}){
  if(!currentUser) return;

  setSyncStatus("syncing", options.manual ? "正在手动同步…" : "正在检查云端…");

  try{
    const row = await fetchCloudRow();

    // First use: there is no cloud row. Preserve this browser's V3 data.
    if(!row){
      await writeCloudState();
      cloudReady = true;
      setSyncStatus("ok","已同步");
      if(options.initial && hasMeaningfulLocalData(state)){
        toast("本机已有数据已上传到云端");
      }
      return;
    }

    const localTs = state.meta?.localUpdatedAt
      ? new Date(state.meta.localUpdatedAt).getTime()
      : 0;
    const cloudTs = row.updated_at
      ? new Date(row.updated_at).getTime()
      : 0;

    // During first login, a V3 local dataset has no sync timestamp.
    // If cloud already contains meaningful data, cloud wins.
    const cloudHasData = hasMeaningfulLocalData(row.data || {});
    const localHasData = hasMeaningfulLocalData(state);

    if(options.initial){
      if(cloudHasData && (!localHasData || cloudTs >= localTs || localTs===0)){
        applyCloudState(row.data);
        lastCloudUpdatedAt = row.updated_at;
      }else if(localHasData && localTs > cloudTs){
        await writeCloudState();
      }else if(!cloudHasData && localHasData){
        await writeCloudState();
      }else{
        applyCloudState(row.data || {});
        lastCloudUpdatedAt = row.updated_at;
      }
    }else{
      // Normal cross-device reconciliation.
      if(cloudTs > localTs){
        applyCloudState(row.data || {});
        lastCloudUpdatedAt = row.updated_at;
        if(options.manual) toast("已从云端更新");
      }else if(localTs > cloudTs){
        await writeCloudState();
        if(options.manual) toast("本地更新已上传");
      }
    }

    cloudReady = true;
    setSyncStatus("ok","已同步");
  }catch(err){
    console.error("Cloud reconcile failed",err);
    cloudReady = true; // allow local use and later retry
    setSyncStatus(navigator.onLine ? "error" : "offline",
      navigator.onLine ? "云端连接失败，本地仍可使用" : "离线模式");
    if(options.manual) toast("同步失败，本地数据仍然安全");
  }
}

function friendlyError(err){
  const message = String(err?.message || err || "未知错误");

  const map = [
    [/Invalid login credentials/i,"邮箱或密码不正确。"],
    [/Email not confirmed/i,"邮箱尚未确认，请先点击确认邮件中的链接。"],
    [/User already registered/i,"这个邮箱已经注册，请直接登录。"],
    [/Password should be at least/i,"密码长度不足。"],
    [/Signups not allowed/i,"当前已关闭新用户注册。"],
    [/rate limit/i,"操作过于频繁，请稍后再试。"],
    [/Failed to fetch/i,"无法连接 Supabase，请检查网络。"]
  ];

  for(const [pattern,text] of map){
    if(pattern.test(message)) return text;
  }
  return message;
}


function enterFocusMode(){
  switchView("today");
  document.body.classList.add("focus-mode");
  state.settings.focusMode=true;
  saveState();
}

function exitFocusMode(){
  document.body.classList.remove("focus-mode");
  state.settings.focusMode=false;
  saveState();
}


// ============================================================================
// V7.1 — sidebar collapse + resizable source/preview
// ============================================================================

function toggleSidebarCollapse(){
  sidebarCollapsed=!document.body.classList.contains("sidebar-collapsed");
  document.body.classList.toggle("sidebar-collapsed",sidebarCollapsed);
  localStorage.setItem("research-desk-sidebar-collapsed",String(sidebarCollapsed));
  updateSidebarCollapseButton();

  // Let editor recalculate after CSS grid transition.
  setTimeout(()=>{
    if(currentTaskId && taskNoteMode==="preview"){
      renderMarkdownInto(els.taskDetailsInput.value,els.taskDetailsPreview);
    }
  },220);
}

function updateSidebarCollapseButton(){
  if(!els.sidebarCollapseBtn) return;
  const collapsed=document.body.classList.contains("sidebar-collapsed");
  els.sidebarCollapseBtn.title=collapsed?"展开侧边栏":"折叠侧边栏";
  els.sidebarCollapseBtn.setAttribute("aria-label",collapsed?"展开侧边栏":"折叠侧边栏");
}

function applyNoteSplitPercent(percent,persist=true){
  let value=Number(percent);
  if(!Number.isFinite(value)) value=58;
  value=Math.min(78,Math.max(28,value));
  noteSourcePercent=value;

  if(els.taskNoteWorkspace){
    els.taskNoteWorkspace.style.setProperty("--source-pct",`${value}%`);
  }
  if(persist){
    localStorage.setItem("research-desk-note-source-pct",String(value));
  }
}

function startNoteSplitDrag(e){
  if(taskNoteMode!=="split") return;
  if(window.matchMedia("(max-width: 800px)").matches) return;

  splitDragging=true;
  els.noteSplitHandle.classList.add("dragging");
  els.taskNoteWorkspace.classList.add("resizing");
  els.noteSplitHandle.setPointerCapture?.(e.pointerId);

  const move=ev=>updateNoteSplitFromPointer(ev.clientX);
  const up=ev=>{
    splitDragging=false;
    els.noteSplitHandle.classList.remove("dragging");
    els.taskNoteWorkspace.classList.remove("resizing");
    try{els.noteSplitHandle.releasePointerCapture?.(e.pointerId)}catch(_){}
    window.removeEventListener("pointermove",move);
    window.removeEventListener("pointerup",up);
    window.removeEventListener("pointercancel",up);
    localStorage.setItem("research-desk-note-source-pct",String(noteSourcePercent));
  };

  window.addEventListener("pointermove",move);
  window.addEventListener("pointerup",up);
  window.addEventListener("pointercancel",up);
  e.preventDefault();
}

function updateNoteSplitFromPointer(clientX){
  const workspace=els.taskNoteWorkspace;
  if(!workspace) return;
  const rect=workspace.getBoundingClientRect();
  if(rect.width<=0) return;

  const raw=((clientX-rect.left)/rect.width)*100;
  applyNoteSplitPercent(raw,false);
}

function switchView(name){
  els.navItems.forEach(x=>x.classList.toggle("active",x.dataset.view===name));
  els.views.forEach(x=>x.classList.toggle("active",x.id===`view-${name}`));

  const titles={
    today:"今日",
    projects:"科研项目",
    "project-detail":"项目详情",
    "task-detail":"任务详情",
    log:"科研日志",
    review:"本周总结",
    calendar:"日历",
    appearance:"外观"
  };
  els.pageTitle.textContent=titles[name] || "科研工作台";

  if(name==="review") renderReview();
  if(name==="calendar") renderCalendar();
  if(name==="appearance") renderAppearanceControls();
}


// ============================================================================
// V8 — Calendar / Deadlines
// ============================================================================

function renderCalendar(){
  if(!els.calendarGrid) return;

  const year=calendarCursor.getFullYear();
  const month=calendarCursor.getMonth();
  els.calendarMonthLabel.textContent=`${year}年${month+1}月`;

  const first=new Date(year,month,1);
  const mondayOffset=(first.getDay()+6)%7;
  const gridStart=new Date(year,month,1-mondayOffset);

  const todayKey=localDateKey();
  const html=[];

  for(let i=0;i<42;i++){
    const d=new Date(gridStart);
    d.setDate(gridStart.getDate()+i);
    const key=localDateKey(d);
    const inMonth=d.getMonth()===month;
    const tasks=state.tasks
      .filter(t=>t.due===key)
      .sort((a,b)=>Number(a.done)-Number(b.done) || (a.createdAt||"").localeCompare(b.createdAt||""));

    const visible=tasks.slice(0,4);
    const more=tasks.length-visible.length;

    html.push(`
      <div class="calendar-day ${inMonth?"":"other-month"} ${key===todayKey?"today":""}">
        <div class="calendar-day-head">
          <span class="calendar-day-number">${d.getDate()}</span>
          <button class="calendar-add-btn" type="button" onclick="openTaskDialogWithDue('${key}')" title="添加 ${key} 截止任务">+</button>
        </div>
        <div class="calendar-day-tasks">
          ${visible.map(t=>`
            <button class="calendar-task ${t.category} ${t.done?"done":""}" type="button"
              onclick="openTaskDetail('${t.id}','calendar')" title="${escapeAttr(t.title)}">
              ${escapeHtml(t.title)}
            </button>
          `).join("")}
          ${more>0?`<div class="calendar-more">+ ${more} 项</div>`:""}
        </div>
      </div>
    `);
  }

  els.calendarGrid.innerHTML=html.join("");
  renderDeadlinePanels();
}

function renderDeadlinePanels(){
  const today=localDateKey();
  const todayDate=new Date(`${today}T00:00:00`);
  const futureLimit=new Date(todayDate);
  futureLimit.setDate(futureLimit.getDate()+30);
  const futureKey=localDateKey(futureLimit);

  const activeTasks=state.tasks.filter(t=>{
    if(!t.due || t.done) return false;
    const p=t.projectId?state.projects.find(x=>x.id===t.projectId):null;
    return !p || p.status!=="archived";
  });

  const overdue=activeTasks
    .filter(t=>t.due<today)
    .sort((a,b)=>a.due.localeCompare(b.due));

  const upcoming=activeTasks
    .filter(t=>t.due>=today && t.due<=futureKey)
    .sort((a,b)=>a.due.localeCompare(b.due));

  els.overdueDeadlineCount.textContent=overdue.length;
  els.upcomingDeadlineCount.textContent=upcoming.length;

  els.overdueDeadlineList.innerHTML=deadlineListHtml(overdue,"目前没有逾期任务。");
  els.upcomingDeadlineList.innerHTML=deadlineListHtml(upcoming,"未来 30 天暂时没有截止任务。");
}

function deadlineListHtml(tasks,emptyText){
  if(!tasks.length) return `<div class="empty">${emptyText}</div>`;

  return tasks.slice(0,20).map(t=>{
    const d=new Date(`${t.due}T12:00:00`);
    const month=new Intl.DateTimeFormat("zh-CN",{month:"numeric"}).format(d).replace("月","");
    const day=d.getDate();

    return `
      <div class="deadline-row">
        <div class="deadline-date">
          <strong>${day}</strong>
          <span>${month}月</span>
        </div>
        <div class="deadline-info">
          <button class="deadline-title" type="button" onclick="openTaskDetail('${t.id}','calendar')">${escapeHtml(t.title)}</button>
          <div class="deadline-meta">
            ${t.projectId?escapeHtml(projectName(t.projectId)):"未归属项目"} · ${labelCategory(t.category)}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function openTaskDialogWithDue(dateKey){
  openTaskDialog();
  els.taskDue.value=dateKey;
}

// ============================================================================
// V8 — Appearance
// ============================================================================

function appearanceDefaults(){
  return {theme:"academic",font:"mixed",density:"comfortable"};
}

function getAppearance(){
  if(!state.settings.appearance){
    state.settings.appearance=appearanceDefaults();
  }
  return state.settings.appearance;
}

function applyAppearanceSettings(){
  const a=getAppearance();

  document.body.dataset.theme=a.theme||"academic";
  document.body.dataset.font=a.font||"mixed";
  document.body.dataset.density=a.density||"comfortable";

  renderAppearanceControls();
}

function renderAppearanceControls(){
  if(!els.themeOptionBtns?.length) return;

  const a=getAppearance();
  els.themeOptionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.themeOption===a.theme));
  els.fontOptionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.fontOption===a.font));
  els.densityOptionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.densityOption===a.density));
}

function setAppearanceOption(kind,value){
  const a=getAppearance();

  const allowed={
    theme:["academic","paper","forest","graphite"],
    font:["mixed","sans","serif","system"],
    density:["comfortable","compact"]
  };

  if(!allowed[kind]?.includes(value)) return;
  a[kind]=value;
  applyAppearanceSettings();
  saveState();
  toast("外观设置已保存");
}

function resetAppearanceSettings(){
  state.settings.appearance=appearanceDefaults();
  applyAppearanceSettings();
  saveState();
  toast("已恢复默认外观");
}


// ============================================================================
// V9 — Today's work-log summary
// ============================================================================

function todayTaskWorkLogs(){
  const today=localDateKey();
  const items=[];

  state.tasks.forEach(task=>{
    (task.workLogs||[]).forEach(log=>{
      if(log.createdAt && localDateKey(new Date(log.createdAt))===today){
        items.push({task,log});
      }
    });
  });

  return items.sort((a,b)=>(b.log.createdAt||"").localeCompare(a.log.createdAt||""));
}

function renderTodayWorkLogs(){
  if(!els.todayWorkLogList) return;

  const items=todayTaskWorkLogs();
  els.todayWorkLogCount.textContent=items.length;

  if(!items.length){
    els.todayWorkLogList.innerHTML=`<div class="empty">今天还没有任务工作记录。即使一个任务尚未完成，也建议把实际推进写进任务详情里的“工作记录”。</div>`;
    return;
  }

  els.todayWorkLogList.innerHTML=items.map(({task,log})=>`
    <div class="today-progress-item">
      <div class="today-progress-time">${formatTimeOnly(log.createdAt)}</div>
      <div>
        <button class="today-progress-task" type="button"
          onclick="openTaskWorkLogFromSearch('${task.id}','${log.id}','today')">${escapeHtml(task.title)}</button>
        <div class="today-progress-project">${task.projectId?escapeHtml(projectName(task.projectId)):"未归属项目"}</div>
        <div class="today-progress-excerpt">${escapeHtml(makePlainExcerpt(log.content,220))}</div>
      </div>
      <button class="today-progress-open" type="button"
        onclick="openTaskWorkLogFromSearch('${task.id}','${log.id}','today')" title="打开工作记录">›</button>
    </div>
  `).join("");
}

function formatTimeOnly(iso){
  if(!iso) return "";
  return new Intl.DateTimeFormat("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(iso));
}

// ============================================================================
// V9 — Research-note templates
// ============================================================================

function getTaskTemplateContent(template){
  switch(template){
    case "theory":
      return String.raw`# 研究目标

这个任务要解决的核心理论问题是什么？

## 模型与假设

- 系统：
- 参数区间：
- 近似与假设：

## 推导

\[
H =
\]

### 关键步骤

1. 
2. 
3. 

## 一致性检查

- 极限情况：
- 量纲：
- 与已有结果比较：

## 当前结论

- 

## 未解决问题

- 

## 下一步

- `;

    case "numerical":
      return String.raw`# 数值目标

需要用数值计算验证什么？

## 模型与参数

- 模型：
- 参数：
- 初态：
- 时间范围 / 扫描范围：

## 数值方法

- 程序：
- 求解器：
- 截断：
- 收敛性检查：

## 结果

### Figure / 数据

- 

## 与解析结果比较

\[
\text{numerics} \quad \text{vs.} \quad \text{analytics}
\]

## 异常与排查

- 

## 下一步

- `;

    case "paper":
      return String.raw`# 修改目标

这一处为什么要修改？

## 原文 / 原结构

> 

## 修改后

> 

## 修改原因

- 物理表述：
- 数学严谨性：
- 篇幅：
- 与全文符号统一：

## 待确认

- 

## 下一步

- `;

    case "literature":
      return String.raw`# 文献信息

- 题目：
- 作者：
- 期刊 / arXiv：
- DOI：
- 阅读日期：

## 这篇文章解决什么问题？

## 核心模型

\[
H =
\]

## 关键方法

- 

## 主要结论

- 

## 对当前项目的启发

- 

## 与我们的区别

- 

## 值得引用的位置

- `;

    case "figure":
      return String.raw`# Figure 目标

这张图要回答什么物理问题？

## 数据 / 参数

- 横轴：
- 纵轴：
- 固定参数：
- 扫描参数：

## 作图方案

- panel (a)：
- panel (b)：
- panel (c)：

## 需要突出

- 

## 检查

- 量纲
- 图例
- 字号
- 线宽
- 颜色
- caption 与正文一致

## 下一步

- `;

    case "referee":
      return String.raw`# Referee Comment

> 审稿意见粘贴在这里。

## 审稿人的核心关切

- 

## 我们的判断

- 是否成立：
- 是否需要补充计算 / 推导：
- 是否需要修改正文：

## Response

> We thank the referee for ...

## Manuscript change

原文：

> 

修改后：

> 

## 待检查

- 页码 / 行号
- Figure / Equation 引用
- Supplement 对应修改
`;

    case "blank":
    default:
      return "";
  }
}

function applyTemplateToCurrentTask(template){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;

  const content=getTaskTemplateContent(template);
  if(!content) return;

  if(els.taskDetailsInput.value.trim()){
    const ok=confirm("当前科研笔记已有内容。套用模板会替换现有笔记，确定继续吗？");
    if(!ok) return;
  }

  els.taskDetailsInput.value=content;
  renderMarkdownInto(content,els.taskDetailsPreview);
  saveTaskDetailsNow();
  toast("科研笔记模板已套用");
}

// ============================================================================
// V9 — Global search
// ============================================================================

function openGlobalSearch(){
  if(currentTaskId){
    saveTaskDetailsNow();
  }

  if(!els.searchDialog.open){
    els.searchDialog.showModal();
  }

  els.globalSearchInput.value="";
  searchMatches=[];
  searchActiveIndex=0;
  renderSearchResults();
  setTimeout(()=>els.globalSearchInput.focus(),30);
}

function closeGlobalSearch(){
  if(els.searchDialog.open) els.searchDialog.close();
}

function runGlobalSearch(rawQuery){
  const query=String(rawQuery||"").trim();
  if(!query){
    searchMatches=[];
    searchActiveIndex=0;
    renderSearchResults();
    return;
  }

  const q=query.toLocaleLowerCase();
  const matches=[];

  state.projects.forEach(project=>{
    const hay=[project.name,project.description,project.summary].filter(Boolean).join("\n");
    if(searchTextMatches(hay,q)){
      matches.push({
        type:"project",
        label:project.status==="archived"?"已归档项目":"科研项目",
        title:project.name,
        context:labelStatus(project.status),
        excerpt:bestSearchExcerpt(hay,q),
        projectId:project.id,
        score:searchScore(project.name,hay,q)
      });
    }
  });

  state.tasks.forEach(task=>{
    const hay=[task.title,task.detailsMarkdown].filter(Boolean).join("\n");
    if(searchTextMatches(hay,q)){
      matches.push({
        type:"task",
        label:"任务 / 科研笔记",
        title:task.title,
        context:task.projectId?projectName(task.projectId):"未归属项目",
        excerpt:bestSearchExcerpt(hay,q),
        taskId:task.id,
        score:searchScore(task.title,hay,q)
      });
    }

    (task.workLogs||[]).forEach(log=>{
      if(searchTextMatches(log.content,q)){
        matches.push({
          type:"worklog",
          label:"工作记录",
          title:task.title,
          context:`${task.projectId?projectName(task.projectId):"未归属项目"} · ${formatDateTime(log.createdAt)}`,
          excerpt:bestSearchExcerpt(log.content,q),
          taskId:task.id,
          workLogId:log.id,
          score:90 + searchScore("",log.content,q)
        });
      }
    });
  });

  state.logs.forEach(log=>{
    const hay=[log.topic,log.progress,log.finding,log.next].filter(Boolean).join("\n");
    if(searchTextMatches(hay,q)){
      matches.push({
        type:"research-log",
        label:"科研日志",
        title:log.topic,
        context:log.projectId?projectName(log.projectId):"未归属项目",
        excerpt:bestSearchExcerpt(hay,q),
        logId:log.id,
        score:80 + searchScore(log.topic,hay,q)
      });
    }
  });

  searchMatches=matches
    .sort((a,b)=>b.score-a.score)
    .slice(0,60);

  searchActiveIndex=0;
  renderSearchResults(query);
}

function searchTextMatches(text,q){
  return String(text||"").toLocaleLowerCase().includes(q);
}

function searchScore(title,text,q){
  const t=String(title||"").toLocaleLowerCase();
  const full=String(text||"").toLocaleLowerCase();
  let score=0;
  if(t===q) score+=300;
  else if(t.startsWith(q)) score+=220;
  else if(t.includes(q)) score+=160;

  const first=full.indexOf(q);
  if(first>=0) score+=Math.max(0,80-Math.min(first,80));
  return score;
}

function makePlainExcerpt(text,maxLength=180){
  let value=String(text||"")
    .replace(/```[\s\S]*?```/g," [代码] ")
    .replace(/`([^`]+)`/g,"$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g,"")
    .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1")
    .replace(/^#{1,6}\s+/gm,"")
    .replace(/[*_>#~-]/g," ")
    .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g," ")
    .replace(/\s+/g," ")
    .trim();

  if(value.length>maxLength) value=value.slice(0,maxLength-1)+"…";
  return value;
}

function bestSearchExcerpt(text,q){
  const plain=makePlainExcerpt(text,10000);
  const low=plain.toLocaleLowerCase();
  const idx=low.indexOf(q);
  if(idx<0) return makePlainExcerpt(plain,190);

  const start=Math.max(0,idx-65);
  const end=Math.min(plain.length,idx+q.length+105);
  return `${start>0?"…":""}${plain.slice(start,end)}${end<plain.length?"…":""}`;
}

function highlightSearchText(text,query){
  const safe=escapeHtml(text||"");
  if(!query) return safe;

  const escapedQuery=String(query).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  try{
    const re=new RegExp(`(${escapedQuery})`,"ig");
    return safe.replace(re,'<mark class="search-highlight">$1</mark>');
  }catch{
    return safe;
  }
}

function renderSearchResults(query=""){
  if(!query){
    els.searchHint.textContent="输入关键词开始搜索。支持中文、英文和公式关键词。";
    els.searchResultCount.textContent="";
    els.searchResults.innerHTML=`
      <div class="search-empty">
        可以搜索项目、任务标题、科研笔记、工作记录和科研日志。<br>
        例如：XY cancellation、rank-two、J_XY、审稿意见。
      </div>`;
    return;
  }

  els.searchHint.textContent=`搜索 “${query}”`;
  els.searchResultCount.textContent=`${searchMatches.length} 个结果`;

  if(!searchMatches.length){
    els.searchResults.innerHTML=`<div class="search-empty">没有找到匹配内容。</div>`;
    return;
  }

  els.searchResults.innerHTML=searchMatches.map((item,index)=>`
    <button class="search-result ${index===searchActiveIndex?"active":""}" type="button"
      data-search-index="${index}" onclick="openSearchResult(${index})">
      <div class="search-result-type">${escapeHtml(item.label)}</div>
      <div>
        <div class="search-result-title">${highlightSearchText(item.title,query)}</div>
        <div class="search-result-context">${escapeHtml(item.context||"")}</div>
        <div class="search-result-excerpt">${highlightSearchText(item.excerpt||"",query)}</div>
      </div>
    </button>
  `).join("");

  scrollActiveSearchResultIntoView();
}

function handleSearchKeydown(e){
  if(e.key==="ArrowDown"){
    e.preventDefault();
    if(searchMatches.length){
      searchActiveIndex=(searchActiveIndex+1)%searchMatches.length;
      renderSearchResults(els.globalSearchInput.value.trim());
    }
  }else if(e.key==="ArrowUp"){
    e.preventDefault();
    if(searchMatches.length){
      searchActiveIndex=(searchActiveIndex-1+searchMatches.length)%searchMatches.length;
      renderSearchResults(els.globalSearchInput.value.trim());
    }
  }else if(e.key==="Enter"){
    e.preventDefault();
    if(searchMatches[searchActiveIndex]) openSearchResult(searchActiveIndex);
  }else if(e.key==="Escape"){
    e.preventDefault();
    closeGlobalSearch();
  }
}

function scrollActiveSearchResultIntoView(){
  requestAnimationFrame(()=>{
    const active=els.searchResults.querySelector(".search-result.active");
    active?.scrollIntoView({block:"nearest"});
  });
}

function openSearchResult(index){
  const item=searchMatches[index];
  if(!item) return;

  closeGlobalSearch();

  if(item.type==="project"){
    openProjectDetail(item.projectId);
  }else if(item.type==="task"){
    openTaskDetail(item.taskId,"today");
  }else if(item.type==="worklog"){
    openTaskWorkLogFromSearch(item.taskId,item.workLogId,"today");
  }else if(item.type==="research-log"){
    openResearchLogFromSearch(item.logId);
  }
}

function openTaskWorkLogFromSearch(taskId,workLogId,returnView="today"){
  openTaskDetail(taskId,returnView);
  setTimeout(()=>{
    const el=document.getElementById(`worklog-card-${escapeAttr(workLogId)}`);
    el?.scrollIntoView({behavior:"smooth",block:"center"});
  },90);
}

function openResearchLogFromSearch(logId){
  switchView("log");
  setTimeout(()=>{
    const el=document.getElementById(`log-entry-${escapeAttr(logId)}`);
    el?.scrollIntoView({behavior:"smooth",block:"center"});
  },80);
}

function todayPriorityTasks(){
  return state.tasks.filter(t=>t.priorityDate===localDateKey());
}

function todayDoneTasks(){
  return state.tasks.filter(t=>
    t.done &&
    t.completedAt &&
    localDateKey(new Date(t.completedAt))===localDateKey()
  );
}

function renderAll(){
  renderToday();
  renderProjects();
  renderProjectOptions();
  renderLogs();
  renderReview();
  renderCalendar();
  renderAppearanceControls();
  if(currentProjectId) renderProjectDetail();
  if(currentTaskId) renderTaskDetail();
}

function renderToday(){
  renderPriorities();
  renderTasks();
  renderDone();
  renderTodayWorkLogs();

  els.doneCount.textContent=todayDoneTasks().length;
  els.openCount.textContent=state.tasks.filter(t=>!t.done).length;
  els.projectCount.textContent=state.projects.filter(p=>p.status==="active").length;

  const pc = todayPriorityTasks().length;
  els.priorityStat.textContent=`${pc} / 3`;
}

function renderPriorities(){
  const items=[...todayPriorityTasks()].sort((a,b)=>{
    if(a.done!==b.done) return Number(a.done)-Number(b.done);
    return a.createdAt.localeCompare(b.createdAt);
  });

  els.priorityCount.textContent=`${items.length} / 3`;

  if(!items.length){
    els.priorityList.innerHTML=`<div class="empty">今天还没有设置重点。建议只挑最重要的 1–3 件事。</div>`;
    return;
  }

  els.priorityList.innerHTML=items.map(t=>`
    <div class="priority-item">
      <input class="check" type="checkbox" ${t.done?"checked":""}
        onchange="toggleTask('${t.id}', ${!t.done})">
      <div class="item-text">
        <div class="item-title ${t.done?"done":""}"><button class="task-title-link" type="button" onclick="openTaskDetail('${t.id}','today')">${escapeHtml(t.title)}</button></div>
        <div class="item-meta">
          ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
          ${t.due?dueBadge(t.due):""}
        </div>
      </div>
      <button class="delete-btn" type="button"
        onclick="removePriority('${t.id}')" title="移出今日重点">×</button>
    </div>
  `).join("");
}

function renderTasks(){
  let items=state.tasks.filter(t=>!t.done);

  if(activeFilter!=="all"){
    items=items.filter(t=>t.category===activeFilter);
  }

  items.sort((a,b)=>{
    if(Boolean(a.priorityDate===localDateKey()) !== Boolean(b.priorityDate===localDateKey())){
      return a.priorityDate===localDateKey() ? -1 : 1;
    }
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
      <input class="check" type="checkbox" onchange="toggleTask('${t.id}', true)">
      <div class="item-text">
        <div class="item-title"><button class="task-title-link" type="button" onclick="openTaskDetail('${t.id}','today')">${escapeHtml(t.title)}</button></div>
        <div class="item-meta">
          <span class="badge ${t.category}">${labelCategory(t.category)}</span>
          ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
          ${t.due?dueBadge(t.due):""}
        </div>
      </div>
      <button class="priority-toggle ${t.priorityDate===localDateKey()?"active":""}" type="button"
        onclick="togglePriority('${t.id}')" title="${t.priorityDate===localDateKey()?"移出今日重点":"设为今日重点"}">
        ${t.priorityDate===localDateKey()?"★":"☆"}
      </button>
      <button class="delete-btn" type="button" onclick="deleteTask('${t.id}')" title="删除任务">×</button>
    </div>
  `).join("");
}

function renderDone(){
  const items=todayDoneTasks().sort((a,b)=>b.completedAt.localeCompare(a.completedAt));

  if(!items.length){
    els.doneList.innerHTML=`<div class="empty">今天还没有完成事项。完成后的任务会自动记录在这里。</div>`;
    return;
  }

  els.doneList.innerHTML=items.map(t=>`
    <div class="done-item">
      <div class="done-icon">✓</div>
      <div class="item-text">
        <div class="item-title"><button class="task-title-link" type="button" onclick="openTaskDetail('${t.id}','today')">${escapeHtml(t.title)}</button></div>
        <div class="item-meta">
          ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
          ${t.priorityDate===localDateKey()?`<span class="badge today">今日重点</span>`:""}
        </div>
      </div>
      <button class="delete-btn" type="button" onclick="toggleTask('${t.id}', false)" title="恢复为待办">↶</button>
    </div>
  `).join("");
}

function renderProjects(){
  const current=state.projects
    .filter(p=>p.status!=="archived")
    .sort((a,b)=>{
      const order={active:0,idea:1,paused:2};
      return (order[a.status]??9)-(order[b.status]??9) || a.name.localeCompare(b.name);
    });
  const archived=state.projects
    .filter(p=>p.status==="archived")
    .sort((a,b)=>(b.archivedAt||"").localeCompare(a.archivedAt||""));

  els.currentProjectCount.textContent=current.length;
  els.projectGrid.innerHTML=current.length
    ? current.map(p=>projectCardHtml(p,false)).join("")
    : `<div class="panel empty">当前没有科研项目。新建项目，或者从下方归档区恢复一个项目。</div>`;
  els.archiveGrid.innerHTML=archived.length
    ? archived.map(p=>projectCardHtml(p,true)).join("")
    : `<div class="panel empty">还没有归档项目。项目完成后可以归档，所有任务和科研日志都会保留。</div>`;
}

function projectCardHtml(p,isArchived){
  const tasks=state.tasks.filter(t=>t.projectId===p.id);
  const open=tasks.filter(t=>!t.done).length;
  const done=tasks.filter(t=>t.done).length;
  const logs=state.logs.filter(l=>l.projectId===p.id).length;
  const total=open+done;
  const progress=total?Math.round(done/total*100):0;
  return `
    <article class="project-card" onclick="openProjectDetail('${p.id}')">
      <div class="project-top">
        <div class="status-dot ${p.status}" title="${labelStatus(p.status)}"></div>
        <div class="project-card-actions" onclick="event.stopPropagation()">
          ${isArchived
            ? `<button class="project-action-btn restore" type="button" onclick="restoreProject('${p.id}')">恢复</button>`
            : `<button class="project-action-btn archive" type="button" onclick="archiveProject('${p.id}')">归档</button>`}
          <button class="project-action-btn delete" type="button" onclick="deleteProject('${p.id}')">删除</button>
        </div>
      </div>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description||"暂无说明。")}</p>
      <div class="project-progress" title="任务完成率 ${progress}%"><span style="width:${progress}%"></span></div>
      <div class="project-bottom"><span>${open} 待办 · ${done} 完成</span><span>${logs} 篇日志 · ${progress}%</span></div>
    </article>`;
}

function renderProjectOptions(){
  const options=[`<option value="">未归属项目</option>`]
    .concat(state.projects.filter(p=>p.status!=="archived").map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`))
    .join("");

  const taskCurrent=els.taskProject.value;
  const logCurrent=els.logProject.value;

  els.taskProject.innerHTML=options;
  els.logProject.innerHTML=options;

  if([...els.taskProject.options].some(o=>o.value===taskCurrent)) els.taskProject.value=taskCurrent;
  if([...els.logProject.options].some(o=>o.value===logCurrent)) els.logProject.value=logCurrent;
}

function renderLogs(){
  if(!state.logs.length){
    els.logList.innerHTML=`<div class="empty">你的科研过程会记录在这里。建议简洁记录：问题、进展、发现、下一步。</div>`;
    return;
  }

  els.logList.innerHTML=state.logs.slice(0,30).map(l=>`
    <article class="log-entry" id="log-entry-${escapeAttr(l.id)}">
      <div class="log-entry-head">
        <div>
          <div class="log-entry-title">${escapeHtml(l.topic)}</div>
          <div class="log-entry-project">${escapeHtml(projectName(l.projectId))}</div>
        </div>
        <div class="log-entry-date">${new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",year:"numeric"}).format(new Date(l.createdAt))}</div>
      </div>
      <dl>
        ${l.progress?`<div><dt>进展</dt><dd>${escapeHtml(l.progress)}</dd></div>`:""}
        ${l.finding?`<div><dt>关键发现</dt><dd>${escapeHtml(l.finding)}</dd></div>`:""}
        ${l.next?`<div><dt>下一步</dt><dd>${escapeHtml(l.next)}</dd></div>`:""}
      </dl>
      <button class="log-delete" type="button" onclick="deleteLog('${l.id}')">删除</button>
    </article>
  `).join("");
}

function renderReview(){
  const start=startOfWeek();
  const end=new Date(start);
  end.setDate(end.getDate()+6);

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
    ? done.map(t=>`
      <div class="done-item">
        <div class="done-icon">✓</div>
        <div class="item-text">
          <div class="item-title">${escapeHtml(t.title)}</div>
          <div class="item-meta">
            ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
          </div>
        </div>
      </div>`).join("")
    : `<div class="empty">本周完成的任务会显示在这里。</div>`;

  els.carryList.innerHTML=open.length
    ? open.slice(0,15).map(t=>`
      <div class="task-item">
        <div class="item-text">
          <div class="item-title">${escapeHtml(t.title)}</div>
          <div class="item-meta">
            ${t.projectId?`<span>${escapeHtml(projectName(t.projectId))}</span>`:""}
            ${t.due?dueBadge(t.due):""}
          </div>
        </div>
      </div>`).join("")
    : `<div class="empty">没有需要延续的待办任务。</div>`;
}

function makeReviewText(){
  const done=state.tasks.filter(t=>t.done&&t.completedAt&&isThisWeek(t.completedAt));
  const logs=state.logs.filter(l=>isThisWeek(l.createdAt));
  const open=state.tasks.filter(t=>!t.done);

  const lines=[];
  lines.push(`本周总结 — ${els.weekLabel.textContent}`);
  lines.push("");
  lines.push(`已完成：${done.length}`);
  lines.push(`科研日志：${logs.length}`);
  lines.push(`进行中项目：${state.projects.filter(p=>p.status==="active").length}`);
  lines.push("");

  lines.push("本周完成");
  if(done.length){
    done.forEach(t=>lines.push(`- ${t.title}${t.projectId?` [${projectName(t.projectId)}]`:""}`));
  }else{
    lines.push("- 暂无记录");
  }

  lines.push("");
  lines.push("下周继续");
  if(open.length){
    open.slice(0,15).forEach(t=>lines.push(`- ${t.title}${t.projectId?` [${projectName(t.projectId)}]`:""}`));
  }else{
    lines.push("- 无");
  }

  lines.push("");
  lines.push("科研发现");
  if(logs.length){
    logs.slice(0,10).forEach(l=>lines.push(`- ${l.topic}${l.finding?`：${l.finding}`:""}`));
  }else{
    lines.push("- 暂无记录");
  }

  return lines.join("\n");
}

function openTaskDialog(){
  renderProjectOptions();
  els.taskForm.reset();
  els.taskTemplate.value="blank";
  els.taskDialog.showModal();
  setTimeout(()=>els.taskTitle.focus(),50);
}

function closeTaskDialog(){
  if(els.taskDialog.open) els.taskDialog.close();
  els.taskForm.reset();
}

function openProjectDialog(){
  els.projectForm.reset();
  els.projectDialog.showModal();
  setTimeout(()=>els.projectName.focus(),50);
}

function closeProjectDialog(){
  if(els.projectDialog.open) els.projectDialog.close();
  els.projectForm.reset();
}

function labelCategory(c){
  return ({research:"科研",writing:"写作",admin:"事务",other:"其他"})[c] || c;
}

function labelStatus(s){
  return ({active:"进行中",paused:"暂停",idea:"想法",archived:"已归档"})[s] || s;
}

function dueBadge(due){
  const today=localDateKey();
  if(due < today) return `<span class="badge overdue">逾期 ${shortDate(due)}</span>`;
  if(due === today) return `<span class="badge today">今天截止</span>`;
  return `<span>截止 ${shortDate(due)}</span>`;
}


// ===== V6 task detail / Markdown / LaTeX =====
function openTaskDetail(id,returnView="today"){
  const task=state.tasks.find(t=>t.id===id);
  if(!task) return;
  currentTaskId=id;
  taskDetailReturnView=returnView || "today";
  switchView("task-detail");
  renderTaskDetail();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderTaskDetail(){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task){
    currentTaskId=null;
    switchView(taskDetailReturnView || "today");
    return;
  }

  els.taskDetailTitle.textContent=task.title;
  els.taskWorkLogCount.textContent=(task.workLogs||[]).length;
  setTaskNoteMode(taskNoteMode,false);

  const meta=[];
  meta.push(`<span class="badge ${task.category}">${labelCategory(task.category)}</span>`);
  if(task.projectId) meta.push(`<span>${escapeHtml(projectName(task.projectId))}</span>`);
  if(task.due) meta.push(dueBadge(task.due));
  if(task.priorityDate===localDateKey()) meta.push(`<span class="badge today">今日重点</span>`);
  meta.push(`<span class="status-badge ${task.done?"archived":"active"}">${task.done?"已完成":"进行中"}</span>`);
  els.taskDetailMeta.innerHTML=meta.join("");

  els.taskCompleteBtn.hidden=task.done;
  els.taskRestoreBtn.hidden=!task.done;

  els.taskDetailsInput.value=task.detailsMarkdown||"";
  renderMarkdownInto(task.detailsMarkdown||"",els.taskDetailsPreview);

  els.taskWorkLogInput.value="";
  renderMarkdownInto("",els.taskWorkLogPreview);
  renderTaskWorkLogs(task);
}

function renderTaskWorkLogs(task){
  const logs=[...(task.workLogs||[])].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  if(!logs.length){
    els.taskWorkLogList.innerHTML=`<div class="panel empty">还没有工作记录。每完成一次推导、计算、文献检查或文字修改，都可以在这里留下一条。</div>`;
    return;
  }

  els.taskWorkLogList.innerHTML=logs.map((log,index)=>`
    <article class="task-worklog-card" id="worklog-card-${escapeAttr(log.id)}">
      <div class="task-worklog-head">
        <div class="task-worklog-date">${formatDateTime(log.createdAt)}</div>
        <div class="task-worklog-index">记录 ${logs.length-index}</div>
      </div>
      <div class="markdown-preview" id="worklog-preview-${escapeAttr(log.id)}"></div>
      <button class="worklog-delete-btn" type="button" onclick="deleteTaskWorkLog('${task.id}','${log.id}')">删除记录</button>
    </article>
  `).join("");

  logs.forEach(log=>{
    const target=document.getElementById(`worklog-preview-${escapeAttr(log.id)}`);
    if(target) renderMarkdownInto(log.content||"",target);
  });
}


function saveTaskDetailsNow(){
  clearTimeout(taskDetailsTimer);
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;

  task.detailsMarkdown=els.taskDetailsInput.value;
  saveState();
  els.taskDetailsSaved.classList.add("show");
  setTimeout(()=>els.taskDetailsSaved.classList.remove("show"),900);
}

function setTaskNoteMode(mode,persist=true){
  const allowed=["split","source","preview"];
  if(!allowed.includes(mode)) mode="split";

  taskNoteMode=mode;
  if(persist) localStorage.setItem("research-desk-note-mode",mode);

  els.taskNoteWorkspace.classList.remove("mode-split","mode-source","mode-preview");
  els.taskNoteWorkspace.classList.add(`mode-${mode}`);

  [els.noteModeSplit,els.noteModeSource,els.noteModePreview].forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.mode===mode);
  });

  if(mode==="split"){
    applyNoteSplitPercent(noteSourcePercent,false);
  }

  if(mode==="preview"){
    renderMarkdownInto(els.taskDetailsInput.value,els.taskDetailsPreview);
  }
}

function insertResearchNoteSyntax(type){
  const textarea=els.taskDetailsInput;
  if(!textarea) return;

  const start=textarea.selectionStart??textarea.value.length;
  const end=textarea.selectionEnd??start;
  const selected=textarea.value.slice(start,end);

  let before="",after="",fallback="";
  switch(type){
    case "section":
      before="\n## ";after="\n";fallback="章节标题";break;
    case "subsection":
      before="\n### ";after="\n";fallback="小节标题";break;
    case "bold":
      before="**";after="**";fallback="重点内容";break;
    case "list":
      before="\n- ";after="\n";fallback="条目";break;
    case "inline-math":
      before="$";after="$";fallback="J_{XY}=0";break;
    case "display-math":
      before="\n\\[\n";after="\n\\]\n";
      fallback="J_{XY}=\\sum_m \\frac{g_{1m}g_{2m}}{2}\\left(\\frac{1}{\\Delta_{1m}}+\\frac{1}{\\Delta_{2m}}\\right)";
      break;
    case "align":
      before="\n\\[\n\\begin{aligned}\n";after="\n\\end{aligned}\n\\]\n";
      fallback="A &= B + C \\\\\nD &= E - F";
      break;
    case "code":
      before="\n```\n";after="\n```\n";fallback="code";break;
    default:return;
  }

  textarea.setRangeText(before+(selected||fallback)+after,start,end,"end");
  textarea.focus();
  textarea.dispatchEvent(new Event("input",{bubbles:true}));
}

function saveCurrentTaskWorkLog(){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;
  const content=els.taskWorkLogInput.value.trim();
  if(!content){
    toast("先写下本次具体做了什么。");
    els.taskWorkLogInput.focus();
    return;
  }

  if(!Array.isArray(task.workLogs)) task.workLogs=[];
  task.workLogs.push({
    id:uid("worklog"),
    createdAt:new Date().toISOString(),
    content
  });

  els.taskWorkLogInput.value="";
  renderMarkdownInto("",els.taskWorkLogPreview);
  saveState();
  renderAll();
  toast("本次工作记录已保存");
}

function deleteTaskWorkLog(taskId,logId){
  const task=state.tasks.find(t=>t.id===taskId);
  if(!task||!Array.isArray(task.workLogs)) return;
  if(!confirm("确定删除这条工作记录吗？")) return;
  task.workLogs=task.workLogs.filter(log=>log.id!==logId);
  saveState();
  renderAll();
}

function renderMarkdownInto(source,target){
  if(!target) return;

  const text=String(source||"");
  if(!text.trim()){
    target.innerHTML=`<div class="empty">预览会显示在这里。</div>`;
    return;
  }

  try{
    if(!window.marked||!window.DOMPurify||!window.katex){
      target.textContent=text;
      return;
    }

    // Markdown 会把 \( \) 里的反斜杠当成转义符。
    // 因此先临时保护代码段和数学公式，再解析 Markdown。
    const protectedResult=protectMarkdownMath(text);
    const protectedText=protectedResult.text;
    const mathSegments=protectedResult.mathSegments;

    marked.setOptions({
      gfm:true,
      breaks:true
    });

    const raw=marked.parse(protectedText);
    target.innerHTML=DOMPurify.sanitize(raw);

    // Markdown 完成后，在 DOM 文本节点中把占位符替换为 KaTeX。
    replaceMathPlaceholders(target,mathSegments);

  }catch(err){
    console.error("Markdown/LaTeX render error",err);
    target.textContent=text;
  }
}

function protectMarkdownMath(source){
  const codeSegments=[];
  const mathSegments=[];

  // 先保护 fenced code 和 inline code，避免其中的 $ 被当作公式。
  let text=source.replace(/```[\s\S]*?```|`[^`\n]*`/g,match=>{
    const token=`CODEV61TOKEN${codeSegments.length}END`;
    codeSegments.push(match);
    return token;
  });

  function storeMath(tex,display){
    const token=`MATHV61TOKEN${mathSegments.length}END`;
    mathSegments.push({tex,display});
    return token;
  }

  // 顺序很重要：先匹配 display math，再匹配 inline math。
  text=text.replace(/\$\$([\s\S]*?)\$\$/g,(m,tex)=>storeMath(tex,true));
  text=text.replace(/\\\[([\s\S]*?)\\\]/g,(m,tex)=>storeMath(tex,true));
  text=text.replace(/\\\(([\s\S]*?)\\\)/g,(m,tex)=>storeMath(tex,false));

  // 单美元仅允许单行，避免跨段误匹配；排除 $$。
  text=text.replace(/(^|[^$])\$([^$\n]+?)\$(?!\$)/g,(m,prefix,tex)=>{
    return prefix+storeMath(tex,false);
  });

  // 把代码原文放回去，让 marked 正常生成 code/pre。
  codeSegments.forEach((code,index)=>{
    text=text.replace(`CODEV61TOKEN${index}END`,code);
  });

  return {text,mathSegments};
}

function replaceMathPlaceholders(root,mathSegments){
  const tokenRe=/MATHV61TOKEN(\d+)END/g;
  const walker=document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  const nodes=[];
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(node.nodeValue&&node.nodeValue.includes("MATHV61TOKEN")){
      nodes.push(node);
    }
  }

  nodes.forEach(node=>{
    const text=node.nodeValue;
    const frag=document.createDocumentFragment();
    let lastIndex=0;
    let match;

    tokenRe.lastIndex=0;
    while((match=tokenRe.exec(text))!==null){
      if(match.index>lastIndex){
        frag.appendChild(document.createTextNode(text.slice(lastIndex,match.index)));
      }

      const idx=Number(match[1]);
      const item=mathSegments[idx];

      if(item){
        const wrapper=document.createElement(item.display?"div":"span");
        wrapper.className=item.display?"katex-v61-display":"katex-v61-inline";

        try{
          wrapper.innerHTML=katex.renderToString(item.tex,{
            displayMode:item.display,
            throwOnError:false,
            strict:"ignore",
            trust:false,
            output:"htmlAndMathml"
          });
        }catch(err){
          wrapper.textContent=(item.display?"$$":"$")+item.tex+(item.display?"$$":"$");
        }

        frag.appendChild(wrapper);
      }else{
        frag.appendChild(document.createTextNode(match[0]));
      }

      lastIndex=tokenRe.lastIndex;
    }

    if(lastIndex<text.length){
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.replaceWith(frag);
  });
}

function insertMarkdownSyntax(targetId,type){
  const textarea=document.getElementById(targetId);
  if(!textarea) return;

  const start=textarea.selectionStart??textarea.value.length;
  const end=textarea.selectionEnd??start;
  const selected=textarea.value.slice(start,end);

  let before="",after="",fallback="";
  switch(type){
    case "bold":before="**";after="**";fallback="加粗文字";break;
    case "h2":before="\n## ";after="\n";fallback="小标题";break;
    case "list":before="\n- ";after="\n";fallback="条目";break;
    case "inline-math":before="$";after="$";fallback="E=mc^2";break;
    case "display-math":
      before="\n$$\n";after="\n$$\n";
      fallback="H_{\\mathrm{eff}} = \\sum_j \\omega_j a_j^\\dagger a_j";
      break;
    case "code":before="\n```\n";after="\n```\n";fallback="code";break;
    default:return;
  }

  textarea.setRangeText(before+(selected||fallback)+after,start,end,"end");
  textarea.focus();
  textarea.dispatchEvent(new Event("input",{bubbles:true}));
}

function exportTaskMarkdown(id){
  const task=state.tasks.find(t=>t.id===id);
  if(!task) return;

  const lines=[];
  lines.push(`# ${task.title}`);
  lines.push("");
  lines.push(`- 项目：${task.projectId?projectName(task.projectId):"未归属项目"}`);
  lines.push(`- 分类：${labelCategory(task.category)}`);
  lines.push(`- 状态：${task.done?"已完成":"进行中"}`);
  if(task.due) lines.push(`- 截止日期：${task.due}`);
  if(task.createdAt) lines.push(`- 创建时间：${formatDateTime(task.createdAt)}`);
  if(task.completedAt) lines.push(`- 完成时间：${formatDateTime(task.completedAt)}`);

  lines.push("");
  lines.push("## 任务说明与推导");
  lines.push("");
  lines.push(task.detailsMarkdown?.trim()||"_暂无记录_");
  lines.push("");
  lines.push("## 工作记录");

  const logs=[...(task.workLogs||[])].sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||""));
  if(!logs.length){
    lines.push("");
    lines.push("_暂无工作记录_");
  }else{
    logs.forEach((log,index)=>{
      lines.push("");
      lines.push(`### ${index+1}. ${formatDateTime(log.createdAt)}`);
      lines.push("");
      lines.push(log.content||"");
    });
  }

  const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`${safeFileName(task.title)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Markdown 已导出");
}

function formatDateTime(iso){
  if(!iso) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN",{
    year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"
  }).format(new Date(iso));
}

function safeFileName(name){
  return String(name||"task").replace(/[\\/:*?"<>|]/g,"-").slice(0,80);
}

function escapeAttr(value){
  return String(value??"").replace(/[^a-zA-Z0-9_-]/g,"_");
}

function togglePriority(id){
  const t=state.tasks.find(x=>x.id===id);
  if(!t) return;

  if(t.priorityDate===localDateKey()){
    t.priorityDate=null;
    saveState();
    renderAll();
    toast("已移出今日重点");
    return;
  }

  if(todayPriorityTasks().length>=3){
    toast("今日重点已经有 3 项，请先移除一项。");
    return;
  }

  t.priorityDate=localDateKey();
  saveState();
  renderAll();
  toast("已设为今日重点");
}

function removePriority(id){
  const t=state.tasks.find(x=>x.id===id);
  if(!t) return;
  t.priorityDate=null;
  saveState();
  renderAll();
}

function toggleTask(id, done){
  const t=state.tasks.find(x=>x.id===id);
  if(!t) return;

  t.done=done;
  t.completedAt=done ? new Date().toISOString() : null;

  saveState();
  renderAll();
}

function deleteTask(id){
  state.tasks=state.tasks.filter(x=>x.id!==id);
  if(currentTaskId===id){
    currentTaskId=null;
    switchView(taskDetailReturnView||"today");
  }
  saveState();
  renderAll();
}

function openProjectDetail(id){
  const p=state.projects.find(x=>x.id===id);
  if(!p) return;
  currentProjectId=id;
  switchView("project-detail");
  renderProjectDetail();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderProjectDetail(){
  const p=state.projects.find(x=>x.id===currentProjectId);
  if(!p){currentProjectId=null;switchView("projects");return;}
  const tasks=state.tasks.filter(t=>t.projectId===p.id).sort((a,b)=>{
    if(a.done!==b.done) return Number(a.done)-Number(b.done);
    if(a.due&&b.due) return a.due.localeCompare(b.due);
    if(a.due) return -1;if(b.due) return 1;
    return (b.createdAt||"").localeCompare(a.createdAt||"");
  });
  const logs=state.logs.filter(l=>l.projectId===p.id).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const done=tasks.filter(t=>t.done).length, open=tasks.length-done;
  const progress=tasks.length?Math.round(done/tasks.length*100):0;
  els.detailProjectName.textContent=p.name;
  els.detailProjectDesc.textContent=p.description||"暂无项目说明。";
  els.detailStatusBadge.textContent=labelStatus(p.status);
  els.detailStatusBadge.className=`status-badge ${p.status}`;
  const fmt=d=>new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"numeric",day:"numeric"}).format(new Date(d));
  const created=p.createdAt?fmt(p.createdAt):"未知";
  const archived=p.archivedAt?fmt(p.archivedAt):null;
  els.detailDateMeta.textContent=p.status==="archived"?`创建 ${created} · 归档 ${archived||"—"}`:`创建 ${created}`;
  els.detailProgressNumber.textContent=`${progress}%`;
  els.detailProgressBar.style.width=`${progress}%`;
  els.detailProgressMeta.textContent=`${done} 完成 · ${open} 待办`;
  els.detailArchiveBtn.hidden=p.status==="archived";
  els.detailRestoreBtn.hidden=p.status!=="archived";
  els.projectSummaryInput.value=p.summary||"";

  els.detailTaskList.innerHTML=tasks.length?tasks.map(t=>`
    <div class="task-item ${t.done?"detail-task-done":""}">
      ${t.done?`<div class="done-icon">✓</div>`:`<input class="check" type="checkbox" onchange="toggleTask('${t.id}', true)">`}
      <div class="item-text"><div class="item-title"><button class="task-title-link" type="button" onclick="openTaskDetail('${t.id}','project-detail')">${escapeHtml(t.title)}</button></div><div class="item-meta">
        <span class="badge ${t.category}">${labelCategory(t.category)}</span>${t.due?dueBadge(t.due):""}${t.priorityDate===localDateKey()?`<span class="badge today">今日重点</span>`:""}
      </div></div>
      ${t.done?`<button class="delete-btn" type="button" onclick="toggleTask('${t.id}', false)" title="恢复为待办">↶</button>`:""}
    </div>`).join(""):`<div class="empty">这个项目还没有任务。</div>`;

  els.detailLogList.innerHTML=logs.length?logs.map(l=>`
    <article class="log-entry"><div class="log-entry-head"><div class="log-entry-title">${escapeHtml(l.topic)}</div><div class="log-entry-date">${fmt(l.createdAt)}</div></div>
    <dl>${l.progress?`<div><dt>进展</dt><dd>${escapeHtml(l.progress)}</dd></div>`:""}${l.finding?`<div><dt>关键发现</dt><dd>${escapeHtml(l.finding)}</dd></div>`:""}${l.next?`<div><dt>下一步</dt><dd>${escapeHtml(l.next)}</dd></div>`:""}</dl></article>`).join(""):`<div class="empty">这个项目还没有科研日志。</div>`;
}

function archiveProject(id,fromDetail=false){
  const p=state.projects.find(x=>x.id===id);if(!p||p.status==="archived") return;
  const open=state.tasks.filter(t=>t.projectId===id&&!t.done).length;
  const msg=open?`这个项目还有 ${open} 个未完成任务。仍然归档吗？任务和科研日志都会保留。`:"确定归档这个项目吗？所有任务、科研日志和项目总结都会保留。";
  if(!confirm(msg)) return;
  p.status="archived";p.archivedAt=new Date().toISOString();saveState();
  archiveExpanded=true;els.archiveWrap.hidden=false;els.toggleArchiveBtn.textContent="收起归档";
  renderAll();if(fromDetail) renderProjectDetail();toast("项目已归档");
}

function restoreProject(id,fromDetail=false){
  const p=state.projects.find(x=>x.id===id);if(!p||p.status!=="archived") return;
  p.status="active";p.archivedAt=null;saveState();renderAll();if(fromDetail) renderProjectDetail();toast("项目已恢复为进行中");
}

function deleteProject(id){
  if(!confirm("确定永久删除这个项目吗？建议已完成项目优先使用“归档”。删除后，相关任务和科研日志会保留，但会变成未归属项目。")) return;
  state.projects=state.projects.filter(x=>x.id!==id);
  state.tasks.forEach(t=>{if(t.projectId===id)t.projectId=null;});
  state.logs.forEach(l=>{if(l.projectId===id)l.projectId=null;});
  if(currentProjectId===id){currentProjectId=null;switchView("projects");}
  saveState();renderAll();
}

function deleteLog(id){
  state.logs=state.logs.filter(x=>x.id!==id);
  saveState();
  renderAll();
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
  if(!file) return;

  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      const restored={...defaultState(), ...parsed};
      migrateToV2(restored);

      Object.keys(state).forEach(k=>delete state[k]);
      Object.assign(state, restored);

      saveState();
      els.quickNote.value=state.notes[localDateKey()] || "";
      renderAll();
      toast("数据已导入");
    }catch(err){
      console.error(err);
      toast("备份文件无效");
    }
  };
  reader.readAsText(file);
  e.target.value="";
}

function toast(message){
  els.toast.textContent=message;
  els.toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>els.toast.classList.remove("show"),1700);
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,ch=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  })[ch]);
}

window.openSearchResult=openSearchResult;
window.openTaskWorkLogFromSearch=openTaskWorkLogFromSearch;
window.openResearchLogFromSearch=openResearchLogFromSearch;
window.openTaskDialogWithDue=openTaskDialogWithDue;
window.openTaskDetail=openTaskDetail;
window.deleteTaskWorkLog=deleteTaskWorkLog;
window.openProjectDetail=openProjectDetail;
window.archiveProject=archiveProject;
window.restoreProject=restoreProject;
window.togglePriority=togglePriority;
window.removePriority=removePriority;
window.toggleTask=toggleTask;
window.deleteTask=deleteTask;
window.deleteProject=deleteProject;
window.deleteLog=deleteLog;


boot();
