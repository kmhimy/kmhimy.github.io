const STORAGE_KEY = "research-desk-v1";
const APP_VERSION = 13;

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
let timelineProjectFilter="all";
let timelineTypeFilter="all";
let timelineRangeFilter="30";

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
  addTaskTopBtn: document.getElementById("addTaskTopBtn"),
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
  taskExportMenu: document.getElementById("taskExportMenu"),
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
  taskRelationType: document.getElementById("taskRelationType"),
  taskRelationTarget: document.getElementById("taskRelationTarget"),
  addTaskRelationBtn: document.getElementById("addTaskRelationBtn"),
  taskRelationsList: document.getElementById("taskRelationsList"),
  taskResourceTitle: document.getElementById("taskResourceTitle"),
  taskResourceType: document.getElementById("taskResourceType"),
  taskResourceUrl: document.getElementById("taskResourceUrl"),
  addTaskResourceBtn: document.getElementById("addTaskResourceBtn"),
  taskResourcesList: document.getElementById("taskResourcesList"),
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
  fontScaleRange: document.getElementById("fontScaleRange"),
  fontScaleValue: document.getElementById("fontScaleValue"),
  fontScalePresetBtns: [...document.querySelectorAll("[data-font-scale]")],


  timelineProjectFilter: document.getElementById("timelineProjectFilter"),
  timelineTypeFilter: document.getElementById("timelineTypeFilter"),
  timelineRangeFilter: document.getElementById("timelineRangeFilter"),
  timelineCount: document.getElementById("timelineCount"),
  timelineList: document.getElementById("timelineList"),
  trashCount: document.getElementById("trashCount"),
  trashList: document.getElementById("trashList"),
  emptyTrashBtn: document.getElementById("emptyTrashBtn"),

  dashboardProjectSelect: document.getElementById("dashboardProjectSelect"),
  dashboardOpenProjectBtn: document.getElementById("dashboardOpenProjectBtn"),
  dashboardEmptyState: document.getElementById("dashboardEmptyState"),
  dashboardContent: document.getElementById("dashboardContent"),
  dashboardProjectTitle: document.getElementById("dashboardProjectTitle"),
  dashboardProjectSubtitle: document.getElementById("dashboardProjectSubtitle"),
  dashboardCreateProjectBtn: document.getElementById("dashboardCreateProjectBtn"),
  dashboardTaskCount: document.getElementById("dashboardTaskCount"),
  dashboardTaskProgress: document.getElementById("dashboardTaskProgress"),
  dashboardLogCount: document.getElementById("dashboardLogCount"),
  dashboardWorkLogCount: document.getElementById("dashboardWorkLogCount"),
  dashboardResourceCount: document.getElementById("dashboardResourceCount"),
  dashboardTaskList: document.getElementById("dashboardTaskList"),
  dashboardNewTaskBtn: document.getElementById("dashboardNewTaskBtn"),
  dashboardSummaryView: document.getElementById("dashboardSummaryView"),
  dashboardSummaryEditor: document.getElementById("dashboardSummaryEditor"),
  dashboardEditSummaryBtn: document.getElementById("dashboardEditSummaryBtn"),
  dashboardResearchQuestion: document.getElementById("dashboardResearchQuestion"),
  dashboardHypothesis: document.getElementById("dashboardHypothesis"),
  dashboardMainResults: document.getElementById("dashboardMainResults"),
  dashboardCurrentProblems: document.getElementById("dashboardCurrentProblems"),
  dashboardNextStep: document.getElementById("dashboardNextStep"),
  dashboardSaveSummaryBtn: document.getElementById("dashboardSaveSummaryBtn"),
  dashboardCancelSummaryBtn: document.getElementById("dashboardCancelSummaryBtn"),
  dashboardRelationCount: document.getElementById("dashboardRelationCount"),
  dashboardNetworkList: document.getElementById("dashboardNetworkList"),
  dashboardResourcePill: document.getElementById("dashboardResourcePill"),
  dashboardResourcesList: document.getElementById("dashboardResourcesList"),
  dashboardTimelineList: document.getElementById("dashboardTimelineList"),
  dashboardOpenTimelineBtn: document.getElementById("dashboardOpenTimelineBtn"),

  todayDateLabel: document.getElementById("todayDateLabel"),
  todayOpeningLine: document.getElementById("todayOpeningLine"),
  todaySearchBtn: document.getElementById("todaySearchBtn"),
  todayReviewYesterdayBtn: document.getElementById("todayReviewYesterdayBtn"),
  todayFocusBtn: document.getElementById("todayFocusBtn"),
  todayAddTaskBtn: document.getElementById("todayAddTaskBtn"),
  todayTop3Progress: document.getElementById("todayTop3Progress"),
  todayTop3List: document.getElementById("todayTop3List"),
  todayTop3TaskSelect: document.getElementById("todayTop3TaskSelect"),
  todayTop3AddBtn: document.getElementById("todayTop3AddBtn"),
  todayYesterdayCount: document.getElementById("todayYesterdayCount"),
  todayYesterdayList: document.getElementById("todayYesterdayList"),
  todayContinueCount: document.getElementById("todayContinueCount"),
  todayContinueList: document.getElementById("todayContinueList"),
  todayActiveTaskList: document.getElementById("todayActiveTaskList"),
  todayDoneNumber: document.getElementById("todayDoneNumber"),
  todayOpenNumber: document.getElementById("todayOpenNumber"),
  todayProjectNumber: document.getElementById("todayProjectNumber"),
  todayWorkLogNumber: document.getElementById("todayWorkLogNumber"),
  todayDoneList: document.getElementById("todayDoneList"),
  todayDailyNote: document.getElementById("todayDailyNote"),
  todayDailyNoteSaveBtn: document.getElementById("todayDailyNoteSaveBtn"),
  projectGrid: document.getElementById("projectGrid"),
  archiveGrid: document.getElementById("archiveGrid"),
  archiveWrap: document.getElementById("archiveWrap"),
  toggleArchiveBtn: document.getElementById("toggleArchiveBtn"),
  currentProjectCount: document.getElementById("currentProjectCount"),
  addProjectBtn: document.getElementById("addProjectBtn"),

  backToProjectsBtn: document.getElementById("backToProjectsBtn"),
  detailDashboardBtn: document.getElementById("detailDashboardBtn"),
  detailTrashBtn: document.getElementById("detailTrashBtn"),
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
    trash: [],
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
  if(!Array.isArray(s.trash)) s.trash = [];
  if(!s.settings || typeof s.settings !== "object") s.settings = {focusMode:false};
  if(!s.settings.appearance || typeof s.settings.appearance !== "object"){
    s.settings.appearance={theme:"academic",font:"mixed",density:"comfortable",fontScale:100};
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
  const fs=Number(s.settings.appearance.fontScale);
  s.settings.appearance.fontScale=Number.isFinite(fs)?Math.min(125,Math.max(85,Math.round(fs/5)*5)):100;
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
    if(!Array.isArray(t.relations)) t.relations = [];
    if(!Array.isArray(t.resources)) t.resources = [];
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
  if(els.fontScaleRange){
    els.fontScaleRange.addEventListener("input",()=>setFontScale(els.fontScaleRange.value,false));
    els.fontScaleRange.addEventListener("change",()=>setFontScale(els.fontScaleRange.value,true));
  }
  els.fontScalePresetBtns?.forEach(btn=>btn.addEventListener("click",()=>setFontScale(btn.dataset.fontScale,true)));
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
    if(e.key==="Escape" && todayFocusMode){toggleTodayFocus(false);return;}
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
    if(e.key==="7") switchView("timeline");
    if(e.key==="8") switchView("trash");
    if(e.key==="9") switchView("project-dashboard");
    if(e.key.toLowerCase()==="n") openTaskDialog();
  });
  els.addTaskTopBtn.addEventListener("click", openTaskDialog);
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
      workLogs:[],
      relations:[],
      resources:[]
    });

    saveState();
    closeTaskDialog();
    renderAll();
    toast(makePriority ? "任务已添加，并设为今日重点" : "任务已添加");
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

  els.taskExportMarkdownBtn.addEventListener("click",(e)=>{
    e.stopPropagation();
    els.taskExportMenu.hidden=!els.taskExportMenu.hidden;
  });
  els.taskExportMenu.addEventListener("click",(e)=>{
    const btn=e.target.closest("[data-export-format]");
    if(!btn||!currentTaskId) return;
    els.taskExportMenu.hidden=true;
    exportTask(currentTaskId,btn.dataset.exportFormat);
  });
  document.addEventListener("click",(e)=>{
    if(!e.target.closest(".export-menu-wrap")) els.taskExportMenu.hidden=true;
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

  els.addTaskRelationBtn.addEventListener("click",addCurrentTaskRelation);
  els.addTaskResourceBtn.addEventListener("click",addCurrentTaskResource);

  els.timelineProjectFilter.addEventListener("change",()=>{
    timelineProjectFilter=els.timelineProjectFilter.value;
    renderTimeline();
  });
  els.timelineTypeFilter.addEventListener("change",()=>{
    timelineTypeFilter=els.timelineTypeFilter.value;
    renderTimeline();
  });
  els.timelineRangeFilter.addEventListener("change",()=>{
    timelineRangeFilter=els.timelineRangeFilter.value;
    renderTimeline();
  });
  els.todaySearchBtn.addEventListener("click",openGlobalSearch);
  els.todayAddTaskBtn.addEventListener("click",()=>openTaskDialog());
  els.todayTop3AddBtn.addEventListener("click",addTodayTop3);
  els.todayDailyNoteSaveBtn.addEventListener("click",saveTodayDailyNote);
  els.todayFocusBtn.addEventListener("click",()=>toggleTodayFocus());
  els.todayReviewYesterdayBtn.addEventListener("click",showYesterdayReview);
  document.querySelectorAll("[data-today-filter]").forEach(btn=>btn.addEventListener("click",()=>{
    todayTaskFilter=btn.dataset.todayFilter;
    document.querySelectorAll("[data-today-filter]").forEach(x=>x.classList.toggle("active",x===btn));
    renderTodayActiveTasks();
  }));
  els.emptyTrashBtn.addEventListener("click",emptyTrash);
  els.dashboardProjectSelect.addEventListener("change",()=>{dashboardProjectId=els.dashboardProjectSelect.value||null;saveDashboardPreference();renderProjectDashboard();});
  els.dashboardOpenProjectBtn.addEventListener("click",()=>{if(dashboardProjectId)openProjectDetail(dashboardProjectId);});
  els.dashboardCreateProjectBtn.addEventListener("click",()=>{switchView("projects");openProjectDialog();});
  els.dashboardNewTaskBtn.addEventListener("click",()=>{openTaskDialog({projectId:dashboardProjectId||""});});
  els.dashboardEditSummaryBtn.addEventListener("click",beginDashboardSummaryEdit);
  els.dashboardSaveSummaryBtn.addEventListener("click",saveDashboardSummary);
  els.dashboardCancelSummaryBtn.addEventListener("click",cancelDashboardSummaryEdit);
  els.dashboardOpenTimelineBtn.addEventListener("click",()=>{timelineProjectFilter=dashboardProjectId||"all";switchView("timeline");});

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

  els.detailTrashBtn.addEventListener("click", ()=>{
    if(currentProjectId) deleteProject(currentProjectId);
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
  document.body.classList.toggle("is-today-view",name==="today");

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
    appearance:"外观",
    timeline:"科研时间轴",
    trash:"回收站",
    "project-dashboard":"研究总览"
  };
  els.pageTitle.textContent=titles[name] || "科研工作台";

  if(name==="review") renderReview();
  if(name==="calendar") renderCalendar();
  if(name==="appearance") renderAppearanceControls();
  if(name==="timeline") renderTimeline();
  if(name==="trash") renderTrash();
  if(name==="today") renderToday();
  if(name==="project-dashboard") renderProjectDashboard();
}


// ============================================================================
// V8 — Calendar / Deadlines
// ============================================================================


function calendarCategoryClass(category){
  if(category==="research") return "research";
  if(category==="writing") return "writing";
  if(category==="admin") return "admin";
  return "other";
}

function calendarDayCategoryMarkers(tasks){
  const cats=[...new Set((tasks||[])
    .map(t=>calendarCategoryClass(t.category))
    .filter(c=>["research","writing","admin"].includes(c)))];
  return cats.map(c=>{
    const label=c==="research"?"科研":c==="writing"?"写作":"事务";
    return `<span class="calendar-day-marker ${c}" title="${label}"></span>`;
  }).join("");
}

function calendarAddButtonClass(tasks){
  const cats=[...new Set((tasks||[])
    .map(t=>calendarCategoryClass(t.category))
    .filter(c=>["research","writing","admin"].includes(c)))];
  if(cats.length===0) return "neutral";
  if(cats.length===1) return cats[0];
  return "mixed";
}

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
          <button class="calendar-add-btn ${calendarAddButtonClass(tasks)}" type="button" onclick="openTaskDialogWithDue('${key}')" title="添加 ${key} 截止任务">+</button>
        </div>
        <div class="calendar-day-markers">${calendarDayCategoryMarkers(tasks)}</div>
        <div class="calendar-day-tasks">
          ${visible.map(t=>`
            <button class="calendar-task ${calendarCategoryClass(t.category)} ${t.done?"done":""}" type="button"
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
  return {theme:"academic",font:"mixed",density:"comfortable",fontScale:100};
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
  const fontScale=Number(a.fontScale)||100;
  document.documentElement.style.setProperty("--font-scale",String(fontScale/100));

  renderAppearanceControls();
}

function renderAppearanceControls(){
  if(!els.themeOptionBtns?.length) return;

  const a=getAppearance();
  els.themeOptionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.themeOption===a.theme));
  els.fontOptionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.fontOption===a.font));
  els.densityOptionBtns.forEach(btn=>btn.classList.toggle("active",btn.dataset.densityOption===a.density));
  const fontScale=Number(a.fontScale)||100;
  if(els.fontScaleRange) els.fontScaleRange.value=String(fontScale);
  if(els.fontScaleValue) els.fontScaleValue.textContent=`${fontScale}%`;
  els.fontScalePresetBtns?.forEach(btn=>btn.classList.toggle("active",Number(btn.dataset.fontScale)===fontScale));
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

function setFontScale(value,save=true){
  const a=getAppearance();
  const n=Math.min(125,Math.max(85,Math.round(Number(value)/5)*5));
  if(!Number.isFinite(n)) return;
  a.fontScale=n;
  applyAppearanceSettings();
  if(save){
    saveState();
    toast(`字体大小已设为 ${n}%`);
  }
}

function resetAppearanceSettings(){
  state.settings.appearance=appearanceDefaults();
  applyAppearanceSettings();
  saveState();
  toast("已恢复默认外观");
}


// ============================================================================
// V12 — Today: daily research command center
// ============================================================================

let todayTaskFilter="all";
let todayFocusMode=false;

function localDateKey(value=new Date()){
  const d=value instanceof Date?value:new Date(value);
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function yesterdayKey(){
  const d=new Date();d.setDate(d.getDate()-1);return localDateKey(d);
}
function ensureDailyState(){
  if(!state.daily || typeof state.daily!=="object") state.daily={};
  const key=localDateKey();
  if(!state.daily[key]) state.daily[key]={top3:[],note:""};
  if(!Array.isArray(state.daily[key].top3)) state.daily[key].top3=[];
  if(typeof state.daily[key].note!=="string") state.daily[key].note="";
  state.daily[key].top3=state.daily[key].top3.filter(id=>state.tasks.some(t=>t.id===id)).slice(0,3);
  return state.daily[key];
}
function renderToday(){
  if(!els.todayTop3List) return;
  const daily=ensureDailyState();
  const now=new Date();
  const week=["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][now.getDay()];
  els.todayDateLabel.textContent=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${week}`;
  const y=state.daily?.[yesterdayKey()];
  els.todayOpeningLine.textContent=y?.note?.trim()?`昨天留下：${y.note.trim()}`:"先看清楚昨天做到哪里，再决定今天真正要推进什么。";
  renderTodayTop3(daily);
  renderTodayContinuity();
  renderTodayActiveTasks();
  renderTodayProgress();
  els.todayDailyNote.value=daily.note||"";
  els.todayFocusBtn.textContent=todayFocusMode?"退出专注":"专注模式";
}
function renderTodayTop3(daily){
  const top3=daily.top3.map(id=>state.tasks.find(t=>t.id===id)).filter(Boolean);
  els.todayTop3Progress.textContent=`${top3.filter(t=>t.done).length} / 3`;
  els.todayTop3List.innerHTML=top3.length?top3.map((t,i)=>`
    <div class="today-top3-item">
      <span class="today-top3-index">${i+1}</span>
      <div><button class="today-top3-title ${t.done?"done":""}" type="button" onclick="openTaskDetail('${escapeAttr(t.id)}','today')">${escapeHtml(t.title)}</button>
      <div class="today-top3-project">${escapeHtml(t.projectId?projectName(t.projectId):"未归属项目")}</div></div>
      <button class="today-top3-check ${t.done?"done":""}" type="button" onclick="toggleTodayTask('${escapeAttr(t.id)}')">${t.done?"✓":""}</button>
      <button class="today-top3-remove" type="button" title="移出今日重点" onclick="removeTodayTop3('${escapeAttr(t.id)}')">×</button>
    </div>`).join(""):`<div class="empty">今天还没有设置重点。从下面选择最多三项真正重要的工作。</div>`;
  const candidates=state.tasks.filter(t=>!t.done&&!daily.top3.includes(t.id));
  els.todayTop3TaskSelect.innerHTML=candidates.length?`<option value="">选择一个任务…</option>`+candidates.map(t=>`<option value="${escapeAttr(t.id)}">${escapeHtml(t.title)} · ${escapeHtml(t.projectId?projectName(t.projectId):"未归属")}</option>`).join(""):`<option value="">暂无可选任务</option>`;
  els.todayTop3AddBtn.disabled=top3.length>=3||!candidates.length;
}
function addTodayTop3(){
  const daily=ensureDailyState(),id=els.todayTop3TaskSelect.value;
  if(!id)return;
  if(daily.top3.length>=3)return toast("今日重点最多三项");
  if(!daily.top3.includes(id))daily.top3.push(id);
  saveState();renderToday();toast("已加入今日重点");
}
function removeTodayTop3(id){
  const daily=ensureDailyState();daily.top3=daily.top3.filter(x=>x!==id);
  saveState();renderToday();
}
function toggleTodayTask(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;
  t.done=!t.done;t.completedAt=t.done?new Date().toISOString():null;
  saveState();renderAll();toast(t.done?"任务已完成":"任务已重新打开");
}
function taskLastWorkLog(task){
  return [...(task.workLogs||[])].filter(x=>x.createdAt).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]||null;
}
function shortText(s,n=100){
  const x=String(s||"").replace(/\s+/g," ").trim();return x.length>n?x.slice(0,n)+"…":x;
}
function renderTodayContinuity(){
  const yKey=yesterdayKey();
  const yesterdayEvents=[];
  state.tasks.forEach(t=>{
    (t.workLogs||[]).forEach(l=>{if(l.createdAt&&localDateKey(l.createdAt)===yKey)yesterdayEvents.push({task:t,log:l});});
    if(t.completedAt&&localDateKey(t.completedAt)===yKey)yesterdayEvents.push({task:t,completed:true,date:t.completedAt});
  });
  yesterdayEvents.sort((a,b)=>(b.log?.createdAt||b.date||"").localeCompare(a.log?.createdAt||a.date||""));
  els.todayYesterdayCount.textContent=yesterdayEvents.length;
  els.todayYesterdayList.innerHTML=yesterdayEvents.length?yesterdayEvents.slice(0,6).map(e=>`
    <div class="today-continuity-item"><button type="button" onclick="openTaskDetail('${escapeAttr(e.task.id)}','today')">${escapeHtml(e.task.title)}</button>
    <div class="today-continuity-meta">${escapeHtml(e.task.projectId?projectName(e.task.projectId):"未归属项目")} · ${e.completed?"昨天完成":"Work Log"}</div>
    ${e.log?`<div class="today-continuity-note">${escapeHtml(shortText(e.log.content,120))}</div>`:""}</div>`).join(""):`<div class="empty">昨天没有记录到 Work Log 或完成任务。</div>`;

  const daily=ensureDailyState();
  const continuation=state.tasks.filter(t=>!t.done).map(t=>({task:t,last:taskLastWorkLog(t)}))
    .filter(x=>daily.top3.includes(x.task.id)||x.last)
    .sort((a,b)=>{
      const af=daily.top3.includes(a.task.id)?1:0,bf=daily.top3.includes(b.task.id)?1:0;
      if(af!==bf)return bf-af;
      return (b.last?.createdAt||"").localeCompare(a.last?.createdAt||"");
    }).slice(0,6);
  els.todayContinueCount.textContent=continuation.length;
  els.todayContinueList.innerHTML=continuation.length?continuation.map(x=>`
    <div class="today-continuity-item"><button type="button" onclick="openTaskDetail('${escapeAttr(x.task.id)}','today')">${escapeHtml(x.task.title)}</button>
    <div class="today-continuity-meta">${daily.top3.includes(x.task.id)?"今日重点 · ":""}${escapeHtml(x.task.projectId?projectName(x.task.projectId):"未归属项目")}</div>
    <div class="today-continuity-note">${x.last?`上次做到：${escapeHtml(shortText(x.last.content,110))}`:"今日重点，等待开始记录。"}</div></div>`).join(""):`<div class="empty">暂无需要续接的任务。把重要任务加入“今日重点”即可。</div>`;
}
function renderTodayActiveTasks(){
  let tasks=state.tasks.filter(t=>!t.done);
  if(todayTaskFilter!=="all")tasks=tasks.filter(t=>t.category===todayTaskFilter);
  const daily=ensureDailyState();
  tasks.sort((a,b)=>{
    const af=daily.top3.includes(a.id)?1:0,bf=daily.top3.includes(b.id)?1:0;
    if(af!==bf)return bf-af;
    if(a.due&&b.due)return a.due.localeCompare(b.due);
    return a.due?-1:b.due?1:0;
  });
  els.todayActiveTaskList.innerHTML=tasks.length?tasks.slice(0,16).map(t=>`
    <div class="today-task-row">
      <button class="today-task-check" type="button" onclick="toggleTodayTask('${escapeAttr(t.id)}')"></button>
      <div class="today-task-main"><button type="button" onclick="openTaskDetail('${escapeAttr(t.id)}','today')">${escapeHtml(t.title)}</button>
      <div class="today-task-meta">${daily.top3.includes(t.id)?"今日重点 · ":""}${escapeHtml(t.projectId?projectName(t.projectId):"未归属项目")} · ${escapeHtml(labelCategory(t.category))}${t.workLogs?.length?` · ${t.workLogs.length} 条 Work Log`:""}</div></div>
      <span class="today-task-due">${t.due?escapeHtml(t.due):""}</span>
    </div>`).join(""):`<div class="empty">这个分类暂时没有待办任务。</div>`;
}
function renderTodayProgress(){
  const key=localDateKey();
  const done=state.tasks.filter(t=>t.done&&t.completedAt&&localDateKey(t.completedAt)===key);
  const logs=state.tasks.flatMap(t=>(t.workLogs||[]).filter(l=>l.createdAt&&localDateKey(l.createdAt)===key).map(l=>({task:t,log:l})));
  const activeProjects=new Set(state.tasks.filter(t=>!t.done&&t.projectId).map(t=>t.projectId));
  els.todayDoneNumber.textContent=done.length;
  els.todayOpenNumber.textContent=state.tasks.filter(t=>!t.done).length;
  els.todayProjectNumber.textContent=activeProjects.size;
  els.todayWorkLogNumber.textContent=logs.length;
  const events=[
    ...done.map(t=>({date:t.completedAt,title:t.title,task:t,type:"完成任务"})),
    ...logs.map(x=>({date:x.log.createdAt,title:x.task.title,task:x.task,type:"Work Log"}))
  ].sort((a,b)=>b.date.localeCompare(a.date));
  els.todayDoneList.innerHTML=events.length?events.slice(0,8).map(e=>`
    <div class="today-done-item"><button type="button" onclick="openTaskDetail('${escapeAttr(e.task.id)}','today')">${escapeHtml(e.title)}</button>
    <div class="today-done-time">${escapeHtml(e.type)} · ${escapeHtml(formatDateTime(e.date))}</div></div>`).join(""):`<div class="empty">今天还没有完成记录。每一条 Work Log 都会成为可见的推进证据。</div>`;
}
function saveTodayDailyNote(){
  const daily=ensureDailyState();daily.note=els.todayDailyNote.value.trim();
  saveState();renderToday();toast("今日小结已保存");
}
function toggleTodayFocus(force){
  todayFocusMode=typeof force==="boolean"?force:!todayFocusMode;
  document.body.classList.toggle("today-focus-mode",todayFocusMode);
  els.todayFocusBtn.textContent=todayFocusMode?"退出专注":"专注模式";
}
function showYesterdayReview(){
  const y=state.daily?.[yesterdayKey()];
  const text=y?.note?.trim()||"昨天没有保存日终小结。";
  alert(`昨天回顾\n\n${text}`);
}

// ============================================================================
// V11 — Research Dashboard
// ============================================================================

let dashboardProjectId=null;

function loadDashboardPreference(){
  try{dashboardProjectId=localStorage.getItem("researchDesk.dashboardProjectId")||null;}catch{dashboardProjectId=null;}
  if(dashboardProjectId && !state.projects.some(p=>p.id===dashboardProjectId)) dashboardProjectId=null;
}
function saveDashboardPreference(){
  try{localStorage.setItem("researchDesk.dashboardProjectId",dashboardProjectId||"");}catch{}
}
function renderDashboardProjectOptions(){
  const projects=[...state.projects].sort((a,b)=>a.name.localeCompare(b.name,"zh-CN"));
  if(!dashboardProjectId && projects.length) dashboardProjectId=projects.find(p=>p.status!=="archived")?.id||projects[0].id;
  els.dashboardProjectSelect.innerHTML=projects.length?projects.map(p=>`<option value="${escapeAttr(p.id)}">${escapeHtml(p.name)}${p.status==="archived"?" · 已归档":""}</option>`).join(""):`<option value="">暂无项目</option>`;
  if(dashboardProjectId) els.dashboardProjectSelect.value=dashboardProjectId;
}
function renderProjectDashboard(){
  if(!els.dashboardContent) return;
  renderDashboardProjectOptions();
  const project=state.projects.find(p=>p.id===dashboardProjectId);
  if(!project){
    els.dashboardEmptyState.hidden=false; els.dashboardContent.hidden=true;
    els.dashboardProjectTitle.textContent="研究总览"; els.dashboardProjectSubtitle.textContent="先创建一个研究项目。";
    return;
  }
  els.dashboardEmptyState.hidden=true; els.dashboardContent.hidden=false;
  els.dashboardProjectTitle.textContent=project.name;
  els.dashboardProjectSubtitle.textContent=(project.status==="archived"?"已归档 · ":"")+(project.description||"研究项目总览");
  const tasks=state.tasks.filter(t=>t.projectId===project.id);
  const logs=state.logs.filter(l=>l.projectId===project.id);
  const workLogs=tasks.flatMap(t=>(t.workLogs||[]));
  const resources=tasks.flatMap(t=>(t.resources||[]));
  const done=tasks.filter(t=>t.done).length;
  els.dashboardTaskCount.textContent=tasks.length;
  els.dashboardTaskProgress.textContent=`${tasks.length?Math.round(done/tasks.length*100):0}% 完成`;
  els.dashboardLogCount.textContent=logs.length;
  els.dashboardWorkLogCount.textContent=workLogs.length;
  els.dashboardResourceCount.textContent=resources.length;
  els.dashboardResourcePill.textContent=resources.length;
  renderDashboardTasks(tasks);
  renderDashboardSummary(project);
  renderDashboardNetwork(tasks);
  renderDashboardResources(resources);
  renderDashboardTimeline(tasks,logs);
}
function renderDashboardTasks(tasks){
  const items=[...tasks.filter(t=>!t.done),...tasks.filter(t=>t.done)].slice(0,12);
  els.dashboardTaskList.innerHTML=items.length?items.map(t=>`
    <div class="dashboard-task-row">
      <button class="dashboard-task-check ${t.done?"done":""}" type="button" onclick="toggleDashboardTask('${escapeAttr(t.id)}')"></button>
      <div><button class="dashboard-task-open ${t.done?"done":""}" type="button" onclick="openTaskDetail('${escapeAttr(t.id)}','project-dashboard')">${escapeHtml(t.title)}</button>
      <div class="dashboard-task-meta">${t.priority==="high"?"高优先级":t.priority==="low"?"低优先级":"常规"}${t.workLogs?.length?` · ${t.workLogs.length} 条 Work Log`:""}</div></div>
      <span class="dashboard-task-due">${t.dueDate?escapeHtml(formatDueCompact(t.dueDate)):""}</span>
    </div>`).join(""):`<div class="empty">这个项目还没有任务。可以直接新建一个。</div>`;
}
function toggleDashboardTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t)return;
  t.done=!t.done; t.completedAt=t.done?new Date().toISOString():null;
  saveState();renderAll();toast(t.done?"任务已完成":"任务已重新打开");
}
function renderDashboardSummary(project){
  const s=project.researchSummary||{};
  const blocks=[["研究问题",s.researchQuestion],["核心假设",s.hypothesis],["主要结果",s.mainResults],["当前困难",s.currentProblems],["下一步",s.nextStep]].filter(x=>String(x[1]||"").trim());
  els.dashboardSummaryEditor.hidden=true;els.dashboardSummaryView.hidden=false;els.dashboardEditSummaryBtn.hidden=false;
  els.dashboardSummaryView.innerHTML=blocks.length?blocks.map(x=>`<div class="summary-block"><div class="summary-label">${x[0]}</div><div class="summary-value">${escapeHtml(x[1])}</div></div>`).join(""):`<div class="summary-empty">还没有项目总结。点击“编辑”把这个研究项目最核心的内容写下来。</div>`;
}
function beginDashboardSummaryEdit(){
  const p=state.projects.find(x=>x.id===dashboardProjectId);if(!p)return;
  const s=p.researchSummary||{};
  els.dashboardResearchQuestion.value=s.researchQuestion||"";els.dashboardHypothesis.value=s.hypothesis||"";
  els.dashboardMainResults.value=s.mainResults||"";els.dashboardCurrentProblems.value=s.currentProblems||"";els.dashboardNextStep.value=s.nextStep||"";
  els.dashboardSummaryView.hidden=true;els.dashboardSummaryEditor.hidden=false;els.dashboardEditSummaryBtn.hidden=true;
}
function cancelDashboardSummaryEdit(){els.dashboardSummaryView.hidden=false;els.dashboardSummaryEditor.hidden=true;els.dashboardEditSummaryBtn.hidden=false;}
function saveDashboardSummary(){
  const p=state.projects.find(x=>x.id===dashboardProjectId);if(!p)return;
  p.researchSummary={researchQuestion:els.dashboardResearchQuestion.value.trim(),hypothesis:els.dashboardHypothesis.value.trim(),mainResults:els.dashboardMainResults.value.trim(),currentProblems:els.dashboardCurrentProblems.value.trim(),nextStep:els.dashboardNextStep.value.trim()};
  saveState();renderProjectDashboard();toast("研究总结已保存");
}
function renderDashboardNetwork(tasks){
  const byId=new Map(tasks.map(t=>[t.id,t]));const groups=new Map();let count=0;
  tasks.forEach(t=>(t.relations||[]).forEach(r=>{
    const target=byId.get(r.taskId);if(!target)return;count+=2;
    if(!groups.has(t.id))groups.set(t.id,{task:t,edges:[]});
    if(!groups.has(target.id))groups.set(target.id,{task:target,edges:[]});
    groups.get(t.id).edges.push({to:target,type:r.type,badge:"我设置"});
    groups.get(target.id).edges.push({to:t,type:r.type,badge:"被关联"});
  }));
  els.dashboardRelationCount.textContent=count;
  els.dashboardNetworkList.innerHTML=count?[...groups.values()].map(g=>`
    <div class="network-group"><button class="network-task-name" type="button" onclick="openTaskDetail('${escapeAttr(g.task.id)}','project-dashboard')">${escapeHtml(g.task.title)}</button>
    ${g.edges.map(e=>`<div class="network-edge"><span class="network-badge">${e.badge}</span><span>${relationLabel(e.type)}</span><span class="network-edge-arrow">→</span><button type="button" onclick="openTaskDetail('${escapeAttr(e.to.id)}','project-dashboard')">${escapeHtml(e.to.title)}</button></div>`).join("")}</div>`).join(""):`<div class="empty">这个项目还没有任务关联。</div>`;
}
function renderDashboardResources(resources){
  const seen=new Set(),items=resources.filter(r=>{const k=(r.url||"")+"|"+(r.title||"");if(seen.has(k))return false;seen.add(k);return true;});
  els.dashboardResourcesList.innerHTML=items.length?items.slice(0,12).map(r=>`
    <div class="dashboard-resource-row"><div class="dashboard-resource-icon">${resourceTypeLabel(r.type)}</div><div class="dashboard-resource-main"><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a><div class="dashboard-resource-meta">${escapeHtml(resourceTypeName(r.type))}</div></div></div>`).join(""):`<div class="empty">这个项目还没有核心资源。</div>`;
}
function renderDashboardTimeline(tasks,logs){
  const ev=[];
  tasks.forEach(t=>{
    (t.workLogs||[]).forEach(l=>l.createdAt&&ev.push({date:l.createdAt,type:"worklog",title:t.title,taskId:t.id,workLogId:l.id}));
    t.done&&t.completedAt&&ev.push({date:t.completedAt,type:"completed-task",title:t.title,taskId:t.id});
  });
  logs.forEach(l=>l.createdAt&&ev.push({date:l.createdAt,type:"research-log",title:l.topic,logId:l.id}));
  ev.sort((a,b)=>b.date.localeCompare(a.date));
  els.dashboardTimelineList.innerHTML=ev.length?ev.slice(0,10).map(e=>{
    const action=e.type==="worklog"?`openTaskWorkLogFromSearch('${e.taskId}','${e.workLogId}','project-dashboard')`:e.type==="completed-task"?`openTaskDetail('${e.taskId}','project-dashboard')`:`openResearchLogFromSearch('${e.logId}')`;
    return `<div class="dashboard-mini-event"><div class="dashboard-mini-date">${formatDateTime(e.date)}</div><div class="dashboard-mini-type">${timelineTypeLabel(e.type)}</div><button class="dashboard-mini-title" type="button" onclick="${action}">${escapeHtml(e.title)}</button></div>`;
  }).join(""):`<div class="empty">这个项目还没有科研活动。</div>`;
}

