const STORAGE_KEY = "minus-style-affiliate-dashboard-v2";
const LEGACY_KEY = "minus-style-affiliate-dashboard-v1";
const BACKUP_KEY = "minus-style-affiliate-backups-v1";
const SESSION_KEY = "minus-style-admin-session";
const CLOUD_URL_KEY = "minus-style-cloud-api-url";
const SUPABASE_URL_KEY = "minus-style-supabase-url";
const SUPABASE_ANON_KEY = "minus-style-supabase-anon-key";
const DEFAULT_SUPABASE_URL = "https://awywuyxcjcrbxrxghszu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_Fk5Yk3q2bRqS40Hdmkd0zw_mimgyRXf";
const OWNER_ADMIN_EMAIL = "asifat553@gmail.com";
const APP_PUBLIC_URL = "https://muhammadsifatofficial1997-design.github.io/minus-style-commission-for-niyezan/";
try {
  if (localStorage.getItem(SUPABASE_URL_KEY) === "https://alvtxfoywlybipindkmr.supabase.co") {
    localStorage.setItem(SUPABASE_URL_KEY, DEFAULT_SUPABASE_URL);
    localStorage.setItem(SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.warn("Supabase config migration skipped", error);
}
const THEME_KEY = "minus-style-theme-mode";
const THEME_PRESET_KEY = "minus-style-theme-preset";
const COMPACT_MODE_KEY = "minus-style-compact-mode";
const DEFAULT_CLOUD_URL = "https://script.google.com/macros/s/AKfycbzbdWRDAn5c7tVyX53oVbQgQUYG5LnN3KwguGODW27JpLj7tpJXSbDWuA_79IyMEf84/exec";
const CLOUD_PUSH_DELAY = 900;
const CLOUD_RETRY_DELAY = 30000;
const CLOUD_RETRY_LIMIT = 3;
const MISSED_BREAK_SECONDS = 2 * 60 * 60;
const BREAK_LIMIT_MINUTES = {
  prayer: 20,
  washroom: 15,
  lunch: 60,
  personal: 30,
  official: 90,
};
const LEAVE_POLICY = {
  casual: 10,
  sick: 10,
  advance: 5,
  fixedHoliday: 18,
};
const PAYROLL_DAYS = 30;

const bn = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
const state = loadState();
let editingFixedId = null;
let currentUser = { role: "guest", name: "" };
let cloudPushTimer = null;
let supabasePushTimer = null;
let supabaseClientInstance = null;
let isApplyingSupabaseState = false;
let isApplyingCloudState = false;
let breakTicker = null;
let cloudDirty = false;
let lastCloudSyncAt = "";
let lastCloudSyncFailed = false;
let cloudRetryTimer = null;
let cloudRetryCount = 0;
let deferredInstallPrompt = null;
let approvalFilter = "pending";
let beginnerMode = localStorage.getItem("minus-style-beginner-mode") === "1";

const categoryLabels = {
  commission: "মাইনাস স্টাইল কমিশন",
  other_income: "অন্যান্য আয়",
  dollar_boost: "ডলার বুস্ট",
  office_other: "অফিস অন্যান্য",
  snack: "নাস্তা",
  salary: "বেতন",
  internet: "ইন্টারনেট বিল",
  rent: "অফিস ভাড়া",
  electricity: "বিদ্যুৎ বিল",
  other: "অন্যান্য",
};

const breakLabels = {
  prayer: "Prayer Break",
  washroom: "Washroom Break",
  lunch: "Lunch Break",
  personal: "Personal Break",
  official: "Official Break",
};

const employeeAccessPins = [
  { matches: ["ফাইজুর", "faizur"], pin: "faizur1001" },
  { matches: ["অমিত", "amit"], pin: "amit1002" },
  { matches: ["সাকিব", "sakib"], pin: "sakib1003" },
];

function defaultFixedHolidays(year = new Date().getFullYear()) {
  return [
    ["02-21", "Language Day"],
    ["03-26", "Independence Day"],
    ["04-14", "Bengali New Year"],
    ["05-01", "May Day"],
    ["05-31", "Buddha Purnima"],
    ["03-21", "Eid ul-Fitr Holiday 1"],
    ["03-22", "Eid ul-Fitr Holiday 2"],
    ["03-23", "Eid ul-Fitr Holiday 3"],
    ["05-27", "Eid ul-Adha Holiday 1"],
    ["05-28", "Eid ul-Adha Holiday 2"],
    ["05-29", "Eid ul-Adha Holiday 3"],
    ["06-26", "Muharram / Ashura"],
    ["08-15", "National Holiday"],
    ["09-04", "Eid-e-Miladunnabi"],
    ["10-20", "Durga Puja"],
    ["12-16", "Victory Day"],
    ["12-25", "Christmas Day"],
    ["12-31", "Year End Office Holiday"],
  ].map(([day, name]) => ({
    id: crypto.randomUUID(),
    date: `${year}-${day}`,
    name,
    note: "Fixed paid holiday",
    fixed: true,
    createdAt: new Date().toISOString(),
  }));
}

const els = {
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  emailInput: document.querySelector("#emailInput"),
  pinInput: document.querySelector("#pinInput"),
  signupBtn: document.querySelector("#signupBtn"),
  resetPasswordBtn: document.querySelector("#resetPasswordBtn"),
  loginRoleHint: document.querySelector("#loginRoleHint"),
  loginError: document.querySelector("#loginError"),
  themeToggleBtn: document.querySelector("#themeToggleBtn"),
  themeToggleText: document.querySelector("#themeToggleText"),
  cloudSyncBar: document.querySelector("#cloudSyncBar"),
  offlineStatusBar: document.querySelector("#offlineStatusBar"),
  installPwaBtn: document.querySelector("#installPwaBtn"),
  refreshPwaBtn: document.querySelector("#refreshPwaBtn"),
  pwaInstallStatus: document.querySelector("#pwaInstallStatus"),
  pwaOfflineStatus: document.querySelector("#pwaOfflineStatus"),
  homeClearCacheBtn: document.querySelector("#homeClearCacheBtn"),
  compactModeBtn: document.querySelector("#compactModeBtn"),
  dailySummaryWhatsappBtn: document.querySelector("#dailySummaryWhatsappBtn"),
  globalSearchInput: document.querySelector("#globalSearchInput"),
  globalSearchResults: document.querySelector("#globalSearchResults"),
  compactIncome: document.querySelector("#compactIncome"),
  compactExpense: document.querySelector("#compactExpense"),
  compactPending: document.querySelector("#compactPending"),
  compactWarnings: document.querySelector("#compactWarnings"),
  roleHomeTitle: document.querySelector("#roleHomeTitle"),
  roleHomeSubtitle: document.querySelector("#roleHomeSubtitle"),
  roleHomeBadge: document.querySelector("#roleHomeBadge"),
  roleHomeGrid: document.querySelector("#roleHomeGrid"),
  roleAccessPanel: document.querySelector("#roleAccessPanel"),
  dashboardAdminPinForm: document.querySelector("#dashboardAdminPinForm"),
  dashboardAdminEmail: document.querySelector("#dashboardAdminEmail"),
  dashboardAdminPin: document.querySelector("#dashboardAdminPin"),
  dashboardManagerForm: document.querySelector("#dashboardManagerForm"),
  dashboardManagerName: document.querySelector("#dashboardManagerName"),
  dashboardManagerEmail: document.querySelector("#dashboardManagerEmail"),
  dashboardManagerPin: document.querySelector("#dashboardManagerPin"),
  dashboardEmployeeAccessForm: document.querySelector("#dashboardEmployeeAccessForm"),
  dashboardEmployeeAccessEmployee: document.querySelector("#dashboardEmployeeAccessEmployee"),
  dashboardEmployeeAccessEmail: document.querySelector("#dashboardEmployeeAccessEmail"),
  dashboardEmployeeAccessPin: document.querySelector("#dashboardEmployeeAccessPin"),
  dashboardAccessList: document.querySelector("#dashboardAccessList"),
  friendlyGuideTitle: document.querySelector("#friendlyGuideTitle"),
  friendlyGuideSubtitle: document.querySelector("#friendlyGuideSubtitle"),
  friendlySteps: document.querySelector("#friendlySteps"),
  toggleBeginnerModeBtn: document.querySelector("#toggleBeginnerModeBtn"),
  smartAlertCount: document.querySelector("#smartAlertCount"),
  smartAlertList: document.querySelector("#smartAlertList"),
  noticeBoardPanel: document.querySelector("#noticeBoardPanel"),
  noticeForm: document.querySelector("#noticeForm"),
  noticeTitle: document.querySelector("#noticeTitle"),
  noticeBody: document.querySelector("#noticeBody"),
  noticeDate: document.querySelector("#noticeDate"),
  noticeAudience: document.querySelector("#noticeAudience"),
  noticeCount: document.querySelector("#noticeCount"),
  noticeList: document.querySelector("#noticeList"),
  themePresetSelect: document.querySelector("#themePresetSelect"),
  payrollSheetExportBtn: document.querySelector("#payrollSheetExportBtn"),
  whatsappTemplateList: document.querySelector("#whatsappTemplateList"),
  pendingApprovalBadge: document.querySelector("#pendingApprovalBadge"),
  selectedDate: document.querySelector("#selectedDate"),
  dailyStart: document.querySelector("#dailyStart"),
  dailyEnd: document.querySelector("#dailyEnd"),
  reportStart: document.querySelector("#reportStart"),
  reportEnd: document.querySelector("#reportEnd"),
  attendanceDate: document.querySelector("#attendanceDate"),
  payrollMonth: document.querySelector("#payrollMonth"),
  attendanceForm: document.querySelector("#attendanceForm"),
  attendanceEmployee: document.querySelector("#attendanceEmployee"),
  attendanceStatus: document.querySelector("#attendanceStatus"),
  attendanceShift: document.querySelector("#attendanceShift"),
  attendanceBreak: document.querySelector("#attendanceBreak"),
  attendanceCheckIn: document.querySelector("#attendanceCheckIn"),
  attendanceCheckOut: document.querySelector("#attendanceCheckOut"),
  attendanceCheckInNowBtn: document.querySelector("#attendanceCheckInNowBtn"),
  attendanceCheckOutNowBtn: document.querySelector("#attendanceCheckOutNowBtn"),
  attendanceLocationStatus: document.querySelector("#attendanceLocationStatus"),
  attendanceNote: document.querySelector("#attendanceNote"),
  attendanceTable: document.querySelector("#attendanceTable"),
  fridayWorkForm: document.querySelector("#fridayWorkForm"),
  fridayWorkEmployees: document.querySelector("#fridayWorkEmployees"),
  fridayWorkEmployeesLabel: document.querySelector("#fridayWorkEmployeesLabel"),
  fridayWorkDate: document.querySelector("#fridayWorkDate"),
  fridayWorkType: document.querySelector("#fridayWorkType"),
  fridayWorkReason: document.querySelector("#fridayWorkReason"),
  fridayWorkNote: document.querySelector("#fridayWorkNote"),
  fridayWorkHint: document.querySelector("#fridayWorkHint"),
  fridayWorkList: document.querySelector("#fridayWorkList"),
  breakForm: document.querySelector("#breakForm"),
  breakEmployee: document.querySelector("#breakEmployee"),
  breakType: document.querySelector("#breakType"),
  breakNote: document.querySelector("#breakNote"),
  breakStatusPill: document.querySelector("#breakStatusPill"),
  currentBreakStatus: document.querySelector("#currentBreakStatus"),
  currentBreakStarted: document.querySelector("#currentBreakStarted"),
  currentBreakDuration: document.querySelector("#currentBreakDuration"),
  startBreakBtn: document.querySelector("#startBreakBtn"),
  endBreakBtn: document.querySelector("#endBreakBtn"),
  breakTable: document.querySelector("#breakTable"),
  breakFilterName: document.querySelector("#breakFilterName"),
  breakFilterStart: document.querySelector("#breakFilterStart"),
  breakFilterEnd: document.querySelector("#breakFilterEnd"),
  breakFilterType: document.querySelector("#breakFilterType"),
  breakFilterStatus: document.querySelector("#breakFilterStatus"),
  timelineEmployee: document.querySelector("#timelineEmployee"),
  timelineList: document.querySelector("#timelineList"),
  correctionForm: document.querySelector("#correctionForm"),
  correctionEmployee: document.querySelector("#correctionEmployee"),
  correctionDate: document.querySelector("#correctionDate"),
  correctionType: document.querySelector("#correctionType"),
  correctionTime: document.querySelector("#correctionTime"),
  correctionBreak: document.querySelector("#correctionBreak"),
  correctionReason: document.querySelector("#correctionReason"),
  breakReportMonth: document.querySelector("#breakReportMonth"),
  breakReportEmployee: document.querySelector("#breakReportEmployee"),
  breakReportType: document.querySelector("#breakReportType"),
  breakMonthlyTable: document.querySelector("#breakMonthlyTable"),
  activityLogList: document.querySelector("#activityLogList"),
  mobileCheckInBtn: document.querySelector("#mobileCheckInBtn"),
  mobileStartBreakBtn: document.querySelector("#mobileStartBreakBtn"),
  mobileEndBreakBtn: document.querySelector("#mobileEndBreakBtn"),
  mobileCheckOutBtn: document.querySelector("#mobileCheckOutBtn"),
  mobileLeaveBtn: document.querySelector("#mobileLeaveBtn"),
  employeeHomePanel: document.querySelector("#employeeHomePanel"),
  employeeHomeTitle: document.querySelector("#employeeHomeTitle"),
  employeeTodayHint: document.querySelector("#employeeTodayHint"),
  employeeTodayStatus: document.querySelector("#employeeTodayStatus"),
  employeeTodayCheckIn: document.querySelector("#employeeTodayCheckIn"),
  employeeTodayCheckOut: document.querySelector("#employeeTodayCheckOut"),
  employeeMonthPayable: document.querySelector("#employeeMonthPayable"),
  employeePendingApproval: document.querySelector("#employeePendingApproval"),
  employeeProfileSummary: document.querySelector("#employeeProfileSummary"),
  employeeMonthPresent: document.querySelector("#employeeMonthPresent"),
  employeeMonthAbsent: document.querySelector("#employeeMonthAbsent"),
  employeeMonthBreak: document.querySelector("#employeeMonthBreak"),
  employeeMonthAdvance: document.querySelector("#employeeMonthAdvance"),
  employeeMonthLeave: document.querySelector("#employeeMonthLeave"),
  employeeNoticeStrip: document.querySelector("#employeeNoticeStrip"),
  employeeSelfAttendanceList: document.querySelector("#employeeSelfAttendanceList"),
  employeeSelfBreakList: document.querySelector("#employeeSelfBreakList"),
  employeeSelfLeaveAdvanceList: document.querySelector("#employeeSelfLeaveAdvanceList"),
  employeeSelfReportBtn: document.querySelector("#employeeSelfReportBtn"),
  performanceSnapshotPanel: document.querySelector("#performanceSnapshotPanel"),
  performanceSnapshotTitle: document.querySelector("#performanceSnapshotTitle"),
  performanceSnapshotGrid: document.querySelector("#performanceSnapshotGrid"),
  workLogPanel: document.querySelector("#workLogPanel"),
  workLogForm: document.querySelector("#workLogForm"),
  workLogEmployee: document.querySelector("#workLogEmployee"),
  workLogDate: document.querySelector("#workLogDate"),
  workLogTitle: document.querySelector("#workLogTitle"),
  workLogNote: document.querySelector("#workLogNote"),
  workLogList: document.querySelector("#workLogList"),
  workLogCount: document.querySelector("#workLogCount"),
  advanceForm: document.querySelector("#advanceForm"),
  advanceEmployee: document.querySelector("#advanceEmployee"),
  advanceMonth: document.querySelector("#advanceMonth"),
  advanceAmount: document.querySelector("#advanceAmount"),
  advanceReason: document.querySelector("#advanceReason"),
  advanceList: document.querySelector("#advanceList"),
  leaveForm: document.querySelector("#leaveForm"),
  leaveEmployee: document.querySelector("#leaveEmployee"),
  leaveType: document.querySelector("#leaveType"),
  leaveStart: document.querySelector("#leaveStart"),
  leaveEnd: document.querySelector("#leaveEnd"),
  leaveReason: document.querySelector("#leaveReason"),
  leaveDecisionPreview: document.querySelector("#leaveDecisionPreview"),
  leaveList: document.querySelector("#leaveList"),
  leaveFixedHolidayTotal: document.querySelector("#leaveFixedHolidayTotal"),
  leaveAdvanceBalance: document.querySelector("#leaveAdvanceBalance"),
  leaveCalendarMonth: document.querySelector("#leaveCalendarMonth"),
  leaveCalendarGrid: document.querySelector("#leaveCalendarGrid"),
  holidayForm: document.querySelector("#holidayForm"),
  holidayDate: document.querySelector("#holidayDate"),
  holidayName: document.querySelector("#holidayName"),
  holidayNote: document.querySelector("#holidayNote"),
  holidayList: document.querySelector("#holidayList"),
  payrollLockBtn: document.querySelector("#payrollLockBtn"),
  payrollReviewChecklist: document.querySelector("#payrollReviewChecklist"),
  salaryAdjustmentForm: document.querySelector("#salaryAdjustmentForm"),
  salaryAdjustmentEmployee: document.querySelector("#salaryAdjustmentEmployee"),
  salaryAdjustmentMonth: document.querySelector("#salaryAdjustmentMonth"),
  salaryAdjustmentType: document.querySelector("#salaryAdjustmentType"),
  salaryAdjustmentAmount: document.querySelector("#salaryAdjustmentAmount"),
  salaryAdjustmentNote: document.querySelector("#salaryAdjustmentNote"),
  salaryAdjustmentList: document.querySelector("#salaryAdjustmentList"),
  runWarningReportBtn: document.querySelector("#runWarningReportBtn"),
  warningReportList: document.querySelector("#warningReportList"),
  entryForm: document.querySelector("#entryForm"),
  entryType: document.querySelector("#entryType"),
  entryCategory: document.querySelector("#entryCategory"),
  entryAmount: document.querySelector("#entryAmount"),
  entryDate: document.querySelector("#entryDate"),
  entryNote: document.querySelector("#entryNote"),
  bulkEntryForm: document.querySelector("#bulkEntryForm"),
  bulkType: document.querySelector("#bulkType"),
  bulkCategory: document.querySelector("#bulkCategory"),
  bulkStart: document.querySelector("#bulkStart"),
  bulkEnd: document.querySelector("#bulkEnd"),
  bulkAmount: document.querySelector("#bulkAmount"),
  bulkMode: document.querySelector("#bulkMode"),
  bulkNote: document.querySelector("#bulkNote"),
  entriesTable: document.querySelector("#entriesTable"),
  todayEntries: document.querySelector("#todayEntries"),
  fixedForm: document.querySelector("#fixedForm"),
  fixedName: document.querySelector("#fixedName"),
  fixedCategory: document.querySelector("#fixedCategory"),
  fixedAmount: document.querySelector("#fixedAmount"),
  fixedActive: document.querySelector("#fixedActive"),
  fixedNote: document.querySelector("#fixedNote"),
  fixedList: document.querySelector("#fixedList"),
  currentUserLabel: document.querySelector("#currentUserLabel"),
  managerForm: document.querySelector("#managerForm"),
  managerName: document.querySelector("#managerName"),
  managerPin: document.querySelector("#managerPin"),
  managerList: document.querySelector("#managerList"),
  approvalList: document.querySelector("#approvalList"),
  approvalTabs: document.querySelector("#approvalTabs"),
  bulkApproveBtn: document.querySelector("#bulkApproveBtn"),
  bulkRejectBtn: document.querySelector("#bulkRejectBtn"),
  employeeAccessForm: document.querySelector("#employeeAccessForm"),
  employeeAccessEmployee: document.querySelector("#employeeAccessEmployee"),
  employeeAccessPin: document.querySelector("#employeeAccessPin"),
  employeeAccessList: document.querySelector("#employeeAccessList"),
  employeeProfileForm: document.querySelector("#employeeProfileForm"),
  profileEmployee: document.querySelector("#profileEmployee"),
  profileShift: document.querySelector("#profileShift"),
  profileJoinDate: document.querySelector("#profileJoinDate"),
  profilePhone: document.querySelector("#profilePhone"),
  profileEmergency: document.querySelector("#profileEmergency"),
  profileStatus: document.querySelector("#profileStatus"),
  employeeProfileList: document.querySelector("#employeeProfileList"),
  notificationList: document.querySelector("#notificationList"),
  cloudApiUrl: document.querySelector("#cloudApiUrl"),
  cloudStatus: document.querySelector("#cloudStatus"),
  employeeSetupSteps: document.querySelector("#employeeSetupSteps"),
  supabaseUrl: document.querySelector("#supabaseUrl"),
  supabaseAnonKey: document.querySelector("#supabaseAnonKey"),
  supabaseStatus: document.querySelector("#supabaseStatus"),
  supabaseHealthCheckBtn: document.querySelector("#supabaseHealthCheckBtn"),
  settingsSaveStatus: document.querySelector("#settingsSaveStatus"),
  officeLocationEnabled: document.querySelector("#officeLocationEnabled"),
  officeLatitude: document.querySelector("#officeLatitude"),
  officeLongitude: document.querySelector("#officeLongitude"),
  officeRadius: document.querySelector("#officeRadius"),
  officeLocationStatus: document.querySelector("#officeLocationStatus"),
  testOfficeLocationBtn: document.querySelector("#testOfficeLocationBtn"),
  permissionMatrix: document.querySelector("#permissionMatrix"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryType: document.querySelector("#categoryType"),
  categoryName: document.querySelector("#categoryName"),
  categoryList: document.querySelector("#categoryList"),
  pinForm: document.querySelector("#pinForm"),
  newPin: document.querySelector("#newPin"),
  exportOutput: document.querySelector("#exportOutput"),
  backupStatus: document.querySelector("#backupStatus"),
  backupVersionSelect: document.querySelector("#backupVersionSelect"),
  restoreBackupVersionBtn: document.querySelector("#restoreBackupVersionBtn"),
  deleteBackupVersionBtn: document.querySelector("#deleteBackupVersionBtn"),
  clearAllBackupsBtn: document.querySelector("#clearAllBackupsBtn"),
  clearOldNotificationsBtn: document.querySelector("#clearOldNotificationsBtn"),
  clearRejectedRequestsBtn: document.querySelector("#clearRejectedRequestsBtn"),
  clearEmptyBackupsBtn: document.querySelector("#clearEmptyBackupsBtn"),
  backupVersionHint: document.querySelector("#backupVersionHint"),
  healthCheckList: document.querySelector("#healthCheckList"),
  runHealthCheckBtn: document.querySelector("#runHealthCheckBtn"),
  systemCheckList: document.querySelector("#systemCheckList"),
  runSystemCheckBtn: document.querySelector("#runSystemCheckBtn"),
  editModal: document.querySelector("#editModal"),
  approvalDetailModal: document.querySelector("#approvalDetailModal"),
  approvalDetailBody: document.querySelector("#approvalDetailBody"),
  closeApprovalDetail: document.querySelector("#closeApprovalDetail"),
  editEntryForm: document.querySelector("#editEntryForm"),
  editId: document.querySelector("#editId"),
  editType: document.querySelector("#editType"),
  editCategory: document.querySelector("#editCategory"),
  editAmount: document.querySelector("#editAmount"),
  editDate: document.querySelector("#editDate"),
  editNote: document.querySelector("#editNote"),
};

function savedThemeMode() {
  return localStorage.getItem(THEME_KEY) === "night" ? "night" : "day";
}

function savedThemePreset() {
  const preset = localStorage.getItem(THEME_PRESET_KEY) || "premium-red";
  return ["premium-red", "emerald-gold", "royal-violet", "graphite-gold"].includes(preset) ? preset : "premium-red";
}

function applyThemePreset(preset = savedThemePreset()) {
  document.body.dataset.preset = preset;
  localStorage.setItem(THEME_PRESET_KEY, preset);
  if (els.themePresetSelect) els.themePresetSelect.value = preset;
}

function applyThemeMode(mode = savedThemeMode()) {
  const nextMode = mode === "night" ? "night" : "day";
  applyThemePreset();
  document.body.dataset.theme = nextMode;
  localStorage.setItem(THEME_KEY, nextMode);
  if (els.themeToggleBtn) {
    els.themeToggleBtn.setAttribute("aria-pressed", String(nextMode === "night"));
    els.themeToggleBtn.innerHTML = `<i data-lucide="${nextMode === "night" ? "moon" : "sun"}"></i><span id="themeToggleText">${nextMode === "night" ? "Night" : "Day"}</span>`;
    els.themeToggleText = document.querySelector("#themeToggleText");
  }
}

function toggleThemeMode() {
  applyThemeMode(savedThemeMode() === "night" ? "day" : "night");
  if (window.lucide) lucide.createIcons();
}

function savedCompactMode() {
  return localStorage.getItem(COMPACT_MODE_KEY) === "1";
}

function applyCompactMode(mode = savedCompactMode()) {
  document.body.classList.toggle("compact-mode", mode);
  if (els.compactModeBtn) {
    els.compactModeBtn.classList.toggle("active", mode);
    els.compactModeBtn.setAttribute("aria-pressed", String(mode));
    els.compactModeBtn.innerHTML = `<i data-lucide="${mode ? "maximize-2" : "minimize-2"}"></i> ${mode ? "Full Mode" : "Compact Mode"}`;
  }
}

function toggleCompactMode() {
  const nextMode = !savedCompactMode();
  localStorage.setItem(COMPACT_MODE_KEY, nextMode ? "1" : "0");
  applyCompactMode(nextMode);
  if (window.lucide) lucide.createIcons();
}

function canOpenView(view) {
  const role = currentUser?.role || "guest";
  const access = {
    admin: ["dashboard", "daily", "reports", "attendance", "advance", "fixed", "approvals", "settings"],
    manager: ["dashboard", "daily", "reports", "attendance", "advance", "approvals"],
    employee: ["dashboard", "attendance", "advance"],
    guest: ["dashboard"],
  };
  return (access[role] || access.guest).includes(view);
}

function defaultState() {
  return {
    settings: {
      adminPin: "1234",
      adminEmail: "",
      officeLocation: {
        enabled: false,
        latitude: "",
        longitude: "",
        radiusMeters: 100,
      },
    },
    managers: [{ id: crypto.randomUUID(), name: "ফাইজুর (ম্যানেজার)", pin: "2222", active: true }],
    employeeAccess: [],
    employeeProfiles: [],
    employees: [],
    approvals: [],
    activityLogs: [],
    notices: [],
    workLogs: [],
    attendance: [],
    fridayWorkRequests: [],
    breaks: [],
    advances: [],
    leaveRequests: [],
    fixedHolidays: defaultFixedHolidays(),
    salaryAdjustments: [],
    payrollLocks: [],
    notifications: [],
    fixedExpenses: [
      fixed("ফাইজুর বেতন", "salary", 15000, true, "এমপ্লয়ী"),
      fixed("অমিত বেতন", "salary", 13000, true, "এমপ্লয়ী"),
      fixed("সাকিব বেতন", "salary", 12000, true, "এমপ্লয়ী"),
      fixed("সিফাত বেতন", "salary", 20000, true, "এমপ্লয়ী"),
      fixed("স্টারলিংক", "internet", 4200, true, "ইন্টারনেট বিল"),
      fixed("গ্রীন নেট", "internet", 1100, true, "ইন্টারনেট বিল"),
      fixed("অফিস ভাড়া", "rent", 9000, true, "মাসিক অফিস ভাড়া"),
      fixed("বিদ্যুৎ বিল", "electricity", 2000, true, "আনুমানিক মাসিক"),
      fixed("অফিসের অন্যান্য", "other", 0, true, "প্রয়োজনে মাসিক স্থায়ী খরচ দিন"),
    ],
    entries: [],
    categories: {
      income: ["commission", "other_income"],
      expense: ["dollar_boost", "office_other", "snack"],
    },
  };
}

function fixed(name, category, amount, active, note) {
  return { id: crypto.randomUUID(), name, category, amount, active, note };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
  if (!saved) return defaultState();

  try {
    const parsed = JSON.parse(saved);
    const defaults = defaultState();
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...parsed.settings },
      managers: parsed.managers || defaults.managers,
      employees: parsed.employees || defaults.employees,
      employeeAccess: parsed.employeeAccess || defaults.employeeAccess,
      employeeProfiles: parsed.employeeProfiles || defaults.employeeProfiles,
      approvals: parsed.approvals || defaults.approvals,
      activityLogs: parsed.activityLogs || defaults.activityLogs,
      notices: parsed.notices || defaults.notices,
      workLogs: parsed.workLogs || defaults.workLogs,
      attendance: parsed.attendance || defaults.attendance,
      fridayWorkRequests: parsed.fridayWorkRequests || defaults.fridayWorkRequests,
      breaks: parsed.breaks || defaults.breaks,
      advances: parsed.advances || defaults.advances,
      leaveRequests: parsed.leaveRequests || defaults.leaveRequests,
      fixedHolidays: parsed.fixedHolidays || defaults.fixedHolidays,
      salaryAdjustments: parsed.salaryAdjustments || defaults.salaryAdjustments,
      payrollLocks: parsed.payrollLocks || defaults.payrollLocks,
      notifications: parsed.notifications || defaults.notifications,
      categories: { ...defaults.categories, ...parsed.categories },
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (els?.settingsSaveStatus) {
    els.settingsSaveStatus.textContent = `Saved · ${new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  }
  createAutoBackup();
  cloudDirty = true;
  lastCloudSyncFailed = false;
  clearCloudRetry();
  updateCloudSyncBar();
  if (supabaseEnabled()) {
    if (currentUser.role !== "guest") queueSupabasePush();
  } else {
    queueCloudPush();
  }
}

function cloudUrl() {
  return localStorage.getItem(CLOUD_URL_KEY) || DEFAULT_CLOUD_URL;
}

function supabaseConfig() {
  return {
    url: localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL,
    anonKey: localStorage.getItem(SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY,
  };
}

function supabaseEnabled() {
  const config = supabaseConfig();
  return Boolean(config.url && config.anonKey);
}

function supabaseClient() {
  if (!supabaseEnabled() || !window.supabase?.createClient) return null;
  const config = supabaseConfig();
  if (supabaseClientInstance?.__url === config.url && supabaseClientInstance?.__anonKey === config.anonKey) return supabaseClientInstance;
  supabaseClientInstance = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  supabaseClientInstance.__url = config.url;
  supabaseClientInstance.__anonKey = config.anonKey;
  return supabaseClientInstance;
}

function setSupabaseStatus(message, status = "") {
  if (els.supabaseStatus) {
    els.supabaseStatus.textContent = message;
    if (status) els.supabaseStatus.dataset.status = status;
  }
  if (els.loginRoleHint && currentUser.role === "guest" && supabaseEnabled()) {
    els.loginRoleHint.textContent = message;
  }
}

function setCloudStatus(message) {
  if (els.cloudStatus) els.cloudStatus.textContent = message;
  updateCloudSyncBar(message);
  if (els.loginRoleHint && !isAdmin() && !isManager() && !isEmployee()) {
    els.loginRoleHint.textContent = message;
  }
}

function updateCloudSyncBar(message = "") {
  if (!els.cloudSyncBar) return;
  if (lastCloudSyncFailed) {
    const retryText = cloudRetryTimer ? ` · retry ${bn.format(cloudRetryCount)}/${bn.format(CLOUD_RETRY_LIMIT)} in 30s` : "";
    els.cloudSyncBar.textContent = message || `Sync failed${retryText}`;
    els.cloudSyncBar.dataset.status = "failed";
    return;
  }
  if (cloudDirty) {
    els.cloudSyncBar.textContent = "Unsaved changes";
    els.cloudSyncBar.dataset.status = "dirty";
    return;
  }
  if (lastCloudSyncAt) {
    els.cloudSyncBar.textContent = `Cloud synced ${timeAgo(lastCloudSyncAt)}`;
    els.cloudSyncBar.dataset.status = "synced";
    return;
  }
  els.cloudSyncBar.textContent = cloudUrl() ? "Cloud sync ready" : "Cloud sync off";
  els.cloudSyncBar.dataset.status = cloudUrl() ? "ready" : "off";
}

function renderPwaStatus() {
  const online = navigator.onLine !== false;
  if (els.offlineStatusBar) {
    els.offlineStatusBar.textContent = online ? "Online" : "Offline mode";
    els.offlineStatusBar.dataset.status = online ? "synced" : "failed";
  }
  if (els.pwaOfflineStatus) {
    els.pwaOfflineStatus.textContent = online ? "Network: online" : "Network: offline, cached app active";
  }
  if (els.pwaInstallStatus) {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
    els.pwaInstallStatus.textContent = standalone ? "Install status: installed" : deferredInstallPrompt ? "Install status: ready" : "Install status: browser menu theke install korte paren";
  }
  if (els.installPwaBtn) {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
    els.installPwaBtn.disabled = standalone || !deferredInstallPrompt;
    els.installPwaBtn.title = standalone ? "App already installed" : deferredInstallPrompt ? "Install prompt open korun" : "Browser menu theke Add to Home screen use korun";
  }
}

async function installPwa() {
  if (!deferredInstallPrompt) {
    alert("Install prompt ready na hole browser menu theke Add to Home screen / Install app use korun.");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  renderPwaStatus();
}

async function refreshPwaCache() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.update();
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("minus-style-pwa")).map((key) => caches.delete(key)));
  }
  alert("App cache refresh hoyeche. Page reload korun.");
}

function clearCloudRetry() {
  clearTimeout(cloudRetryTimer);
  cloudRetryTimer = null;
  cloudRetryCount = 0;
}

function scheduleCloudRetry(errorMessage = "Sync failed") {
  if (!cloudUrl() || !cloudDirty || cloudRetryCount >= CLOUD_RETRY_LIMIT) {
    updateCloudSyncBar(errorMessage);
    return;
  }
  clearTimeout(cloudRetryTimer);
  cloudRetryCount += 1;
  cloudRetryTimer = setTimeout(() => {
    cloudRetryTimer = null;
    syncToCloud(false);
  }, CLOUD_RETRY_DELAY);
  updateCloudSyncBar(`${errorMessage} · auto retry ${bn.format(cloudRetryCount)}/${bn.format(CLOUD_RETRY_LIMIT)} in 30s`);
}

function cloudLoginSummary() {
  const linkedEmails = state.employeeAccess.filter((access) => normalizeEmail(access.email)).length;
  return `Access ready: ${bn.format(linkedEmails)} email linked, ${bn.format(employees().length)} employee`;
}

function queueCloudPush() {
  if (isApplyingCloudState || !cloudUrl()) return;
  clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(() => syncToCloud(false), CLOUD_PUSH_DELAY);
}

async function syncToCloud(showAlert = true) {
  const url = cloudUrl();
  if (!url) {
    setCloudStatus("Cloud URL দেওয়া হয়নি।");
    return;
  }

  try {
    setCloudStatus("Cloud-এ data পাঠানো হচ্ছে...");
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "saveState", state, updatedAt: new Date().toISOString() }),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Cloud save failed");
    cloudDirty = false;
    lastCloudSyncFailed = false;
    lastCloudSyncAt = new Date().toISOString();
    clearCloudRetry();
    setCloudStatus(`শেষ cloud save: ${new Date().toLocaleString("bn-BD")}`);
    if (showAlert) alert("Cloud-এ data save হয়েছে।");
  } catch (error) {
    lastCloudSyncFailed = true;
    scheduleCloudRetry(`Cloud save failed: ${error.message}`);
    if (showAlert) alert(`Cloud save failed: ${error.message}`);
  }
}

async function syncFromCloud(showAlert = true) {
  const url = cloudUrl();
  if (!url) {
    setCloudStatus("Cloud URL দেওয়া হয়নি।");
    return false;
  }

  try {
    setCloudStatus("Cloud থেকে data আনা হচ্ছে...");
    const response = await fetch(`${url}?action=getState&cache=${Date.now()}`, { method: "GET", mode: "cors" });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Cloud load failed");
    if (result.state) {
      isApplyingCloudState = true;
      Object.assign(state, defaultState(), result.state);
      state.settings = { ...defaultState().settings, ...result.state.settings };
      state.categories = { ...defaultState().categories, ...result.state.categories };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      cloudDirty = false;
      lastCloudSyncFailed = false;
      lastCloudSyncAt = new Date().toISOString();
      isApplyingCloudState = false;
      ensureEmployeeAccess();
      render();
      if (els.loginRoleHint) els.loginRoleHint.textContent = cloudLoginSummary();
    }
    setCloudStatus(`শেষ cloud load: ${new Date().toLocaleString("bn-BD")}`);
    if (showAlert) alert("Cloud থেকে data load হয়েছে।");
    return true;
  } catch (error) {
    isApplyingCloudState = false;
    lastCloudSyncFailed = true;
    setCloudStatus(`Cloud load failed: ${error.message}`);
    if (showAlert) alert(`Cloud load failed: ${error.message}`);
    return false;
  }
}

function queueSupabasePush() {
  if (isApplyingSupabaseState || !supabaseEnabled()) return;
  clearTimeout(supabasePushTimer);
  supabasePushTimer = setTimeout(() => syncToSupabase(false), CLOUD_PUSH_DELAY);
}

function supabaseLoginSummary() {
  if (!supabaseEnabled()) return "Supabase off";
  return "Supabase mode: email + password login";
}

async function signInWithSupabase(email, password) {
  const client = supabaseClient();
  if (!client) throw new Error("Supabase library/config missing");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data?.user;
  if (!user) throw new Error("Supabase user not found");
  return supabaseUserToCurrentUser(user);
}

async function signUpWithSupabase(email, password) {
  const client = supabaseClient();
  if (!client) throw new Error("Supabase library/config missing");
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: APP_PUBLIC_URL,
      data: { display_name: email.split("@")[0] },
    },
  });
  if (error) throw error;
  return data;
}

async function sendSupabasePasswordReset(email) {
  const client = supabaseClient();
  if (!client) throw new Error("Supabase library/config missing");
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: APP_PUBLIC_URL,
  });
  if (error) throw error;
}

function supabaseAuthUrlParams() {
  const rawHash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(rawHash);
  const searchParams = new URLSearchParams(window.location.search);
  return {
    type: hashParams.get("type") || searchParams.get("type"),
    error: hashParams.get("error") || searchParams.get("error"),
    errorCode: hashParams.get("error_code") || searchParams.get("error_code"),
    errorDescription: hashParams.get("error_description") || searchParams.get("error_description"),
  };
}

function showSupabaseAuthUrlError(params) {
  if (!params.error && !params.errorCode) return false;
  const isExpired = params.errorCode === "otp_expired";
  const message = isExpired
    ? "Password reset link expired/invalid. Email diye Set / Reset password abar click kore newest email link open korun."
    : `Supabase auth link failed: ${params.errorDescription || params.errorCode || params.error}`;
  if (els.loginError) els.loginError.textContent = message;
  if (els.loginRoleHint) els.loginRoleHint.textContent = "Reset link kaj na korle fresh email nin";
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}

async function completeSupabasePasswordRecovery() {
  if (!supabaseEnabled()) return false;
  const params = supabaseAuthUrlParams();
  if (showSupabaseAuthUrlError(params)) return false;
  if (params.type !== "recovery") return false;
  const client = supabaseClient();
  if (!client) return false;
  let { data } = await client.auth.getSession();
  for (let attempt = 0; attempt < 8 && !data?.session; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const result = await client.auth.getSession();
    data = result.data;
  }
  if (!data?.session) return false;
  const nextPassword = window.prompt("New password din (minimum 6 character):");
  if (!nextPassword) return false;
  if (nextPassword.length < 6) {
    alert("Password minimum 6 character hote hobe.");
    return false;
  }
  const { error } = await client.auth.updateUser({ password: nextPassword });
  if (error) {
    alert(`Password update failed: ${error.message}`);
    return false;
  }
  window.history.replaceState({}, document.title, window.location.pathname);
  alert("Password set hoyeche. Ebar email + new password diye login korun.");
  return true;
}

async function supabaseUserToCurrentUser(user) {
  const client = supabaseClient();
  if (!client) throw new Error("Supabase library/config missing");
  let { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,email,role,employee_id,display_name,active")
    .eq("id", user.id)
    .single();
  if (profileError && String(user.email || "").toLowerCase() === OWNER_ADMIN_EMAIL) {
    const { error: bootstrapError } = await client.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role: "admin",
      display_name: "Admin",
      active: true,
    });
    if (!bootstrapError) {
      const retry = await client
        .from("profiles")
        .select("id,email,role,employee_id,display_name,active")
        .eq("id", user.id)
        .single();
      profile = retry.data;
      profileError = retry.error;
    }
  }
  if (profileError) throw profileError;
  if (!profile?.active) throw new Error("This user is inactive");

  let employeeName = profile.display_name || user.email;
  let employeeId = profile.employee_id || null;
  if (!employeeId && profile.role === "employee") {
    const inferredEmployee = inferEmployeeFromAuthProfile(profile, user);
    if (inferredEmployee) {
      employeeId = inferredEmployee.id;
      employeeName = inferredEmployee.name;
    }
  }
  if (profile.role === "employee" && !employeeId) {
    throw new Error("Account created, but admin approval/employee link pending.");
  }
  if (profile.employee_id) {
    const { data: employee } = await client.from("employees").select("id,name").eq("id", profile.employee_id).maybeSingle();
    if (employee?.name) employeeName = employee.name;
  }

  return {
    role: profile.role,
    name: profile.role === "admin" ? profile.display_name || "Admin" : employeeName,
    employeeId,
    authId: user.id,
    email: user.email,
    source: "supabase",
  };
}

function inferEmployeeFromAuthProfile(profile, user) {
  const haystack = normalizeName(`${profile.display_name || ""} ${profile.email || ""} ${user?.email || ""}`).replace(/shakib/g, "sakib");
  const accessRule = employeeAccessPins.find((rule) => rule.matches.some((match) => haystack.includes(normalizeName(match))));
  if (!accessRule) return null;
  return employees().find((employee) => employeeAccessRule(employee) === accessRule) || null;
}

function supabaseEmployeeScope() {
  return isEmployee() ? currentEmployeeId() : "";
}

function visibleByEmployeeScope(rows, employeeKey = "employeeId") {
  const scope = supabaseEmployeeScope();
  return scope ? rows.filter((row) => row[employeeKey] === scope) : rows;
}

function sanitizeRows(rows) {
  return rows.filter((row) => row && row.id).map((row) => ({ ...row }));
}

function tableRowsForSupabase() {
  const scope = supabaseEmployeeScope();
  const teamScope = !scope;
  const scopeRows = (rows, employeeKey = "employeeId") => (scope ? rows.filter((row) => row[employeeKey] === scope) : rows);
  return {
    employees: scope
      ? employees().filter((employee) => employee.id === scope).map((employee) => ({ id: employee.id, name: employee.name, salary: Number(employee.salary || 0), active: true }))
      : employees().map((employee) => ({ id: employee.id, name: employee.name, salary: Number(employee.salary || 0), active: true })),
    daily_entries: teamScope ? sanitizeRows(state.entries).map((entry) => ({
      id: entry.id,
      entry_date: entry.date,
      type: entry.type,
      category: entry.category,
      amount: Number(entry.amount || 0),
      note: entry.note || "",
      created_by_name: entry.createdBy || currentUser.name || "",
    })) : [],
    fixed_expenses: teamScope ? sanitizeRows(state.fixedExpenses).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      amount: Number(item.amount || 0),
      active: Boolean(item.active),
      note: item.note || "",
    })) : [],
    attendance_records: sanitizeRows(scopeRows(state.attendance || [])).map((item) => ({
      id: item.id,
      employee_id: item.employeeId,
      work_date: item.date,
      status: item.status,
      shift: item.shift,
      check_in: item.checkIn || null,
      check_out: item.checkOut || null,
      break_minutes: Number(item.breakMinutes || item.break || 0),
      note: item.note || "",
      marked_by: item.markedBy || currentUser.name || "",
      source: item.source || "web",
    })),
    break_records: sanitizeRows(scopeRows(state.breaks || [])).map((item) => ({
      id: item.id,
      employee_id: item.employeeId,
      break_date: item.date,
      type: item.type,
      note: item.note || "",
      started_at: item.startedAt || item.startAt || null,
      ended_at: item.endedAt || item.endAt || null,
      duration_seconds: Number(item.durationSeconds || 0),
      status: item.status || (item.endedAt ? "completed" : "running"),
    })),
    leave_requests: sanitizeRows(scopeRows(state.leaveRequests || [])).map((item) => ({
      id: item.id,
      employee_id: item.employeeId,
      leave_type: item.type,
      start_date: item.start || item.startDate,
      end_date: item.end || item.endDate,
      days: Number(item.days || 0),
      reason: item.reason || "",
      status: item.status || "pending",
      breakdown: item.breakdown || [],
      requested_by: item.requestedBy || currentUser.name || "",
      reviewed_by: item.reviewedBy || "",
    })),
    advance_requests: sanitizeRows(scopeRows(state.advances || [])).map((item) => ({
      id: item.id,
      employee_id: item.employeeId,
      salary_month: item.month,
      amount: Number(item.amount || 0),
      reason: item.reason || "",
      status: item.status || "pending",
      approved_by: item.approvedBy || "",
    })),
    approvals: sanitizeRows(scope ? (state.approvals || []).filter((item) => item.payload?.employeeId === scope) : state.approvals || []).map((item) => ({
      id: item.id,
      action: item.action,
      status: item.status || "pending",
      payload: item.payload || {},
      requested_by: item.requestedBy || "",
      reviewed_by: item.reviewedBy || "",
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),
    })),
    friday_work_requests: sanitizeRows(scopeRows(state.fridayWorkRequests || [])).map((item) => ({
      id: item.id,
      employee_id: item.employeeId,
      work_date: item.work_date || item.workDate,
      request_type: item.request_type || item.requestType,
      reason: item.reason || "",
      note: item.note || "",
      status: item.status || "pending",
      approved_by: item.approved_by || item.approvedBy || "",
      attendance_id: item.attendance_id || item.attendanceId || null,
      salary_added: Boolean(item.salary_added || item.salaryAdded),
      compensatory_leave_added: Boolean(item.compensatory_leave_added || item.compensatoryLeaveAdded),
    })),
    salary_adjustments: teamScope ? sanitizeRows(scopeRows(state.salaryAdjustments || [])).map((item) => ({
      id: item.id,
      employee_id: item.employeeId,
      salary_month: item.month,
      type: item.type,
      label: item.label || item.reason || "",
      amount: Number(item.amount || 0),
      note: item.note || "",
    })) : [],
  };
}

async function upsertSupabaseTable(client, table, rows) {
  if (!rows?.length) return;
  const { error } = await client.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function syncToSupabase(showAlert = true) {
  const client = supabaseClient();
  if (!client) {
    setSupabaseStatus("Supabase config/library missing.", "failed");
    return false;
  }
  try {
    setSupabaseStatus("Supabase-e data pathano hocche...", "dirty");
    const rows = tableRowsForSupabase();
    await upsertSupabaseTable(client, "employees", rows.employees);
    await upsertSupabaseTable(client, "daily_entries", rows.daily_entries);
    await upsertSupabaseTable(client, "fixed_expenses", rows.fixed_expenses);
    await upsertSupabaseTable(client, "attendance_records", rows.attendance_records);
    await upsertSupabaseTable(client, "break_records", rows.break_records);
    await upsertSupabaseTable(client, "leave_requests", rows.leave_requests);
    await upsertSupabaseTable(client, "advance_requests", rows.advance_requests);
    await upsertSupabaseTable(client, "approvals", rows.approvals);
    await upsertSupabaseTable(client, "friday_work_requests", rows.friday_work_requests);
    await upsertSupabaseTable(client, "salary_adjustments", rows.salary_adjustments);
    if (isAdmin()) {
      await client.from("app_state").upsert({ id: "main", snapshot: state, updated_at: new Date().toISOString() }, { onConflict: "id" });
      await client.from("app_backups").insert({ snapshot: state, label: "manual/frontend backup" });
    }
    cloudDirty = false;
    lastCloudSyncFailed = false;
    lastCloudSyncAt = new Date().toISOString();
    updateCloudSyncBar("Supabase synced");
    setSupabaseStatus(`Supabase synced: ${new Date().toLocaleString("bn-BD")}`, "synced");
    if (showAlert) alert("Supabase-e data save hoyeche.");
    return true;
  } catch (error) {
    lastCloudSyncFailed = true;
    setSupabaseStatus(`Supabase save failed: ${error.message}`, "failed");
    updateCloudSyncBar(`Supabase save failed: ${error.message}`);
    if (showAlert) alert(`Supabase save failed: ${error.message}`);
    return false;
  }
}

function mergeSupabaseRows(payload) {
  if (payload.employees?.length) state.employees = payload.employees.map((item) => ({ id: item.id, name: item.name, salary: Number(item.salary || 0) }));
  if (payload.daily_entries) {
    state.entries = payload.daily_entries.map((item) => ({
      id: item.id,
      date: item.entry_date,
      type: item.type,
      category: item.category,
      amount: Number(item.amount || 0),
      note: item.note || "",
      createdBy: item.created_by_name || "",
    }));
  }
  if (payload.fixed_expenses) {
    state.fixedExpenses = payload.fixed_expenses.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      amount: Number(item.amount || 0),
      active: Boolean(item.active),
      note: item.note || "",
    }));
  }
  if (payload.attendance_records) {
    state.attendance = payload.attendance_records.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: employeeById(item.employee_id)?.name || "",
      date: item.work_date,
      status: item.status,
      shift: item.shift,
      checkIn: item.check_in || "",
      checkOut: item.check_out || "",
      breakMinutes: Number(item.break_minutes || 0),
      note: item.note || "",
      markedBy: item.marked_by || "",
      source: item.source || "supabase",
    }));
  }
  if (payload.break_records) {
    state.breaks = payload.break_records.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: employeeById(item.employee_id)?.name || "",
      date: item.break_date,
      type: item.type,
      note: item.note || "",
      startedAt: item.started_at || "",
      endedAt: item.ended_at || "",
      durationSeconds: Number(item.duration_seconds || 0),
      status: item.status || "completed",
    }));
  }
  if (payload.leave_requests) {
    state.leaveRequests = payload.leave_requests.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: employeeById(item.employee_id)?.name || "",
      type: item.leave_type,
      start: item.start_date,
      end: item.end_date,
      days: Number(item.days || 0),
      reason: item.reason || "",
      status: item.status || "pending",
      breakdown: item.breakdown || [],
      requestedBy: item.requested_by || "",
      reviewedBy: item.reviewed_by || "",
    }));
  }
  if (payload.advance_requests) {
    state.advances = payload.advance_requests.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: employeeById(item.employee_id)?.name || "",
      month: item.salary_month,
      amount: Number(item.amount || 0),
      reason: item.reason || "",
      status: item.status || "pending",
      approvedBy: item.approved_by || "",
    }));
  }
  if (payload.approvals) {
    state.approvals = payload.approvals.map((item) => ({
      id: item.id,
      action: item.action,
      status: item.status || "pending",
      payload: item.payload || {},
      requestedBy: item.requested_by || "",
      reviewedBy: item.reviewed_by || "",
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }
  if (payload.friday_work_requests) {
    state.fridayWorkRequests = payload.friday_work_requests.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: employeeById(item.employee_id)?.name || "",
      work_date: item.work_date,
      request_type: item.request_type,
      reason: item.reason || "",
      note: item.note || "",
      status: item.status || "pending",
      approved_by: item.approved_by || "",
      attendance_id: item.attendance_id || "",
      salary_added: Boolean(item.salary_added),
      compensatory_leave_added: Boolean(item.compensatory_leave_added),
    }));
  }
  if (payload.salary_adjustments) {
    state.salaryAdjustments = payload.salary_adjustments.map((item) => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: employeeById(item.employee_id)?.name || "",
      month: item.salary_month,
      type: item.type,
      label: item.label || "",
      amount: Number(item.amount || 0),
      note: item.note || "",
    }));
  }
}

async function selectSupabaseTable(client, table, orderColumn = "created_at") {
  let query = client.from(table).select("*");
  if (orderColumn) query = query.order(orderColumn, { ascending: false });
  const { data, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function syncFromSupabase(showAlert = true) {
  const client = supabaseClient();
  if (!client) {
    setSupabaseStatus("Supabase config/library missing.", "failed");
    return false;
  }
  try {
    setSupabaseStatus("Supabase theke data ana hocche...", "dirty");
    isApplyingSupabaseState = true;
    const payload = {
      employees: await selectSupabaseTable(client, "employees", "name"),
      daily_entries: await selectSupabaseTable(client, "daily_entries", "entry_date"),
      fixed_expenses: await selectSupabaseTable(client, "fixed_expenses", "name"),
      attendance_records: await selectSupabaseTable(client, "attendance_records", "work_date"),
      break_records: await selectSupabaseTable(client, "break_records", "break_date"),
      leave_requests: await selectSupabaseTable(client, "leave_requests", "start_date"),
      advance_requests: await selectSupabaseTable(client, "advance_requests", "salary_month"),
      approvals: await selectSupabaseTable(client, "approvals", "created_at"),
      friday_work_requests: await selectSupabaseTable(client, "friday_work_requests", "work_date"),
      salary_adjustments: await selectSupabaseTable(client, "salary_adjustments", "salary_month"),
    };
    mergeSupabaseRows(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    cloudDirty = false;
    lastCloudSyncFailed = false;
    lastCloudSyncAt = new Date().toISOString();
    isApplyingSupabaseState = false;
    ensureEmployeeAccess();
    render();
    updateCloudSyncBar("Supabase synced");
    setSupabaseStatus(`Supabase load complete: ${new Date().toLocaleString("bn-BD")}`, "synced");
    if (showAlert) alert("Supabase theke data load hoyeche.");
    return true;
  } catch (error) {
    isApplyingSupabaseState = false;
    lastCloudSyncFailed = true;
    setSupabaseStatus(`Supabase load failed: ${error.message}`, "failed");
    updateCloudSyncBar(`Supabase load failed: ${error.message}`);
    if (showAlert) alert(`Supabase load failed: ${error.message}`);
    return false;
  }
}

async function runSupabaseHealthCheck() {
  const client = supabaseClient();
  if (!client) {
    setSupabaseStatus("Supabase config/library missing.", "failed");
    return;
  }
  const checks = [];
  const addCheck = (name, ok, detail = "") => checks.push(`${ok ? "OK" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
  try {
    setSupabaseStatus("Supabase health check cholche...", "dirty");
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    addCheck("Auth session", Boolean(user), sessionError?.message || user?.email || "Not logged in");
    if (!user) {
      const message = checks.join(" | ");
      setSupabaseStatus(message, "failed");
      alert(`Supabase Health Check\n${message}`);
      return;
    }

    const tables = [
      ["profiles", "created_at"],
      ["employees", "name"],
      ["attendance_records", "work_date"],
      ["break_records", "break_date"],
      ["leave_requests", "start_date"],
      ["approvals", "created_at"],
    ];
    for (const [table, orderColumn] of tables) {
      try {
        let query = client.from(table).select("*").limit(1);
        if (orderColumn) query = query.order(orderColumn, { ascending: false });
        const { data, error } = await query;
        addCheck(table, !error, error?.message || `${data?.length || 0} row visible`);
      } catch (error) {
        addCheck(table, false, error.message);
      }
    }
    const failed = checks.some((line) => line.startsWith("FAIL"));
    const message = checks.join(" | ");
    setSupabaseStatus(message, failed ? "failed" : "synced");
    alert(`Supabase Health Check\n${checks.join("\n")}`);
  } catch (error) {
    setSupabaseStatus(`Supabase health check failed: ${error.message}`, "failed");
    alert(`Supabase health check failed: ${error.message}`);
  }
}

async function logoutSupabase() {
  const client = supabaseClient();
  if (client) await client.auth.signOut().catch(() => null);
  lockApp();
}

function isAdmin() {
  return currentUser.role === "admin";
}

function isManager() {
  return currentUser.role === "manager";
}

function isEmployee() {
  return currentUser.role === "employee";
}

function normalizePin(value) {
  const digitMap = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return String(value || "")
    .trim()
    .replace(/[০-৯٠-٩]/g, (digit) => digitMap[digit] || digit);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createAutoBackup() {
  const backups = getBackups();
  const now = new Date();
  const stamp = now.toISOString();
  const last = backups[0];

  if (last && Date.now() - new Date(last.createdAt).getTime() < 5 * 60 * 1000) {
    last.data = state;
    last.createdAt = stamp;
  } else {
    backups.unshift({ createdAt: stamp, data: JSON.parse(JSON.stringify(state)) });
  }

  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0, 15)));
  renderBackupStatus();
}

function getBackups() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
  } catch {
    return [];
  }
}

function setBackups(backups) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify((backups || []).slice(0, 15)));
}