// ============================================================================
// V10 — Task relations
// ============================================================================

function relationLabel(type){
  return ({depends:"依赖于",related:"相关",followup:"后续"})[type] || "相关";
}

function renderTaskRelations(task){
  const options=state.tasks
    .filter(t=>t.id!==task.id)
    .filter(t=>{
      const project=t.projectId?state.projects.find(p=>p.id===t.projectId):null;
      return !project || project.status!=="archived";
    })
    .sort((a,b)=>{
      const sameA=a.projectId===task.projectId?0:1;
      const sameB=b.projectId===task.projectId?0:1;
      return sameA-sameB || a.title.localeCompare(b.title,"zh-CN");
    });

  els.taskRelationTarget.innerHTML=options.length
    ? options.map(t=>`<option value="${escapeAttr(t.id)}">${escapeHtml(t.title)}${t.projectId?` · ${escapeHtml(projectName(t.projectId))}`:""}</option>`).join("")
    : `<option value="">暂无其他任务</option>`;

  const relations=(task.relations||[])
    .map(r=>({relation:r,target:state.tasks.find(t=>t.id===r.taskId)}))
    .filter(x=>x.target);

  if(!relations.length){
    els.taskRelationsList.innerHTML=`<div class="empty">还没有任务关联。</div>`;
    return;
  }

  els.taskRelationsList.innerHTML=relations.map(({relation,target})=>`
    <div class="relation-row">
      <span class="relation-type">${relationLabel(relation.type)}</span>
      <button class="relation-title-btn" type="button"
        onclick="openTaskDetail('${target.id}','today')">${escapeHtml(target.title)}</button>
      <button class="row-icon-btn" type="button"
        onclick="removeTaskRelation('${escapeAttr(relation.id)}')" title="移除关联">×</button>
    </div>
  `).join("");
}