function money(value) {
  return `৳${bn.format(Math.round(Number(value) || 0))}`;
}

function today() {
  return formatYmd(new Date());
}

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function monthStart(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

function monthEnd(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return formatYmd(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function dateRange(start, end) {
  const dates = [];
  const cursor = new Date(`${start}T00:00:00`);
  const stop = new Date(`${end}T00:00:00`);
  while (cursor <= stop) {
    dates.push(formatYmd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthKey(dateString) {
  return dateString.slice(0, 7);
}

function timeAgo(isoString) {
  const diff = Math.max(Date.now() - new Date(isoString).getTime(), 0);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

function labelFor(category) {
  return categoryLabels[category] || category;
}

function activeFixedTotal() {
  return sum(state.fixedExpenses.filter((item) => item.active), "amount");
}

function salaryEmployees() {
  const fromSalary = state.fixedExpenses
    .filter((item) => item.active && item.category === "salary")
    .map((item) => ({
      id: item.id,
      name: item.name.replace(/\s*বেতন\s*$/u, "").trim(),
      salary: Number(item.amount || 0),
    }));
  if (fromSalary.length) return fromSalary;
  return (state.employees || [])
    .filter((item) => item.active !== false)
    .map((item) => ({
      id: item.id,
      name: item.name,
      salary: Number(item.salary || 0),
    }));
}

function isPayrollOnlyAdminSalary(employeeOrName) {
  const name = typeof employeeOrName === "string" ? employeeOrName : employeeOrName?.name;
  return normalizeName(name).includes("সিফাত");
}

function isFormerEmployeeSalary(employeeOrName) {
  const name = typeof employeeOrName === "string" ? employeeOrName : employeeOrName?.name;
  const normalized = normalizeName(name);
  return normalized.includes("শুভ") || normalized.includes("shuvo") || normalized.includes("shuv");
}

function employees() {
  return salaryEmployees().filter((employee) => !isPayrollOnlyAdminSalary(employee) && !isFormerEmployeeSalary(employee));
}

function employeeProfileFor(employeeId) {
  let profile = state.employeeProfiles.find((item) => item.employeeId === employeeId);
  if (!profile) {
    profile = {
      id: crypto.randomUUID(),
      employeeId,
      shift: "morning",
      joinDate: "",
      phone: "",
      emergencyContact: "",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    state.employeeProfiles.push(profile);
  }
  return profile;
}

function employeePinFor(employeeId) {
  const access = state.employeeAccess.find((item) => item.employeeId === employeeId);
  return access?.pin ? "*".repeat(String(access.pin).length) : "Not set";
}

function employeeAccessRule(employeeOrName) {
  const name = typeof employeeOrName === "string" ? employeeOrName : employeeOrName?.name || employeeOrName?.employeeName;
  const normalized = normalizeName(name);
  return employeeAccessPins.find((rule) => rule.matches.some((match) => normalized.includes(match)));
}

function ensureEmployeeAccess() {
  const before = JSON.stringify(state.employeeAccess);
  const allowedEmployees = employees().filter(employeeAccessRule);
  const nextAccess = [];

  allowedEmployees.forEach((employee) => {
    const rule = employeeAccessRule(employee);
    const existing = state.employeeAccess.find(
      (access) => access.employeeId === employee.id || normalizeName(access.employeeName) === normalizeName(employee.name),
    );
    if (existing) {
      existing.employeeId = employee.id;
      existing.employeeName = employee.name;
      existing.pin = normalizePin(existing.pin) || rule.pin;
      existing.active = true;
      nextAccess.push(existing);
      return;
    }
    nextAccess.push({
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      pin: rule.pin,
      active: true,
    });
  });

  state.employeeAccess = nextAccess;
  return before !== JSON.stringify(state.employeeAccess);
}

function cleanupPayrollOnlyAdminData() {
  const payrollOnlyIds = salaryEmployees().filter(isPayrollOnlyAdminSalary).map((employee) => employee.id);
  if (!payrollOnlyIds.length) return false;
  let changed = false;
  const before = JSON.stringify({
    fixedExpenses: state.fixedExpenses,
    employeeAccess: state.employeeAccess,
    employeeProfiles: state.employeeProfiles,
    attendance: state.attendance,
    breaks: state.breaks,
    advances: state.advances,
    leaveRequests: state.leaveRequests,
    fridayWorkRequests: state.fridayWorkRequests,
    approvals: state.approvals,
  });

  state.fixedExpenses.forEach((item) => {
    if (item.category === "salary" && isPayrollOnlyAdminSalary(item.name)) {
      item.amount = 20000;
      item.active = true;
      item.note = "Admin salary only - no employee attendance/login data";
    }
  });
  state.employeeAccess = state.employeeAccess.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.employeeProfiles = state.employeeProfiles.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.attendance = state.attendance.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.breaks = state.breaks.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.advances = state.advances.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.leaveRequests = state.leaveRequests.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.fridayWorkRequests = state.fridayWorkRequests.filter((item) => !payrollOnlyIds.includes(item.employeeId));
  state.approvals = state.approvals.filter((item) => !payrollOnlyIds.includes(item.payload?.employeeId));

  changed =
    before !==
    JSON.stringify({
      fixedExpenses: state.fixedExpenses,
      employeeAccess: state.employeeAccess,
      employeeProfiles: state.employeeProfiles,
      attendance: state.attendance,
      breaks: state.breaks,
      advances: state.advances,
      leaveRequests: state.leaveRequests,
      fridayWorkRequests: state.fridayWorkRequests,
      approvals: state.approvals,
    });
  return changed;
}

function cleanupFormerEmployeeData() {
  const formerIds = salaryEmployees().filter(isFormerEmployeeSalary).map((employee) => employee.id);
  const before = JSON.stringify({
    fixedExpenses: state.fixedExpenses,
    employeeAccess: state.employeeAccess,
    employeeProfiles: state.employeeProfiles,
    attendance: state.attendance,
    breaks: state.breaks,
    advances: state.advances,
    leaveRequests: state.leaveRequests,
    fridayWorkRequests: state.fridayWorkRequests,
    approvals: state.approvals,
  });

  state.fixedExpenses = state.fixedExpenses.filter((item) => !(item.category === "salary" && isFormerEmployeeSalary(item.name)));
  state.employeeAccess = state.employeeAccess.filter(
    (item) => !formerIds.includes(item.employeeId) && !isFormerEmployeeSalary(item.employeeName),
  );
  state.employeeProfiles = state.employeeProfiles.filter((item) => !formerIds.includes(item.employeeId));
  state.attendance = state.attendance.filter((item) => !formerIds.includes(item.employeeId));
  state.breaks = state.breaks.filter((item) => !formerIds.includes(item.employeeId));
  state.advances = state.advances.filter((item) => !formerIds.includes(item.employeeId));
  state.leaveRequests = state.leaveRequests.filter((item) => !formerIds.includes(item.employeeId));
  state.fridayWorkRequests = state.fridayWorkRequests.filter((item) => !formerIds.includes(item.employeeId));
  state.approvals = state.approvals.filter(
    (item) => !formerIds.includes(item.payload?.employeeId) && !isFormerEmployeeSalary(item.payload?.employeeName),
  );

  return (
    before !==
    JSON.stringify({
      fixedExpenses: state.fixedExpenses,
      employeeAccess: state.employeeAccess,
      employeeProfiles: state.employeeProfiles,
      attendance: state.attendance,
      breaks: state.breaks,
      advances: state.advances,
      leaveRequests: state.leaveRequests,
      fridayWorkRequests: state.fridayWorkRequests,
      approvals: state.approvals,
    })
  );
}

function currentEmployeeId() {
  return currentUser.employeeId || "";
}

function employeeById(id) {
  return employees().find((employee) => employee.id === id);
}

function employeeName(id) {
  return employeeById(id)?.name || state.employeeAccess.find((item) => item.employeeId === id)?.employeeName || "Unknown employee";
}

function normalizeName(value) {
  return String(value || "")
    .replace(/\s*বেতন\s*$/u, "")
    .trim()
    .toLowerCase();
}

function employeeForAccess(access) {
  return (
    employeeById(access.employeeId) ||
    employees().find((employee) => normalizeName(employee.name) === normalizeName(access.employeeName))
  );
}

function officeLocation() {
  return state.settings.officeLocation || defaultState().settings.officeLocation;
}

function officeLocationReady() {
  const office = officeLocation();
  return Boolean(office.enabled && Number(office.latitude) && Number(office.longitude) && Number(office.radiusMeters));
}

function distanceMeters(from, to) {
  const earthRadius = 6371000;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("এই browser location support করে না।"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  });
}

async function verifyOfficeLocation() {
  const office = officeLocation();
  const position = await getCurrentPosition();
  const current = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  const distance = distanceMeters(current, {
    latitude: Number(office.latitude),
    longitude: Number(office.longitude),
  });
  return {
    latitude: current.latitude,
    longitude: current.longitude,
    accuracy: Math.round(position.coords.accuracy || 0),
    distance: Math.round(distance),
    allowed: distance <= Number(office.radiusMeters || 100),
  };
}

function shiftStart(shift) {
  return { morning: "09:00", evening: "15:00", night: "21:00" }[shift] || "09:00";
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isCheckInWindow(value) {
  const minutes = timeToMinutes(value);
  return minutes !== null && minutes >= timeToMinutes("09:45") && minutes <= timeToMinutes("10:10");
}

function isCheckoutAllowed(value) {
  const minutes = timeToMinutes(value);
  return minutes !== null && minutes >= timeToMinutes("19:00");
}

function attendanceApprovalReason(payload) {
  const fridayBlock = fridayAttendanceBlockReason(payload.date, payload.employeeId);
  if (fridayBlock) return fridayBlock;
  if (payload.checkIn && !isCheckInWindow(payload.checkIn)) {
    return `Check-in ${payload.checkIn} allowed window 09:45-10:10-এর বাইরে`;
  }
  if (payload.checkOut && !isCheckoutAllowed(payload.checkOut)) {
    return `Check-out ${payload.checkOut} সন্ধ্যা 7:00 PM-এর আগে`;
  }
  return "";
}

function isLate(shift, checkIn) {
  const start = timeToMinutes(shiftStart(shift));
  const actual = timeToMinutes(checkIn);
  return actual !== null && actual > start + 15;
}

function addNotification(type, message) {
  state.notifications.unshift({
    id: crypto.randomUUID(),
    type,
    phone: "01676182447",
    message,
    createdAt: new Date().toISOString(),
    sent: false,
  });
}

function logActivity(action, detail, target = "") {
  state.activityLogs = state.activityLogs || [];
  state.activityLogs.unshift({
    id: crypto.randomUUID(),
    action,
    detail,
    target,
    user: currentUser.name || "System",
    role: currentUser.role || "system",
    createdAt: new Date().toISOString(),
  });
  state.activityLogs = state.activityLogs.slice(0, 250);
}

function attendanceFor(date, employeeId) {
  return state.attendance.find((item) => item.date === date && item.employeeId === employeeId);
}

function breakLabel(type) {
  return breakLabels[type] || type;
}

function activeBreakFor(employeeId) {
  return state.breaks.find((item) => item.employeeId === employeeId && !item.endAt);
}

function breakDurationSeconds(item) {
  if (!item) return 0;
  if (item.durationSeconds !== undefined && item.endAt) return Number(item.durationSeconds || 0);
  const start = Date.parse(item.startAt);
  const end = item.endAt ? Date.parse(item.endAt) : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function breakLimitSeconds(type) {
  return Number(BREAK_LIMIT_MINUTES[type] || 0) * 60;
}

function isBreakOverLimit(item) {
  const limit = breakLimitSeconds(item?.type);
  return limit > 0 && breakDurationSeconds(item) > limit;
}

function isMissedBreak(item) {
  return item && !item.endAt && breakDurationSeconds(item) > MISSED_BREAK_SECONDS;
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatBreakMinutes(seconds) {
  const minutes = Math.round((Number(seconds) || 0) / 60);
  if (minutes < 60) return `${bn.format(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${bn.format(hours)}h ${bn.format(rest)}m` : `${bn.format(hours)}h`;
}

function breaksForDate(date, employeeIds = null) {
  return state.breaks.filter((item) => item.date === date && (!employeeIds || employeeIds.includes(item.employeeId)));
}

function breaksInRange(start, end, employeeIds = null) {
  return state.breaks.filter((item) => item.date >= start && item.date <= end && (!employeeIds || employeeIds.includes(item.employeeId)));
}

function breakTotals(items) {
  const totals = { prayer: 0, washroom: 0, lunch: 0, personal: 0, official: 0, total: 0, running: 0 };
  items.forEach((item) => {
    const duration = breakDurationSeconds(item);
    totals[item.type] = (totals[item.type] || 0) + duration;
    totals.total += duration;
    if (!item.endAt) totals.running += 1;
  });
  totals.count = items.length;
  return totals;
}

function visibleEmployeesForRole() {
  return isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
}

function employeeOptionsForRole(currentValue = "", includeAll = false) {
  const visible = visibleEmployeesForRole();
  const allOption = includeAll && !isEmployee() ? `<option value="">All Employees</option>` : "";
  const options = visible.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  return { visible, html: allOption + options, value: visible.some((employee) => employee.id === currentValue) ? currentValue : isEmployee() ? currentEmployeeId() : currentValue };
}

function isFriday(dateString) {
  return new Date(`${dateString}T00:00:00`).getDay() === 5;
}

function fridayWorkTypeLabel(type) {
  return {
    extra_salary: "Extra Salary",
    compensatory_leave: "Compensatory Leave",
  }[type] || type;
}

function approvedFridayWorkFor(date, employeeId) {
  return (state.fridayWorkRequests || []).find((item) => {
    return item.employeeId === employeeId && item.work_date === date && ["approved", "completed"].includes(item.status);
  });
}

function fridayWorkCompleted(request) {
  if (!request) return false;
  if (request.status === "completed") return true;
  const attendance = request.attendance_id
    ? state.attendance.find((item) => item.id === request.attendance_id)
    : attendanceFor(request.work_date, request.employeeId);
  return Boolean(attendance?.checkIn && attendance?.checkOut);
}

function fridayWorkPayForMonth(employee, month) {
  const dailySalary = employee.salary / PAYROLL_DAYS;
  const requests = (state.fridayWorkRequests || []).filter((item) => {
    return item.employeeId === employee.id && item.request_type === "extra_salary" && item.work_date?.startsWith(month) && fridayWorkCompleted(item);
  });
  return { count: requests.length, amount: dailySalary * requests.length };
}

function compensatoryLeaveEarned(employeeId) {
  return (state.fridayWorkRequests || []).filter((item) => {
    return item.employeeId === employeeId && item.request_type === "compensatory_leave" && item.compensatory_leave_added && ["approved", "completed"].includes(item.status);
  }).length;
}

function compensatoryLeaveUsed(employeeId) {
  return state.leaveRequests
    .filter((item) => item.employeeId === employeeId && item.status === "approved")
    .reduce((total, item) => total + leaveDates(item).filter((day) => day.type === "compensatory").length, 0);
}

function compensatoryLeavePending(employeeId) {
  return state.leaveRequests
    .filter((item) => item.employeeId === employeeId && item.status === "pending")
    .reduce((total, item) => total + leaveDates(item).filter((day) => day.type === "compensatory").length, 0);
}

function compensatoryLeaveBalance(employeeId) {
  return Math.max(compensatoryLeaveEarned(employeeId) - compensatoryLeaveUsed(employeeId) - compensatoryLeavePending(employeeId), 0);
}

function holidayForDate(date) {
  return (state.fixedHolidays || []).find((item) => item.date === date);
}

function leaveDates(leave) {
  if (Array.isArray(leave.breakdown) && leave.breakdown.length) return leave.breakdown;
  return dateRange(leave.start, leave.end).map((date) => ({
    date,
    type: leave.type === "personal" || leave.type === "study" || leave.type === "other" ? "casual" : leave.type,
  }));
}

function leaveDaysByType(employeeId, type, status) {
  return state.leaveRequests
    .filter((item) => item.employeeId === employeeId && item.status === status)
    .reduce((total, item) => total + leaveDates(item).filter((day) => day.type === type).length, 0);
}

function casualLeaveRemaining(employeeId) {
  return Math.max(LEAVE_POLICY.casual - leaveDaysByType(employeeId, "casual", "approved") - leaveDaysByType(employeeId, "casual", "pending"), 0);
}

function sickLeaveRemaining(employeeId) {
  return Math.max(LEAVE_POLICY.sick - leaveDaysByType(employeeId, "sick", "approved") - leaveDaysByType(employeeId, "sick", "pending"), 0);
}

function advanceLeaveRemaining(employeeId) {
  return Math.max(LEAVE_POLICY.advance - leaveDaysByType(employeeId, "advance_leave", "approved") - leaveDaysByType(employeeId, "advance_leave", "pending"), 0);
}

function isExamLeaveReason(reason) {
  return /exam|পরীক্ষা|test|পরিক্ষা/i.test(String(reason || ""));
}

function buildLeaveBreakdown(employeeId, requestedType, start, end, reason) {
  let casualLeft = casualLeaveRemaining(employeeId);
  let sickLeft = sickLeaveRemaining(employeeId);
  let advanceLeft = advanceLeaveRemaining(employeeId);
  const useCasualChain = requestedType === "casual" || isExamLeaveReason(reason);

  return dateRange(start, end).map((date) => {
    const holiday = holidayForDate(date);
    if (holiday) return { date, type: "fixed_holiday", label: holiday.name };
    if (requestedType === "compensatory") return { date, type: "compensatory" };
    if (requestedType === "lwp") return { date, type: "lwp" };
    if (requestedType === "sick") {
      if (sickLeft > 0) {
        sickLeft -= 1;
        return { date, type: "sick" };
      }
      return { date, type: "lwp" };
    }
    if (requestedType === "advance_leave") {
      if (advanceLeft > 0) {
        advanceLeft -= 1;
        return { date, type: "advance_leave" };
      }
      return { date, type: "lwp" };
    }
    if (useCasualChain) {
      if (casualLeft > 0) {
        casualLeft -= 1;
        return { date, type: "casual" };
      }
      if (advanceLeft > 0) {
        advanceLeft -= 1;
        return { date, type: "advance_leave" };
      }
      return { date, type: "lwp" };
    }
    return { date, type: "casual" };
  });
}

function leaveBreakdownSummary(leave) {
  const counts = leaveDates(leave).reduce((result, day) => {
    result[day.type] = (result[day.type] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts)
    .map(([type, count]) => `${leaveTypeLabel(type)}: ${bn.format(count)}d`)
    .join(", ");
}

function ensureHolidayAttendance() {
  const holidays = state.fixedHolidays || [];
  let changed = false;
  holidays.forEach((holiday) => {
    employees().forEach((employee) => {
      if (attendanceFor(holiday.date, employee.id)) return;
      state.attendance.push({
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employeeName: employee.name,
        date: holiday.date,
        status: "paid_holiday",
        shift: "morning",
        checkIn: "",
        checkOut: "",
        breakMinutes: 0,
        note: `Fixed Holiday: ${holiday.name}${holiday.note ? ` - ${holiday.note}` : ""}`,
        markedBy: "Admin",
        holidayId: holiday.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      changed = true;
    });
  });
  if (changed) saveState();
}

function payrollLockFor(month) {
  return state.payrollLocks.find((item) => item.month === month && item.locked);
}

function monthClosed(month) {
  return Boolean(payrollLockFor(month));
}

function lockedMonthMessage(month) {
  return `${month} মাস Monthly Closing করা আছে। edit করতে হলে আগে Payroll Unlock করুন।`;
}

function ensureMonthEditable(dateOrMonth) {
  const month = dateOrMonth.length === 7 ? dateOrMonth : monthKey(dateOrMonth);
  if (!monthClosed(month)) return true;
  alert(lockedMonthMessage(month));
  return false;
}

function salaryAdjustmentSign(type) {
  return ["penalty", "special_deduction"].includes(type) ? -1 : 1;
}

function salaryAdjustmentLabel(type) {
  return {
    bonus: "Bonus",
    allowance: "Allowance",
    overtime: "Overtime",
    penalty: "Penalty",
    special_deduction: "Special Deduction",
  }[type] || type;
}

function salaryAdjustmentsFor(employeeId, month) {
  return (state.salaryAdjustments || []).filter((item) => item.employeeId === employeeId && item.month === month);
}

function calculatePayrollForMonth(month) {
  const start = `${month}-01`;
  const end = monthEnd(start);
  const payrollRows = salaryEmployees().map((employee) => {
    const records = state.attendance.filter((item) => item.employeeId === employee.id && item.date >= start && item.date <= end);
    const present = records.filter((item) => item.status === "present").length;
    const leave = records.filter((item) => item.status === "leave").length;
    const paidLeave = records.filter((item) => item.status === "paid_leave" || item.status === "paid_holiday").length;
    const absent = records.filter((item) => item.status === "absent").length;
    const cutDays = leave + absent;
    const dailySalary = employee.salary / PAYROLL_DAYS;
    const deduction = dailySalary * cutDays;
    const fridayPay = fridayWorkPayForMonth(employee, month);
    const adjustments = salaryAdjustmentsFor(employee.id, month);
    const additions = sum(adjustments.filter((item) => salaryAdjustmentSign(item.type) > 0), "amount");
    const manualDeductions = sum(adjustments.filter((item) => salaryAdjustmentSign(item.type) < 0), "amount");
    const advance = sum(
      state.advances.filter((item) => item.status === "approved" && item.employeeId === employee.id && item.month === month),
      "amount",
    );

    return {
      ...employee,
      present,
      leave,
      paidLeave,
      absent,
      fridayWorkDays: fridayPay.count,
      weekendPay: fridayPay.amount,
      adjustments,
      additions,
      manualDeductions,
      cutDays,
      deduction,
      advance,
      totalDeduction: deduction + advance + manualDeductions,
      payable: employee.salary - deduction - advance - manualDeductions + fridayPay.amount + additions,
    };
  });

  return {
    rows: payrollRows,
    gross: sum(payrollRows, "salary"),
    deduction: sum(payrollRows, "totalDeduction"),
    payable: sum(payrollRows, "payable"),
    cutDays: sum(payrollRows, "cutDays"),
  };
}

function payrollForMonth(month) {
  const locked = payrollLockFor(month);
  if (locked?.snapshot) return locked.snapshot;
  return calculatePayrollForMonth(month);
}

function fixedForRange(start, end) {
  return dateRange(start, end).reduce((total, date) => total + activeFixedTotal() / getDaysInMonth(date), 0);
}

function entriesInRange(start, end) {
  return state.entries.filter((entry) => entry.date >= start && entry.date <= end && isEntryApproved(entry));
}

function isEntryApproved(entry) {
  return entry.status !== "pending" && entry.status !== "rejected";
}

function approvedEntry(entry) {
  return {
    ...entry,
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy: "Admin",
  };
}

function totalsForDate(dateString) {
  return totalsForRange(dateString, dateString);
}

function totalsForRange(start, end) {
  const entries = entriesInRange(start, end);
  const income = sum(entries.filter((entry) => entry.type === "income"), "amount");
  const variableExpense = sum(entries.filter((entry) => entry.type === "expense"), "amount");
  const boost = sum(entries.filter((entry) => entry.category === "dollar_boost"), "amount");
  const fixedTotal = fixedForRange(start, end);

  return {
    entries,
    income,
    variableExpense,
    boost,
    fixedTotal,
    expense: variableExpense + fixedTotal,
    net: income - variableExpense - fixedTotal,
  };
}

function totalsForMonth(dateString) {
  return totalsForRange(monthStart(dateString), monthEnd(dateString));
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
}

function render() {
  applyThemeMode();
  document.body.classList.toggle("beginner-mode", beginnerMode);
  ensureHolidayAttendance();
  const date = els.selectedDate.value;
  const day = totalsForDate(date);
  const month = totalsForMonth(date);

  setText("todayIncome", money(day.income));
  setText("todayExpense", money(day.expense));
  setText("dailyFixedShare", money(day.fixedTotal));
  setText("todayNet", money(day.net));
  setText("todayNetHint", day.net >= 0 ? "আজ লাভে আছেন" : "আজ লসে আছেন");
  setText("sidebarFixedTotal", money(activeFixedTotal()));
  setText("monthIncome", money(month.income));
  setText("monthBoost", money(month.boost));
  setText("monthFixed", money(activeFixedTotal()));
  setText("monthNet", money(month.net));
  setText("monthStatus", month.net >= 0 ? "মাসিক লাভ" : "মাসিক লস");
  setText("monthLabel", `${formatMonth(date)} সারাংশ`);
  renderCompactSummary(day);

  document.querySelector("#todayNet").className = day.net >= 0 ? "amount good" : "amount bad";
  document.querySelector("#monthNet").className = month.net >= 0 ? "amount good" : "amount bad";

  renderEntryCategories(els.entryType.value, els.entryCategory);
  renderEntryCategories(els.editType.value, els.editCategory);
  renderEntryCategories(els.bulkType.value, els.bulkCategory);
  renderTodayEntries(day.entries);
  renderRoleHome(day, month);
  renderDashboardAccessPanel();
  renderFriendlyGuide(day, month);
  renderSmartAlerts();
  renderNoticeBoard();
  renderEntriesTable();
  renderFixedList();
  renderCategories();
  renderManagers();
  renderApprovalsV2();
  renderRoleUi();
  renderAttendance();
  renderFridayWork();
  renderBreaks();
  renderTimeline();
  renderCorrectionForm();
  renderPayroll();
  renderEmployeeHome();
  renderPerformanceSnapshot();
  renderWorkLogs();
  renderPayrollReviewChecklist();
  renderAdvance();
  renderLeave();
  renderLeaveDecisionPreview();
  renderLeaveCalendar();
  renderHolidayCalendar();
  renderSalaryAdjustments();
  renderWarningReport();
  renderEmployeeAccess();
  renderEmployeeProfiles();
  renderNotifications();
  renderWhatsappTemplates();
  renderActivityLog();
  renderCloudSettings();
  renderSystemCheck();
  renderReports();
  renderMonthlyBreakReport();
  renderChart(date);
  renderBackupStatus();
  renderHealthCheck();
  renderGlobalSearchResults();
  renderPwaStatus();
  applyCompactMode();
  updateCloudSyncBar();

  if (window.lucide) lucide.createIcons();
}

function formatMonth(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
}

function renderRoleUi() {
  if (els.currentUserLabel) els.currentUserLabel.textContent = isAdmin() ? "Admin" : currentUser.name;
  document.body.dataset.role = currentUser.role;

  document.querySelectorAll(".nav-button").forEach((button) => {
    const view = button.dataset.view;
    const visible = canOpenView(view);
    button.hidden = !visible;
    button.style.display = visible ? "" : "none";
  });

  document.querySelectorAll(".mobile-nav-button").forEach((button) => {
    const view = button.dataset.mobileView;
    const visible = canOpenView(view);
    button.hidden = !visible;
    button.style.display = visible ? "flex" : "none";
    button.classList.toggle("active", document.querySelector(`#${view}View`)?.classList.contains("active"));
  });

  if (!isAdmin() && ["reportsView", "fixedView", "settingsView"].some((id) => document.querySelector(`#${id}`).classList.contains("active"))) {
    document.querySelector(isEmployee() ? '[data-view="attendance"]' : '[data-view="dashboard"]').click();
  }

  if (isEmployee() && !["attendanceView", "advanceView"].some((id) => document.querySelector(`#${id}`).classList.contains("active"))) {
    document.querySelector('[data-view="attendance"]').click();
  }

  document.querySelectorAll("#entryForm, #attendanceForm, #advanceForm, #fixedForm, #pinForm, #managerForm, #employeeAccessForm").forEach((form) => {
    form.style.display = "";
  });

  [els.attendanceCheckIn, els.attendanceCheckOut].forEach((input) => {
    if (input) input.readOnly = isEmployee();
  });

  [els.attendanceStatus, els.attendanceShift, els.attendanceBreak].forEach((field) => {
    const label = field?.closest("label");
    if (label) label.style.display = isEmployee() ? "none" : "";
  });

  const attendanceSubmit = els.attendanceForm?.querySelector('button[type="submit"]');
  if (attendanceSubmit) attendanceSubmit.style.display = isEmployee() ? "none" : "";
}

function renderEntryCategories(type, select) {
  const current = select.value;
  select.innerHTML = state.categories[type]
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(labelFor(category))}</option>`)
    .join("");
  if (state.categories[type].includes(current)) select.value = current;
}

function renderTodayEntries(entries) {
  if (!entries.length) {
    els.todayEntries.innerHTML = `<div class="empty">এই তারিখে এখনো কোনো আয় বা খরচ যোগ করা হয়নি।</div>`;
    return;
  }

  els.todayEntries.innerHTML = entries
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(
      (entry) => `
        <article class="entry-item">
          <div class="item-line">
            <strong>${escapeHtml(labelFor(entry.category))}</strong>
            <span class="amount ${entry.type === "income" ? "good" : "bad"}">${entry.type === "income" ? "+" : "-"}${money(entry.amount)}</span>
          </div>
          <small class="muted">${escapeHtml(entry.note || "নোট নেই")}</small>
        </article>
      `,
    )
    .join("");
}

function renderEntriesTable() {
  const start = els.dailyStart.value || "0000-01-01";
  const end = els.dailyEnd.value || "9999-12-31";
  const filtered = entriesInRange(start, end);
  setText("entryTableHint", `${start} থেকে ${end} পর্যন্ত ${bn.format(filtered.length)}টি এন্ট্রি`);

  const rows = filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.date)}</td>
          <td><span class="type-pill">${entry.type === "income" ? "আয়" : "খরচ"}</span></td>
          <td>${escapeHtml(labelFor(entry.category))}</td>
          <td class="amount ${entry.type === "income" ? "good" : "bad"}">${money(entry.amount)}</td>
          <td>${escapeHtml(entry.note || "-")}</td>
          <td>
            <div class="action-row">
              <button class="small-action" data-edit-entry="${entry.id}" type="button">${isAdmin() ? "এডিট" : "এডিট রিকুয়েস্ট"}</button>
              <button class="small-action danger" data-delete-entry="${entry.id}" type="button">${isAdmin() ? "ডিলিট" : "ডিলিট রিকুয়েস্ট"}</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");

  els.entriesTable.innerHTML = rows || `<tr><td colspan="6" class="empty">এই রেঞ্জে কোনো এন্ট্রি নেই।</td></tr>`;
}

function renderFixedList() {
  els.fixedList.innerHTML = state.fixedExpenses
    .map(
      (item) => `
        <article class="fixed-item">
          <div class="item-line">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="amount">${money(item.amount)}</span>
          </div>
          <div class="item-line">
            <small class="muted">${escapeHtml(labelFor(item.category))} · ${escapeHtml(item.note || "নোট নেই")}</small>
            <span class="status-pill">${item.active ? "সক্রিয়" : "inactive"}</span>
          </div>
          <div class="action-row">
            <button class="small-action" data-edit-fixed="${item.id}" type="button">এডিট</button>
            <button class="small-action" data-toggle-fixed="${item.id}" type="button">${item.active ? "Inactive" : "Active"}</button>
            <button class="small-action danger" data-delete-fixed="${item.id}" type="button">ডিলিট</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderManagers() {
  if (!els.managerList) return;
  if (supabaseEnabled()) {
    els.managerList.innerHTML = `
      <article class="fixed-item">
        <div class="item-line">
          <strong>Supabase Auth Active</strong>
          <span class="status-pill">Secure</span>
        </div>
        <small class="muted">Manager password dashboard-e set hobe na. Supabase Auth Users/reset password diye manage korun.</small>
      </article>
    `;
    return;
  }
  els.managerList.innerHTML =
    state.managers
      .map(
        (manager) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(manager.name)}</strong>
              <span class="status-pill">${manager.active ? "Active" : "Inactive"}</span>
            </div>
            <small class="muted">PIN: ${"*".repeat(String(manager.pin).length)}</small>
            <div class="action-row">
              <button class="small-action" data-toggle-manager="${manager.id}" type="button">${manager.active ? "Inactive" : "Active"}</button>
              <button class="small-action danger" data-delete-manager="${manager.id}" type="button">ডিলিট</button>
            </div>
          </article>
        `,
      )
      .join("") || `<div class="empty">Manager access নেই।</div>`;
}

function renderApprovals() {
  if (!els.approvalList) return;
  const pending = state.approvals.filter((request) => request.status === "pending");
  renderPendingApprovalBadge(pending.length);
  els.approvalList.innerHTML =
    pending
      .map(
        (request) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(requestTitle(request))}</strong>
              <span class="status-pill">${escapeHtml(requestCategory(request))}</span>
            </div>
            <small class="muted">${new Date(request.createdAt).toLocaleString("bn-BD")} · ${escapeHtml(requestDescription(request))}</small>
            ${approvalTimelineHtml(request)}
            <div class="action-row">
              <button class="small-action" data-approve-request="${request.id}" type="button">Approve</button>
              <button class="small-action danger" data-reject-request="${request.id}" type="button">Reject</button>
            </div>
          </article>
        `,
      )
      .join("") || `<div class="empty">কোনো pending request নেই।</div>`;
}

function approvalGroup(request) {
  if (["attendance_punch", "correction_request", "leave_request"].includes(request.action)) return "attendance";
  if (["add_entry", "bulk_entries", "edit_entry", "delete_entry"].includes(request.action)) return "finance";
  if (["add_fixed", "edit_fixed", "delete_fixed", "toggle_fixed", "save_fixed"].includes(request.action)) return "fixed";
  return "other";
}

function approvalFilterMatches(request) {
  if (approvalFilter === "all") return true;
  if (approvalFilter === "pending") return request.status === "pending";
  if (approvalFilter === "completed") return request.status !== "pending";
  return approvalGroup(request) === approvalFilter;
}

function selectedApprovalIds() {
  return Array.from(document.querySelectorAll("[data-approval-select]:checked")).map((input) => input.dataset.approvalSelect);
}

function renderApprovalsV2() {
  if (!els.approvalList) return;
  const pending = state.approvals.filter((request) => request.status === "pending");
  renderPendingApprovalBadge(pending.length);
  if (els.approvalTabs) {
    els.approvalTabs.querySelectorAll("[data-approval-filter]").forEach((button) => {
      button.classList.toggle("active", button.dataset.approvalFilter === approvalFilter);
    });
  }
  const visible = state.approvals.filter(approvalFilterMatches);
  const bulkVisible = visible.filter((request) => request.status === "pending");
  if (els.bulkApproveBtn) els.bulkApproveBtn.disabled = !bulkVisible.length || !isAdmin();
  if (els.bulkRejectBtn) els.bulkRejectBtn.disabled = !bulkVisible.length || !isAdmin();
  els.approvalList.innerHTML =
    visible
      .map(
        (request) => `
          <article class="fixed-item approval-card ${escapeHtml(request.status)}">
            <div class="item-line">
              <label class="check-line approval-check">
                ${request.status === "pending" && isAdmin() ? `<input type="checkbox" data-approval-select="${request.id}" checked />` : ""}
                <strong>${escapeHtml(requestTitle(request))}</strong>
              </label>
              <span class="status-pill">${escapeHtml(request.status)} · ${escapeHtml(requestCategory(request))}</span>
            </div>
            <small class="muted">${formatDateTime(request.createdAt)} · ${escapeHtml(requestDescription(request))}</small>
            ${approvalTimelineHtml(request)}
            ${
              request.status === "pending" && isAdmin()
                ? `<div class="action-row">
                    <button class="small-action" data-approval-detail="${request.id}" type="button">Details</button>
                    <button class="small-action" data-approve-request="${request.id}" type="button">Approve</button>
                    <button class="small-action danger" data-reject-request="${request.id}" type="button">Reject</button>
                  </div>`
                : `<small class="muted">Reviewed by ${escapeHtml(request.reviewedBy || "-")} · ${escapeHtml(formatDateTime(request.reviewedAt))}</small>`
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">No approval request found for this filter.</div>`;
}

function bulkReviewApprovals(approved) {
  if (!isAdmin()) return;
  const ids = selectedApprovalIds();
  if (!ids.length) return;
  if (!confirm(`${approved ? "Approve" : "Reject"} ${ids.length} selected request?`)) return;
  ids.forEach((id) => applyApproval(id, approved, { silent: true }));
  saveState();
  render();
}

function openApprovalDetail(id) {
  const request = state.approvals.find((item) => item.id === id);
  if (!request || !els.approvalDetailModal || !els.approvalDetailBody) return;
  const payload = request.payload || {};
  const impact = {
    add_entry: "Approved হলে income/expense dashboard-এ যোগ হবে।",
    bulk_entries: "Approved হলে range ধরে একাধিক entry যোগ হবে।",
    edit_entry: "Approved হলে পুরোনো entry update হবে।",
    delete_entry: "Approved হলে selected entry delete হবে।",
    attendance_punch: "Approved হলে attendance save হবে এবং payroll effect পড়বে।",
    correction_request: "Approved হলে attendance/break correction apply হবে।",
    leave_request: "Approved হলে leave balance/payroll update হবে।",
    save_fixed: "Approved হলে fixed cost update হবে।",
    toggle_fixed: "Approved হলে fixed cost active/inactive হবে।",
    delete_fixed: "Approved হলে fixed cost delete হবে।",
  }[request.action] || "Approved হলে related data update হবে।";
  els.approvalDetailBody.innerHTML = `
    <article class="fixed-item approval-card ${escapeHtml(request.status)}">
      <div class="item-line">
        <strong>${escapeHtml(requestTitle(request))}</strong>
        <span class="status-pill">${escapeHtml(request.status)} · ${escapeHtml(requestCategory(request))}</span>
      </div>
      <small class="muted">Created: ${formatDateTime(request.createdAt)} · Reviewed: ${escapeHtml(request.reviewedAt ? formatDateTime(request.reviewedAt) : "Pending")}</small>
      ${approvalTimelineHtml(request)}
    </article>
    <article class="fixed-item">
      <strong>Request Impact</strong>
      <small>${escapeHtml(impact)}</small>
    </article>
    <article class="fixed-item">
      <strong>Payload</strong>
      <pre class="detail-pre">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    </article>
    ${
      request.status === "pending" && isAdmin()
        ? `<div class="button-row">
            <button class="secondary-button" data-approve-request="${request.id}" type="button">Approve</button>
            <button class="secondary-button danger" data-reject-request="${request.id}" type="button">Reject</button>
          </div>`
        : ""
    }
  `;
  els.approvalDetailModal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeApprovalDetail() {
  els.approvalDetailModal?.classList.add("hidden");
}

function requestCategory(request) {
  return {
    attendance_punch: "হাজিরা ও বেতন",
    correction_request: "হাজিরা ও বেতন",
    leave_request: "হাজিরা ও বেতন",
    edit_entry: "দৈনিক হিসাব",
    delete_entry: "দৈনিক হিসাব",
    add_fixed: "ফিক্সড খরচ",
    edit_fixed: "ফিক্সড খরচ",
    delete_fixed: "ফিক্সড খরচ",
    toggle_fixed: "ফিক্সড খরচ",
  }[request.action] || "অন্যান্য";
}

function renderPendingApprovalBadge(count = state.approvals.filter((request) => request.status === "pending").length) {
  if (!els.pendingApprovalBadge) return;
  const fridayPending = (state.fridayWorkRequests || []).filter((request) => request.status === "pending").length;
  const total = count + fridayPending;
  els.pendingApprovalBadge.innerHTML = `<i data-lucide="bell"></i> ${bn.format(total)}`;
  els.pendingApprovalBadge.title = `${bn.format(total)} pending approval request`;
}

function pendingApprovalTotal() {
  return state.approvals.filter((request) => request.status === "pending").length + (state.fridayWorkRequests || []).filter((request) => request.status === "pending").length;
}

function attendanceWarningTotal(date = today()) {
  const missingCheckout = employees().filter((employee) => {
    const record = attendanceFor(date, employee.id);
    return record?.checkIn && !record?.checkOut;
  }).length;
  const runningBreaks = breaksForDate(date).filter((item) => !item.endAt).length;
  return missingCheckout + runningBreaks;
}

function renderCompactSummary(day = totalsForDate(els.selectedDate?.value || today())) {
  if (!els.compactIncome) return;
  els.compactIncome.textContent = money(day.income);
  els.compactExpense.textContent = money(day.expense);
  els.compactPending.textContent = bn.format(pendingApprovalTotal());
  els.compactWarnings.textContent = bn.format(attendanceWarningTotal(els.selectedDate?.value || today()));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("bn-BD");
}

function approvalTimelineHtml(request) {
  const steps = [
    { label: "Requested", value: formatDateTime(request.createdAt), done: true },
    { label: "Waiting", value: request.status === "pending" ? "Pending approval" : "Completed", done: request.status !== "pending" },
    { label: "Reviewed", value: request.reviewedAt ? formatDateTime(request.reviewedAt) : "Not reviewed yet", done: Boolean(request.reviewedAt) },
  ];
  return `
    <div class="approval-timeline">
      ${steps
        .map(
          (step) => `
            <span class="${step.done ? "done" : ""}">
              <i></i>
              <strong>${escapeHtml(step.label)}</strong>
              <small>${escapeHtml(step.value)}</small>
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function dailySummaryMessage(date = els.selectedDate?.value || today()) {
  const day = totalsForDate(date);
  const warnings = attendanceWarningTotal(date);
  const pending = pendingApprovalTotal();
  const activeBreaks = breaksForDate(date)
    .filter((item) => !item.endAt)
    .map((item) => `${employeeName(item.employeeId)}: ${breakLabel(item.type)}`)
    .slice(0, 5);
  return [
    `Minus Style Daily Summary`,
    `Date: ${date}`,
    `Income: ${money(day.income)}`,
    `Expense: ${money(day.expense)}`,
    `Net: ${money(day.net)}`,
    `Pending approval: ${bn.format(pending)}`,
    `Attendance warning: ${bn.format(warnings)}`,
    activeBreaks.length ? `Running break: ${activeBreaks.join(", ")}` : `Running break: none`,
  ].join("\n");
}

function openDailyWhatsappSummary() {
  const phone = "8801676182447";
  const message = dailySummaryMessage();
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

function searchItems() {
  const items = [];
  employees().forEach((employee) => {
    items.push({ title: employee.name, detail: `Salary ${money(employee.salary)}`, view: "attendance", type: "Employee" });
  });
  state.entries.forEach((entry) => {
    items.push({ title: labelFor(entry.category), detail: `${entry.date} · ${entry.type} · ${money(entry.amount)} · ${entry.note || ""}`, view: "daily", type: "Entry" });
  });
  state.fixedExpenses.forEach((item) => {
    items.push({ title: item.name, detail: `${labelFor(item.category)} · ${money(item.amount)} · ${item.active ? "active" : "inactive"}`, view: "fixed", type: "Fixed" });
  });
  state.approvals.forEach((item) => {
    items.push({ title: requestTitle(item), detail: `${requestCategory(item)} · ${item.status} · ${requestDescription(item)}`, view: "settings", type: "Approval" });
  });
  (state.fridayWorkRequests || []).forEach((item) => {
    items.push({ title: `Friday Work · ${employeeName(item.employeeId)}`, detail: `${item.work_date || item.workDate} · ${item.request_type || item.requestType} · ${item.status}`, view: "attendance", type: "Friday" });
  });
  state.leaveRequests.forEach((item) => {
    items.push({ title: `Leave · ${employeeName(item.employeeId)}`, detail: `${item.startDate} to ${item.endDate} · ${item.type} · ${item.status}`, view: "advance", type: "Leave" });
  });
  state.advances.forEach((item) => {
    items.push({ title: `Advance · ${employeeName(item.employeeId)}`, detail: `${item.month} · ${money(item.amount)} · ${item.status}`, view: "advance", type: "Advance" });
  });
  return items;
}

function renderGlobalSearchResults() {
  if (!els.globalSearchInput || !els.globalSearchResults) return;
  const query = els.globalSearchInput.value.trim().toLowerCase();
  if (!query) {
    els.globalSearchResults.hidden = true;
    els.globalSearchResults.innerHTML = "";
    return;
  }
  const results = searchItems()
    .filter((item) => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(query) && canOpenView(item.view))
    .slice(0, 8);
  els.globalSearchResults.hidden = false;
  els.globalSearchResults.innerHTML =
    results
      .map(
        (item) => `
          <button type="button" data-search-view="${escapeHtml(item.view)}">
            <span>${escapeHtml(item.type)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.detail)}</small>
          </button>
        `,
      )
      .join("") || `<div class="empty">No result found</div>`;
}

function smartAlerts() {
  const date = els.selectedDate?.value || today();
  const alerts = [];
  const pending = pendingApprovalTotal();
  if (pending) alerts.push({ level: "danger", title: "Pending Approval", detail: `${bn.format(pending)} request admin decision দরকার`, view: "settings" });

  employees().forEach((employee) => {
    const record = attendanceFor(date, employee.id);
    if (record?.checkIn && !record?.checkOut) {
      alerts.push({ level: "warning", title: "Missing Checkout", detail: `${employee.name} check-in করেছেন, checkout নেই`, view: "attendance" });
    }
  });

  breaksForDate(date)
    .filter((item) => !item.endAt)
    .forEach((item) => {
      const minutes = Math.floor(breakDurationSeconds(item) / 60);
      const limit = BREAK_LIMIT_MINUTES[item.type] || 60;
      alerts.push({
        level: minutes > limit ? "danger" : "info",
        title: minutes > limit ? "Long Running Break" : "Running Break",
        detail: `${employeeName(item.employeeId)} ${breakLabel(item.type)} ${formatBreakMinutes(breakDurationSeconds(item))}`,
        view: "attendance",
      });
    });

  const month = els.payrollMonth?.value || today().slice(0, 7);
  payrollForMonth(month).rows.forEach((row) => {
    if (row.payable < row.salary * 0.6) {
      alerts.push({ level: "warning", title: "Salary Warning", detail: `${row.name} payable salary কম: ${money(row.payable)}`, view: "attendance" });
    }
  });

  if (lastCloudSyncFailed) alerts.push({ level: "danger", title: "Cloud Sync Failed", detail: "শেষ cloud sync failed হয়েছে। Settings থেকে sync check করুন।", view: "settings" });
  if (!alerts.length) alerts.push({ level: "good", title: "All Clear", detail: "আজ কোনো priority alert নেই।", view: "dashboard" });
  return alerts;
}

function renderSmartAlerts() {
  if (!els.smartAlertList) return;
  const alerts = smartAlerts();
  const activeCount = alerts.filter((item) => item.level !== "good").length;
  els.smartAlertCount.textContent = `${bn.format(activeCount)} alert`;
  els.smartAlertList.innerHTML = alerts
    .slice(0, 8)
    .map(
      (item) => `
        <article class="fixed-item smart-alert ${escapeHtml(item.level)}">
          <div class="item-line">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="status-pill">${escapeHtml(item.level)}</span>
          </div>
          <small class="muted">${escapeHtml(item.detail)}</small>
          <div class="action-row">
            <button class="small-action" data-alert-target="${escapeHtml(smartAlertTarget(item))}" type="button">Open</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function smartAlertTarget(item) {
  const title = String(item?.title || "").toLowerCase();
  if (title.includes("approval")) return "approvalList";
  if (title.includes("checkout") || title.includes("attendance")) return "attendanceTable";
  if (title.includes("break")) return "breakTable";
  if (title.includes("salary") || title.includes("payroll")) return "payrollTable";
  if (title.includes("cloud")) return "cloudSyncBar";
  return "dashboardView";
}

function openSmartAlertTarget(targetId) {
  const viewMap = {
    approvalList: "approvals",
    attendanceTable: "attendance",
    breakTable: "attendance",
    payrollTable: "attendance",
    cloudSyncBar: "settings",
    dashboardView: "dashboard",
  };
  const view = viewMap[targetId] || "dashboard";
  const nav = document.querySelector(`.nav-button[data-view="${view}"]`);
  if (nav && !nav.hidden) nav.click();
  requestAnimationFrame(() => {
    const target = document.querySelector(`#${CSS.escape(targetId || "dashboardView")}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("focus-pulse");
      setTimeout(() => target.classList.remove("focus-pulse"), 1600);
    }
  });
}

function noticeVisibleForRole(notice) {
  if (isAdmin()) return true;
  if (notice.audience === "managers") return isManager();
  if (notice.audience === "employees") return isEmployee();
  return isManager() || isEmployee();
}

function renderNoticeBoard() {
  if (!els.noticeList) return;
  if (els.noticeForm) els.noticeForm.hidden = !isAdmin();
  if (els.noticeDate && !els.noticeDate.value) els.noticeDate.value = today();

  const notices = (state.notices || [])
    .filter(noticeVisibleForRole)
    .sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")));
  const activeCount = notices.length;
  if (els.noticeCount) els.noticeCount.textContent = `${bn.format(activeCount)} notice`;

  els.noticeList.innerHTML =
    notices
      .slice(0, isEmployee() ? 5 : 12)
      .map(
        (notice) => `
          <article class="fixed-item notice-card">
            <div class="item-line">
              <strong>${escapeHtml(notice.title || "Notice")}</strong>
              <span class="status-pill">${escapeHtml(notice.audience || "all")}</span>
            </div>
            <small class="muted">${escapeHtml(notice.date || "-")} · ${escapeHtml(notice.body || "")}</small>
            ${
              isAdmin()
                ? `<div class="action-row"><button class="small-action danger" data-delete-notice="${notice.id}" type="button">Delete</button></div>`
                : ""
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">No active notice.</div>`;
}

function saveNotice(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  state.notices = state.notices || [];
  state.notices.unshift({
    id: crypto.randomUUID(),
    title: els.noticeTitle.value.trim(),
    body: els.noticeBody.value.trim(),
    date: els.noticeDate.value || today(),
    audience: els.noticeAudience.value || "all",
    createdAt: new Date().toISOString(),
    createdBy: currentUser.name || "Admin",
  });
  logActivity("Notice", `Notice published: ${els.noticeTitle.value.trim()}`, "notice");
  els.noticeForm.reset();
  if (els.noticeDate) els.noticeDate.value = today();
  saveState();
  render();
}

function deleteNotice(id) {
  if (!isAdmin()) return;
  state.notices = (state.notices || []).filter((notice) => notice.id !== id);
  logActivity("Notice Delete", "Notice deleted", "notice");
  saveState();
  render();
}

function renderWorkLogs() {
  if (!els.workLogList) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  const selected = els.workLogEmployee?.value || currentEmployeeId() || visibleEmployees[0]?.id || "";

  if (els.workLogEmployee) {
    els.workLogEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
    els.workLogEmployee.disabled = isEmployee();
    if (visibleEmployees.some((employee) => employee.id === selected)) els.workLogEmployee.value = selected;
  }
  if (els.workLogDate && !els.workLogDate.value) els.workLogDate.value = today();

  const filterDate = els.workLogDate?.value || today();
  const filterEmployee = isEmployee() ? currentEmployeeId() : els.workLogEmployee?.value;
  const logs = (state.workLogs || [])
    .filter((log) => !isEmployee() || log.employeeId === currentEmployeeId())
    .filter((log) => !filterDate || log.date === filterDate || (!isEmployee() && !filterEmployee))
    .filter((log) => isEmployee() || !filterEmployee || log.employeeId === filterEmployee)
    .sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")));

  if (els.workLogCount) els.workLogCount.textContent = `${bn.format(logs.length)} log`;
  els.workLogList.innerHTML =
    logs
      .slice(0, 20)
      .map(
        (log) => `
          <article class="fixed-item work-log-card">
            <div class="item-line">
              <strong>${escapeHtml(log.title || "Work Log")}</strong>
              <span class="status-pill">${escapeHtml(log.date || "-")}</span>
            </div>
            <small class="muted">${escapeHtml(log.employeeName || employeeName(log.employeeId))} · ${escapeHtml(log.note || "No details")}</small>
            ${
              isAdmin() || isManager()
                ? `<div class="action-row"><button class="small-action danger" data-delete-work-log="${log.id}" type="button">Delete</button></div>`
                : ""
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">No work log found.</div>`;
}

function saveWorkLog(event) {
  event.preventDefault();
  const employeeId = isEmployee() ? currentEmployeeId() : els.workLogEmployee.value;
  const employee = employeeById(employeeId);
  if (!employee) return;
  state.workLogs = state.workLogs || [];
  state.workLogs.unshift({
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    date: els.workLogDate.value || today(),
    title: els.workLogTitle.value.trim(),
    note: els.workLogNote.value.trim(),
    createdAt: new Date().toISOString(),
    createdBy: currentUser.name || employee.name,
  });
  logActivity("Work Log", `${employee.name} work log saved`, employee.id);
  els.workLogTitle.value = "";
  els.workLogNote.value = "";
  saveState();
  render();
}

function deleteWorkLog(id) {
  if (!isAdmin() && !isManager()) return;
  state.workLogs = (state.workLogs || []).filter((log) => log.id !== id);
  logActivity("Work Log Delete", "Work log deleted", id);
  saveState();
  render();
}

function roleHomeCards(day, month) {
  const payroll = payrollForMonth(els.payrollMonth?.value || today().slice(0, 7));
  if (isEmployee()) {
    const employee = employeeById(currentEmployeeId());
    const record = employee ? attendanceFor(today(), employee.id) : null;
    const row = payroll.rows.find((item) => item.id === currentEmployeeId());
    return {
      title: `${employee?.name || "Employee"} Dashboard`,
      subtitle: "নিজের attendance, salary, leave ও request summary",
      badge: "Employee",
      cards: [
        { label: "Check In", value: record?.checkIn || "-", hint: "আজকের check-in", view: "attendance" },
        { label: "Check Out", value: record?.checkOut || "-", hint: "আজকের check-out", view: "attendance" },
        { label: "Payable", value: money(row?.payable || 0), hint: "এই মাসে পাবেন", view: "advance" },
        { label: "Pending", value: bn.format(state.approvals.filter((item) => item.payload?.employeeId === currentEmployeeId() && item.status === "pending").length), hint: "আপনার request", view: "advance" },
      ],
    };
  }
  if (isManager()) {
    return {
      title: "Manager Control Room",
      subtitle: "Attendance, break ও employee request দ্রুত দেখুন",
      badge: "Manager",
      cards: [
        { label: "Attendance Warning", value: bn.format(attendanceWarningTotal(today())), hint: "আজকের issue", view: "attendance" },
        { label: "Pending Approval", value: bn.format(pendingApprovalTotal()), hint: "Admin decision দরকার", view: "dashboard" },
        { label: "Running Break", value: bn.format(breaksForDate(today()).filter((item) => !item.endAt).length), hint: "এখন break চলছে", view: "attendance" },
        { label: "Today Net", value: money(day.net), hint: "দৈনিক result", view: "dashboard" },
      ],
    };
  }
  return {
    title: "Admin Command Center",
    subtitle: "Finance, approval, payroll ও alert এক জায়গায়",
    badge: "Admin",
    cards: [
      { label: "Today Net", value: money(day.net), hint: day.net >= 0 ? "আজ লাভ" : "আজ লস", view: "dashboard" },
      { label: "Pending Approval", value: bn.format(pendingApprovalTotal()), hint: "সব approval request", view: "settings" },
      { label: "Monthly Payable", value: money(payroll.payable), hint: "Payroll payable", view: "attendance" },
      { label: "Smart Alerts", value: bn.format(smartAlerts().filter((item) => item.level !== "good").length), hint: "Priority issue", view: "dashboard" },
    ],
  };
}

function renderRoleHome(day = totalsForDate(today()), month = totalsForMonth(today())) {
  if (!els.roleHomeGrid) return;
  const model = roleHomeCards(day, month);
  els.roleHomeTitle.textContent = model.title;
  els.roleHomeSubtitle.textContent = model.subtitle;
  els.roleHomeBadge.textContent = model.badge;
  els.roleHomeGrid.innerHTML = model.cards
    .map(
      (card) => `
        <button class="role-home-card" data-search-view="dashboard" type="button">
          <small>${escapeHtml(card.label)}</small>
          <strong>${escapeHtml(card.value)}</strong>
          <span>${escapeHtml(card.hint)}</span>
        </button>
      `,
    )
    .join("");
}

function maskedPin(pin) {
  const value = String(pin || "");
  return value ? "*".repeat(Math.max(4, value.length)) : "Not set";
}

function renderDashboardAccessPanel() {
  if (!els.roleAccessPanel) return;
  els.roleAccessPanel.hidden = !isAdmin();
  if (!isAdmin()) return;

  if (els.dashboardAdminEmail) {
    els.dashboardAdminEmail.value = state.settings.adminEmail || "";
  }

  const supabaseMode = supabaseEnabled();
  [els.dashboardManagerPin, els.dashboardEmployeeAccessPin].forEach((input) => {
    if (!input) return;
    input.required = !supabaseMode;
    input.placeholder = supabaseMode ? "Supabase Auth password এখানে set হবে না" : input.placeholder;
  });
  if (els.dashboardAdminPin) {
    els.dashboardAdminPin.placeholder = supabaseMode ? "Local fallback admin password" : "New admin password";
  }
  const hideSupabasePasswordInput = (input) => {
    if (!input) return;
    input.required = false;
    input.disabled = supabaseMode;
    input.hidden = supabaseMode;
    if (supabaseMode) input.value = "";
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) label.hidden = supabaseMode;
  };
  [els.dashboardAdminPin, els.dashboardManagerPin, els.dashboardEmployeeAccessPin].forEach(hideSupabasePasswordInput);
  const adminSaveButton = els.dashboardAdminPinForm?.querySelector("button[type='submit']");
  if (adminSaveButton) adminSaveButton.hidden = supabaseMode;
  const managerSaveButton = els.dashboardManagerForm?.querySelector("button[type='submit']");
  if (managerSaveButton) {
    managerSaveButton.innerHTML = supabaseMode
      ? `<i data-lucide="link"></i> Manager Email Link Save`
      : `<i data-lucide="user-cog"></i> Manager Save`;
  }
  const employeeSaveButton = els.dashboardEmployeeAccessForm?.querySelector("button[type='submit']");
  if (employeeSaveButton) {
    employeeSaveButton.innerHTML = supabaseMode
      ? `<i data-lucide="link"></i> Employee Email Link Save`
      : `<i data-lucide="badge-check"></i> Employee Save`;
  }

  if (els.dashboardEmployeeAccessEmployee) {
    const selected = els.dashboardEmployeeAccessEmployee.value;
    const employeeOptions = employees();
    els.dashboardEmployeeAccessEmployee.innerHTML = employeeOptions.length
      ? employeeOptions.map((employee) => `<option value="${escapeHtml(employee.id)}">${escapeHtml(employee.name)}</option>`).join("")
      : `<option value="">Employee list empty - Supabase থেকে আনুন</option>`;
    els.dashboardEmployeeAccessEmployee.disabled = !employeeOptions.length;
    if (selected && employeeOptions.some((employee) => employee.id === selected)) {
      els.dashboardEmployeeAccessEmployee.value = selected;
    }
  }

  if (!els.dashboardAccessList) return;
  {
    const accessStatus = (email, active = true) => {
      if (!active) return "Inactive";
      if (!supabaseMode) return "Active";
      return normalizeEmail(email) ? "Email linked" : "Email missing";
    };
    const accessMeta = (email, pin) => {
      const cleanEmail = escapeHtml(email || "Not set");
      if (supabaseMode) return `Email: ${cleanEmail} · Auth: Supabase`;
      return `Email: ${cleanEmail} · Password: ${escapeHtml(maskedPin(pin))}`;
    };
    const managerRows = state.managers
      .map(
        (manager) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(manager.name)}</strong>
              <span class="status-pill">${accessStatus(manager.email, manager.active)}</span>
            </div>
            <small>${accessMeta(manager.email, manager.pin)}</small>
          </article>
        `,
      )
      .join("");
    const employeeRows = state.employeeAccess
      .map(
        (access) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(access.employeeName || employeeById(access.employeeId)?.name || "Employee")}</strong>
              <span class="status-pill">${accessStatus(access.email, access.active)}</span>
            </div>
            <small>${accessMeta(access.email, access.pin)}</small>
          </article>
        `,
      )
      .join("");
    const supabaseNotice = supabaseMode
      ? `<article class="fixed-item">
          <div class="item-line">
            <strong>Supabase Auth Active</strong>
            <span class="status-pill">Secure</span>
          </div>
          <small>Password Supabase Authentication > Users theke manage hobe. Ei panel sudhu admin/manager/employee email link korar jonno.</small>
        </article>`
      : "";

    els.dashboardAccessList.innerHTML = `
      ${supabaseNotice}
      <article class="fixed-item">
        <div class="item-line">
          <strong>Admin Access</strong>
          <span class="status-pill">${supabaseMode ? "Supabase Auth" : escapeHtml(maskedPin(state.settings.adminPin))}</span>
        </div>
        <small>Email: ${escapeHtml(state.settings.adminEmail || "Not set")} · ${supabaseMode ? "Password Supabase Auth-e manage hobe." : "Reload dile login thakbe. Logout korle abar password dite hobe."}</small>
      </article>
      ${managerRows || `<article class="empty-state">No manager access set.</article>`}
      ${employeeRows || `<article class="empty-state">No employee access set.</article>`}
    `;
    return;
  }
  const managerRows = state.managers
    .map(
      (manager) => `
        <article class="fixed-item">
          <div class="item-line">
            <strong>${escapeHtml(manager.name)}</strong>
            <span class="status-pill">${manager.active ? "Active" : "Inactive"}</span>
          </div>
          <small>Email: ${escapeHtml(manager.email || "Not set")} Â· Password: ${escapeHtml(maskedPin(manager.pin))}</small>
        </article>
      `,
    )
    .join("");
  const employeeRows = state.employeeAccess
    .map(
      (access) => `
        <article class="fixed-item">
          <div class="item-line">
            <strong>${escapeHtml(access.employeeName || employeeById(access.employeeId)?.name || "Employee")}</strong>
            <span class="status-pill">${access.active ? "Active" : "Inactive"}</span>
          </div>
          <small>Email: ${escapeHtml(access.email || "Not set")} Â· Password: ${escapeHtml(maskedPin(access.pin))}</small>
        </article>
      `,
    )
    .join("");

  const supabaseNotice = supabaseMode
    ? `<article class="fixed-item">
        <div class="item-line">
          <strong>Supabase Auth Active</strong>
          <span class="status-pill">Secure</span>
        </div>
        <small>Employee password এই dashboard থেকে set হবে না। Supabase Auth > Users থেকে password/update বা login page-এর reset link ব্যবহার করুন। এখানে শুধু email/employee mapping রাখা যায়।</small>
      </article>`
    : "";

  els.dashboardAccessList.innerHTML = `
    ${supabaseNotice}
    <article class="fixed-item">
      <div class="item-line">
        <strong>Admin Password</strong>
        <span class="status-pill">${escapeHtml(maskedPin(state.settings.adminPin))}</span>
      </div>
      <small>Email: ${escapeHtml(state.settings.adminEmail || "Not set")} Â· Reload dile login thakbe. Logout korle abar password dite hobe.</small>
    </article>
    ${managerRows || `<article class="empty-state">No manager access set.</article>`}
    ${employeeRows || `<article class="empty-state">No employee access set.</article>`}
  `;
}

function friendlyGuideSteps(day = totalsForDate(today()), month = totalsForMonth(today())) {
  const pending = pendingApprovalTotal();
  const missingCheckout = state.attendance.filter((item) => item.date === today() && item.checkIn && !item.checkOut).length;
  if (isEmployee()) {
    const employeeId = currentEmployeeId();
    const todayRow = state.attendance.find((item) => item.employeeId === employeeId && item.date === today());
    const running = runningBreakFor(employeeId, today());
    return [
      { title: todayRow?.checkIn ? "Check-in done" : "Start your day", detail: todayRow?.checkIn ? `আজ check-in: ${todayRow.checkIn}` : "Office এ এসে Check In দিন।", view: "attendance", icon: "log-in" },
      { title: running ? "You are on break" : "Need a break?", detail: running ? "Back from Break চাপুন।" : "Prayer/Lunch/Official break শুরু করুন।", view: "attendance", icon: running ? "play-circle" : "pause-circle" },
      { title: todayRow?.checkOut ? "Day closed" : "Before leaving", detail: todayRow?.checkOut ? `Check-out: ${todayRow.checkOut}` : "Office থেকে বের হওয়ার আগে Check Out দিন।", view: "attendance", icon: "log-out" },
      { title: "Your monthly report", detail: "নিজের attendance, break, leave, salary summary দেখুন।", view: "attendance", icon: "file-text" },
    ];
  }
  if (isManager()) {
    return [
      { title: "Review today attendance", detail: `${bn.format(missingCheckout)} missing checkout / running issue থাকতে পারে।`, view: "attendance", icon: "clipboard-check" },
      { title: "Check pending requests", detail: `${bn.format(pending)} approval admin decision দরকার।`, view: "approvals", icon: "bell" },
      { title: "Break status", detail: "কে এখন break এ আছে দ্রুত দেখুন।", view: "attendance", icon: "timer" },
      { title: "Daily work logs", detail: "Employee আজ কী কাজ করেছে review করুন।", view: "dashboard", icon: "notebook-tabs" },
    ];
  }
  return [
    { title: "Check business result", detail: `Today net: ${money(day.net)} · Monthly net: ${money(month.net)}`, view: "dashboard", icon: "chart-no-axes-combined" },
    { title: "Approve requests", detail: `${bn.format(pending)} pending approval আছে।`, view: "approvals", icon: "check-check" },
    { title: "Payroll health", detail: "Missing checkout, leave, advance দেখে salary close করুন।", view: "attendance", icon: "wallet-cards" },
    { title: "Cloud and backup", detail: "Cloud sync, backup, cleanup ও settings check করুন।", view: "settings", icon: "cloud-check" },
  ];
}

function renderFriendlyGuide(day = totalsForDate(today()), month = totalsForMonth(today())) {
  if (!els.friendlySteps) return;
  const steps = friendlyGuideSteps(day, month);
  if (els.friendlyGuideTitle) els.friendlyGuideTitle.textContent = isEmployee() ? "Today’s Employee Guide" : isManager() ? "Manager Quick Guide" : "Admin Quick Guide";
  if (els.friendlyGuideSubtitle) els.friendlyGuideSubtitle.textContent = beginnerMode ? "Simple Mode চালু আছে: শুধু দরকারি কাজগুলো আগে দেখাচ্ছে।" : "কাজ শুরু করার জন্য সবচেয়ে দরকারি shortcuts।";
  if (els.toggleBeginnerModeBtn) {
    els.toggleBeginnerModeBtn.classList.toggle("active", beginnerMode);
    els.toggleBeginnerModeBtn.innerHTML = `<i data-lucide="${beginnerMode ? "sparkle" : "sparkles"}"></i> ${beginnerMode ? "Simple On" : "Simple Mode"}`;
  }
  els.friendlySteps.innerHTML = steps
    .map(
      (step, index) => `
        <button class="friendly-step" data-search-view="dashboard" type="button">
          <span><i data-lucide="${escapeHtml(step.icon)}"></i></span>
          <strong>${bn.format(index + 1)}. ${escapeHtml(step.title)}</strong>
          <small>${escapeHtml(step.detail)}</small>
        </button>
      `,
    )
    .join("");
}

function toggleBeginnerMode() {
  beginnerMode = !beginnerMode;
  localStorage.setItem("minus-style-beginner-mode", beginnerMode ? "1" : "0");
  document.body.classList.toggle("beginner-mode", beginnerMode);
  render();
}

function whatsappTemplates() {
  const date = els.selectedDate?.value || today();
  const month = els.payrollMonth?.value || today().slice(0, 7);
  const payroll = payrollForMonth(month);
  const warningCount = attendanceWarningTotal(date);
  return [
    { id: "daily", title: "Daily Summary", message: dailySummaryMessage(date) },
    { id: "payroll", title: "Salary Summary", message: `Minus Style Salary Summary\nMonth: ${month}\nGross: ${money(payroll.gross)}\nDeduction: ${money(payroll.deduction)}\nPayable: ${money(payroll.payable)}` },
    { id: "approval", title: "Pending Approval", message: `Minus Style Approval Alert\nPending request: ${bn.format(pendingApprovalTotal())}\nPlease review dashboard approval section.` },
    { id: "attendance", title: "Attendance Warning", message: `Minus Style Attendance Alert\nDate: ${date}\nWarning count: ${bn.format(warningCount)}\nPlease check attendance panel.` },
  ];
}

function renderWhatsappTemplates() {
  if (!els.whatsappTemplateList) return;
  els.whatsappTemplateList.innerHTML = whatsappTemplates()
    .map(
      (template) => `
        <article class="template-card">
          <div>
            <strong>${escapeHtml(template.title)}</strong>
            <small>${escapeHtml(template.message.split("\n").slice(0, 2).join(" · "))}</small>
          </div>
          <div class="action-row">
            <button class="small-action" data-copy-template="${escapeHtml(template.id)}" type="button">Copy</button>
            <button class="small-action" data-whatsapp-template="${escapeHtml(template.id)}" type="button">WhatsApp</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function exportPayrollSheetCsv() {
  const month = els.payrollMonth?.value || today().slice(0, 7);
  const payroll = payrollForMonth(month);
  const rows = [
    ["Salary Month", month],
    ["Gross Salary", Math.round(payroll.gross)],
    ["Total Deduction", Math.round(payroll.deduction)],
    ["Payable Salary", Math.round(payroll.payable)],
    [],
    ["Employee", "Base Salary", "Present", "Leave", "Paid Leave", "Absent", "Deduction", "Advance", "Weekend Pay", "Adjustment Plus", "Adjustment Minus", "Payable"],
    ...payroll.rows.map((row) => [
      row.name,
      Math.round(row.salary),
      row.present,
      row.leave,
      row.paidLeave || 0,
      row.absent,
      Math.round(row.deduction),
      Math.round(row.advance),
      Math.round(row.weekendPay || 0),
      Math.round(row.additions || 0),
      Math.round(row.manualDeductions || 0),
      Math.round(row.payable),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile(`minus-style-salary-sheet-${month}.csv`, csv, "text/csv;charset=utf-8");
}

function exportEmployeeSelfReport() {
  if (!isEmployee()) return;
  const employeeId = currentEmployeeId();
  const employee = employees().find((item) => item.id === employeeId);
  if (!employee) return;
  const month = els.payrollMonth?.value || today().slice(0, 7);
  const payroll = payrollForMonth(month).rows.find((row) => row.id === employeeId);
  const attendanceRows = state.attendance.filter((item) => item.employeeId === employeeId && item.date?.startsWith(month));
  const breakRows = state.breaks.filter((item) => item.employeeId === employeeId && item.date?.startsWith(month));
  const leaveRows = state.leaveRequests.filter((item) => item.employeeId === employeeId && (item.start || "").startsWith(month));
  const rows = [
    ["Employee", employee.name],
    ["Month", month],
    ["Base Salary", employee.salary],
    ["Present", attendanceRows.filter((item) => item.status === "present").length],
    ["Absent", attendanceRows.filter((item) => item.status === "absent").length],
    ["Total Break Minutes", Math.round(breakRows.reduce((total, item) => total + Number(item.durationSeconds || 0), 0) / 60)],
    ["Leave Requests", leaveRows.length],
    ["Gross Salary", Math.round(payroll?.gross || employee.salary)],
    ["Deduction", Math.round(payroll?.deduction || 0)],
    ["Advance", Math.round(payroll?.advance || 0)],
    ["Payable", Math.round(payroll?.payable || employee.salary)],
    [],
    ["Date", "Status", "Shift", "Check In", "Check Out", "Note"],
    ...attendanceRows.map((item) => [item.date, item.status, shiftLabel(item.shift), item.checkIn || "", item.checkOut || "", item.note || ""]),
  ];
  const reportCsv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile(`employee-self-report-${employee.name}-${month}.csv`, reportCsv, "text/csv;charset=utf-8");
}

function renderAttendance() {
  if (!els.attendanceEmployee) return;
  const currentEmployee = els.attendanceEmployee.value;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  const employeeOptions = visibleEmployees
    .map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)} - ${money(employee.salary)}</option>`)
    .join("");
  els.attendanceEmployee.innerHTML = employeeOptions || `<option value="">কোনো active salary employee নেই</option>`;
  if (visibleEmployees.some((employee) => employee.id === currentEmployee)) els.attendanceEmployee.value = currentEmployee;
  if (isEmployee()) els.attendanceEmployee.value = currentEmployeeId();

  const date = els.attendanceDate.value;
  setText("attendanceHint", `${date} তারিখের হাজিরা`);
  const rows = visibleEmployees
    .map((employee) => {
      const record = attendanceFor(date, employee.id);
      const status = record?.status || "present";
      return `
        <tr>
          <td>${escapeHtml(employee.name)}</td>
          <td><span class="type-pill attendance-${status}">${statusLabel(status)}</span></td>
          <td>${escapeHtml(shiftLabel(record?.shift || "morning"))}</td>
          <td>${escapeHtml(record?.checkIn || "-")}</td>
          <td>${escapeHtml(record?.checkOut || "-")}</td>
          <td>${formatBreakMinutes((Number(record?.breakMinutes || 0) * 60) + breakTotals(breaksForDate(date, [employee.id])).total)}</td>
          <td>${escapeHtml(record?.note || "-")}</td>
          <td>${escapeHtml(record?.markedBy || "Default")}</td>
          <td>
            ${record && !isEmployee() ? `<button class="small-action danger" data-delete-attendance="${record.id}" type="button">ডিলিট</button>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
  els.attendanceTable.innerHTML = rows || `<tr><td colspan="5" class="empty">কোনো employee নেই।</td></tr>`;
  renderAttendanceActionState();
}

function renderFridayWork() {
  if (!els.fridayWorkForm) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  const selected = Array.from(els.fridayWorkEmployees?.selectedOptions || []).map((option) => option.value);
  els.fridayWorkEmployees.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  selected.forEach((id) => {
    Array.from(els.fridayWorkEmployees.options).forEach((option) => {
      if (option.value === id) option.selected = true;
    });
  });
  if (isEmployee()) {
    els.fridayWorkEmployees.value = currentEmployeeId();
    els.fridayWorkEmployeesLabel.style.display = "none";
  } else {
    els.fridayWorkEmployeesLabel.style.display = "";
  }
  if (!els.fridayWorkDate.value) els.fridayWorkDate.value = nextFriday(today());
  if (els.fridayWorkHint) {
    els.fridayWorkHint.textContent = isEmployee()
      ? "Friday work approval ছাড়া শুক্রবার check-in চালু হবে না।"
      : "Admin assignment করলে request approved হবে, employee Friday check-in করতে পারবে।";
  }

  const rows = (state.fridayWorkRequests || [])
    .filter((item) => !isEmployee() || item.employeeId === currentEmployeeId())
    .sort((a, b) => String(b.work_date).localeCompare(String(a.work_date)) || String(b.created_at).localeCompare(String(a.created_at)));

  els.fridayWorkList.innerHTML =
    rows
      .map((item) => {
        const attendance = item.attendance_id ? state.attendance.find((record) => record.id === item.attendance_id) : attendanceFor(item.work_date, item.employeeId);
        const completed = fridayWorkCompleted(item);
        return `
          <article class="fixed-item friday-work-item">
            <div class="item-line">
              <strong>${escapeHtml(item.employeeName)} · ${escapeHtml(item.work_date)}</strong>
              <span class="status-pill">${escapeHtml(item.status)}</span>
            </div>
            <small class="muted">${escapeHtml(fridayWorkTypeLabel(item.request_type))} · ${escapeHtml(item.reason || "No reason")}</small>
            <small class="muted">Check In: ${escapeHtml(attendance?.checkIn || "-")} · Check Out: ${escapeHtml(attendance?.checkOut || "-")} ${completed ? "· Completed" : ""}</small>
            ${item.note ? `<small class="muted">Note: ${escapeHtml(item.note)}</small>` : ""}
            ${
              isAdmin()
                ? `<div class="action-row">
                    ${item.status === "pending" ? `<button class="small-action" data-approve-friday="${item.id}" type="button">Approve</button>` : ""}
                    ${["pending", "approved"].includes(item.status) ? `<button class="small-action danger" data-reject-friday="${item.id}" type="button">Reject</button>` : ""}
                    ${completed && item.status !== "completed" ? `<button class="small-action" data-complete-friday="${item.id}" type="button">Complete</button>` : ""}
                    <button class="small-action danger" data-delete-friday="${item.id}" type="button">Delete</button>
                  </div>`
                : ""
            }
          </article>
        `;
      })
      .join("") || `<div class="empty">Friday work request নেই।</div>`;
}

function nextFriday(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const add = (5 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + add);
  return date.toISOString().slice(0, 10);
}

function saveFridayWorkRequest(event) {
  event.preventDefault();
  const workDate = els.fridayWorkDate.value;
  if (!isFriday(workDate)) {
    alert("Friday Work Request-এর তারিখ অবশ্যই শুক্রবার হতে হবে।");
    return;
  }

  const selectedIds = isEmployee()
    ? [currentEmployeeId()]
    : Array.from(els.fridayWorkEmployees.selectedOptions || []).map((option) => option.value);
  if (!selectedIds.length) {
    alert("কমপক্ষে ১ জন employee select করুন।");
    return;
  }

  const now = new Date().toISOString();
  selectedIds.forEach((employeeId) => {
    const employee = employeeById(employeeId);
    if (!employee) return;
    const existing = (state.fridayWorkRequests || []).find((item) => {
      return item.employeeId === employee.id && item.work_date === workDate && !["rejected"].includes(item.status);
    });
    if (existing) {
      existing.request_type = els.fridayWorkType.value;
      existing.reason = els.fridayWorkReason.value.trim();
      existing.note = els.fridayWorkNote.value.trim();
      existing.updated_at = now;
      if (isAdmin()) {
        existing.status = "approved";
        existing.approved_by = "Admin";
      }
      return;
    }
    state.fridayWorkRequests.unshift({
      id: crypto.randomUUID(),
      employee_id: employee.id,
      employeeId: employee.id,
      employeeName: employee.name,
      work_date: workDate,
      request_type: els.fridayWorkType.value,
      reason: els.fridayWorkReason.value.trim(),
      note: els.fridayWorkNote.value.trim(),
      status: isAdmin() ? "approved" : "pending",
      approved_by: isAdmin() ? "Admin" : "",
      attendance_id: "",
      salary_added: false,
      compensatory_leave_added: isAdmin() && els.fridayWorkType.value === "compensatory_leave",
      created_at: now,
      updated_at: now,
      requested_by: currentUser.name || employee.name,
    });
    addNotification(
      "Friday Work Alert",
      isAdmin()
        ? `${employee.name}-এর Friday work approved: ${workDate} (${fridayWorkTypeLabel(els.fridayWorkType.value)})`
        : `${employee.name}-এর Friday work approval দরকার: ${workDate} (${fridayWorkTypeLabel(els.fridayWorkType.value)})`,
    );
  });

  logActivity("Friday Work Request", `${workDate} · ${fridayWorkTypeLabel(els.fridayWorkType.value)} · ${bn.format(selectedIds.length)} employee`, selectedIds.join(","));
  els.fridayWorkForm.reset();
  els.fridayWorkDate.value = nextFriday(today());
  saveState();
  render();
}

function reviewFridayWork(id, status) {
  if (!isAdmin()) return;
  const item = (state.fridayWorkRequests || []).find((request) => request.id === id);
  if (!item) return;
  item.status = status;
  item.updated_at = new Date().toISOString();
  item.approved_by = status === "approved" ? "Admin" : item.approved_by || "";
  if (status === "approved" && item.request_type === "compensatory_leave") item.compensatory_leave_added = true;
  if (status === "rejected") {
    item.salary_added = false;
    item.compensatory_leave_added = false;
  }
  if (status === "completed") {
    const attendance = attendanceFor(item.work_date, item.employeeId);
    if (attendance) item.attendance_id = attendance.id;
    if (item.request_type === "extra_salary") item.salary_added = true;
    if (item.request_type === "compensatory_leave") item.compensatory_leave_added = true;
  }
  addNotification("Friday Work Alert", `${item.employeeName}-এর Friday work ${status}: ${item.work_date}`);
  logActivity("Friday Work Review", `${item.employeeName} · ${item.work_date} · ${status}`, item.employeeId);
  saveState();
  render();
}

function deleteFridayWork(id) {
  if (!isAdmin()) return;
  if (!confirm("এই Friday work request delete করবেন?")) return;
  state.fridayWorkRequests = (state.fridayWorkRequests || []).filter((item) => item.id !== id);
  saveState();
  render();
}

function renderBreaks() {
  if (!els.breakEmployee) return;
  const visibleEmployees = visibleEmployeesForRole();
  const currentBreakEmployee = els.breakEmployee.value;
  els.breakEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  if (visibleEmployees.some((employee) => employee.id === currentBreakEmployee)) els.breakEmployee.value = currentBreakEmployee;
  if (isEmployee()) els.breakEmployee.value = currentEmployeeId();

  const selectedEmployee = visibleEmployees.find((employee) => employee.id === els.breakEmployee.value);
  const running = selectedEmployee ? activeBreakFor(selectedEmployee.id) : null;
  const statusText = running ? `On ${breakLabel(running.type)}` : "Available";

  els.breakStatusPill.textContent = statusText;
  els.currentBreakStatus.textContent = `Current Status: ${statusText}`;
  els.currentBreakStarted.textContent = `Started At: ${running?.startTime || "-"}`;
  els.currentBreakDuration.textContent = `Running Duration: ${formatDuration(breakDurationSeconds(running))}`;
  els.currentBreakDuration.classList.toggle("warning-text", Boolean(running && isMissedBreak(running)));
  els.startBreakBtn.disabled = Boolean(running) || !selectedEmployee;
  els.endBreakBtn.disabled = !running;
  els.breakType.disabled = Boolean(running);
  if (els.mobileStartBreakBtn) els.mobileStartBreakBtn.disabled = Boolean(running) || !selectedEmployee;
  if (els.mobileEndBreakBtn) els.mobileEndBreakBtn.disabled = !running;

  const date = els.attendanceDate.value;
  if (els.breakFilterStart && !els.breakFilterStart.value) els.breakFilterStart.value = date;
  if (els.breakFilterEnd && !els.breakFilterEnd.value) els.breakFilterEnd.value = date;
  const start = els.breakFilterStart?.value || date;
  const end = els.breakFilterEnd?.value || date;
  const query = (els.breakFilterName?.value || "").trim().toLowerCase();
  const type = els.breakFilterType?.value || "";
  const status = els.breakFilterStatus?.value || "";
  const employeeIds = visibleEmployees.map((employee) => employee.id);
  const rows = breaksInRange(start, end, employeeIds)
    .filter((item) => !query || item.employeeName.toLowerCase().includes(query))
    .filter((item) => !type || item.type === type)
    .filter((item) => {
      if (!status) return true;
      if (status === "running") return !item.endAt;
      if (status === "closed") return Boolean(item.endAt);
      if (status === "missed") return isMissedBreak(item);
      return true;
    })
    .sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
  const totals = breakTotals(rows);

  setText("breakSummaryHint", isEmployee() ? `${start} to ${end} your break history` : `${start} to ${end} all employee break report`);
  setText("breakPrayerTotal", formatBreakMinutes(totals.prayer));
  setText("breakWashroomTotal", formatBreakMinutes(totals.washroom));
  setText("breakLunchTotal", formatBreakMinutes(totals.lunch));
  setText("breakPersonalTotal", formatBreakMinutes(totals.personal));
  setText("breakOfficialTotal", formatBreakMinutes(totals.official));
  setText("breakGrandTotal", formatBreakMinutes(totals.total));
  setText("breakCountTotal", bn.format(totals.count || 0));
  setText("breakRunningTotal", bn.format(totals.running || 0));

  els.breakTable.innerHTML =
    rows
      .map((item) => {
        const missed = isMissedBreak(item);
        const overLimit = isBreakOverLimit(item);
        const statusNote = missed ? "Missed Back warning" : overLimit ? "Limit alert" : "";
        return `
          <tr class="${missed ? "danger-row" : overLimit ? "warning-row" : ""}">
            <td>${escapeHtml(item.employeeName)}</td>
            <td><span class="type-pill">${escapeHtml(breakLabel(item.type))}</span></td>
            <td>${escapeHtml(item.startTime || "-")}</td>
            <td>${escapeHtml(item.endTime || "Running")}</td>
            <td>${formatBreakMinutes(breakDurationSeconds(item))}${statusNote ? `<br><small class="warning-text">${statusNote}</small>` : ""}</td>
            <td>${escapeHtml(item.note || "-")}</td>
            <td>
              ${
                isAdmin()
                  ? `<button class="small-action" data-edit-break="${item.id}" type="button">Edit</button>
                     <button class="small-action danger" data-delete-break="${item.id}" type="button">Delete</button>`
                  : ""
              }
              ${!item.endAt && (isAdmin() || isManager()) ? `<button class="small-action danger" data-force-end-break="${item.id}" type="button">Close</button>` : ""}
            </td>
          </tr>
        `;
      })
      .join("") || `<tr><td colspan="7" class="empty">No break history found.</td></tr>`;
}
function renderAttendanceActionState() {
  if (!els.attendanceCheckInNowBtn || !els.attendanceCheckOutNowBtn) return;
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employees().find((item) => item.id === els.attendanceEmployee.value);
  const record = employee ? attendanceFor(today(), employee.id) : null;
  const hasCheckIn = Boolean(record?.checkIn);
  const hasCheckOut = Boolean(record?.checkOut);
  const fridayBlocked = Boolean(employee && fridayAttendanceBlockReason(today(), employee.id));

  els.attendanceCheckInNowBtn.disabled = hasCheckIn || fridayBlocked;
  els.attendanceCheckOutNowBtn.disabled = !hasCheckIn || hasCheckOut || fridayBlocked;
  els.attendanceCheckInNowBtn.title = fridayBlocked ? "Friday Work approval ছাড়া শুক্রবার check-in বন্ধ।" : hasCheckIn ? "আজ check-in already save আছে।" : "বর্তমান সময় দিয়ে check-in করুন।";
  els.attendanceCheckOutNowBtn.title = fridayBlocked
    ? "Friday Work approval ছাড়া শুক্রবার check-out বন্ধ।"
    : !hasCheckIn
    ? "আগে check-in করতে হবে।"
    : hasCheckOut
      ? "আজ check-out already save আছে।"
      : "বর্তমান সময় দিয়ে check-out করুন।";

  if (els.mobileCheckInBtn) els.mobileCheckInBtn.disabled = hasCheckIn || fridayBlocked;
  if (els.mobileCheckOutBtn) els.mobileCheckOutBtn.disabled = !hasCheckIn || hasCheckOut || fridayBlocked;
  if (els.mobileStartBreakBtn) els.mobileStartBreakBtn.disabled = !hasCheckIn || hasCheckOut || Boolean(employee && activeBreakFor(employee.id));
  if (els.mobileEndBreakBtn) els.mobileEndBreakBtn.disabled = !employee || !activeBreakFor(employee.id);
}

function renderEmployeeHome() {
  if (!els.employeeHomePanel) return;
  els.employeeHomePanel.hidden = !isEmployee();
  if (!isEmployee()) return;

  const employee = employeeById(currentEmployeeId());
  if (!employee) {
    els.employeeHomePanel.hidden = true;
    return;
  }

  const record = attendanceFor(today(), employee.id);
  const payroll = payrollForMonth(els.payrollMonth.value);
  const payrollRow = payroll.rows.find((row) => row.id === employee.id);
  const pendingAttendance = state.approvals.filter((item) => item.status === "pending" && item.payload?.employeeId === employee.id).length;
  const pendingAdvance = state.advances.filter((item) => item.status === "pending" && item.employeeId === employee.id).length;
  const pendingLeave = state.leaveRequests.filter((item) => item.status === "pending" && item.employeeId === employee.id).length;
  const pendingTotal = pendingAttendance + pendingAdvance + pendingLeave;

  const hasCheckIn = Boolean(record?.checkIn);
  const hasCheckOut = Boolean(record?.checkOut);
  const runningBreak = activeBreakFor(employee.id);
  const statusText = runningBreak ? `On ${breakLabel(runningBreak.type)}` : hasCheckIn && hasCheckOut ? "Complete" : hasCheckIn ? "Check-out baki" : "Check-in baki";

  els.employeeHomeTitle.textContent = `${employee.name} - আজকের স্ট্যাটাস`;
  els.employeeTodayStatus.textContent = statusText;
  els.employeeTodayCheckIn.textContent = record?.checkIn || "বাকি";
  els.employeeTodayCheckOut.textContent = record?.checkOut || "বাকি";
  els.employeeMonthPayable.textContent = payrollRow ? money(payrollRow.payable) : money(0);
  els.employeePendingApproval.textContent = bn.format(pendingTotal);

  if (els.employeeNoticeStrip) {
    const notices = (state.notices || []).filter(noticeVisibleForRole).slice(0, 2);
    els.employeeNoticeStrip.innerHTML = notices
      .map((notice) => `<span><strong>${escapeHtml(notice.title || "Notice")}</strong> ${escapeHtml(notice.body || "")}</span>`)
      .join("");
    els.employeeNoticeStrip.hidden = !notices.length;
  }

  if (els.employeeProfileSummary) {
    const profile = employeeProfileFor(employee.id);
    els.employeeProfileSummary.innerHTML = `
      <span>Shift: ${escapeHtml(shiftLabel(profile.shift || "morning"))}</span>
      <span>Salary: ${money(employee.salary)}</span>
      <span>Join: ${escapeHtml(profile.joinDate || "-")}</span>
      <span>Phone: ${escapeHtml(profile.phone || "-")}</span>
      <span>Emergency: ${escapeHtml(profile.emergencyContact || "-")}</span>
    `;
  }

  if (runningBreak) {
    els.employeeTodayHint.textContent = `${breakLabel(runningBreak.type)} চলছে। Started: ${runningBreak.startTime}, Duration: ${formatDuration(breakDurationSeconds(runningBreak))}`;
  } else if (!hasCheckIn) {
    els.employeeTodayHint.textContent = "আজ check-in বাকি আছে। অফিস লোকেশনে গিয়ে Check In Now চাপুন।";
  } else if (!hasCheckOut) {
    els.employeeTodayHint.textContent = "আজ check-out বাকি আছে। কাজ শেষ হলে Check Out Now চাপুন।";
  } else {
    els.employeeTodayHint.textContent = "আজকের attendance complete হয়েছে। নিচে নিজের payroll ও request history দেখতে পারবেন।";
  }

  renderEmployeeSelfDashboard(employee, payrollRow);
}

function renderEmployeeSelfDashboard(employee, payrollRow) {
  const month = els.payrollMonth.value || today().slice(0, 7);
  const start = `${month}-01`;
  const end = monthEnd(start);
  const monthAttendance = state.attendance
    .filter((item) => item.employeeId === employee.id && item.date >= start && item.date <= end)
    .sort((a, b) => b.date.localeCompare(a.date));
  const monthBreaks = breaksInRange(start, end, [employee.id]).sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
  const monthLeaves = state.leaveRequests
    .filter((item) => {
      const leaveStart = item.startDate || item.start;
      const leaveEnd = item.endDate || item.end;
      return item.employeeId === employee.id && leaveStart <= end && leaveEnd >= start;
    })
    .sort((a, b) => String(b.createdAt || b.requestedAt).localeCompare(String(a.createdAt || a.requestedAt)));
  const monthAdvances = state.advances
    .filter((item) => item.employeeId === employee.id && item.month === month)
    .sort((a, b) => String(b.createdAt || b.requestedAt).localeCompare(String(a.createdAt || a.requestedAt)));
  const breakTotal = breakTotals(monthBreaks).total;
  const approvedAdvance = monthAdvances.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (els.employeeMonthPresent) els.employeeMonthPresent.textContent = bn.format(monthAttendance.filter((item) => item.status === "present").length || payrollRow?.present || 0);
  if (els.employeeMonthAbsent) els.employeeMonthAbsent.textContent = bn.format(monthAttendance.filter((item) => item.status === "absent").length || payrollRow?.absent || 0);
  if (els.employeeMonthBreak) els.employeeMonthBreak.textContent = formatBreakMinutes(breakTotal);
  if (els.employeeMonthAdvance) els.employeeMonthAdvance.textContent = money(approvedAdvance);
  if (els.employeeMonthLeave) {
    els.employeeMonthLeave.textContent = bn.format(
      monthLeaves
        .filter((item) => item.status === "approved")
        .reduce((sum, item) => sum + (item.days || dateRange(item.startDate || item.start, item.endDate || item.end).length), 0),
    );
  }

  if (els.employeeSelfAttendanceList) {
    els.employeeSelfAttendanceList.innerHTML =
      monthAttendance
        .slice(0, 5)
        .map(
          (item) => `
            <article class="mini-list-item">
              <strong>${escapeHtml(item.date)}</strong>
              <small>${escapeHtml(statusLabel(item.status))} · In ${escapeHtml(item.checkIn || "-")} · Out ${escapeHtml(item.checkOut || "-")}</small>
            </article>
          `,
        )
        .join("") || `<div class="empty">এই মাসে attendance নেই।</div>`;
  }

  if (els.employeeSelfBreakList) {
    els.employeeSelfBreakList.innerHTML =
      monthBreaks
        .slice(0, 5)
        .map(
          (item) => `
            <article class="mini-list-item ${!item.endAt ? "warning-row" : ""}">
              <strong>${escapeHtml(item.date)} · ${escapeHtml(breakLabel(item.type))}</strong>
              <small>${escapeHtml(item.startTime || "-")} - ${escapeHtml(item.endTime || "Running")} · ${formatBreakMinutes(breakDurationSeconds(item))}</small>
            </article>
          `,
        )
        .join("") || `<div class="empty">এই মাসে break নেই।</div>`;
  }

  if (els.employeeSelfLeaveAdvanceList) {
    const items = [
      ...monthLeaves.map((item) => ({ createdAt: item.createdAt || item.requestedAt, title: `${item.startDate || item.start} to ${item.endDate || item.end}`, detail: `${item.type || "Leave"} · ${item.status}` })),
      ...monthAdvances.map((item) => ({ createdAt: item.createdAt || item.requestedAt, title: money(item.amount), detail: `Advance · ${item.status}` })),
    ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    els.employeeSelfLeaveAdvanceList.innerHTML =
      items
        .slice(0, 5)
        .map(
          (item) => `
            <article class="mini-list-item">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.detail)}</small>
            </article>
          `,
        )
        .join("") || `<div class="empty">Leave বা advance request নেই।</div>`;
  }
}

function renderTimeline() {
  if (!els.timelineEmployee || !els.timelineList) return;
  const { visible, html } = employeeOptionsForRole(els.timelineEmployee.value);
  els.timelineEmployee.innerHTML = html;
  if (isEmployee()) els.timelineEmployee.value = currentEmployeeId();
  if (!els.timelineEmployee.value && visible[0]) els.timelineEmployee.value = visible[0].id;

  const employeeId = els.timelineEmployee.value;
  const date = els.attendanceDate.value;
  const record = attendanceFor(date, employeeId);
  const events = [];
  if (record?.checkIn) events.push({ time: record.checkIn, title: "Check In", detail: record.note || "Present" });
  breaksForDate(date, [employeeId]).forEach((item) => {
    events.push({ time: item.startTime, title: `Start ${breakLabel(item.type)}`, detail: item.note || "Break started" });
    if (item.endTime) events.push({ time: item.endTime, title: "Back from Break", detail: `${breakLabel(item.type)} - ${formatBreakMinutes(breakDurationSeconds(item))}` });
  });
  if (record?.checkOut) events.push({ time: record.checkOut, title: "Check Out", detail: "Workday completed" });
  events.sort((a, b) => (timeToMinutes(a.time) ?? 9999) - (timeToMinutes(b.time) ?? 9999));

  els.timelineList.innerHTML =
    events
      .map(
        (item) => `
          <article class="timeline-item">
            <strong>${escapeHtml(item.time || "-")}</strong>
            <div>
              <b>${escapeHtml(item.title)}</b>
              <small>${escapeHtml(item.detail)}</small>
            </div>
          </article>
        `,
      )
      .join("") || `<div class="empty">এই তারিখে timeline event নেই।</div>`;
}

function renderCorrectionForm() {
  if (!els.correctionEmployee) return;
  const { visible, html } = employeeOptionsForRole(els.correctionEmployee.value);
  els.correctionEmployee.innerHTML = html;
  if (isEmployee()) els.correctionEmployee.value = currentEmployeeId();
  if (!els.correctionEmployee.value && visible[0]) els.correctionEmployee.value = visible[0].id;
  if (els.correctionDate && !els.correctionDate.value) els.correctionDate.value = els.attendanceDate.value || today();

  const employeeId = els.correctionEmployee.value;
  const date = els.correctionDate.value || els.attendanceDate.value;
  const breakItems = breaksForDate(date, [employeeId]);
  els.correctionBreak.innerHTML =
    breakItems
      .map((item) => `<option value="${item.id}">${breakLabel(item.type)} | ${item.startTime || "-"} - ${item.endTime || "Running"}</option>`)
      .join("") || `<option value="">No break record</option>`;

  const type = els.correctionType.value;
  const needsBreak = ["break_start", "break_end", "break_delete"].includes(type);
  els.correctionBreak.closest("label").style.display = needsBreak ? "" : "none";
  els.correctionTime.closest("label").style.display = type === "break_delete" ? "none" : "";
}

function renderMonthlyBreakReport() {
  if (!els.breakMonthlyTable) return;
  const month = els.breakReportMonth.value || els.payrollMonth.value || today().slice(0, 7);
  if (els.breakReportMonth && !els.breakReportMonth.value) els.breakReportMonth.value = month;
  const { visible } = employeeOptionsForRole(els.breakReportEmployee.value, true);
  const currentValue = els.breakReportEmployee.value;
  els.breakReportEmployee.innerHTML =
    (!isEmployee() ? `<option value="">All Employees</option>` : "") +
    visible.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  if (isEmployee()) els.breakReportEmployee.value = currentEmployeeId();
  else if (visible.some((employee) => employee.id === currentValue)) els.breakReportEmployee.value = currentValue;

  const start = `${month}-01`;
  const end = monthEnd(start);
  const selectedEmployee = els.breakReportEmployee.value;
  const selectedType = els.breakReportType.value;
  const rows = visible
    .filter((employee) => !selectedEmployee || employee.id === selectedEmployee)
    .map((employee) => {
      const items = breaksInRange(start, end, [employee.id]).filter((item) => !selectedType || item.type === selectedType);
      const totals = breakTotals(items);
      const longest = items.reduce((max, item) => Math.max(max, breakDurationSeconds(item)), 0);
      const average = items.length ? totals.total / items.length : 0;
      return { employee, totals, longest, average };
    });

  els.breakMonthlyTable.innerHTML =
    rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.employee.name)}</td>
            <td>${bn.format(row.totals.count || 0)}</td>
            <td>${formatBreakMinutes(row.totals.prayer)}</td>
            <td>${formatBreakMinutes(row.totals.washroom)}</td>
            <td>${formatBreakMinutes(row.totals.lunch)}</td>
            <td>${formatBreakMinutes(row.totals.personal)}</td>
            <td>${formatBreakMinutes(row.totals.official)}</td>
            <td>${formatBreakMinutes(row.totals.total)}</td>
            <td>${formatBreakMinutes(row.average)}</td>
            <td>${formatBreakMinutes(row.longest)}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="10" class="empty">Break report নেই।</td></tr>`;
}

function renderActivityLog() {
  if (!els.activityLogList) return;
  if (!isAdmin()) {
    els.activityLogList.innerHTML = `<div class="empty">Only admin can see activity log.</div>`;
    return;
  }
  els.activityLogList.innerHTML =
    (state.activityLogs || [])
      .slice(0, 60)
      .map(
        (item) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.action)}</strong>
              <span class="status-pill">${escapeHtml(item.role || "")}</span>
            </div>
            <small class="muted">${new Date(item.createdAt).toLocaleString("bn-BD")} · ${escapeHtml(item.user || "System")} · ${escapeHtml(item.detail || "")}</small>
          </article>
        `,
      )
      .join("") || `<div class="empty">Activity log এখনো নেই।</div>`;
}

function dataHealthIssues() {
  const issues = [];
  const attendanceGroups = new Map();

  state.attendance.forEach((record) => {
    const key = `${record.date}|${record.employeeId}`;
    const list = attendanceGroups.get(key) || [];
    list.push(record);
    attendanceGroups.set(key, list);

    if (record.checkIn && !record.checkOut && record.status === "present") {
      issues.push({
        type: "Missing Checkout",
        level: "warning",
        employee: record.employeeName || employeeById(record.employeeId)?.name || "Unknown",
        date: record.date,
        detail: `Check-in আছে (${record.checkIn}) কিন্তু checkout নেই।`,
      });
    }
  });

  attendanceGroups.forEach((records) => {
    if (records.length <= 1) return;
    const first = records[0];
    issues.push({
      type: "Duplicate Attendance",
      level: "danger",
      employee: first.employeeName || employeeById(first.employeeId)?.name || "Unknown",
      date: first.date,
      detail: `${bn.format(records.length)}টি attendance record পাওয়া গেছে।`,
    });
  });

  (state.breaks || []).forEach((item) => {
    if (item.startAt && !item.endAt) {
      issues.push({
        type: "Break Not Closed",
        level: isMissedBreak(item) ? "danger" : "warning",
        employee: item.employeeName || employeeById(item.employeeId)?.name || "Unknown",
        date: item.date,
        detail: `${breakLabel(item.type)} ${item.startTime || "-"} থেকে running আছে।`,
      });
    }
  });

  return issues.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function renderHealthCheck() {
  if (!els.healthCheckList) return;
  if (!isAdmin()) {
    els.healthCheckList.innerHTML = `<div class="empty">Only admin can run data health check.</div>`;
    return;
  }
  const issues = dataHealthIssues();
  els.healthCheckList.innerHTML =
    issues
      .map(
        (issue) => `
          <article class="fixed-item health-item ${issue.level === "danger" ? "danger-row" : "warning-row"}">
            <div class="item-line">
              <strong>${escapeHtml(issue.type)}</strong>
              <span class="status-pill">${escapeHtml(issue.date || "-")}</span>
            </div>
            <small class="muted">${escapeHtml(issue.employee)} · ${escapeHtml(issue.detail)}</small>
          </article>
        `,
      )
      .join("") || `<div class="empty">Data health OK. Duplicate, missing checkout বা running break নেই।</div>`;
}

function systemCheckItems() {
  const pendingApprovals = state.approvals.filter((request) => request.status === "pending").length;
  const pendingFriday = (state.fridayWorkRequests || []).filter((request) => request.status === "pending").length;
  const missingCheckout = state.attendance.filter((item) => item.checkIn && !item.checkOut && ["present", "late"].includes(item.status)).length;
  const runningBreaks = state.breaks.filter((item) => !item.endAt).length;
  const pendingNotifications = state.notifications.filter((item) => !item.sent).length;
  const healthIssues = dataHealthIssues().length;
  const cloudReady = Boolean(cloudUrl());
  const pwaReady = "serviceWorker" in navigator && window.isSecureContext;
  const installed = window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone;

  return [
    {
      title: "App files",
      value: "OK",
      detail: "Dashboard script এবং UI load হয়েছে।",
      level: "good",
    },
    {
      title: "Cloud Sync",
      value: lastCloudSyncFailed ? "Failed" : cloudDirty ? "Unsaved" : cloudReady ? "Ready" : "Off",
      detail: lastCloudSyncAt ? `Last sync ${timeAgo(lastCloudSyncAt)}` : cloudReady ? "Google Sheets URL set আছে।" : "Apps Script URL দিলে live sync হবে।",
      level: lastCloudSyncFailed ? "danger" : cloudDirty ? "warning" : cloudReady ? "good" : "warning",
    },
    {
      title: "Approvals",
      value: bn.format(pendingApprovals + pendingFriday),
      detail: "Pending approval requests",
      level: pendingApprovals + pendingFriday ? "warning" : "good",
    },
    {
      title: "Attendance",
      value: bn.format(missingCheckout),
      detail: "Check-in আছে কিন্তু checkout নেই",
      level: missingCheckout ? "warning" : "good",
    },
    {
      title: "Breaks",
      value: bn.format(runningBreaks),
      detail: "Running break এখনো close হয়নি",
      level: runningBreaks ? "warning" : "good",
    },
    {
      title: "WhatsApp Queue",
      value: bn.format(pendingNotifications),
      detail: "Pending notification mark/sent বাকি",
      level: pendingNotifications ? "warning" : "good",
    },
    {
      title: "Data Health",
      value: bn.format(healthIssues),
      detail: "Duplicate/missing/running issue count",
      level: healthIssues ? "danger" : "good",
    },
    {
      title: "PWA Install",
      value: installed ? "Installed" : pwaReady ? "Ready" : "Not ready",
      detail: pwaReady ? "Mobile/desktop install support active." : "HTTPS/GitHub Pages-এ open করলে ready হবে।",
      level: pwaReady ? "good" : "warning",
    },
  ];
}

function renderSystemCheck() {
  if (!els.systemCheckList) return;
  els.systemCheckList.innerHTML = systemCheckItems()
    .map(
      (item) => `
        <article class="system-check-item ${item.level}">
          <span class="status-pill">${escapeHtml(item.title)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.detail)}</small>
        </article>
      `,
    )
    .join("");
}

function payrollReviewItems(month) {
  const start = `${month}-01`;
  const end = monthEnd(start);
  const missingCheckout = state.attendance.filter((item) => item.date >= start && item.date <= end && item.checkIn && !item.checkOut && item.status === "present");
  const runningBreaks = state.breaks.filter((item) => (item.date || item.startAt?.slice(0, 10)) >= start && (item.date || item.startAt?.slice(0, 10)) <= end && !item.endAt);
  const pendingLeaves = state.leaveRequests.filter((item) => {
    const leaveStart = item.startDate || item.start;
    const leaveEnd = item.endDate || item.end;
    return item.status === "pending" && leaveStart <= end && leaveEnd >= start;
  });
  const pendingAdvances = state.advances.filter((item) => item.status === "pending" && item.month === month);
  const pendingApprovals = state.approvals.filter((item) => item.status === "pending");
  const locked = payrollLockFor(month);
  return [
    { title: "Missing checkout", count: missingCheckout.length, detail: "Check-in ache, checkout nei" },
    { title: "Running break", count: runningBreaks.length, detail: "Break start hoye back nei" },
    { title: "Pending leave", count: pendingLeaves.length, detail: "Approve/reject baki" },
    { title: "Pending advance", count: pendingAdvances.length, detail: "Salary deduction-er age decision dorkar" },
    { title: "Pending approval", count: pendingApprovals.length, detail: "Request center check korun" },
    { title: "Month lock", count: locked ? 0 : 1, detail: locked ? "Month closed/locked" : "Close Month baki" },
  ];
}

function renderPayrollReviewChecklist() {
  if (!els.payrollReviewChecklist) return;
  const month = els.payrollMonth?.value || today().slice(0, 7);
  const items = payrollReviewItems(month);
  els.payrollReviewChecklist.innerHTML = items
    .map(
      (item) => `
        <article class="check-card ${item.count ? "warning" : "good"}">
          <span>${escapeHtml(item.title)}</span>
          <strong>${item.count ? bn.format(item.count) : "OK"}</strong>
          <small>${escapeHtml(item.detail)}</small>
        </article>
      `,
    )
    .join("");
}

function employeePerformanceSnapshot(employeeId, month) {
  const employee = employeeById(employeeId);
  const payroll = payrollForMonth(month).rows.find((row) => row.id === employeeId);
  const warnings = warningReportForMonth(month).find((row) => row.employee.id === employeeId) || {};
  const fridayCompleted = (state.fridayWorkRequests || []).filter(
    (item) => (item.employee_id || item.employeeId) === employeeId && item.status === "completed" && (item.work_date || item.workDate || "").startsWith(month),
  ).length;
  return {
    employee,
    late: warnings.late || 0,
    absent: payroll?.absent || warnings.absent || 0,
    longBreak: warnings.longBreak || 0,
    fridayCompleted,
    payable: payroll?.payable || 0,
  };
}

function renderPerformanceSnapshot() {
  if (!els.performanceSnapshotGrid) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  const selectedId = isEmployee() ? currentEmployeeId() : els.attendanceEmployee?.value || visibleEmployees[0]?.id;
  const model = employeePerformanceSnapshot(selectedId, els.payrollMonth?.value || today().slice(0, 7));
  if (!model.employee) {
    els.performanceSnapshotGrid.innerHTML = `<div class="empty">No employee selected.</div>`;
    return;
  }
  if (els.performanceSnapshotTitle) els.performanceSnapshotTitle.textContent = `${model.employee.name} Performance Snapshot`;
  const cards = [
    { label: "Late count", value: bn.format(model.late), tone: model.late ? "warning" : "good" },
    { label: "Absent", value: bn.format(model.absent), tone: model.absent ? "danger" : "good" },
    { label: "Long break", value: bn.format(model.longBreak), tone: model.longBreak ? "warning" : "good" },
    { label: "Friday work", value: bn.format(model.fridayCompleted), tone: model.fridayCompleted ? "good" : "neutral" },
    { label: "Total payable", value: money(model.payable), tone: "good" },
  ];
  els.performanceSnapshotGrid.innerHTML = cards
    .map(
      (card) => `
        <div class="performance-card ${card.tone}">
          <small>${escapeHtml(card.label)}</small>
          <strong>${escapeHtml(card.value)}</strong>
        </div>
      `,
    )
    .join("");
}

function renderPayroll() {
  if (!els.payrollMonth) return;
  const month = els.payrollMonth.value;
  const locked = payrollLockFor(month);
  const payroll = payrollForMonth(month);
  const rows = isEmployee() ? payroll.rows.filter((row) => row.id === currentEmployeeId()) : payroll.rows;
  const summary = {
    gross: sum(rows, "salary"),
    deduction: sum(rows, "totalDeduction"),
    payable: sum(rows, "payable"),
    cutDays: sum(rows, "cutDays"),
  };
  setText("payrollHint", isEmployee() ? `${month} মাসের আপনার payroll হিসাব` : `${month} মাসের payroll হিসাব`);
  setText("payrollGross", money(summary.gross));
  setText("payrollDeduction", money(summary.deduction));
  setText("payrollPayable", money(summary.payable));
  setText("payrollCutDays", bn.format(summary.cutDays));
  if (els.payrollLockBtn) {
    els.payrollLockBtn.hidden = !isAdmin();
    els.payrollLockBtn.innerHTML = locked ? `<i data-lucide="unlock"></i> Monthly Unlock` : `<i data-lucide="lock"></i> Close Month`;
    els.payrollLockBtn.title = locked ? `${month} monthly closing locked আছে` : `${month} payroll final করে month close করুন`;
  }
  document.querySelector("#payrollTable").innerHTML =
    rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${money(row.salary)}</td>
            <td>${bn.format(row.present)}</td>
            <td>${bn.format(row.leave)}</td>
            <td>${bn.format(row.paidLeave || 0)}</td>
            <td>${bn.format(row.absent)}</td>
            <td class="amount bad">${money(row.deduction)}</td>
            <td class="amount bad">${money(row.advance)}</td>
            <td class="amount good">${money(row.weekendPay || 0)}</td>
            <td class="amount good">${money(row.additions || 0)}</td>
            <td class="amount bad">${money(row.manualDeductions || 0)}</td>
            <td class="amount good">${money(row.payable)}</td>
            <td><button class="small-action" data-payslip="${row.id}" type="button">PDF</button></td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="13" class="empty">Payroll-এর জন্য কোনো employee নেই।</td></tr>`;
}

function renderSalaryAdjustments() {
  if (!els.salaryAdjustmentList) return;
  const month = els.payrollMonth.value || today().slice(0, 7);
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  if (els.salaryAdjustmentEmployee) {
    els.salaryAdjustmentEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  }
  if (els.salaryAdjustmentMonth) els.salaryAdjustmentMonth.value = month;
  if (els.salaryAdjustmentForm) els.salaryAdjustmentForm.hidden = !isAdmin();

  const visible = (state.salaryAdjustments || [])
    .filter((item) => item.month === month)
    .filter((item) => !isEmployee() || item.employeeId === currentEmployeeId());

  els.salaryAdjustmentList.innerHTML =
    visible
      .map(
        (item) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.employeeName)} · ${escapeHtml(salaryAdjustmentLabel(item.type))} · ${money(item.amount)}</strong>
              <span class="status-pill">${salaryAdjustmentSign(item.type) > 0 ? "Addition" : "Deduction"}</span>
            </div>
            <small class="muted">${escapeHtml(item.month)} · ${escapeHtml(item.note || "No note")} · ${escapeHtml(item.createdBy || "Admin")}</small>
            ${
              isAdmin() && !monthClosed(item.month)
                ? `<div class="action-row"><button class="small-action danger" data-delete-salary-adjustment="${item.id}" type="button">Delete</button></div>`
                : ""
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">এই মাসে manual salary adjustment নেই।</div>`;
}

function saveSalaryAdjustment(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const month = els.salaryAdjustmentMonth.value || els.payrollMonth.value;
  if (monthClosed(month)) {
    alert("এই মাস payroll closed/locked আছে। আগে unlock করুন, তারপর adjustment add করুন।");
    return;
  }
  const employee = employeeById(els.salaryAdjustmentEmployee.value);
  if (!employee) return;
  state.salaryAdjustments.unshift({
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    month,
    type: els.salaryAdjustmentType.value,
    amount: Number(els.salaryAdjustmentAmount.value || 0),
    note: els.salaryAdjustmentNote.value.trim(),
    createdBy: currentUser.name || "Admin",
    createdAt: new Date().toISOString(),
  });
  logActivity("Salary Adjustment", `${employee.name} ${month} ${els.salaryAdjustmentType.value} ${els.salaryAdjustmentAmount.value}`, employee.id);
  els.salaryAdjustmentForm.reset();
  if (els.salaryAdjustmentMonth) els.salaryAdjustmentMonth.value = month;
  saveState();
  render();
}

function deleteSalaryAdjustment(id) {
  if (!isAdmin()) return;
  const item = state.salaryAdjustments.find((adjustment) => adjustment.id === id);
  if (!item) return;
  if (monthClosed(item.month)) {
    alert("এই মাস payroll closed/locked আছে। আগে unlock করুন।");
    return;
  }
  if (!confirm("এই salary adjustment delete করবেন?")) return;
  state.salaryAdjustments = state.salaryAdjustments.filter((adjustment) => adjustment.id !== id);
  logActivity("Delete Salary Adjustment", `${item.employeeName} ${item.month} ${salaryAdjustmentLabel(item.type)}`, item.employeeId);
  saveState();
  render();
}

function warningReportForMonth(month) {
  const start = `${month}-01`;
  const end = monthEnd(start);
  return employees().map((employee) => {
    const records = state.attendance.filter((item) => item.employeeId === employee.id && item.date >= start && item.date <= end);
    const breaks = (state.breaks || []).filter((item) => item.employeeId === employee.id && item.date >= start && item.date <= end);
    const late = records.filter((item) => item.status === "present" && isLate(item.shift, item.checkIn)).length;
    const earlyCheckout = records.filter((item) => item.status === "present" && item.checkOut && !isCheckoutAllowed(item.checkOut)).length;
    const missingCheckout = records.filter((item) => item.status === "present" && item.checkIn && !item.checkOut).length;
    const longBreak = breaks.filter((item) => item.endAt && BREAK_LIMIT_MINUTES[item.type] && breakDurationSeconds(item) / 60 > BREAK_LIMIT_MINUTES[item.type]).length;
    const missedBreak = breaks.filter((item) => item.startAt && !item.endAt).length;
    return { employee, late, earlyCheckout, missingCheckout, longBreak, missedBreak, total: late + earlyCheckout + missingCheckout + longBreak + missedBreak };
  });
}

function renderWarningReport() {
  if (!els.warningReportList) return;
  const month = els.payrollMonth.value || today().slice(0, 7);
  const rows = warningReportForMonth(month).filter((row) => !isEmployee() || row.employee.id === currentEmployeeId());
  els.warningReportList.innerHTML =
    rows
      .map(
        (row) => `
          <article class="fixed-item ${row.total ? "warning-row" : ""}">
            <div class="item-line">
              <strong>${escapeHtml(row.employee.name)}</strong>
              <span class="status-pill">${row.total ? `${bn.format(row.total)} warning` : "Clear"}</span>
            </div>
            <small class="muted">Late: ${bn.format(row.late)} · Early checkout: ${bn.format(row.earlyCheckout)} · Long break: ${bn.format(row.longBreak)} · Missing checkout: ${bn.format(row.missingCheckout)} · Open break: ${bn.format(row.missedBreak)}</small>
          </article>
        `,
      )
      .join("") || `<div class="empty">Warning report empty.</div>`;
}

function renderAdvance() {
  if (!els.advanceEmployee) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  els.advanceEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  if (isEmployee()) els.advanceEmployee.value = currentEmployeeId();

  const visibleAdvances = isEmployee() ? state.advances.filter((item) => item.employeeId === currentEmployeeId()) : state.advances;
  els.advanceList.innerHTML =
    visibleAdvances
      .map(
        (item) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.employeeName)} · ${money(item.amount)}</strong>
              <span class="status-pill">${escapeHtml(item.status)}</span>
            </div>
            <small class="muted">${escapeHtml(item.month)} · ${escapeHtml(item.reason || "No reason")} · Requested by ${escapeHtml(item.requestedBy)}</small>
            ${
              isAdmin() && item.status === "pending"
                ? `<div class="action-row">
                    <button class="small-action" data-approve-advance="${item.id}" type="button">Approve</button>
                    <button class="small-action danger" data-reject-advance="${item.id}" type="button">Reject</button>
                  </div>`
                : ""
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">Advance request নেই।</div>`;
}

function leaveTypeLabel(type) {
  return {
    casual: "Casual Leave",
    personal: "Casual Leave",
    sick: "Sick Leave",
    study: "Casual Leave",
    compensatory: "Compensatory Leave",
    advance_leave: "Leave in Advance",
    lwp: "Leave Without Pay",
    fixed_holiday: "Fixed Holiday",
    paid_holiday: "Fixed Holiday",
    mixed: "Mixed Leave",
    other: "Casual Leave",
  }[type] || type;
}

function renderHolidayCalendar() {
  if (!els.holidayList) return;
  if (els.holidayForm) els.holidayForm.hidden = !isAdmin();
  const holidays = [...(state.fixedHolidays || [])].sort((a, b) => a.date.localeCompare(b.date));
  els.holidayList.innerHTML =
    holidays
      .map(
        (item) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.date)} · ${escapeHtml(item.name)}</strong>
              <span class="status-pill">${item.fixed ? "Fixed" : "Admin Paid"}</span>
            </div>
            <small class="muted">${escapeHtml(item.note || "No salary cut, no leave balance cut")}</small>
            ${
              isAdmin()
                ? `<div class="action-row">
                    <button class="small-action danger" data-delete-holiday="${item.id}" type="button">Delete</button>
                  </div>`
                : ""
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">Holiday calendar empty.</div>`;
}

function renderLeave() {
  if (!els.leaveEmployee) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  els.leaveEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  if (isEmployee()) els.leaveEmployee.value = currentEmployeeId();

  const visibleLeaves = isEmployee() ? state.leaveRequests.filter((item) => item.employeeId === currentEmployeeId()) : state.leaveRequests;
  const employeeId = isEmployee() ? currentEmployeeId() : els.leaveEmployee.value || visibleEmployees[0]?.id;
  const used = leaveDaysByType(employeeId, "casual", "approved") + leaveDaysByType(employeeId, "sick", "approved");
  const pending = leaveDaysByType(employeeId, "casual", "pending") + leaveDaysByType(employeeId, "sick", "pending");
  const compBalance = employeeId ? compensatoryLeaveBalance(employeeId) : 0;
  const total = LEAVE_POLICY.casual + LEAVE_POLICY.sick;
  const remaining = casualLeaveRemaining(employeeId) + sickLeaveRemaining(employeeId);

  setText("leaveTotal", bn.format(total));
  setText("leaveUsed", bn.format(used));
  setText("leavePending", bn.format(pending));
  setText("leaveCompBalance", bn.format(compBalance));
  setText("leaveRemaining", bn.format(remaining));
  setText("leaveFixedHolidayTotal", bn.format((state.fixedHolidays || []).length || LEAVE_POLICY.fixedHoliday));
  setText("leaveAdvanceBalance", bn.format(advanceLeaveRemaining(employeeId)));
  setText("leaveHint", isEmployee() ? "আপনার leave balance ও request history" : "নির্বাচিত কর্মীর leave balance এবং সব request");

  els.leaveList.innerHTML =
    visibleLeaves
      .map(
        (item) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.employeeName)} · ${escapeHtml(leaveTypeLabel(item.type))}</strong>
              <span class="status-pill">${escapeHtml(item.status)}</span>
            </div>
            <small class="muted">${escapeHtml(item.start)} to ${escapeHtml(item.end)} · ${bn.format(item.days || 0)} days · ${escapeHtml(leaveBreakdownSummary(item) || leaveTypeLabel(item.type))} · ${escapeHtml(item.reason || "No reason")}</small>
            ${
              isAdmin() && item.status === "pending"
                ? `<div class="action-row">
                    <button class="small-action" data-approve-leave="${item.id}" type="button">Approve</button>
                    <button class="small-action danger" data-reject-leave="${item.id}" type="button">Reject</button>
                  </div>`
                : ""
            }
          </article>
        `,
      )
      .join("") || `<div class="empty">Leave request নেই।</div>`;
}

function renderLeaveDecisionPreview() {
  if (!els.leaveDecisionPreview || !els.leaveEmployee) return;
  const employeeId = isEmployee() ? currentEmployeeId() : els.leaveEmployee.value;
  const employee = employeeById(employeeId);
  const start = els.leaveStart.value;
  const end = els.leaveEnd.value;
  if (!employee || !start || !end || end < start) {
    els.leaveDecisionPreview.textContent = "Leave date/type দিলে এখানে auto decision দেখাবে।";
    els.leaveDecisionPreview.dataset.status = "empty";
    return;
  }
  const breakdown = buildLeaveBreakdown(employee.id, els.leaveType.value, start, end, els.leaveReason.value);
  const counts = breakdown.reduce((result, day) => {
    result[day.type] = (result[day.type] || 0) + 1;
    return result;
  }, {});
  const parts = Object.entries(counts).map(([type, count]) => `${bn.format(count)} দিন ${leaveTypeLabel(type)}`);
  els.leaveDecisionPreview.textContent = `Auto decision: ${parts.join(", ")}।`;
  els.leaveDecisionPreview.dataset.status = counts.lwp ? "warning" : "ok";
}

function renderEmployeeAccess() {
  if (!els.employeeAccessEmployee) return;
  if (supabaseEnabled()) {
    if (els.employeeAccessForm) els.employeeAccessForm.hidden = true;
    els.employeeAccessList.innerHTML = `
      <article class="fixed-item">
        <div class="item-line">
          <strong>Supabase Auth Active</strong>
          <span class="status-pill">Secure</span>
        </div>
        <small class="muted">Employee PIN setup বন্ধ আছে। Employee password Supabase Authentication > Users অথবা login page-এর reset link দিয়ে set/reset হবে।</small>
      </article>
    `;
    return;
  }
  if (els.employeeAccessForm) els.employeeAccessForm.hidden = false;
  ensureEmployeeAccess();
  els.employeeAccessEmployee.innerHTML = employees().map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  els.employeeAccessList.innerHTML =
    state.employeeAccess
      .map((access) => {
        const employee = employeeForAccess(access);
        return `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(employee?.name || "Unknown employee")}</strong>
              <span class="status-pill">${access.active ? "Active" : "Inactive"}</span>
            </div>
            <small class="muted">PIN: ${normalizePin(access.pin) ? "*".repeat(String(access.pin).length) : "সেট করা নেই"}</small>
            <div class="action-row">
              <button class="small-action" data-toggle-employee-access="${access.id}" type="button">${access.active ? "Inactive" : "Active"}</button>
              <button class="small-action danger" data-delete-employee-access="${access.id}" type="button">ডিলিট</button>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">Employee access নেই।</div>`;
}

function renderEmployeeProfiles() {
  if (!els.employeeProfileList) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  if (els.employeeProfileForm) els.employeeProfileForm.hidden = isEmployee();
  if (els.profileEmployee) {
    const current = els.profileEmployee.value;
    els.profileEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
    if (visibleEmployees.some((employee) => employee.id === current)) els.profileEmployee.value = current;
    fillEmployeeProfileForm();
  }

  els.employeeProfileList.innerHTML =
    visibleEmployees
      .map((employee) => {
        const profile = employeeProfileFor(employee.id);
        const pin = employeePinFor(employee.id);
        return `
          <article class="fixed-item profile-card">
            <div class="item-line">
              <strong>${escapeHtml(employee.name)} · ${money(employee.salary)}</strong>
              <span class="status-pill">${escapeHtml(profile.status || "active")}</span>
            </div>
            <div class="profile-details">
              <span>Shift: ${escapeHtml(shiftLabel(profile.shift || "morning"))}</span>
              <span>PIN: ${escapeHtml(pin)}</span>
              <span>Join: ${escapeHtml(profile.joinDate || "-")}</span>
              <span>Phone: ${escapeHtml(profile.phone || "-")}</span>
              <span>Emergency: ${escapeHtml(profile.emergencyContact || "-")}</span>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">Employee profile নেই।</div>`;
}

function fillEmployeeProfileForm() {
  if (!els.profileEmployee || !els.profileShift) return;
  const profile = employeeProfileFor(els.profileEmployee.value);
  els.profileShift.value = profile.shift || "morning";
  els.profileJoinDate.value = profile.joinDate || "";
  els.profilePhone.value = profile.phone || "";
  els.profileEmergency.value = profile.emergencyContact || "";
  els.profileStatus.value = profile.status || "active";
}

function saveEmployeeProfile(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const employee = employeeById(els.profileEmployee.value);
  if (!employee) return;
  const profile = employeeProfileFor(employee.id);
  profile.employeeName = employee.name;
  profile.shift = els.profileShift.value;
  profile.joinDate = els.profileJoinDate.value;
  profile.phone = els.profilePhone.value.trim();
  profile.emergencyContact = els.profileEmergency.value.trim();
  profile.status = els.profileStatus.value;
  profile.updatedAt = new Date().toISOString();
  profile.updatedBy = currentUser.name || "Admin";
  logActivity("Employee Profile", `${employee.name} profile updated`, employee.id);
  saveState();
  render();
}

function renderLeaveCalendar() {
  if (!els.leaveCalendarGrid || !els.leaveCalendarMonth) return;
  const month = els.leaveCalendarMonth.value || els.payrollMonth.value || today().slice(0, 7);
  els.leaveCalendarMonth.value = month;
  const start = `${month}-01`;
  const end = monthEnd(start);
  const visibleIds = isEmployee() ? [currentEmployeeId()] : employees().map((employee) => employee.id);
  const visibleNames = new Map(employees().map((employee) => [employee.id, employee.name]));

  els.leaveCalendarGrid.innerHTML = dateRange(start, end)
    .map((date) => {
      const items = [];
      state.fixedHolidays
        .filter((holiday) => holiday.date === date)
        .forEach((holiday) => items.push(`<span class="calendar-tag holiday">${escapeHtml(holiday.name)}</span>`));
      state.leaveRequests
        .filter((leave) => {
          const leaveStart = leave.startDate || leave.start;
          const leaveEnd = leave.endDate || leave.end;
          return leave.status === "approved" && visibleIds.includes(leave.employeeId) && leaveStart <= date && leaveEnd >= date;
        })
        .forEach((leave) => items.push(`<span class="calendar-tag leave">${escapeHtml(visibleNames.get(leave.employeeId) || leave.employeeName)} · ${escapeHtml(leaveTypeLabel(leave.type))}</span>`));
      state.fridayWorkRequests
        .filter((request) => ["approved", "completed"].includes(request.status) && visibleIds.includes(request.employeeId) && request.work_date === date)
        .forEach((request) => items.push(`<span class="calendar-tag friday">${escapeHtml(visibleNames.get(request.employeeId) || request.employeeName)} · Friday Work</span>`));

      return `
        <article class="calendar-day ${items.length ? "has-items" : ""}">
          <strong>${bn.format(Number(date.slice(8, 10)))}</strong>
          ${items.join("") || `<span class="muted">-</span>`}
        </article>
      `;
    })
    .join("");
}

function renderNotifications() {
  if (!els.notificationList) return;
  els.notificationList.innerHTML =
    state.notifications
      .slice(0, 20)
      .map((item) => {
        const waPhone = String(item.phone || "01676182447").replace(/^0/, "880");
        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(item.message)}`;
        return `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.type)}</strong>
              <span class="status-pill">${item.sent ? "Sent" : "Pending"}</span>
            </div>
            <small class="muted">${escapeHtml(item.message)}</small>
            <div class="action-row">
              <a class="small-action" href="${url}" target="_blank" rel="noreferrer">Send WhatsApp</a>
              <button class="small-action" data-copy-notification="${item.id}" type="button">Copy</button>
              <button class="small-action" data-mark-notification="${item.id}" type="button" ${item.sent ? "disabled" : ""}>
                ${item.sent ? "Already Sent" : "Mark Sent"}
              </button>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">Notification নেই।</div>`;
}

function renderCloudSettings() {
  if (!els.cloudApiUrl) return;
  els.cloudApiUrl.value = cloudUrl();
  const backupButtons = [
    ["saveCloudUrlBtn", "Backup URL Save"],
    ["syncFromCloudBtn", "Backup Import"],
    ["syncToCloudBtn", "Backup Export"],
  ];
  backupButtons.forEach(([id, label]) => {
    const button = document.querySelector(`#${id}`);
    if (button) button.lastChild.textContent = ` ${label}`;
  });
  if (els.supabaseUrl) {
    const config = supabaseConfig();
    els.supabaseUrl.value = config.url;
    els.supabaseAnonKey.value = config.anonKey;
    setSupabaseStatus(supabaseEnabled() ? "Supabase ready. Email/password login active." : "Supabase off. SQL setup kore URL/anon key din.", supabaseEnabled() ? "ready" : "off");
  }
  if (!cloudUrl()) setCloudStatus("Cloud sync বন্ধ আছে। Apps Script Web App URL দিলে live data sync হবে।");
  if (els.cloudStatus && !cloudUrl()) {
    setCloudStatus(supabaseEnabled() ? "Google Sheets backup/report ready. Main live data is Supabase." : "Google Sheets backup off. Supabase live database setup korun.");
  }
  if (els.pinForm) els.pinForm.hidden = supabaseEnabled();
  if (els.managerForm) els.managerForm.hidden = supabaseEnabled();
  renderEmployeeSetupWizard();
  renderOfficeLocationSettings();
  renderPermissionMatrix();
}

function renderEmployeeSetupWizard() {
  if (!els.employeeSetupSteps) return;
  const activeEmployees = employees();
  const accessRows = state.employeeAccess || [];
  const linkedEmployees = activeEmployees.filter((employee) =>
    accessRows.some((access) => access.employeeId === employee.id && String(access.email || "").includes("@")),
  );
  const missingEmployees = activeEmployees.filter((employee) => !linkedEmployees.some((linked) => linked.id === employee.id));
  const steps = [
    {
      ok: supabaseEnabled(),
      title: "Supabase Auth active",
      text: supabaseEnabled() ? "Email + password login cholche." : "Supabase URL/anon key save korun.",
    },
    {
      ok: Boolean(state.dashboardAccess?.admin?.email),
      title: "Admin email linked",
      text: state.dashboardAccess?.admin?.email || "Admin email set korun.",
    },
    {
      ok: activeEmployees.length > 0,
      title: "Employee profile ready",
      text: `${bn.format(activeEmployees.length)} active employee profile.`,
    },
    {
      ok: missingEmployees.length === 0 && activeEmployees.length > 0,
      title: "Employee email link",
      text: missingEmployees.length
        ? `${missingEmployees.map((employee) => employee.name).join(", ")} email link missing.`
        : `${bn.format(linkedEmployees.length)} employee email linked.`,
    },
    {
      ok: true,
      title: "Password setup rule",
      text: "Password dashboard-e save hobe na. Supabase Auth Users/reset link diye manage korun.",
    },
  ];
  els.employeeSetupSteps.innerHTML = steps
    .map(
      (step, index) => `
        <article class="setup-step ${step.ok ? "done" : "pending"}">
          <span class="status-pill">${step.ok ? "OK" : "Need"}</span>
          <div>
            <strong>${bn.format(index + 1)}. ${escapeHtml(step.title)}</strong>
            <small class="muted">${escapeHtml(step.text)}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPermissionMatrix() {
  if (!els.permissionMatrix) return;
  const rows = [
    ["Feature", "Admin", "Manager", "Employee"],
    ["Dashboard & reports", "Full", "Team view", "Own data"],
    ["Attendance", "Add/Edit/Approve", "Add/Request", "Check in/out"],
    ["Break", "Full control", "Team report", "Own break"],
    ["Payroll", "Generate/Adjust", "View team", "Own payslip"],
    ["Leave/Friday work", "Approve", "Request/Team view", "Request only"],
    ["Settings & backup", "Full", "No", "No"],
  ];
  els.permissionMatrix.innerHTML = rows
    .map((row, index) => `<div class="${index === 0 ? "permission-head" : ""}">${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`)
    .join("");
}

function renderOfficeLocationSettings() {
  if (!els.officeLocationEnabled) return;
  const office = officeLocation();
  els.officeLocationEnabled.checked = Boolean(office.enabled);
  els.officeLatitude.value = office.latitude || "";
  els.officeLongitude.value = office.longitude || "";
  els.officeRadius.value = office.radiusMeters || 100;
  const ready = officeLocationReady();
  const text = ready
    ? `Office location চালু: ${office.latitude}, ${office.longitude} | Radius ${bn.format(office.radiusMeters)}m`
    : "Office location সেট করা নেই বা বন্ধ আছে।";
  if (els.officeLocationStatus) els.officeLocationStatus.textContent = text;
  if (els.attendanceLocationStatus) {
    els.attendanceLocationStatus.textContent = ready
      ? `Employee check-in/check-out office radius ${bn.format(office.radiusMeters)}m-এর ভিতরে হতে হবে।`
      : "Office location verification বন্ধ আছে।";
  }
}

function statusLabel(status) {
  return {
    present: "Present",
    paid_leave: "Paid Leave",
    paid_holiday: "Fixed Holiday",
    leave: "Leave - Cut",
    absent: "Absent - Cut",
  }[status] || status;
}

function shiftLabel(shift) {
  return {
    morning: "Morning Shift",
    evening: "Evening Shift",
    night: "Night Shift",
  }[shift] || shift;
}

function requestTitle(request) {
  return {
    add_entry: "Daily entry approval request",
    bulk_entries: "Range entries approval request",
    attendance_punch: "Attendance approval request",
    correction_request: "Attendance correction request",
    leave_request: "Leave approval request",
    edit_entry: "Entry edit request",
    delete_entry: "Entry delete request",
    toggle_fixed: "Fixed expense update request",
    delete_fixed: "Fixed expense delete request",
    delete_category: "Category delete request",
    save_fixed: "Fixed expense save request",
  }[request.action] || request.action;
}

function requestDescription(request) {
  if (request.action === "add_entry") return `${labelFor(request.payload.category)} · ${money(request.payload.amount)} · ${request.payload.date}`;
  if (request.action === "bulk_entries") return `${labelFor(request.payload.category)} · ${money(request.payload.total)} · ${request.payload.start} to ${request.payload.end} · ${bn.format(request.payload.entries?.length || 0)} entries`;
  if (request.action === "attendance_punch") return `${request.payload.employeeName} · ${request.payload.date} · ${request.payload.reason}`;
  if (request.action === "correction_request") return `${correctionDescription(request.payload)} · ${request.payload.reason || ""}`;
  if (request.action === "edit_entry") return `${labelFor(request.payload.category)} · ${money(request.payload.amount)} · ${request.payload.date}`;
  if (request.action === "leave_request") return `${request.payload.employeeName} · ${request.payload.start} to ${request.payload.end} · ${bn.format(request.payload.days)} days`;
  if (request.action === "delete_entry") return `Entry ID: ${request.payload.id}`;
  if (request.action === "toggle_fixed" || request.action === "delete_fixed") return `Fixed ID: ${request.payload.id}`;
  if (request.action === "delete_category") return `${request.payload.type}: ${request.payload.category}`;
  if (request.action === "save_fixed") return `${request.payload.name} · ${money(request.payload.amount)}`;
  return "পরিবর্তনের অনুরোধ";
}

function renderCategories() {
  els.categoryList.innerHTML = ["income", "expense"]
    .flatMap((type) =>
      state.categories[type].map(
        (category) => `
          <div class="chip">
            <span>${type === "income" ? "আয়" : "খরচ"}: ${escapeHtml(labelFor(category))}</span>
            <button class="small-action danger" data-delete-category="${type}:${category}" type="button">ডিলিট</button>
          </div>
        `,
      ),
    )
    .join("");
}

function renderReports() {
  const start = els.reportStart.value;
  const end = els.reportEnd.value;
  const totals = totalsForRange(start, end);
  setText("reportRangeLabel", `${start} থেকে ${end} পর্যন্ত রিপোর্ট`);
  setText("reportIncome", money(totals.income));
  setText("reportBoost", money(totals.boost));
  setText("reportFixed", money(totals.fixedTotal));
  setText("reportNet", money(totals.net));
  setText("reportStatus", totals.net >= 0 ? "লাভ" : "লস");
  document.querySelector("#reportNet").className = totals.net >= 0 ? "amount good" : "amount bad";

  const categoryMap = new Map();
  totals.entries.forEach((entry) => {
    const key = `${entry.type}:${entry.category}`;
    const current = categoryMap.get(key) || { type: entry.type, category: entry.category, amount: 0 };
    current.amount += Number(entry.amount || 0);
    categoryMap.set(key, current);
  });
  categoryMap.set("expense:fixed_cost", { type: "expense", category: "fixed_cost", amount: totals.fixedTotal });

  document.querySelector("#categoryReportTable").innerHTML = Array.from(categoryMap.values())
    .map(
      (row) => `
        <tr>
          <td>${row.category === "fixed_cost" ? "ফিক্সড খরচ" : escapeHtml(labelFor(row.category))}</td>
          <td>${row.type === "income" ? "আয়" : "খরচ"}</td>
          <td class="amount ${row.type === "income" ? "good" : "bad"}">${money(row.amount)}</td>
        </tr>
      `,
    )
    .join("");

  document.querySelector("#dailyReportTable").innerHTML = dateRange(start, end)
    .map((date) => {
      const item = totalsForDate(date);
      return `
        <tr>
          <td>${date}</td>
          <td class="amount good">${money(item.income)}</td>
          <td class="amount bad">${money(item.expense)}</td>
          <td class="amount ${item.net >= 0 ? "good" : "bad"}">${money(item.net)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderBackupStatus() {
  const backups = getBackups();
  if (!els.backupStatus) return;
  if (!backups.length) {
    els.backupStatus.textContent = "Auto backup এখনো তৈরি হয়নি।";
    renderBackupVersions(backups);
    return;
  }
  const latest = new Date(backups[0].createdAt).toLocaleString("bn-BD");
  els.backupStatus.textContent = `শেষ auto backup: ${latest} | মোট snapshot: ${bn.format(backups.length)}`;
  renderBackupVersions(backups);
}

function renderBackupVersions(backups = getBackups()) {
  if (!els.backupVersionSelect) return;
  els.backupVersionSelect.innerHTML =
    backups
      .map((backup, index) => {
        const created = new Date(backup.createdAt).toLocaleString("bn-BD");
        const data = backup.data || {};
        const count = Number(data.entries?.length || 0) + Number(data.attendance?.length || 0) + Number(data.breaks?.length || 0);
        return `<option value="${index}">${created} · ${bn.format(count)} records</option>`;
      })
      .join("") || `<option value="">Backup নেই</option>`;
  if (els.restoreBackupVersionBtn) els.restoreBackupVersionBtn.disabled = !backups.length;
  if (els.deleteBackupVersionBtn) els.deleteBackupVersionBtn.disabled = !backups.length;
  if (els.clearAllBackupsBtn) els.clearAllBackupsBtn.disabled = !backups.length;
  if (els.backupVersionHint) {
    els.backupVersionHint.textContent = backups.length
      ? "Restore করার আগে তারিখ দেখে version select করুন।"
      : "Auto backup তৈরি হলে এখানে version list দেখা যাবে।";
  }
}

function normalizeRestoredState(nextState) {
  const defaults = defaultState();
  return {
    ...defaults,
    ...nextState,
    settings: { ...defaults.settings, ...(nextState.settings || {}) },
    categories: { ...defaults.categories, ...(nextState.categories || {}) },
      breaks: nextState.breaks || [],
      fridayWorkRequests: nextState.fridayWorkRequests || [],
      activityLogs: nextState.activityLogs || [],
    leaveRequests: nextState.leaveRequests || [],
    employeeProfiles: nextState.employeeProfiles || [],
    fixedHolidays: nextState.fixedHolidays || defaults.fixedHolidays,
    salaryAdjustments: nextState.salaryAdjustments || [],
    payrollLocks: nextState.payrollLocks || [],
  };
}

function applyRestoredState(nextState) {
  if (!nextState || typeof nextState !== "object" || !Array.isArray(nextState.fixedExpenses)) {
    throw new Error("Valid dashboard backup পাওয়া যায়নি।");
  }
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, normalizeRestoredState(nextState));
}

function restoreBackupVersion() {
  if (!isAdmin()) return;
  const backups = getBackups();
  const index = Number(els.backupVersionSelect?.value);
  const selected = backups[index];
  if (!selected?.data) {
    alert("Restore করার মতো backup version পাওয়া যায়নি।");
    return;
  }
  const created = new Date(selected.createdAt).toLocaleString("bn-BD");
  if (!confirm(`${created} backup restore করলে current dashboard data replace হবে। চালাবেন?`)) return;
  try {
    applyRestoredState(selected.data);
    logActivity("Restore Backup", created, "backup");
    saveState();
    render();
    alert("Selected backup restore হয়েছে।");
  } catch (error) {
    alert(`Restore failed: ${error.message}`);
  }
}

function deleteBackupVersion() {
  if (!isAdmin()) return;
  const backups = getBackups();
  const index = Number(els.backupVersionSelect?.value);
  const selected = backups[index];
  if (!selected) {
    alert("Delete করার মতো backup version পাওয়া যায়নি।");
    return;
  }
  const created = new Date(selected.createdAt).toLocaleString("bn-BD");
  if (!confirm(`${created} backup snapshot delete করবেন? Current dashboard data থাকবে।`)) return;
  backups.splice(index, 1);
  setBackups(backups);
  renderBackupStatus();
  if (window.lucide) lucide.createIcons();
}

function clearAllBackups() {
  if (!isAdmin()) return;
  const backups = getBackups();
  if (!backups.length) return;
  if (!confirm(`মোট ${bn.format(backups.length)}টি auto backup snapshot delete করবেন? Current dashboard data থাকবে।`)) return;
  localStorage.removeItem(BACKUP_KEY);
  renderBackupStatus();
  if (window.lucide) lucide.createIcons();
}

function clearOldNotifications() {
  if (!isAdmin()) return;
  const before = state.notifications.length;
  state.notifications = state.notifications.filter((item) => !item.sent);
  saveState();
  render();
  alert(`${bn.format(before - state.notifications.length)} sent notification cleaned.`);
}

function clearRejectedRequests() {
  if (!isAdmin()) return;
  const before = state.approvals.length;
  state.approvals = state.approvals.filter((item) => item.status !== "rejected");
  saveState();
  render();
  alert(`${bn.format(before - state.approvals.length)} rejected approval request cleaned.`);
}

function clearEmptyBackups() {
  if (!isAdmin()) return;
  const backups = getBackups();
  const next = backups.filter((backup) => {
    const data = backup.data || {};
    return ["entries", "attendance", "breaks", "leaveRequests", "approvals"].some((key) => (data[key] || []).length);
  });
  setBackups(next);
  renderBackupStatus();
  alert(`${bn.format(backups.length - next.length)} empty backup cleaned.`);
}

function renderChart(dateString) {
  const canvas = document.querySelector("#trendChart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const start = monthStart(dateString);
  const end = monthEnd(dateString);
  const points = dateRange(start, end).map((date) => {
    const total = totalsForDate(date);
    return { date, income: total.income, expense: total.expense };
  });

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8faf9";
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 22, right: 18, bottom: 42, left: 58 };
  const maxValue = Math.max(1000, ...points.flatMap((point) => [point.income, point.expense]));
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  ctx.strokeStyle = "#dbe4df";
  ctx.lineWidth = 1;
  ctx.font = "15px Hind Siliguri";
  ctx.fillStyle = "#66736d";

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const value = maxValue - (maxValue / 4) * i;
    ctx.fillText(`৳${bn.format(Math.round(value))}`, 8, y + 5);
  }

  drawLine(ctx, points, "income", "#16804f", padding, plotW, plotH, maxValue);
  drawLine(ctx, points, "expense", "#b64242", padding, plotW, plotH, maxValue);
  ctx.fillStyle = "#17211d";
  ctx.fillText("সবুজ: আয়", padding.left, height - 13);
  ctx.fillStyle = "#b64242";
  ctx.fillText("লাল: খরচ", padding.left + 95, height - 13);
}

function drawLine(ctx, points, key, color, padding, plotW, plotH, maxValue) {
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = padding.left + (plotW / Math.max(points.length - 1, 1)) * index;
    const y = padding.top + plotH - (point[key] / maxValue) * plotH;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function addEntry(event) {
  event.preventDefault();
  const entry = {
    id: crypto.randomUUID(),
    type: els.entryType.value,
    category: els.entryCategory.value,
    amount: Number(els.entryAmount.value),
    date: els.entryDate.value,
    note: els.entryNote.value.trim(),
    createdBy: currentUser.name || "Admin",
    createdAt: new Date().toISOString(),
  };

  if (isAdmin()) {
    state.entries.push(approvedEntry(entry));
    saveState();
  } else {
    addApproval("add_entry", entry);
  }

  els.entryForm.reset();
  els.entryDate.value = els.selectedDate.value;
  render();
}

function addBulkEntries(event) {
  event.preventDefault();
  const start = els.bulkStart.value;
  const end = els.bulkEnd.value;
  if (end < start) {
    alert("শেষ তারিখ শুরু তারিখের আগে হতে পারবে না।");
    return;
  }

  const dates = dateRange(start, end);
  const total = Number(els.bulkAmount.value || 0);
  const note = els.bulkNote.value.trim();
  const type = els.bulkType.value;
  const category = els.bulkCategory.value;
  const mode = els.bulkMode.value;
  const batchId = crypto.randomUUID();
  const entries = [];

  if (mode === "single") {
    entries.push({
      id: crypto.randomUUID(),
      type,
      category,
      amount: total,
      date: end,
      note: note || `রেঞ্জ এন্ট্রি: ${start} থেকে ${end}`,
      createdBy: currentUser.name || "Admin",
      createdAt: new Date().toISOString(),
      batchId,
      rangeStart: start,
      rangeEnd: end,
    });
  } else {
    const perDay = total / dates.length;
    dates.forEach((date, index) => {
      const amount = index === dates.length - 1 ? total - perDay * (dates.length - 1) : perDay;
      entries.push({
        id: crypto.randomUUID(),
        type,
        category,
        amount,
        date,
        note: note || `রেঞ্জ এন্ট্রি: ${start} থেকে ${end}`,
        createdBy: currentUser.name || "Admin",
        createdAt: new Date().toISOString(),
        batchId,
        rangeStart: start,
        rangeEnd: end,
      });
    });
  }

  if (isAdmin()) {
    state.entries.push(...entries.map(approvedEntry));
    saveState();
  } else {
    addApproval("bulk_entries", {
      entries,
      start,
      end,
      type,
      category,
      total,
      mode,
    });
  }

  els.bulkEntryForm.reset();
  els.bulkStart.value = els.dailyStart.value;
  els.bulkEnd.value = els.dailyEnd.value;
  render();
  if (isAdmin()) alert(`${bn.format(entries.length)}টি এন্ট্রি যোগ হয়েছে।`);
}

async function attachLocationIfNeeded(payload) {
  if (!isEmployee() || payload.status !== "present" || !officeLocationReady()) return true;

  try {
    if (els.attendanceLocationStatus) els.attendanceLocationStatus.textContent = "Location verify করা হচ্ছে...";
    const location = await verifyOfficeLocation();
    if (!location.allowed) {
      els.attendanceLocationStatus.textContent = `Office radius-এর বাইরে: ${bn.format(location.distance)}m দূরে। Attendance save হয়নি।`;
      alert(`আপনি office radius-এর বাইরে আছেন (${location.distance}m)। Attendance save হয়নি।`);
      return false;
    }
    if (location.accuracy > 100) {
      els.attendanceLocationStatus.textContent = `GPS accuracy weak: ${bn.format(location.accuracy)}m. Better signal নিয়ে আবার try করা ভালো।`;
      if (!confirm(`GPS accuracy ${location.accuracy}m. Location weak হলে attendance ভুল হতে পারে। তারপরও continue করবেন?`)) return false;
    }
    payload.location = location;
    els.attendanceLocationStatus.textContent = `Location verified: office থেকে ${bn.format(location.distance)}m দূরে।`;
    return true;
  } catch (error) {
    els.attendanceLocationStatus.textContent = `Location পাওয়া যায়নি: ${error.message}`;
    alert("Location permission allow না করলে employee attendance save হবে না।");
    return false;
  }
}

function persistAttendance(payload, employee, resetForm = true) {
  const existing = attendanceFor(payload.date, payload.employeeId);
  let record;

  if (existing) {
    Object.assign(existing, payload);
    record = existing;
  } else {
    record = { id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() };
    state.attendance.push(record);
  }

  linkFridayWorkAttendance(record);

  if (payload.status === "present" && isLate(payload.shift, payload.checkIn)) {
    addNotification("Late Arrival Alert", `${employee.name} ${payload.date} তারিখে ${shiftLabel(payload.shift)}-এ late check-in করেছে: ${payload.checkIn}`);
  }
  if (payload.status === "leave") {
    addNotification("Leave Approval Alert", `${employee.name}-এর ${payload.date} তারিখের leave marked/approved হয়েছে।`);
  }

  if (resetForm) {
    els.attendanceForm.reset();
    els.attendanceDate.value = payload.date;
  }
  saveState();
  render();
  return record;
}

function fridayAttendanceBlockReason(date, employeeId) {
  if (!isFriday(date)) return "";
  return approvedFridayWorkFor(date, employeeId) ? "" : "শুক্রবার off day। Friday Work approval ছাড়া check-in/check-out করা যাবে না।";
}

function linkFridayWorkAttendance(record) {
  if (!record || !isFriday(record.date)) return;
  const request = approvedFridayWorkFor(record.date, record.employeeId);
  if (!request) return;
  request.attendance_id = record.id;
  request.updated_at = new Date().toISOString();
  if (record.checkIn && record.checkOut) {
    request.status = "completed";
    if (request.request_type === "extra_salary") request.salary_added = true;
    if (request.request_type === "compensatory_leave") request.compensatory_leave_added = true;
  }
}

function requestAttendanceApproval(payload, employee, reason) {
  addApproval("attendance_punch", {
    ...payload,
    employeeName: employee.name,
    reason,
    requestedAt: new Date().toISOString(),
  });
  addNotification("Attendance Approval Alert", `${employee.name} ${payload.date} attendance approval দরকার: ${reason}`);
  saveState();
  render();
}

async function saveAttendancePunch(kind) {
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employees().find((item) => item.id === els.attendanceEmployee.value);
  if (!employee) return;

  const date = today();
  if (!ensureMonthEditable(date)) return;
  const existing = attendanceFor(date, employee.id);
  const payload = {
    employeeId: employee.id,
    employeeName: employee.name,
    date,
    status: "present",
    shift: existing?.shift || els.attendanceShift.value || "morning",
    checkIn: existing?.checkIn || "",
    checkOut: existing?.checkOut || "",
    breakMinutes: existing?.breakMinutes || Number(els.attendanceBreak.value || 0),
    note: existing?.note || "",
    markedBy: currentUser.name || "Admin",
    updatedAt: new Date().toISOString(),
  };

  if (kind === "in") {
    if (payload.checkIn) {
      alert("আজ check-in already save আছে। Update দরকার হলে Admin/Manager correction ব্যবহার করুন।");
      renderAttendanceActionState();
      return;
    }
    payload.checkIn = currentTimeValue();
  }

  if (kind === "out") {
    if (!payload.checkIn) {
      alert("আগে check-in করতে হবে, তারপর check-out করা যাবে।");
      renderAttendanceActionState();
      return;
    }
    if (payload.checkOut) {
      alert("আজ check-out already save আছে। Update দরকার হলে Admin/Manager correction ব্যবহার করুন।");
      renderAttendanceActionState();
      return;
    }
    payload.checkOut = currentTimeValue();
  }

  const fridayBlock = isEmployee() ? fridayAttendanceBlockReason(payload.date, payload.employeeId) : "";
  if (fridayBlock) {
    alert(`${fridayBlock} আগে Friday Work Request পাঠান।`);
    renderAttendanceActionState();
    return;
  }

  const verified = await attachLocationIfNeeded(payload);
  if (!verified) return;

  const reason = !isAdmin() ? attendanceApprovalReason(payload) : "";
  if (reason) {
    requestAttendanceApproval(payload, employee, reason);
    alert("এই attendance admin approval লাগবে। Request পাঠানো হয়েছে।");
    return;
  }

  persistAttendance(payload, employee, false);
  alert(kind === "in" ? "Check-in save হয়েছে।" : "Check-out save হয়েছে।");
}

async function saveAttendance(event) {
  event.preventDefault();
  const employee = employees().find((item) => item.id === els.attendanceEmployee.value);
  if (!employee) return;
  if (!ensureMonthEditable(els.attendanceDate.value)) return;

  const payload = {
    employeeId: employee.id,
    employeeName: employee.name,
    date: els.attendanceDate.value,
    status: els.attendanceStatus.value,
    shift: els.attendanceShift.value,
    checkIn: els.attendanceCheckIn.value,
    checkOut: els.attendanceCheckOut.value,
    breakMinutes: Number(els.attendanceBreak.value || 0),
    note: els.attendanceNote.value.trim(),
    markedBy: currentUser.name || "Admin",
    updatedAt: new Date().toISOString(),
  };

  const fridayBlock = isEmployee() ? fridayAttendanceBlockReason(payload.date, payload.employeeId) : "";
  if (fridayBlock) {
    alert(`${fridayBlock} আগে Friday Work Request পাঠান।`);
    return;
  }

  const verified = await attachLocationIfNeeded(payload);
  if (!verified) return;

  const reason = !isAdmin() ? attendanceApprovalReason(payload) : "";
  if (reason) {
    requestAttendanceApproval(payload, employee, reason);
    alert("এই attendance admin approval লাগবে। Request পাঠানো হয়েছে।");
    return;
  }

  const existing = attendanceFor(payload.date, payload.employeeId);

  if (existing) {
    Object.assign(existing, payload);
  } else {
    state.attendance.push({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() });
  }

  if (payload.status === "present" && isLate(payload.shift, payload.checkIn)) {
    addNotification("Late Arrival Alert", `${employee.name} ${payload.date} তারিখে ${shiftLabel(payload.shift)}-এ late check-in করেছে: ${payload.checkIn}`);
  }
  if (payload.status === "leave") {
    addNotification("Leave Approval Alert", `${employee.name}-এর ${payload.date} তারিখের leave marked/approved হয়েছে।`);
  }

  els.attendanceForm.reset();
  els.attendanceDate.value = payload.date;
  saveState();
  render();
}

function isoForDateTime(date, time) {
  return new Date(`${date}T${time || "00:00"}:00`).toISOString();
}

function startBreak(event) {
  event.preventDefault();
  if (!ensureMonthEditable(today())) return;
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employees().find((item) => item.id === els.breakEmployee.value);
  if (!employee) return;
  const breakType = els.breakType.value;
  const note = els.breakNote.value.trim();
  if (["personal", "official"].includes(breakType) && !note) {
    alert("Personal/Official Break হলে note বাধ্যতামূলক। যেমন: Bank / Delivery / Market");
    els.breakNote.focus();
    return;
  }

  const running = activeBreakFor(employee.id);
  if (running) {
    alert(`You are already on ${breakLabel(running.type)}. Please end the current break before starting a new one.`);
    renderBreaks();
    return;
  }

  const attendance = attendanceFor(today(), employee.id);
  if (isEmployee() && (!attendance?.checkIn || attendance?.checkOut)) {
    alert("Break start করার আগে আজকের check-in থাকতে হবে এবং check-out হয়ে গেলে আর break start করা যাবে না।");
    return;
  }

  const now = new Date();
  const startTime = currentTimeValue();
  state.breaks.unshift({
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    type: breakType,
    date: today(),
    startAt: now.toISOString(),
    startTime,
    endAt: "",
    endTime: "",
    durationSeconds: 0,
    note,
    createdBy: currentUser.name || employee.name,
    createdAt: now.toISOString(),
  });

  els.breakNote.value = "";
  logActivity("Start Break", `${employee.name} started ${breakLabel(breakType)} at ${startTime}`, employee.id);
  saveState();
  render();
}

function endBreak() {
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employees().find((item) => item.id === els.breakEmployee.value);
  if (!employee) return;
  const running = activeBreakFor(employee.id);
  if (running && !ensureMonthEditable(running.date)) return;
  if (!running) {
    alert("Running break নেই।");
    return;
  }

  const now = new Date();
  running.endAt = now.toISOString();
  running.endTime = currentTimeValue();
  running.durationSeconds = breakDurationSeconds(running);
  running.updatedAt = now.toISOString();
  running.updatedBy = currentUser.name || employee.name;
  if (isBreakOverLimit(running)) {
    addNotification("Break Limit Alert", `${employee.name} ${breakLabel(running.type)} ${formatBreakMinutes(running.durationSeconds)} নিয়েছে। Salary auto cut হবে না।`);
  }
  logActivity("Back from Break", `${employee.name} ended ${breakLabel(running.type)}. Duration ${formatBreakMinutes(running.durationSeconds)}`, employee.id);
  saveState();
  render();
}

function editBreak(id) {
  if (!isAdmin()) return;
  const item = state.breaks.find((breakItem) => breakItem.id === id);
  if (!item) return;
  if (!ensureMonthEditable(item.date)) return;
  const type = prompt("Break type লিখুন: prayer, washroom, lunch, personal, official", item.type);
  if (!type || !breakLabels[type]) {
    alert("Valid break type দিন।");
    return;
  }
  const startTime = prompt("Start time দিন (HH:MM)", item.startTime || "");
  if (!startTime || timeToMinutes(startTime) === null) return;
  const endTime = prompt("End time দিন (HH:MM). Running রাখতে খালি রাখুন।", item.endTime || "");
  if (endTime && timeToMinutes(endTime) === null) return;
  if (endTime && timeToMinutes(endTime) < timeToMinutes(startTime)) {
    alert("End time start time-এর আগে হতে পারবে না।");
    return;
  }
  const note = prompt("Note লিখুন", item.note || "");

  item.type = type;
  item.startTime = startTime;
  item.startAt = isoForDateTime(item.date, startTime);
  item.endTime = endTime || "";
  item.endAt = endTime ? isoForDateTime(item.date, endTime) : "";
  item.durationSeconds = endTime ? Math.max(0, Math.floor((Date.parse(item.endAt) - Date.parse(item.startAt)) / 1000)) : 0;
  item.note = note || "";
  item.updatedAt = new Date().toISOString();
  item.updatedBy = "Admin";
  logActivity("Edit Break", `${item.employeeName} ${breakLabel(item.type)} edited`, item.employeeId);
  saveState();
  render();
}

function deleteBreak(id) {
  if (!isAdmin()) return;
  const item = state.breaks.find((breakItem) => breakItem.id === id);
  if (item && !ensureMonthEditable(item.date)) return;
  if (!confirm("এই break record delete করবেন?")) return;
  state.breaks = state.breaks.filter((item) => item.id !== id);
  logActivity("Delete Break", item ? `${item.employeeName} ${breakLabel(item.type)} deleted` : id, item?.employeeId || "");
  saveState();
  render();
}

function forceEndBreak(id) {
  if (!isAdmin() && !isManager()) return;
  const item = state.breaks.find((breakItem) => breakItem.id === id);
  if (!item || item.endAt) return;
  if (!ensureMonthEditable(item.date)) return;
  if (!confirm("এই running break close করবেন?")) return;
  const now = new Date();
  item.endAt = now.toISOString();
  item.endTime = currentTimeValue();
  item.durationSeconds = breakDurationSeconds(item);
  item.note = `${item.note || ""}${item.note ? " | " : ""}Closed by ${currentUser.name}`;
  item.updatedAt = now.toISOString();
  item.updatedBy = currentUser.name;
  logActivity("Close Missed Break", `${item.employeeName} ${breakLabel(item.type)} closed. Duration ${formatBreakMinutes(item.durationSeconds)}`, item.employeeId);
  saveState();
  render();
}

function correctionDescription(payload) {
  const employee = employeeById(payload.employeeId) || { name: payload.employeeName };
  const typeText = {
    check_in: "Check In",
    check_out: "Check Out",
    break_start: "Break Start",
    break_end: "Break End",
    break_delete: "Break Delete",
  }[payload.type] || payload.type;
  return `${employee.name} · ${payload.date} · ${typeText}${payload.time ? ` · ${payload.time}` : ""}`;
}

function saveCorrectionRequest(event) {
  event.preventDefault();
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employeeById(els.correctionEmployee.value);
  if (!employee) return;
  if (!ensureMonthEditable(els.correctionDate.value)) return;
  const type = els.correctionType.value;
  const payload = {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    date: els.correctionDate.value,
    type,
    time: els.correctionTime.value,
    breakId: els.correctionBreak.value,
    reason: els.correctionReason.value.trim(),
    requestedAt: new Date().toISOString(),
  };
  if (type !== "break_delete" && !payload.time) {
    alert("Correction time দিন।");
    return;
  }
  if (type.startsWith("break") && !payload.breakId) {
    alert("Break record select করুন।");
    return;
  }

  if (isAdmin()) {
    applyCorrection(payload);
    logActivity("Apply Correction", correctionDescription(payload), employee.id);
    saveState();
    render();
  } else {
    addApproval("correction_request", payload);
    addNotification("Attendance Correction Alert", `${employee.name} correction approval দরকার: ${correctionDescription(payload)}`);
  }
  els.correctionForm.reset();
  els.correctionDate.value = els.attendanceDate.value;
  render();
}

function applyCorrection(payload) {
  const employee = employeeById(payload.employeeId) || { id: payload.employeeId, name: payload.employeeName };
  if (payload.type === "check_in" || payload.type === "check_out") {
    let record = attendanceFor(payload.date, payload.employeeId);
    if (!record) {
      record = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employeeName: employee.name,
        date: payload.date,
        status: "present",
        shift: "morning",
        checkIn: "",
        checkOut: "",
        breakMinutes: 0,
        note: "",
        markedBy: "Correction",
        createdAt: new Date().toISOString(),
      };
      state.attendance.push(record);
    }
    if (payload.type === "check_in") record.checkIn = payload.time;
    if (payload.type === "check_out") record.checkOut = payload.time;
    record.note = `${record.note || ""}${record.note ? " | " : ""}Correction: ${payload.reason}`;
    record.updatedAt = new Date().toISOString();
    record.updatedBy = currentUser.name || "Admin";
    return;
  }

  const item = state.breaks.find((breakItem) => breakItem.id === payload.breakId);
  if (!item) return;
  if (payload.type === "break_delete") {
    state.breaks = state.breaks.filter((breakItem) => breakItem.id !== payload.breakId);
    return;
  }
  if (payload.type === "break_start") {
    item.startTime = payload.time;
    item.startAt = isoForDateTime(item.date, payload.time);
  }
  if (payload.type === "break_end") {
    item.endTime = payload.time;
    item.endAt = isoForDateTime(item.date, payload.time);
  }
  if (item.endAt) item.durationSeconds = Math.max(0, Math.floor((Date.parse(item.endAt) - Date.parse(item.startAt)) / 1000));
  item.note = `${item.note || ""}${item.note ? " | " : ""}Correction: ${payload.reason}`;
  item.updatedAt = new Date().toISOString();
  item.updatedBy = currentUser.name || "Admin";
}

function saveAdvance(event) {
  event.preventDefault();
  const employee = employeeById(els.advanceEmployee.value);
  if (!employee) return;
  if (!ensureMonthEditable(els.advanceMonth.value)) return;
  state.advances.unshift({
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    month: els.advanceMonth.value,
    amount: Number(els.advanceAmount.value),
    reason: els.advanceReason.value.trim(),
    requestedBy: currentUser.name || "Admin",
    status: isAdmin() ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  });
  els.advanceForm.reset();
  els.advanceMonth.value = els.payrollMonth.value;
  saveState();
  render();
}

function reviewAdvance(id, approved) {
  const item = state.advances.find((advance) => advance.id === id);
  if (!item) return;
  if (approved && !ensureMonthEditable(item.month)) return;
  item.status = approved ? "approved" : "rejected";
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = "Admin";
  if (approved) {
    addNotification("Advance Approval Alert", `${item.employeeName}-এর advance salary request approved হয়েছে: ${money(item.amount)} (${item.month})`);
  }
  saveState();
  render();
}

function saveEmployeeAccess(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  if (supabaseEnabled()) {
    alert("Supabase mode-e employee PIN/password dashboard theke set hobe na. Supabase Auth ba reset link use korun.");
    return;
  }
  const pin = normalizePin(els.employeeAccessPin.value);
  if (!pin) return;
  const existing = state.employeeAccess.find((item) => item.employeeId === els.employeeAccessEmployee.value);
  if (existing) {
    existing.employeeName = employeeById(els.employeeAccessEmployee.value)?.name || existing.employeeName || "";
    existing.pin = pin;
    existing.active = true;
  } else {
    state.employeeAccess.push({
      id: crypto.randomUUID(),
      employeeId: els.employeeAccessEmployee.value,
      employeeName: employeeById(els.employeeAccessEmployee.value)?.name || "",
      pin,
      active: true,
    });
  }
  els.employeeAccessForm.reset();
  saveState();
  if (cloudUrl()) syncToCloud(false);
  alert("Employee login PIN সেভ হয়েছে। এখন logout করে মূল login screen থেকে এই PIN দিয়ে ঢুকুন।");
  render();
}

function saveDashboardAdminPin(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  if (supabaseEnabled()) {
    alert("Supabase mode-e admin password dashboard theke set hobe na. Supabase Auth ba reset link use korun.");
    return;
  }
  const pin = normalizePin(els.dashboardAdminPin.value);
  if (!pin) return;
  state.settings.adminEmail = normalizeEmail(els.dashboardAdminEmail?.value);
  state.settings.adminPin = pin;
  els.dashboardAdminPin.value = "";
  saveState();
  if (cloudUrl()) syncToCloud(false);
  alert("Admin password save hoyeche.");
  render();
}

function saveDashboardManager(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const baseName = els.dashboardManagerName.value.trim();
  const email = normalizeEmail(els.dashboardManagerEmail?.value);
  const pin = normalizePin(els.dashboardManagerPin.value);
  if (!baseName || !email || (!pin && !supabaseEnabled())) return;
  state.managers.push({
    id: crypto.randomUUID(),
    name: baseName.toLowerCase().includes("manager") || baseName.includes("à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°") ? baseName : `${baseName} (Manager)`,
    email,
    pin,
    active: true,
  });
  els.dashboardManagerForm.reset();
  saveState();
  if (cloudUrl()) syncToCloud(false);
  alert(supabaseEnabled() ? "Manager email link save hoyeche. Role/password Supabase Auth theke manage korte hobe." : "Manager access save hoyeche.");
  render();
}

function saveDashboardEmployeeAccess(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const employeeId = els.dashboardEmployeeAccessEmployee.value;
  const email = normalizeEmail(els.dashboardEmployeeAccessEmail?.value);
  const pin = normalizePin(els.dashboardEmployeeAccessPin.value);
  if (!employeeId || !email || (!pin && !supabaseEnabled())) return;
  const employee = employeeById(employeeId);
  const existing = state.employeeAccess.find((item) => item.employeeId === employeeId);
  if (existing) {
    existing.employeeName = employee?.name || existing.employeeName || "";
    existing.email = email;
    if (pin) existing.pin = pin;
    existing.active = true;
  } else {
    state.employeeAccess.push({
      id: crypto.randomUUID(),
      employeeId,
      employeeName: employee?.name || "",
      email,
      pin,
      active: true,
    });
  }
  els.dashboardEmployeeAccessForm.reset();
  saveState();
  if (cloudUrl()) syncToCloud(false);
  alert(supabaseEnabled() ? "Employee email link save hoyeche. Password Supabase Auth theke set/reset korte hobe." : "Employee access save hoyeche.");
  render();
}

async function setOfficeLocationFromCurrentPosition() {
  if (!isAdmin()) return;
  try {
    if (els.officeLocationStatus) els.officeLocationStatus.textContent = "বর্তমান location নেওয়া হচ্ছে...";
    const position = await getCurrentPosition();
    els.officeLatitude.value = position.coords.latitude.toFixed(7);
    els.officeLongitude.value = position.coords.longitude.toFixed(7);
    els.officeLocationStatus.textContent = `Current location set হয়েছে। Accuracy: ${bn.format(Math.round(position.coords.accuracy || 0))}m`;
  } catch (error) {
    els.officeLocationStatus.textContent = `Location নেওয়া যায়নি: ${error.message}`;
    alert("Browser location permission allow করুন, তারপর আবার চেষ্টা করুন।");
  }
}

function markSettingsSaved(message = "Settings saved") {
  if (!els.settingsSaveStatus) return;
  els.settingsSaveStatus.textContent = `${message} · ${new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

function saveOfficeLocation() {
  if (!isAdmin()) return;
  state.settings.officeLocation = {
    enabled: els.officeLocationEnabled.checked,
    latitude: els.officeLatitude.value.trim(),
    longitude: els.officeLongitude.value.trim(),
    radiusMeters: Number(els.officeRadius.value || 100),
  };
  saveState();
  renderOfficeLocationSettings();
  alert("Office location attendance settings সেভ হয়েছে।");
}

function saveOfficeLocationSilently() {
  if (!isAdmin() || !els.officeLocationEnabled) return;
  state.settings.officeLocation = {
    enabled: els.officeLocationEnabled.checked,
    latitude: els.officeLatitude.value.trim(),
    longitude: els.officeLongitude.value.trim(),
    radiusMeters: Number(els.officeRadius.value || 100),
  };
  saveState();
  renderOfficeLocationSettings();
}

async function testOfficeLocation() {
  if (!isAdmin()) return;
  if (!officeLocationReady()) {
    alert("আগে Office Location চালু করে latitude/longitude/radius সেভ করুন।");
    return;
  }
  try {
    if (els.officeLocationStatus) els.officeLocationStatus.textContent = "Location test চলছে...";
    const location = await verifyOfficeLocation();
    const accuracyText = location.accuracy > 100 ? "GPS weak" : "GPS good";
    els.officeLocationStatus.textContent = `Test result: office থেকে ${bn.format(location.distance)}m দূরে · Accuracy ${bn.format(location.accuracy)}m · ${accuracyText}`;
  } catch (error) {
    if (els.officeLocationStatus) els.officeLocationStatus.textContent = `Location test failed: ${error.message}`;
  }
}

function printPayslip(employeeId) {
  if (isEmployee() && employeeId !== currentEmployeeId()) return;
  const month = els.payrollMonth.value;
  const payroll = payrollForMonth(month);
  const row = payroll.rows.find((item) => item.id === employeeId);
  if (!row) return;
  addNotification("Salary Generated Alert", `${row.name}-এর ${month} payslip generated হয়েছে। Net Salary: ${money(row.payable)}`);
  saveState();
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Payslip - ${row.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #17211d; }
          h1 { margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          td, th { border: 1px solid #dbe4df; padding: 10px; text-align: left; }
          .total { font-size: 22px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Minus Style Payslip</h1>
        <p>Salary Month: ${month}</p>
        <table>
          <tr><th>Employee Name</th><td>${row.name}</td></tr>
          <tr><th>Employee ID</th><td>${row.id}</td></tr>
          <tr><th>Salary Month</th><td>${month}</td></tr>
          <tr><th>Attendance Summary</th><td>Present: ${row.present}, Leave: ${row.leave}, Paid Leave: ${row.paidLeave || 0}, Absent: ${row.absent}</td></tr>
          <tr><th>Gross Salary</th><td>${money(row.salary)}</td></tr>
          <tr><th>Friday Work Bonus / Weekend Work Pay</th><td>${money(row.weekendPay || 0)}</td></tr>
          <tr><th>Manual Addition</th><td>${money(row.additions || 0)}</td></tr>
          <tr><th>Manual Deduction</th><td>${money(row.manualDeductions || 0)}</td></tr>
          <tr><th>Deduction</th><td>${money(row.totalDeduction)}</td></tr>
          <tr><th>Net Salary</th><td class="total">${money(row.payable)}</td></tr>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  render();
}

function applyLeaveToAttendance(leave) {
  const employee = employeeById(leave.employeeId) || { id: leave.employeeId, name: leave.employeeName };
  leaveDates(leave).forEach((leaveDay) => {
    const status = leaveDay.type === "lwp" ? "leave" : leaveDay.type === "fixed_holiday" ? "paid_holiday" : "paid_leave";
    persistAttendance(
      {
        employeeId: employee.id,
        employeeName: employee.name,
        date: leaveDay.date,
        status,
        shift: "morning",
        checkIn: "",
        checkOut: "",
        breakMinutes: 0,
        note: `${leaveTypeLabel(leaveDay.type)}: ${leave.reason || "Approved leave"}`,
        markedBy: "Admin",
        updatedAt: new Date().toISOString(),
      },
      employee,
      false,
    );
  });
}

function saveLeaveRequest(event) {
  event.preventDefault();
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employees().find((item) => item.id === els.leaveEmployee.value);
  if (!employee) return;
  const start = els.leaveStart.value;
  const end = els.leaveEnd.value;
  if (!ensureMonthEditable(start)) return;
  if (end < start) {
    alert("শেষ তারিখ শুরু তারিখের আগে হতে পারবে না।");
    return;
  }
  const requestedDays = dateRange(start, end).length;
  const requestedType = els.leaveType.value;
  if (requestedType === "compensatory" && requestedDays > compensatoryLeaveBalance(employee.id)) {
    alert(`Compensatory leave balance ${bn.format(compensatoryLeaveBalance(employee.id))} দিন। এর বেশি request করা যাবে না।`);
    return;
  }

  const reason = els.leaveReason.value.trim();
  const breakdown = buildLeaveBreakdown(employee.id, requestedType, start, end, reason);
  const realTypes = [...new Set(breakdown.filter((day) => day.type !== "fixed_holiday").map((day) => day.type))];

  const leave = {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    type: realTypes.length === 1 ? realTypes[0] : realTypes.length ? "mixed" : "fixed_holiday",
    requestedType,
    breakdown,
    start,
    end,
    days: requestedDays,
    reason,
    requestedBy: currentUser.name || employee.name,
    requestedAt: new Date().toISOString(),
    status: isAdmin() ? "approved" : "pending",
  };

  state.leaveRequests.unshift(leave);
  if (isAdmin()) {
    applyLeaveToAttendance(leave);
    addNotification("Leave Approval Alert", `${employee.name}-এর leave approved হয়েছে: ${start} to ${end}`);
  } else {
    addApproval("leave_request", leave);
    addNotification("Leave Approval Alert", `${employee.name}-এর leave approval দরকার: ${start} to ${end}`);
  }

  els.leaveForm.reset();
  els.leaveStart.value = today();
  els.leaveEnd.value = today();
  saveState();
  render();
}

function reviewLeave(id, approved) {
  const leave = state.leaveRequests.find((item) => item.id === id);
  if (!leave || leave.status !== "pending") return;
  leave.status = approved ? "approved" : "rejected";
  leave.reviewedAt = new Date().toISOString();
  leave.reviewedBy = "Admin";
  state.approvals
    .filter((item) => item.action === "leave_request" && item.payload?.id === id && item.status === "pending")
    .forEach((item) => {
      item.status = approved ? "approved" : "rejected";
      item.reviewedAt = leave.reviewedAt;
      item.reviewedBy = "Admin";
    });
  if (approved) {
    applyLeaveToAttendance(leave);
    addNotification("Leave Approval Alert", `${leave.employeeName}-এর leave approved হয়েছে: ${leave.start} to ${leave.end}`);
  }
  saveState();
  render();
}

function togglePayrollLock() {
  if (!isAdmin()) return;
  const month = els.payrollMonth.value;
  const existing = state.payrollLocks.find((item) => item.month === month);
  if (existing?.locked) {
    if (!confirm(`${month} Monthly Closing unlock করবেন? এরপর attendance/leave/payroll edit করা যাবে।`)) return;
    existing.locked = false;
    existing.unlockedAt = new Date().toISOString();
    existing.unlockedBy = "Admin";
    saveState();
    render();
    return;
  }

  if (!confirm(`${month} Close Month করবেন? Lock হলে unlock না করা পর্যন্ত attendance/leave/payroll বদলাবে না।`)) return;
  const snapshot = calculatePayrollForMonth(month);
  if (existing) {
    Object.assign(existing, { locked: true, snapshot, lockedAt: new Date().toISOString(), lockedBy: "Admin" });
  } else {
    state.payrollLocks.push({ id: crypto.randomUUID(), month, locked: true, snapshot, lockedAt: new Date().toISOString(), lockedBy: "Admin" });
  }
  addNotification("Salary Generated Alert", `${month} payroll generated and locked হয়েছে। Payable: ${money(snapshot.payable)}`);
  saveState();
  render();
}

function saveFixed(event) {
  event.preventDefault();
  if (!isAdmin()) {
    addApproval("save_fixed", {
      id: editingFixedId,
      name: els.fixedName.value.trim(),
      category: els.fixedCategory.value,
      amount: Number(els.fixedAmount.value),
      active: els.fixedActive.checked,
      note: els.fixedNote.value.trim(),
    });
    return;
  }
  const payload = {
    name: els.fixedName.value.trim(),
    category: els.fixedCategory.value,
    amount: Number(els.fixedAmount.value),
    active: els.fixedActive.checked,
    note: els.fixedNote.value.trim(),
  };

  if (editingFixedId) {
    const item = state.fixedExpenses.find((fixedItem) => fixedItem.id === editingFixedId);
    Object.assign(item, payload);
    editingFixedId = null;
  } else {
    state.fixedExpenses.push({ id: crypto.randomUUID(), ...payload });
  }

  saveState();
  els.fixedForm.reset();
  els.fixedActive.checked = true;
  render();
}

function addManager(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const baseName = els.managerName.value.trim();
  const pin = normalizePin(els.managerPin.value);
  if (!baseName || !pin) return;
  state.managers.push({
    id: crypto.randomUUID(),
    name: baseName.includes("ম্যানেজার") ? baseName : `${baseName} (ম্যানেজার)`,
    pin,
    active: true,
  });
  els.managerForm.reset();
  saveState();
  render();
}

function addApproval(action, payload) {
  state.approvals.unshift({
    id: crypto.randomUUID(),
    action,
    payload,
    requestedBy: currentUser.name,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  logActivity("Create Approval Request", requestTitle({ action, payload }), payload?.employeeId || payload?.id || "");
  saveState();
  alert("Admin approval request পাঠানো হয়েছে।");
  render();
}

function applyApproval(id, approved, options = {}) {
  const request = state.approvals.find((item) => item.id === id);
  if (!request) return;
  if (approved && ["attendance_punch", "correction_request", "leave_request"].includes(request.action)) {
    const lockedDate = request.payload.start || request.payload.date;
    if (lockedDate && !ensureMonthEditable(lockedDate)) return;
  }
  request.status = approved ? "approved" : "rejected";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = "Admin";

  if (approved) {
    if (request.action === "attendance_punch") {
      if (!ensureMonthEditable(request.payload.date)) return;
      const employee = employeeById(request.payload.employeeId) || { id: request.payload.employeeId, name: request.payload.employeeName };
      persistAttendance(request.payload, employee, false);
    }
    if (request.action === "correction_request") {
      if (!ensureMonthEditable(request.payload.date)) return;
      applyCorrection(request.payload);
      logActivity("Approve Correction", correctionDescription(request.payload), request.payload.employeeId);
    }
    if (request.action === "leave_request") {
      if (!ensureMonthEditable(request.payload.start || request.payload.date)) return;
      reviewLeave(request.payload.id, true);
    }
    if (request.action === "add_entry") {
      state.entries.push(approvedEntry(request.payload));
    }
    if (request.action === "bulk_entries") {
      state.entries.push(...(request.payload.entries || []).map(approvedEntry));
    }
    if (request.action === "edit_entry") {
      const entry = state.entries.find((item) => item.id === request.payload.id);
      if (entry) Object.assign(entry, approvedEntry(request.payload));
    }
    if (request.action === "delete_entry") {
      state.entries = state.entries.filter((entry) => entry.id !== request.payload.id);
    }
    if (request.action === "toggle_fixed") {
      const item = state.fixedExpenses.find((fixedItem) => fixedItem.id === request.payload.id);
      if (item) item.active = !item.active;
    }
    if (request.action === "delete_fixed") {
      state.fixedExpenses = state.fixedExpenses.filter((item) => item.id !== request.payload.id);
    }
    if (request.action === "delete_category") {
      state.categories[request.payload.type] = state.categories[request.payload.type].filter((item) => item !== request.payload.category);
    }
    if (request.action === "save_fixed") {
      if (request.payload.id) {
        const item = state.fixedExpenses.find((fixedItem) => fixedItem.id === request.payload.id);
        if (item) Object.assign(item, request.payload);
      } else {
        state.fixedExpenses.push({ id: crypto.randomUUID(), ...request.payload });
      }
    }
  } else if (request.action === "leave_request") {
    const leave = state.leaveRequests.find((item) => item.id === request.payload.id);
    if (leave) {
      leave.status = "rejected";
      leave.reviewedAt = new Date().toISOString();
      leave.reviewedBy = "Admin";
    }
  }

  logActivity(approved ? "Approve Request" : "Reject Request", requestTitle(request), request.payload?.employeeId || request.payload?.id || "");

  if (!options.silent) {
    saveState();
    render();
  }
}

function addCategory(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const type = els.categoryType.value;
  const key = els.categoryName.value.trim();
  if (!key || state.categories[type].includes(key)) return;
  state.categories[type].push(key);
  saveState();
  els.categoryForm.reset();
  render();
}

function openEditEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  els.editId.value = entry.id;
  els.editType.value = entry.type;
  renderEntryCategories(entry.type, els.editCategory);
  els.editCategory.value = entry.category;
  els.editAmount.value = entry.amount;
  els.editDate.value = entry.date;
  els.editNote.value = entry.note || "";
  els.editModal.classList.remove("hidden");
}

function saveEditEntry(event) {
  event.preventDefault();
  const entry = state.entries.find((item) => item.id === els.editId.value);
  if (!entry) return;
  const payload = {
    id: entry.id,
    type: els.editType.value,
    category: els.editCategory.value,
    amount: Number(els.editAmount.value),
    date: els.editDate.value,
    note: els.editNote.value.trim(),
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
  };
  if (isAdmin()) {
    Object.assign(entry, approvedEntry(payload));
    saveState();
  } else {
    addApproval("edit_entry", payload);
  }
  closeModal();
  render();
}

function closeModal() {
  els.editModal.classList.add("hidden");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const start = els.reportStart.value;
  const end = els.reportEnd.value;
  const totals = totalsForRange(start, end);
  const rows = [
    ["Report Start", start],
    ["Report End", end],
    ["Total Income", totals.income],
    ["Boost Cost", totals.boost],
    ["Fixed Cost", Math.round(totals.fixedTotal)],
    ["Net Profit", Math.round(totals.net)],
    [],
    ["Date", "Type", "Category", "Amount", "Note"],
    ...totals.entries.map((entry) => [entry.date, entry.type, labelFor(entry.category), entry.amount, entry.note || ""]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile(`minus-style-report-${start}-to-${end}.csv`, csv, "text/csv;charset=utf-8");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function printPdf() {
  window.print();
}

function exportJson() {
  const payload = JSON.stringify(state, null, 2);
  els.exportOutput.value = payload;
  downloadFile(`minus-style-backup-${today()}.json`, payload, "application/json;charset=utf-8");
}

function downloadBackup() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), backups: getBackups() }, null, 2);
  downloadFile(`minus-style-auto-backups-${today()}.json`, payload, "application/json;charset=utf-8");
}

function restoreJson() {
  if (!isAdmin()) return;
  const text = els.exportOutput.value.trim();
  if (!text) {
    alert("Backup JSON paste করুন, তারপর restore চাপুন।");
    return;
  }
  if (!confirm("এই JSON restore করলে current dashboard data replace হবে। চালাবেন?")) return;
  try {
    const parsed = JSON.parse(text);
    const nextState = parsed.data || parsed.state || parsed.backups?.[0]?.data || parsed;
    applyRestoredState(nextState);
    logActivity("Restore JSON", "Manual JSON restore", "backup");
    saveState();
    render();
    alert("Backup restore হয়েছে। Cloud sync চালু থাকলে data cloud-এও save হবে।");
  } catch (error) {
    alert(`Restore failed: ${error.message}`);
  }
}

async function clearAppCache() {
  if (!confirm("Cache clear করলে এই browser-এর local data/session মুছে যাবে। Google Sheets backend থাকলে reload-এর পর cloud থেকে data আসবে। চালিয়ে যাবেন?")) return;
  const savedCloudUrl = cloudUrl();
  const savedTheme = savedThemeMode();

  sessionStorage.clear();
  localStorage.clear();
  if (savedCloudUrl) localStorage.setItem(CLOUD_URL_KEY, savedCloudUrl);
  localStorage.setItem(THEME_KEY, savedTheme);

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  alert("Cache clear হয়েছে। পেজ reload হবে।");
  location.reload();
}

function copyCurrentLink() {
  navigator.clipboard
    ?.writeText(location.href)
    .then(() => alert("বর্তমান dashboard link কপি হয়েছে।"))
    .catch(() => alert("লিংক কপি করা যায়নি। address bar থেকে link কপি করুন।"));
}

function saveHoliday(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const date = els.holidayDate.value;
  const name = els.holidayName.value.trim();
  if (!date || !name) return;
  const existing = holidayForDate(date);
  if (existing) {
    existing.name = name;
    existing.note = els.holidayNote.value.trim();
    existing.fixed = Boolean(existing.fixed);
    existing.updatedAt = new Date().toISOString();
  } else {
    state.fixedHolidays.push({
      id: crypto.randomUUID(),
      date,
      name,
      note: els.holidayNote.value.trim(),
      fixed: false,
      createdAt: new Date().toISOString(),
    });
  }
  ensureHolidayAttendance();
  els.holidayForm.reset();
  if (els.holidayDate) els.holidayDate.value = today();
  logActivity("Holiday Save", `${date} ${name}`, "holiday");
  saveState();
  render();
}

function deleteHoliday(id) {
  if (!isAdmin()) return;
  const holiday = state.fixedHolidays.find((item) => item.id === id);
  if (!holiday) return;
  if (!confirm(`${holiday.date} ${holiday.name} delete করবেন?`)) return;
  state.fixedHolidays = state.fixedHolidays.filter((item) => item.id !== id);
  state.attendance = state.attendance.filter((item) => item.holidayId !== id);
  logActivity("Holiday Delete", `${holiday.date} ${holiday.name}`, "holiday");
  saveState();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unlockApp() {
  els.loginScreen.classList.add("hidden");
  els.appShell.classList.remove("locked");
  const session = JSON.stringify(currentUser);
  sessionStorage.setItem(SESSION_KEY, session);
  localStorage.setItem(SESSION_KEY, session);
}

function lockApp() {
  if (currentUser.source === "supabase") supabaseClient()?.auth.signOut().catch(() => null);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  currentUser = { role: "guest", name: "" };
  els.loginScreen.classList.remove("hidden");
  els.appShell.classList.add("locked");
  els.pinInput.value = "";
  els.pinInput.focus();
}

function initDates() {
  const now = today();
  els.selectedDate.value = now;
  els.entryDate.value = now;
  els.attendanceDate.value = now;
  els.dailyStart.value = monthStart(now);
  els.dailyEnd.value = monthEnd(now);
  els.bulkStart.value = monthStart(now);
  els.bulkEnd.value = now;
  els.reportStart.value = monthStart(now);
  els.reportEnd.value = monthEnd(now);
  if (els.breakFilterStart) els.breakFilterStart.value = now;
  if (els.breakFilterEnd) els.breakFilterEnd.value = now;
  if (els.leaveCalendarMonth) els.leaveCalendarMonth.value = now.slice(0, 7);
  els.payrollMonth.value = now.slice(0, 7);
  if (els.salaryAdjustmentMonth) els.salaryAdjustmentMonth.value = now.slice(0, 7);
  if (els.breakReportMonth) els.breakReportMonth.value = now.slice(0, 7);
  els.advanceMonth.value = now.slice(0, 7);
  if (els.correctionDate) els.correctionDate.value = now;
  if (els.leaveStart) els.leaveStart.value = now;
  if (els.leaveEnd) els.leaveEnd.value = now;
  if (els.holidayDate) els.holidayDate.value = now;
  if (els.fridayWorkDate) els.fridayWorkDate.value = nextFriday(now);
  if (els.noticeDate) els.noticeDate.value = now;
  if (els.workLogDate) els.workLogDate.value = now;
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}View`).classList.add("active");
    document.querySelectorAll(".mobile-nav-button").forEach((item) => item.classList.toggle("active", item.dataset.mobileView === button.dataset.view));
  });
});

function userForPin(password) {
  if (password === normalizePin(state.settings.adminPin)) {
    return { role: "admin", name: "Admin" };
  }

  const manager = state.managers.find((item) => item.active && password === normalizePin(item.pin));
  if (manager) {
    return { role: "manager", name: manager.name };
  }

  const employeeAccess = state.employeeAccess.find((item) => {
    return item.active && password === normalizePin(item.pin);
  });
  if (employeeAccess) {
    const employee = employeeForAccess(employeeAccess);
    if (employee) {
      return { role: "employee", name: employee.name, employeeId: employee.id };
    }
  }

  return null;
}

function userForCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePin(password);
  if (!normalizedEmail) return userForPin(normalizedPassword);

  if (normalizeEmail(state.settings.adminEmail) === normalizedEmail && normalizedPassword === normalizePin(state.settings.adminPin)) {
    return { role: "admin", name: "Admin" };
  }

  const manager = state.managers.find((item) => item.active && normalizeEmail(item.email) === normalizedEmail && normalizedPassword === normalizePin(item.pin));
  if (manager) {
    return { role: "manager", name: manager.name };
  }

  const employeeAccess = state.employeeAccess.find((item) => {
    return item.active && normalizeEmail(item.email) === normalizedEmail && normalizedPassword === normalizePin(item.pin);
  });
  if (employeeAccess) {
    const employee = employeeForAccess(employeeAccess);
    if (employee) {
      return { role: "employee", name: employee.name, employeeId: employee.id };
    }
  }

  return null;
}

function finishLogin(user) {
  els.loginError.textContent = "";
  currentUser = user;
  unlockApp();
  render();
}

function friendlyAuthError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("permission denied") && message.includes("profiles")) {
    return "Login hoyeche, kintu profile permission/RLS policy thik nei. Supabase SQL policy apply korun.";
  }
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Email ba password vul. Password reset kore abar try korun.";
  }
  if (message.includes("email not confirmed")) {
    return "Email ekhono confirm hoyni. Inbox/spam theke confirmation link open korun.";
  }
  if (message.includes("rate limit")) {
    return "Onekbar email pathano hoyeche. Kichu shomoy wait kore abar try korun.";
  }
  if (message.includes("otp_expired") || message.includes("expired")) {
    return "Reset/confirm link expire hoyeche. Notun reset email nin.";
  }
  if (message.includes("user not found")) {
    return "Ei email-er account paoa jayni. Admin-ke account create korte bolun.";
  }
  return `Login failed: ${error?.message || error}`;
}

els.signupBtn?.addEventListener("click", async () => {
  const email = normalizeEmail(els.emailInput?.value);
  const password = els.pinInput.value;
  if (!supabaseEnabled()) {
    els.loginError.textContent = "Signup-er jonno Supabase setup active korte hobe.";
    return;
  }
  if (!email) {
    els.loginError.textContent = "Account create korte email din.";
    return;
  }
  if (!password || password.length < 6) {
    els.loginError.textContent = "Password minimum 6 character hote hobe.";
    return;
  }
  try {
    els.loginError.textContent = "Employee account create hocche...";
    await signUpWithSupabase(email, password);
    els.loginError.textContent = "Account create request hoyeche. Email inbox check kore confirm korun, tarpor login korun.";
    if (els.loginRoleHint) els.loginRoleHint.textContent = "New employee signup pending admin link";
  } catch (error) {
    els.loginError.textContent = friendlyAuthError(error);
  }
});

els.resetPasswordBtn?.addEventListener("click", async () => {
  const email = normalizeEmail(els.emailInput?.value);
  if (!supabaseEnabled()) {
    els.loginError.textContent = "Password reset-er jonno Supabase setup active korte hobe.";
    return;
  }
  if (!email) {
    els.loginError.textContent = "Password set/reset korte email din.";
    return;
  }
  try {
    els.loginError.textContent = "Password setup email pathano hocche...";
    await sendSupabasePasswordReset(email);
    els.loginError.textContent = "Password setup/reset email pathano hoyeche. Inbox/spam check korun.";
    if (els.loginRoleHint) els.loginRoleHint.textContent = "Email link open kore new password set korun";
  } catch (error) {
    els.loginError.textContent = friendlyAuthError(error);
  }
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = normalizeEmail(els.emailInput?.value);
  const password = els.pinInput.value;
  if (supabaseEnabled()) {
    if (!email) {
      els.loginError.textContent = "Supabase mode chalu. Email + password diye login korun.";
      return;
    }
    try {
      els.loginError.textContent = "Supabase Auth diye login hocche...";
      const supabaseUser = await signInWithSupabase(email, password);
      finishLogin(supabaseUser);
      await syncFromSupabase(false);
      return;
    } catch (error) {
      els.loginError.textContent = friendlyAuthError(error);
      return;
    }
  }

  const normalizedPassword = normalizePin(password);
  const user = userForCredentials(email, normalizedPassword);
  if (user) {
    finishLogin(user);
    return;
  }

  if (cloudUrl()) {
    els.loginError.textContent = "Cloud থেকে data আনা হচ্ছে, একটু অপেক্ষা করুন...";
    const loaded = await syncFromCloud(false);
    const cloudUser = userForCredentials(email, normalizedPassword);
    if (cloudUser) {
      finishLogin(cloudUser);
      return;
    }
    if (!loaded) {
      els.loginError.textContent = "Cloud থেকে data আনা যায়নি। internet/Apps Script URL চেক করুন।";
      return;
    }
  }

  els.loginError.textContent = `PIN ঠিক নয়। ${cloudLoginSummary()}`;
});

document.querySelector("#logoutBtn").addEventListener("click", lockApp);
els.pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  state.settings.adminPin = normalizePin(els.newPin.value);
  els.newPin.value = "";
  saveState();
  alert("নতুন PIN সেভ হয়েছে।");
});
els.managerForm.addEventListener("submit", addManager);
els.employeeAccessForm.addEventListener("submit", saveEmployeeAccess);
els.dashboardAdminPinForm?.addEventListener("submit", saveDashboardAdminPin);
els.dashboardManagerForm?.addEventListener("submit", saveDashboardManager);
els.dashboardEmployeeAccessForm?.addEventListener("submit", saveDashboardEmployeeAccess);
els.noticeForm?.addEventListener("submit", saveNotice);
els.approvalTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-approval-filter]");
  if (!button) return;
  approvalFilter = button.dataset.approvalFilter;
  renderApprovalsV2();
});
els.bulkApproveBtn?.addEventListener("click", () => bulkReviewApprovals(true));
els.bulkRejectBtn?.addEventListener("click", () => bulkReviewApprovals(false));

els.selectedDate.addEventListener("change", () => {
  els.entryDate.value = els.selectedDate.value;
  render();
});
els.entryType.addEventListener("change", () => renderEntryCategories(els.entryType.value, els.entryCategory));
els.bulkType.addEventListener("change", () => renderEntryCategories(els.bulkType.value, els.bulkCategory));
els.editType.addEventListener("change", () => renderEntryCategories(els.editType.value, els.editCategory));
els.entryForm.addEventListener("submit", addEntry);
els.bulkEntryForm.addEventListener("submit", addBulkEntries);
els.attendanceForm.addEventListener("submit", saveAttendance);
els.attendanceCheckInNowBtn?.addEventListener("click", () => saveAttendancePunch("in"));
els.attendanceCheckOutNowBtn?.addEventListener("click", () => saveAttendancePunch("out"));
els.fridayWorkForm?.addEventListener("submit", saveFridayWorkRequest);
els.breakForm?.addEventListener("submit", startBreak);
els.endBreakBtn?.addEventListener("click", endBreak);
els.breakEmployee?.addEventListener("change", renderBreaks);
document.querySelector("#applyBreakFilter")?.addEventListener("click", renderBreaks);
els.breakFilterName?.addEventListener("input", renderBreaks);
els.breakFilterType?.addEventListener("change", renderBreaks);
els.breakFilterStatus?.addEventListener("change", renderBreaks);
els.timelineEmployee?.addEventListener("change", renderTimeline);
els.correctionForm?.addEventListener("submit", saveCorrectionRequest);
els.correctionEmployee?.addEventListener("change", renderCorrectionForm);
els.correctionDate?.addEventListener("change", renderCorrectionForm);
els.correctionType?.addEventListener("change", renderCorrectionForm);
els.workLogForm?.addEventListener("submit", saveWorkLog);
els.workLogEmployee?.addEventListener("change", renderWorkLogs);
els.workLogDate?.addEventListener("change", renderWorkLogs);
els.breakReportMonth?.addEventListener("change", renderMonthlyBreakReport);
els.breakReportEmployee?.addEventListener("change", renderMonthlyBreakReport);
els.breakReportType?.addEventListener("change", renderMonthlyBreakReport);
document.querySelector("#applyBreakReportFilter")?.addEventListener("click", renderMonthlyBreakReport);
els.mobileCheckInBtn?.addEventListener("click", () => saveAttendancePunch("in"));
els.mobileCheckOutBtn?.addEventListener("click", () => saveAttendancePunch("out"));
els.mobileStartBreakBtn?.addEventListener("click", () => els.breakForm?.requestSubmit());
els.mobileEndBreakBtn?.addEventListener("click", endBreak);
els.mobileLeaveBtn?.addEventListener("click", () => {
  document.querySelector('[data-view="advance"]')?.click();
  els.leaveReason?.focus();
});
els.advanceForm.addEventListener("submit", saveAdvance);
els.leaveForm?.addEventListener("submit", saveLeaveRequest);
els.leaveEmployee?.addEventListener("change", renderLeave);
els.leaveEmployee?.addEventListener("change", renderLeaveDecisionPreview);
els.leaveType?.addEventListener("change", renderLeaveDecisionPreview);
els.leaveStart?.addEventListener("change", renderLeaveDecisionPreview);
els.leaveEnd?.addEventListener("change", renderLeaveDecisionPreview);
els.leaveReason?.addEventListener("input", renderLeaveDecisionPreview);
els.leaveCalendarMonth?.addEventListener("change", renderLeaveCalendar);
els.holidayForm?.addEventListener("submit", saveHoliday);
els.employeeProfileForm?.addEventListener("submit", saveEmployeeProfile);
els.profileEmployee?.addEventListener("change", fillEmployeeProfileForm);
els.salaryAdjustmentForm?.addEventListener("submit", saveSalaryAdjustment);
els.runWarningReportBtn?.addEventListener("click", renderWarningReport);
els.fixedForm.addEventListener("submit", saveFixed);
els.categoryForm.addEventListener("submit", addCategory);
els.editEntryForm.addEventListener("submit", saveEditEntry);
document.querySelector("#closeModal").addEventListener("click", closeModal);
els.closeApprovalDetail?.addEventListener("click", closeApprovalDetail);
els.approvalDetailModal?.addEventListener("click", (event) => {
  if (event.target === els.approvalDetailModal) closeApprovalDetail();
});
document.querySelector("#quickAddBtn").addEventListener("click", () => {
  document.querySelector('[data-view="daily"]').click();
  els.entryAmount.focus();
});
document.querySelector("#applyDailyFilter").addEventListener("click", renderEntriesTable);
document.querySelector("#applyReportFilter").addEventListener("click", renderReports);
document.querySelector("#applyPayrollBtn").addEventListener("click", renderPayroll);
els.payrollLockBtn?.addEventListener("click", togglePayrollLock);
els.attendanceDate.addEventListener("change", () => {
  renderAttendance();
  renderBreaks();
  renderTimeline();
  renderCorrectionForm();
});
els.attendanceEmployee?.addEventListener("change", renderAttendanceActionState);
els.attendanceEmployee?.addEventListener("change", renderPerformanceSnapshot);
els.payrollMonth.addEventListener("change", () => {
  renderPayroll();
  renderEmployeeHome();
  renderPerformanceSnapshot();
  renderPayrollReviewChecklist();
  renderSalaryAdjustments();
  renderWarningReport();
});
document.querySelector("#csvExportBtn").addEventListener("click", exportCsv);
document.querySelector("#pdfExportBtn").addEventListener("click", printPdf);
document.querySelector("#exportBtn").addEventListener("click", exportJson);
document.querySelector("#downloadBackupBtn").addEventListener("click", downloadBackup);
document.querySelector("#restoreJsonBtn")?.addEventListener("click", restoreJson);
els.restoreBackupVersionBtn?.addEventListener("click", restoreBackupVersion);
els.deleteBackupVersionBtn?.addEventListener("click", deleteBackupVersion);
els.clearAllBackupsBtn?.addEventListener("click", clearAllBackups);
els.clearOldNotificationsBtn?.addEventListener("click", clearOldNotifications);
els.clearRejectedRequestsBtn?.addEventListener("click", clearRejectedRequests);
els.clearEmptyBackupsBtn?.addEventListener("click", clearEmptyBackups);
els.runHealthCheckBtn?.addEventListener("click", renderHealthCheck);
els.runSystemCheckBtn?.addEventListener("click", renderSystemCheck);
document.querySelector("#clearCacheBtn").addEventListener("click", clearAppCache);
els.homeClearCacheBtn?.addEventListener("click", clearAppCache);
els.themeToggleBtn?.addEventListener("click", toggleThemeMode);
els.installPwaBtn?.addEventListener("click", installPwa);
els.refreshPwaBtn?.addEventListener("click", refreshPwaCache);
els.themePresetSelect?.addEventListener("change", () => {
  applyThemePreset(els.themePresetSelect.value);
  if (window.lucide) lucide.createIcons();
});
els.compactModeBtn?.addEventListener("click", toggleCompactMode);
els.dailySummaryWhatsappBtn?.addEventListener("click", openDailyWhatsappSummary);
els.payrollSheetExportBtn?.addEventListener("click", exportPayrollSheetCsv);
els.employeeSelfReportBtn?.addEventListener("click", exportEmployeeSelfReport);
els.toggleBeginnerModeBtn?.addEventListener("click", toggleBeginnerMode);
els.globalSearchInput?.addEventListener("input", renderGlobalSearchResults);
els.globalSearchInput?.addEventListener("focus", renderGlobalSearchResults);
document.querySelector("#copyLinkBtn").addEventListener("click", copyCurrentLink);
document.querySelector("#saveCloudUrlBtn").addEventListener("click", () => {
  localStorage.setItem(CLOUD_URL_KEY, els.cloudApiUrl.value.trim());
  setCloudStatus(cloudUrl() ? "Cloud URL সেভ হয়েছে।" : "Cloud sync বন্ধ আছে।");
});
document.querySelector("#syncFromCloudBtn").addEventListener("click", () => syncFromCloud(true));
document.querySelector("#syncToCloudBtn").addEventListener("click", () => syncToCloud(true));
document.querySelector("#saveSupabaseConfigBtn")?.addEventListener("click", () => {
  localStorage.setItem(SUPABASE_URL_KEY, els.supabaseUrl?.value.trim() || "");
  localStorage.setItem(SUPABASE_ANON_KEY, els.supabaseAnonKey?.value.trim() || "");
  supabaseClientInstance = null;
  setSupabaseStatus(supabaseEnabled() ? "Supabase config saved. Email/password login active." : "Supabase config blank.", supabaseEnabled() ? "ready" : "off");
  updateCloudSyncBar();
});
document.querySelector("#syncFromSupabaseBtn")?.addEventListener("click", () => syncFromSupabase(true));
document.querySelector("#syncToSupabaseBtn")?.addEventListener("click", () => syncToSupabase(true));
els.supabaseHealthCheckBtn?.addEventListener("click", runSupabaseHealthCheck);
document.querySelector("#supabaseLogoutBtn")?.addEventListener("click", logoutSupabase);
document.querySelector("#setOfficeLocationBtn")?.addEventListener("click", setOfficeLocationFromCurrentPosition);
els.testOfficeLocationBtn?.addEventListener("click", testOfficeLocation);
document.querySelector("#saveOfficeLocationBtn")?.addEventListener("click", saveOfficeLocation);
els.officeLocationEnabled?.addEventListener("change", saveOfficeLocationSilently);
els.officeLatitude?.addEventListener("change", saveOfficeLocationSilently);
els.officeLongitude?.addEventListener("change", saveOfficeLocationSilently);
els.officeRadius?.addEventListener("change", saveOfficeLocationSilently);

document.body.addEventListener("click", (event) => {
  const entryEdit = event.target.closest("[data-edit-entry]");
  const entryDelete = event.target.closest("[data-delete-entry]");
  const fixedEdit = event.target.closest("[data-edit-fixed]");
  const fixedToggle = event.target.closest("[data-toggle-fixed]");
  const fixedDelete = event.target.closest("[data-delete-fixed]");
  const categoryDelete = event.target.closest("[data-delete-category]");
  const managerToggle = event.target.closest("[data-toggle-manager]");
  const managerDelete = event.target.closest("[data-delete-manager]");
  const approveRequest = event.target.closest("[data-approve-request]");
  const rejectRequest = event.target.closest("[data-reject-request]");
  const approvalDetail = event.target.closest("[data-approval-detail]");
  const attendanceDelete = event.target.closest("[data-delete-attendance]");
  const approveAdvance = event.target.closest("[data-approve-advance]");
  const rejectAdvance = event.target.closest("[data-reject-advance]");
  const approveLeave = event.target.closest("[data-approve-leave]");
  const rejectLeave = event.target.closest("[data-reject-leave]");
  const deleteHolidayButton = event.target.closest("[data-delete-holiday]");
  const deleteSalaryAdjustmentButton = event.target.closest("[data-delete-salary-adjustment]");
  const editBreakButton = event.target.closest("[data-edit-break]");
  const deleteBreakButton = event.target.closest("[data-delete-break]");
  const forceEndBreakButton = event.target.closest("[data-force-end-break]");
  const payslip = event.target.closest("[data-payslip]");
  const employeeAccessToggle = event.target.closest("[data-toggle-employee-access]");
  const employeeAccessDelete = event.target.closest("[data-delete-employee-access]");
  const notificationCopy = event.target.closest("[data-copy-notification]");
  const notificationMark = event.target.closest("[data-mark-notification]");
  const approveFriday = event.target.closest("[data-approve-friday]");
  const rejectFriday = event.target.closest("[data-reject-friday]");
  const completeFriday = event.target.closest("[data-complete-friday]");
  const deleteFriday = event.target.closest("[data-delete-friday]");
  const mobileView = event.target.closest("[data-mobile-view]");
  const searchView = event.target.closest("[data-search-view]");
  const alertTarget = event.target.closest("[data-alert-target]");
  const copyTemplate = event.target.closest("[data-copy-template]");
  const whatsappTemplate = event.target.closest("[data-whatsapp-template]");
  const deleteNoticeButton = event.target.closest("[data-delete-notice]");
  const deleteWorkLogButton = event.target.closest("[data-delete-work-log]");

  if (mobileView) {
    const target = document.querySelector(`.nav-button[data-view="${mobileView.dataset.mobileView}"]`);
    if (target && !target.hidden) target.click();
  }

  if (searchView) {
    const target = document.querySelector(`.nav-button[data-view="${searchView.dataset.searchView}"]`);
    if (target && !target.hidden) target.click();
    if (els.globalSearchResults) els.globalSearchResults.hidden = true;
    if (els.globalSearchInput) els.globalSearchInput.value = "";
  }

  if (alertTarget) {
    openSmartAlertTarget(alertTarget.dataset.alertTarget || "dashboardView");
  }

  if (copyTemplate || whatsappTemplate) {
    const id = (copyTemplate || whatsappTemplate).dataset.copyTemplate || (copyTemplate || whatsappTemplate).dataset.whatsappTemplate;
    const template = whatsappTemplates().find((item) => item.id === id);
    if (template && copyTemplate) {
      navigator.clipboard?.writeText(template.message).then(() => alert("WhatsApp template copy হয়েছে।")).catch(() => alert(template.message));
    }
    if (template && whatsappTemplate) {
      window.open(`https://wa.me/8801676182447?text=${encodeURIComponent(template.message)}`, "_blank", "noopener");
    }
  }

  if (deleteNoticeButton) {
    deleteNotice(deleteNoticeButton.dataset.deleteNotice);
  }

  if (deleteWorkLogButton) {
    deleteWorkLog(deleteWorkLogButton.dataset.deleteWorkLog);
  }

  if (entryEdit) openEditEntry(entryEdit.dataset.editEntry);

  if (entryDelete && isManager()) {
    addApproval("delete_entry", { id: entryDelete.dataset.deleteEntry });
  } else if (entryDelete && confirm("এই এন্ট্রি ডিলিট করবেন?")) {
    state.entries = state.entries.filter((entry) => entry.id !== entryDelete.dataset.deleteEntry);
    saveState();
    render();
  }

  if (fixedEdit) {
    const item = state.fixedExpenses.find((fixedItem) => fixedItem.id === fixedEdit.dataset.editFixed);
    if (!item) return;
    editingFixedId = item.id;
    els.fixedName.value = item.name;
    els.fixedCategory.value = item.category;
    els.fixedAmount.value = item.amount;
    els.fixedActive.checked = item.active;
    els.fixedNote.value = item.note || "";
    els.fixedName.focus();
  }

  if (fixedToggle && isManager()) {
    addApproval("toggle_fixed", { id: fixedToggle.dataset.toggleFixed });
  } else if (fixedToggle) {
    const item = state.fixedExpenses.find((fixedItem) => fixedItem.id === fixedToggle.dataset.toggleFixed);
    if (!item) return;
    item.active = !item.active;
    saveState();
    render();
  }

  if (fixedDelete && isManager()) {
    addApproval("delete_fixed", { id: fixedDelete.dataset.deleteFixed });
  } else if (fixedDelete && confirm("এই ফিক্সড খরচ ডিলিট করবেন?")) {
    state.fixedExpenses = state.fixedExpenses.filter((item) => item.id !== fixedDelete.dataset.deleteFixed);
    saveState();
    render();
  }

  if (categoryDelete && isManager()) {
    const [type, category] = categoryDelete.dataset.deleteCategory.split(":");
    addApproval("delete_category", { type, category });
  } else if (categoryDelete) {
    const [type, category] = categoryDelete.dataset.deleteCategory.split(":");
    const used = state.entries.some((entry) => entry.category === category);
    if (used) {
      alert("এই ক্যাটাগরিতে এন্ট্রি আছে, তাই ডিলিট করার আগে এন্ট্রিগুলো পরিবর্তন করুন।");
      return;
    }
    state.categories[type] = state.categories[type].filter((item) => item !== category);
    saveState();
    render();
  }

  if (managerToggle) {
    const manager = state.managers.find((item) => item.id === managerToggle.dataset.toggleManager);
    if (manager) manager.active = !manager.active;
    saveState();
    render();
  }

  if (managerDelete && confirm("এই manager access ডিলিট করবেন?")) {
    state.managers = state.managers.filter((item) => item.id !== managerDelete.dataset.deleteManager);
    saveState();
    render();
  }

  if (approveRequest) applyApproval(approveRequest.dataset.approveRequest, true);
  if (rejectRequest) applyApproval(rejectRequest.dataset.rejectRequest, false);
  if (approvalDetail) openApprovalDetail(approvalDetail.dataset.approvalDetail);
  if (deleteHolidayButton) deleteHoliday(deleteHolidayButton.dataset.deleteHoliday);
  if (deleteSalaryAdjustmentButton) deleteSalaryAdjustment(deleteSalaryAdjustmentButton.dataset.deleteSalaryAdjustment);

  if (attendanceDelete && !isEmployee()) {
    const attendanceItem = state.attendance.find((item) => item.id === attendanceDelete.dataset.deleteAttendance);
    if (attendanceItem && !ensureMonthEditable(attendanceItem.date)) return;
    if (!confirm("এই হাজিরা record ডিলিট করবেন?")) return;
    state.attendance = state.attendance.filter((item) => item.id !== attendanceDelete.dataset.deleteAttendance);
    saveState();
    render();
  }

  if (approveAdvance) reviewAdvance(approveAdvance.dataset.approveAdvance, true);
  if (rejectAdvance) reviewAdvance(rejectAdvance.dataset.rejectAdvance, false);
  if (approveLeave) reviewLeave(approveLeave.dataset.approveLeave, true);
  if (rejectLeave) reviewLeave(rejectLeave.dataset.rejectLeave, false);
  if (editBreakButton) editBreak(editBreakButton.dataset.editBreak);
  if (deleteBreakButton) deleteBreak(deleteBreakButton.dataset.deleteBreak);
  if (forceEndBreakButton) forceEndBreak(forceEndBreakButton.dataset.forceEndBreak);
  if (payslip) printPayslip(payslip.dataset.payslip);

  if (employeeAccessToggle) {
    const access = state.employeeAccess.find((item) => item.id === employeeAccessToggle.dataset.toggleEmployeeAccess);
    if (access) access.active = !access.active;
    saveState();
    render();
  }

  if (employeeAccessDelete && confirm("এই employee access ডিলিট করবেন?")) {
    state.employeeAccess = state.employeeAccess.filter((item) => item.id !== employeeAccessDelete.dataset.deleteEmployeeAccess);
    saveState();
    render();
  }

  if (notificationCopy) {
    const item = state.notifications.find((notification) => notification.id === notificationCopy.dataset.copyNotification);
    if (!item) return;
    navigator.clipboard
      .writeText(item.message)
      .then(() => alert("WhatsApp message copy হয়েছে।"))
      .catch(() => alert(item.message));
  }

  if (notificationMark) {
    const item = state.notifications.find((notification) => notification.id === notificationMark.dataset.markNotification);
    if (item) {
      item.sent = true;
      item.sentAt = new Date().toISOString();
    }
    saveState();
    render();
  }

  if (approveFriday) reviewFridayWork(approveFriday.dataset.approveFriday, "approved");
  if (rejectFriday) reviewFridayWork(rejectFriday.dataset.rejectFriday, "rejected");
  if (completeFriday) reviewFridayWork(completeFriday.dataset.completeFriday, "completed");
  if (deleteFriday) deleteFridayWork(deleteFriday.dataset.deleteFriday);
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("সব ডেটা রিসেট করে ডিফল্ট খরচ ফিরিয়ে আনবেন?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  Object.assign(state, defaultState());
  saveState();
  render();
});

let resizeChartTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeChartTimer);
  resizeChartTimer = setTimeout(() => renderChart(els.selectedDate.value), 220);
});

applyThemeMode();
initDates();
{
  const cleanupChanged = cleanupPayrollOnlyAdminData() || cleanupFormerEmployeeData();
  const accessChanged = ensureEmployeeAccess();
  if (cleanupChanged || accessChanged) saveState();
}
breakTicker = setInterval(() => {
  if (document.hidden) return;
  if (!activeBreakFor(currentUser.employeeId) && !state.breaks.some((item) => !item.endedAt && !item.endAt)) return;
  renderBreaks();
  renderEmployeeHome();
}, 10000);

async function boot() {
  registerServiceWorker();
  if (!supabaseEnabled() && cloudUrl()) await syncFromCloud(false);
  const cleanupChanged = cleanupPayrollOnlyAdminData() || cleanupFormerEmployeeData();
  const accessChanged = ensureEmployeeAccess();
  if (cleanupChanged || accessChanged) saveState();
  try {
    if (supabaseEnabled()) {
      const client = supabaseClient();
      await completeSupabasePasswordRecovery();
      const { data } = await client.auth.getSession();
      if (data?.session?.user) {
        currentUser = await supabaseUserToCurrentUser(data.session.user);
        unlockApp();
        await syncFromSupabase(false);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
      }
    } else {
      const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
      if (savedSession?.role) {
        currentUser = savedSession;
        unlockApp();
      }
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
  if (els.loginRoleHint && currentUser.role === "guest") els.loginRoleHint.textContent = supabaseEnabled() ? supabaseLoginSummary() : cloudLoginSummary();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(renderSystemCheck).catch(() => renderSystemCheck());
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderPwaStatus();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  renderPwaStatus();
});

window.addEventListener("online", renderPwaStatus);
window.addEventListener("offline", renderPwaStatus);

boot();