function addCurrentTaskRelation(){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;

  const targetId=els.taskRelationTarget.value;
  const type=els.taskRelationType.value;
  if(!targetId) return;

  task.relations=task.relations||[];
  if(task.relations.some(r=>r.taskId===targetId && r.type===type)){
    toast("这个关联已经存在");
    return;
  }

  task.relations.push({
    id:uid("relation"),
    taskId:targetId,
    type,
    createdAt:new Date().toISOString()
  });

  saveState();
  renderTaskRelations(task);
  toast("任务关联已添加");
}

function removeTaskRelation(relationId){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;
  task.relations=(task.relations||[]).filter(r=>r.id!==relationId);
  saveState();
  renderTaskRelations(task);
}

// ============================================================================
// V10 — Research resources
// ============================================================================

function resourceTypeName(type){
  return ({
    overleaf:"Overleaf",
    github:"GitHub",
    drive:"Google Drive",
    paper:"论文 / arXiv / DOI",
    data:"数据 / Figure",
    web:"网页",
    other:"其他"
  })[type] || "链接";
}

function resourceTypeLabel(type){
  return ({
    overleaf:"OV",
    github:"GH",
    drive:"DR",
    paper:"PDF",
    data:"DATA",
    web:"WEB",
    other:"LINK"
  })[type] || "LINK";
}

function normalizeResourceUrl(raw){
  let url=String(raw||"").trim();
  if(!url) return "";
  if(!/^https?:\/\//i.test(url)) url="https://"+url;

  try{
    const parsed=new URL(url);
    if(!["http:","https:"].includes(parsed.protocol)) return "";
    return parsed.href;
  }catch{
    return "";
  }
}

function renderTaskResources(task){
  const resources=task.resources||[];
  if(!resources.length){
    els.taskResourcesList.innerHTML=`<div class="empty">还没有科研资源链接。</div>`;
    return;
  }

  els.taskResourcesList.innerHTML=resources.map(r=>`
    <div class="resource-row">
      <div class="resource-icon">${resourceTypeLabel(r.type)}</div>
      <div class="resource-main">
        <a class="resource-title" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>
        <div class="resource-url">${escapeHtml(r.url)}</div>
      </div>
      <button class="row-icon-btn" type="button"
        onclick="removeTaskResource('${escapeAttr(r.id)}')" title="删除资源">×</button>
    </div>
  `).join("");
}

function addCurrentTaskResource(){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;

  const title=els.taskResourceTitle.value.trim();
  const url=normalizeResourceUrl(els.taskResourceUrl.value);
  const type=els.taskResourceType.value;

  if(!title){
    toast("请填写资源名称");
    els.taskResourceTitle.focus();
    return;
  }
  if(!url){
    toast("请输入有效的 http / https 链接");
    els.taskResourceUrl.focus();
    return;
  }

  task.resources=task.resources||[];
  task.resources.push({
    id:uid("resource"),
    title,
    url,
    type,
    createdAt:new Date().toISOString()
  });

  els.taskResourceTitle.value="";
  els.taskResourceUrl.value="";
  saveState();
  renderTaskResources(task);
  toast("科研资源已添加");
}

function removeTaskResource(resourceId){
  const task=state.tasks.find(t=>t.id===currentTaskId);
  if(!task) return;
  const resource=(task.resources||[]).find(r=>r.id===resourceId);
  if(!resource) return;
  if(!confirm(`删除资源“${resource.title}”？`)) return;

  task.resources=(task.resources||[]).filter(r=>r.id!==resourceId);
  saveState();
  renderTaskResources(task);
}

// ============================================================================
// V10 — Research timeline
// ============================================================================

function renderTimelineProjectOptions(){
  const current=timelineProjectFilter;
  const projects=[...state.projects].sort((a,b)=>a.name.localeCompare(b.name,"zh-CN"));

  els.timelineProjectFilter.innerHTML=
    `<option value="all">全部项目</option>`+
    projects.map(p=>`<option value="${escapeAttr(p.id)}">${escapeHtml(p.name)}${p.status==="archived"?" · 已归档":""}</option>`).join("");

  els.timelineProjectFilter.value=projects.some(p=>p.id===current)?current:"all";
  timelineProjectFilter=els.timelineProjectFilter.value;
}

function buildTimelineEvents(){
  const events=[];

  state.tasks.forEach(task=>{
    (task.workLogs||[]).forEach(log=>{
      if(!log.createdAt) return;
      events.push({
        id:`worklog-${log.id}`,
        type:"worklog",
        date:log.createdAt,
        title:task.title,
        projectId:task.projectId||null,
        excerpt:makePlainExcerpt(log.content,260),
        taskId:task.id,
        workLogId:log.id
      });
    });

    if(task.done && task.completedAt){
      events.push({
        id:`completed-${task.id}`,
        type:"completed-task",
        date:task.completedAt,
        title:task.title,
        projectId:task.projectId||null,
        excerpt:"任务完成",
        taskId:task.id
      });
    }
  });

  state.logs.forEach(log=>{
    if(!log.createdAt) return;
    events.push({
      id:`research-log-${log.id}`,
      type:"research-log",
      date:log.createdAt,
      title:log.topic,
      projectId:log.projectId||null,
      excerpt:makePlainExcerpt([log.progress,log.finding,log.next].filter(Boolean).join(" · "),260),
      logId:log.id
    });
  });

  return events.sort((a,b)=>b.date.localeCompare(a.date));
}

function timelineTypeLabel(type){
  return ({
    worklog:"工作记录",
    "research-log":"科研日志",
    "completed-task":"完成任务"
  })[type] || "记录";
}

function renderTimeline(){
  if(!els.timelineList) return;
  renderTimelineProjectOptions();

  els.timelineTypeFilter.value=timelineTypeFilter;
  els.timelineRangeFilter.value=timelineRangeFilter;

  let events=buildTimelineEvents();

  if(timelineProjectFilter!=="all"){
    events=events.filter(e=>e.projectId===timelineProjectFilter);
  }
  if(timelineTypeFilter!=="all"){
    events=events.filter(e=>e.type===timelineTypeFilter);
  }
  if(timelineRangeFilter!=="all"){
    const days=Number(timelineRangeFilter);
    const cutoff=new Date();
    cutoff.setHours(0,0,0,0);
    cutoff.setDate(cutoff.getDate()-days+1);
    events=events.filter(e=>new Date(e.date)>=cutoff);
  }

  els.timelineCount.textContent=events.length;

  if(!events.length){
    els.timelineList.innerHTML=`<div class="empty">当前筛选条件下还没有研究活动。</div>`;
    return;
  }

  const groups=new Map();
  events.forEach(event=>{
    const key=localDateKey(new Date(event.date));
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(event);
  });

  els.timelineList.innerHTML=[...groups.entries()].map(([day,items])=>{
    const date=new Date(`${day}T12:00:00`);
    const md=new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric"}).format(date);
    const weekday=new Intl.DateTimeFormat("zh-CN",{weekday:"short"}).format(date);

    return `
      <div class="timeline-day-group">
        <div class="timeline-day-label"><strong>${md}</strong><span>${weekday}</span></div>
        <div class="timeline-items">
          ${items.map(timelineEventHtml).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function timelineEventHtml(event){
  let action="";
  if(event.type==="worklog"){
    action=`openTaskWorkLogFromSearch('${event.taskId}','${event.workLogId}','timeline')`;
  }else if(event.type==="completed-task"){
    action=`openTaskDetail('${event.taskId}','timeline')`;
  }else{
    action=`openResearchLogFromSearch('${event.logId}')`;
  }

  return `
    <div class="timeline-event ${event.type}">
      <div class="timeline-event-head">
        <span class="timeline-event-type">${timelineTypeLabel(event.type)}</span>
        <span class="timeline-event-time">${formatTimeOnly(event.date)}</span>
      </div>
      <button class="timeline-event-title" type="button" onclick="${action}">${escapeHtml(event.title)}</button>
      <div class="timeline-event-project">${event.projectId?escapeHtml(projectName(event.projectId)):"未归属项目"}</div>
      ${event.excerpt?`<div class="timeline-event-excerpt">${escapeHtml(event.excerpt)}</div>`:""}
    </div>
  `;
}

// ============================================================================
// V10 — Recycle bin
// ============================================================================

function trashTypeLabel(type){
  return ({
    task:"任务",
    "research-log":"科研日志",
    project:"项目",
    worklog:"工作记录"
  })[type] || "内容";
}

function moveToTrash(entityType,data,title){
  state.trash=state.trash||[];
  state.trash.unshift({
    id:uid("trash"),
    entityType,
    deletedAt:new Date().toISOString(),
    title:title||"未命名",
    data:JSON.parse(JSON.stringify(data))
  });
}

function renderTrash(){
  if(!els.trashList) return;
  state.trash=state.trash||[];
  els.trashCount.textContent=state.trash.length;

  if(!state.trash.length){
    els.trashList.innerHTML=`<div class="empty">回收站是空的。</div>`;
    return;
  }

  els.trashList.innerHTML=state.trash.map(item=>`
    <div class="trash-row">
      <div class="trash-type">${trashTypeLabel(item.entityType)}</div>
      <div>
        <div class="trash-title">${escapeHtml(item.title||"未命名")}</div>
        <div class="trash-meta">删除于 ${formatDateTime(item.deletedAt)}</div>
      </div>
      <div class="trash-actions">
        <button class="trash-restore-btn" type="button" onclick="restoreTrashItem('${escapeAttr(item.id)}')">恢复</button>
        <button class="trash-delete-btn" type="button" onclick="permanentlyDeleteTrashItem('${escapeAttr(item.id)}')">永久删除</button>
      </div>
    </div>
  `).join("");
}

function restoreTrashItem(trashId){
  const item=(state.trash||[]).find(x=>x.id===trashId);
  if(!item) return;

  const data=JSON.parse(JSON.stringify(item.data));

  if(item.entityType==="task"){
    if(state.tasks.some(t=>t.id===data.id)) data.id=uid("task");
    if(data.projectId && !state.projects.some(p=>p.id===data.projectId)) data.projectId=null;
    state.tasks.push(data);

  }else if(item.entityType==="research-log"){
    if(state.logs.some(l=>l.id===data.id)) data.id=uid("log");
    if(data.projectId && !state.projects.some(p=>p.id===data.projectId)) data.projectId=null;
    state.logs.push(data);

  }else if(item.entityType==="project"){
    const linkedTaskIds=Array.isArray(data._linkedTaskIds)?data._linkedTaskIds:[];
    const linkedLogIds=Array.isArray(data._linkedLogIds)?data._linkedLogIds:[];
    delete data._linkedTaskIds;
    delete data._linkedLogIds;

    if(state.projects.some(p=>p.id===data.id)) data.id=uid("project");
    state.projects.push(data);

    state.tasks.forEach(t=>{
      if(linkedTaskIds.includes(t.id) && !t.projectId) t.projectId=data.id;
    });
    state.logs.forEach(l=>{
      if(linkedLogIds.includes(l.id) && !l.projectId) l.projectId=data.id;
    });

  }else if(item.entityType==="worklog"){
    const task=state.tasks.find(t=>t.id===data.taskId);
    if(!task){
      toast("原任务当前不在工作台中，请先恢复原任务");
      return;
    }
    const restored={...data};
    delete restored.taskId;
    if((task.workLogs||[]).some(log=>log.id===restored.id)) restored.id=uid("worklog");
    task.workLogs=task.workLogs||[];
    task.workLogs.push(restored);
  }

  state.trash=state.trash.filter(x=>x.id!==trashId);
  saveState();
  renderAll();
  toast("已从回收站恢复");
}

function permanentlyDeleteTrashItem(trashId){
  const item=(state.trash||[]).find(x=>x.id===trashId);
  if(!item) return;
  if(!confirm(`永久删除“${item.title}”？此操作无法恢复。`)) return;

  state.trash=state.trash.filter(x=>x.id!==trashId);
  saveState();
  renderTrash();
  toast("已永久删除");
}

function emptyTrash(){
  if(!(state.trash||[]).length){
    toast("回收站已经是空的");
    return;
  }
  if(!confirm(`永久删除回收站中的 ${state.trash.length} 项内容？此操作无法恢复。`)) return;

  state.trash=[];
  saveState();
  renderTrash();
  toast("回收站已清空");
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
    const resourceText=(task.resources||[]).map(r=>`${r.title} ${r.url}`).join("\n");
    const relationText=(task.relations||[]).map(r=>{
      const target=state.tasks.find(x=>x.id===r.taskId);
      return target?`${relationLabel(r.type)} ${target.title}`:"";
    }).join("\n");
    const hay=[task.title,task.detailsMarkdown,resourceText,relationText].filter(Boolean).join("\n");
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
  renderTimeline();
  renderTrash();
  renderProjectDashboard();
  if(currentProjectId) renderProjectDetail();
  if(currentTaskId) renderTaskDetail();
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

function openTaskDialog(options={}){
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
  renderTaskRelations(task);
  renderTaskResources(task);
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
  const log=task.workLogs.find(x=>x.id===logId);
  if(!log) return;
  if(!confirm("把这条工作记录移到回收站？")) return;

  moveToTrash("worklog",{...log,taskId:task.id},`${task.title} · 工作记录`);
  task.workLogs=task.workLogs.filter(x=>x.id!==logId);
  saveState();
  renderAll();
  toast("工作记录已移到回收站");
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

function exportTask(id,format){
  const task=state.tasks.find(t=>t.id===id);
  if(!task) return;
  if(format==="pdf") return exportTaskPdf(task);
  if(format==="tex"){
    downloadTaskText(buildTaskLatex(task),`${safeFileName(task.title)}.tex`,"application/x-tex;charset=utf-8");
    return toast("LaTeX 已导出");
  }
  if(format==="txt"){
    downloadTaskText(buildTaskPlainText(task),`${safeFileName(task.title)}.txt`,"text/plain;charset=utf-8");
    return toast("纯文本已导出");
  }
  exportTaskMarkdown(id);
}

function downloadTaskText(text,name,type){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

function buildTaskPlainText(task){
  const lines=[
    task.title,"",
    `项目：${task.projectId?projectName(task.projectId):"未归属项目"}`,
    `分类：${labelCategory(task.category)}`,
    `状态：${task.done?"已完成":"进行中"}`,
    task.due?`截止日期：${task.due}`:"",
    "","任务说明与推导","",
    task.detailsMarkdown||"暂无记录"
  ];
  const logs=[...(task.workLogs||[])].sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||""));
  if(logs.length){
    lines.push("","工作记录");
    logs.forEach((log,i)=>lines.push("",`${i+1}. ${formatDateTime(log.createdAt)}`,log.content||""));
  }
  return lines.filter(x=>x!==undefined).join("\n");
}

function buildTaskLatex(task){
  const logs=[...(task.workLogs||[])].sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||""));
  const logText=logs.map((log,i)=>`
\\section*{工作记录 ${i+1}}
\\textit{${latexEscape(formatDateTime(log.createdAt))}}

${log.content||""}`).join("\n");
  return `\\documentclass[11pt]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{amsmath,amssymb,bm}
\\usepackage[a4paper,margin=2.4cm]{geometry}
\\usepackage{hyperref}
\\title{${latexEscape(task.title)}}
\\date{}
\\begin{document}
\\maketitle
\\noindent\\textbf{项目：}${latexEscape(task.projectId?projectName(task.projectId):"未归属项目")}\\\\
\\textbf{分类：}${latexEscape(labelCategory(task.category))}\\\\
\\textbf{状态：}${task.done?"已完成":"进行中"}${task.due?`\\\\\n\\textbf{截止日期：}${latexEscape(task.due)}`:""}

\\section*{任务说明与推导}
${task.detailsMarkdown||"暂无记录"}

${logText}
\\end{document}
`;
}

function latexEscape(value){
  return String(value||"")
    .replace(/\\/g,"\\textbackslash{}")
    .replace(/([#$%&_{}])/g,"\\$1")
    .replace(/\^/g,"\\textasciicircum{}")
    .replace(/~/g,"\\textasciitilde{}");
}

function renderTaskMarkdownHtml(source){
  const holder=document.createElement("div");
  renderMarkdownInto(source||"",holder);
  return holder.innerHTML;
}

function exportTaskPdf(task){
  const popup=window.open("","_blank");
  if(!popup){
    toast("浏览器阻止了导出窗口，请允许弹窗后重试");
    return;
  }
  const noteHtml=renderTaskMarkdownHtml(task.detailsMarkdown||"");
  const logs=[...(task.workLogs||[])].sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||""));
  const logsHtml=logs.map((log,i)=>`
    <section class="worklog">
      <h2>工作记录 ${i+1}</h2>
      <div class="meta">${escapeHtml(formatDateTime(log.createdAt))}</div>
      ${renderTaskMarkdownHtml(log.content||"")}
    </section>`).join("");
  const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>`<link rel="stylesheet" href="${x.href}">`).join("");
  popup.document.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
  <title>${escapeHtml(task.title)}</title>${styles}
  <style>
  @page{size:A4;margin:18mm 18mm 20mm}
  body{margin:0;color:#182027;background:#fff;font-family:"Noto Serif SC","Songti SC","Times New Roman",serif;font-size:11pt;line-height:1.75}
  main{max-width:760px;margin:0 auto}
  .eyebrow{font-family:Arial,sans-serif;font-size:8pt;letter-spacing:.14em;color:#55766b;font-weight:700}
  h1{font-size:26pt;line-height:1.25;margin:8px 0 8px}
  h2{font-size:16pt;margin:24px 0 8px}
  h3{font-size:13pt;margin:18px 0 6px}
  .meta{font-family:Arial,sans-serif;color:#7d878e;font-size:8.5pt;margin-bottom:18px}
  .note{border-top:1px solid #dfe4e5;padding-top:18px}
  blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid #b9c8c2;background:#f5f7f6}
  pre{white-space:pre-wrap;background:#f5f6f7;padding:10px;border-radius:6px}
  code{font-family:Consolas,monospace;font-size:.92em}
  img{max-width:100%}
  .worklog{page-break-inside:avoid;border-top:1px solid #e2e5e7;margin-top:24px;padding-top:8px}
  .katex-display{overflow:visible!important}
  a{color:inherit;text-decoration:none}
  </style></head><body><main>
    <div class="eyebrow">RESEARCH TASK NOTE</div>
    <h1>${escapeHtml(task.title)}</h1>
    <div class="meta">项目：${escapeHtml(task.projectId?projectName(task.projectId):"未归属项目")} · ${escapeHtml(labelCategory(task.category))} · ${task.done?"已完成":"进行中"}${task.due?` · 截止：${escapeHtml(task.due)}`:""}</div>
    <section class="note">${noteHtml}</section>
    ${logsHtml}
  </main><script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script></body></html>`);
  popup.document.close();
  toast("PDF 页面已打开，请在打印窗口选择“另存为 PDF”");
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
  lines.push("## 任务关联");
  lines.push("");
  const relations=(task.relations||[]).map(r=>{
    const target=state.tasks.find(t=>t.id===r.taskId);
    return target?`- ${relationLabel(r.type)}：${target.title}`:null;
  }).filter(Boolean);
  lines.push(relations.length?relations.join("\n"):"_暂无任务关联_");

  lines.push("");
  lines.push("## 科研资源");
  lines.push("");
  const resources=(task.resources||[]).map(r=>`- [${r.title}](${r.url}) · ${resourceTypeName(r.type)}`);
  lines.push(resources.length?resources.join("\n"):"_暂无科研资源_");

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
  const task=state.tasks.find(x=>x.id===id);
  if(!task) return;
  if(!confirm(`把任务“${task.title}”移到回收站？`)) return;

  moveToTrash("task",task,task.title);
  state.tasks=state.tasks.filter(x=>x.id!==id);

  if(currentTaskId===id){
    currentTaskId=null;
    switchView(taskDetailReturnView||"today");
  }
  saveState();
  renderAll();
  toast("任务已移到回收站");
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
  const project=state.projects.find(x=>x.id===id);
  if(!project) return;

  const linkedTasks=state.tasks.filter(t=>t.projectId===id);
  const linkedLogs=state.logs.filter(l=>l.projectId===id);

  if(!confirm(`把项目“${project.name}”移到回收站？\n\n项目下 ${linkedTasks.length} 个任务和 ${linkedLogs.length} 条科研日志不会删除，会暂时显示为未归属项目。`)) return;

  moveToTrash("project",{
    ...project,
    _linkedTaskIds:linkedTasks.map(t=>t.id),
    _linkedLogIds:linkedLogs.map(l=>l.id)
  },project.name);

  state.projects=state.projects.filter(x=>x.id!==id);
  state.tasks.forEach(t=>{if(t.projectId===id)t.projectId=null;});
  state.logs.forEach(l=>{if(l.projectId===id)l.projectId=null;});

  if(currentProjectId===id){
    currentProjectId=null;
    switchView("projects");
  }
  saveState();
  renderAll();
  toast("项目已移到回收站");
}

function deleteLog(id){
  const log=state.logs.find(x=>x.id===id);
  if(!log) return;
  if(!confirm(`把科研日志“${log.topic}”移到回收站？`)) return;

  moveToTrash("research-log",log,log.topic);
  state.logs=state.logs.filter(x=>x.id!==id);
  saveState();
  renderAll();
  toast("科研日志已移到回收站");
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

window.toggleDashboardTask=toggleDashboardTask;
window.removeTaskRelation=removeTaskRelation;
window.removeTaskResource=removeTaskResource;
window.restoreTrashItem=restoreTrashItem;
window.permanentlyDeleteTrashItem=permanentlyDeleteTrashItem;
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

window.toggleTodayTask=toggleTodayTask;
window.removeTodayTop3=removeTodayTop3;
