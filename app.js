const STORAGE_KEY = "minus-style-affiliate-dashboard-v2";
const LEGACY_KEY = "minus-style-affiliate-dashboard-v1";
const BACKUP_KEY = "minus-style-affiliate-backups-v1";
const SESSION_KEY = "minus-style-admin-session";
const CLOUD_URL_KEY = "minus-style-cloud-api-url";
const DEFAULT_CLOUD_URL = "https://script.google.com/macros/s/AKfycbzbdWRDAn5c7tVyX53oVbQgQUYG5LnN3KwguGODW27JpLj7tpJXSbDWuA_79IyMEf84/exec";
const CLOUD_PUSH_DELAY = 900;
const MISSED_BREAK_SECONDS = 2 * 60 * 60;
const BREAK_LIMIT_MINUTES = {
  prayer: 20,
  washroom: 15,
  lunch: 60,
  personal: 30,
  official: 90,
};

const bn = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
const state = loadState();
let editingFixedId = null;
let currentUser = { role: "guest", name: "" };
let cloudPushTimer = null;
let isApplyingCloudState = false;
let breakTicker = null;

const categoryLabels = {
  commission: "à¦®à¦¾à¦‡à¦¨à¦¾à¦¸ à¦¸à§à¦Ÿà¦¾à¦‡à¦² à¦•à¦®à¦¿à¦¶à¦¨",
  other_income: "à¦…à¦¨à§à¦¯à¦¾à¦¨à§à¦¯ à¦†à§Ÿ",
  dollar_boost: "à¦¡à¦²à¦¾à¦° à¦¬à§à¦¸à§à¦Ÿ",
  office_other: "à¦…à¦«à¦¿à¦¸ à¦…à¦¨à§à¦¯à¦¾à¦¨à§à¦¯",
  snack: "à¦¨à¦¾à¦¸à§à¦¤à¦¾",
  salary: "à¦¬à§‡à¦¤à¦¨",
  internet: "à¦‡à¦¨à§à¦Ÿà¦¾à¦°à¦¨à§‡à¦Ÿ à¦¬à¦¿à¦²",
  rent: "à¦…à¦«à¦¿à¦¸ à¦­à¦¾à§œà¦¾",
  electricity: "à¦¬à¦¿à¦¦à§à¦¯à§à§Ž à¦¬à¦¿à¦²",
  other: "à¦…à¦¨à§à¦¯à¦¾à¦¨à§à¦¯",
};

const breakLabels = {
  prayer: "Prayer Break",
  washroom: "Washroom Break",
  lunch: "Lunch Break",
  personal: "Personal Break",
  official: "Official Break",
};

const els = {
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  pinInput: document.querySelector("#pinInput"),
  loginRoleHint: document.querySelector("#loginRoleHint"),
  loginError: document.querySelector("#loginError"),
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
  employeeHomePanel: document.querySelector("#employeeHomePanel"),
  employeeHomeTitle: document.querySelector("#employeeHomeTitle"),
  employeeTodayHint: document.querySelector("#employeeTodayHint"),
  employeeTodayStatus: document.querySelector("#employeeTodayStatus"),
  employeeTodayCheckIn: document.querySelector("#employeeTodayCheckIn"),
  employeeTodayCheckOut: document.querySelector("#employeeTodayCheckOut"),
  employeeMonthPayable: document.querySelector("#employeeMonthPayable"),
  employeePendingApproval: document.querySelector("#employeePendingApproval"),
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
  leaveList: document.querySelector("#leaveList"),
  payrollLockBtn: document.querySelector("#payrollLockBtn"),
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
  employeeAccessForm: document.querySelector("#employeeAccessForm"),
  employeeAccessEmployee: document.querySelector("#employeeAccessEmployee"),
  employeeAccessPin: document.querySelector("#employeeAccessPin"),
  employeeAccessList: document.querySelector("#employeeAccessList"),
  notificationList: document.querySelector("#notificationList"),
  cloudApiUrl: document.querySelector("#cloudApiUrl"),
  cloudStatus: document.querySelector("#cloudStatus"),
  officeLocationEnabled: document.querySelector("#officeLocationEnabled"),
  officeLatitude: document.querySelector("#officeLatitude"),
  officeLongitude: document.querySelector("#officeLongitude"),
  officeRadius: document.querySelector("#officeRadius"),
  officeLocationStatus: document.querySelector("#officeLocationStatus"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryType: document.querySelector("#categoryType"),
  categoryName: document.querySelector("#categoryName"),
  categoryList: document.querySelector("#categoryList"),
  pinForm: document.querySelector("#pinForm"),
  newPin: document.querySelector("#newPin"),
  exportOutput: document.querySelector("#exportOutput"),
  backupStatus: document.querySelector("#backupStatus"),
  editModal: document.querySelector("#editModal"),
  editEntryForm: document.querySelector("#editEntryForm"),
  editId: document.querySelector("#editId"),
  editType: document.querySelector("#editType"),
  editCategory: document.querySelector("#editCategory"),
  editAmount: document.querySelector("#editAmount"),
  editDate: document.querySelector("#editDate"),
  editNote: document.querySelector("#editNote"),
};

function defaultState() {
  return {
    settings: {
      adminPin: "1234",
      officeLocation: {
        enabled: false,
        latitude: "",
        longitude: "",
        radiusMeters: 100,
      },
    },
    managers: [{ id: crypto.randomUUID(), name: "à¦«à¦¾à¦‡à¦œà§à¦° (à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°)", pin: "2222", active: true }],
    employeeAccess: [],
    approvals: [],
    activityLogs: [],
    attendance: [],
    breaks: [],
    advances: [],
    leaveRequests: [],
    payrollLocks: [],
    notifications: [],
    fixedExpenses: [
      fixed("à¦«à¦¾à¦‡à¦œà§à¦° à¦¬à§‡à¦¤à¦¨", "salary", 15000, true, "à¦à¦®à¦ªà§à¦²à§Ÿà§€"),
      fixed("à¦…à¦®à¦¿à¦¤ à¦¬à§‡à¦¤à¦¨", "salary", 13000, true, "à¦à¦®à¦ªà§à¦²à§Ÿà§€"),
      fixed("à¦¶à§à¦­ à¦­à¦¾à¦‡ à¦¬à§‡à¦¤à¦¨", "salary", 12000, true, "à¦à¦®à¦ªà§à¦²à§Ÿà§€"),
      fixed("à¦¸à¦¾à¦•à¦¿à¦¬ à¦¬à§‡à¦¤à¦¨", "salary", 12000, true, "à¦à¦®à¦ªà§à¦²à§Ÿà§€"),
      fixed("à¦¸à¦¿à¦«à¦¾à¦¤ à¦¬à§‡à¦¤à¦¨", "salary", 20000, true, "à¦à¦®à¦ªà§à¦²à§Ÿà§€"),
      fixed("à¦¸à§à¦Ÿà¦¾à¦°à¦²à¦¿à¦‚à¦•", "internet", 4200, true, "à¦‡à¦¨à§à¦Ÿà¦¾à¦°à¦¨à§‡à¦Ÿ à¦¬à¦¿à¦²"),
      fixed("à¦—à§à¦°à§€à¦¨ à¦¨à§‡à¦Ÿ", "internet", 1100, true, "à¦‡à¦¨à§à¦Ÿà¦¾à¦°à¦¨à§‡à¦Ÿ à¦¬à¦¿à¦²"),
      fixed("à¦…à¦«à¦¿à¦¸ à¦­à¦¾à§œà¦¾", "rent", 9000, true, "à¦®à¦¾à¦¸à¦¿à¦• à¦…à¦«à¦¿à¦¸ à¦­à¦¾à§œà¦¾"),
      fixed("à¦¬à¦¿à¦¦à§à¦¯à§à§Ž à¦¬à¦¿à¦²", "electricity", 2000, true, "à¦†à¦¨à§à¦®à¦¾à¦¨à¦¿à¦• à¦®à¦¾à¦¸à¦¿à¦•"),
      fixed("à¦…à¦«à¦¿à¦¸à§‡à¦° à¦…à¦¨à§à¦¯à¦¾à¦¨à§à¦¯", "other", 0, true, "à¦ªà§à¦°à§Ÿà§‹à¦œà¦¨à§‡ à¦®à¦¾à¦¸à¦¿à¦• à¦¸à§à¦¥à¦¾à§Ÿà§€ à¦–à¦°à¦š à¦¦à¦¿à¦¨"),
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
      employeeAccess: parsed.employeeAccess || defaults.employeeAccess,
      approvals: parsed.approvals || defaults.approvals,
      activityLogs: parsed.activityLogs || defaults.activityLogs,
      attendance: parsed.attendance || defaults.attendance,
      breaks: parsed.breaks || defaults.breaks,
      advances: parsed.advances || defaults.advances,
      leaveRequests: parsed.leaveRequests || defaults.leaveRequests,
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
  createAutoBackup();
  queueCloudPush();
}

function cloudUrl() {
  return localStorage.getItem(CLOUD_URL_KEY) || DEFAULT_CLOUD_URL;
}

function setCloudStatus(message) {
  if (els.cloudStatus) els.cloudStatus.textContent = message;
  if (els.loginRoleHint && !isAdmin() && !isManager() && !isEmployee()) {
    els.loginRoleHint.textContent = message;
  }
}

function cloudLoginSummary() {
  const savedPins = state.employeeAccess.filter((access) => normalizePin(access.pin)).length;
  return `Cloud ready: ${bn.format(savedPins)} employee PIN, ${bn.format(employees().length)} employee`;
}

function queueCloudPush() {
  if (isApplyingCloudState || !cloudUrl()) return;
  clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(() => syncToCloud(false), CLOUD_PUSH_DELAY);
}

async function syncToCloud(showAlert = true) {
  const url = cloudUrl();
  if (!url) {
    setCloudStatus("Cloud URL à¦¦à§‡à¦“à§Ÿà¦¾ à¦¹à§Ÿà¦¨à¦¿à¥¤");
    return;
  }

  try {
    setCloudStatus("Cloud-à¦ data à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à¦šà§à¦›à§‡...");
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "saveState", state, updatedAt: new Date().toISOString() }),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Cloud save failed");
    setCloudStatus(`à¦¶à§‡à¦· cloud save: ${new Date().toLocaleString("bn-BD")}`);
    if (showAlert) alert("Cloud-à¦ data save à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
  } catch (error) {
    setCloudStatus(`Cloud save failed: ${error.message}`);
    if (showAlert) alert(`Cloud save failed: ${error.message}`);
  }
}

async function syncFromCloud(showAlert = true) {
  const url = cloudUrl();
  if (!url) {
    setCloudStatus("Cloud URL à¦¦à§‡à¦“à§Ÿà¦¾ à¦¹à§Ÿà¦¨à¦¿à¥¤");
    return false;
  }

  try {
    setCloudStatus("Cloud à¦¥à§‡à¦•à§‡ data à¦†à¦¨à¦¾ à¦¹à¦šà§à¦›à§‡...");
    const response = await fetch(`${url}?action=getState&cache=${Date.now()}`, { method: "GET", mode: "cors" });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Cloud load failed");
    if (result.state) {
      isApplyingCloudState = true;
      Object.assign(state, defaultState(), result.state);
      state.settings = { ...defaultState().settings, ...result.state.settings };
      state.categories = { ...defaultState().categories, ...result.state.categories };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      isApplyingCloudState = false;
      ensureEmployeeAccess();
      render();
      if (els.loginRoleHint) els.loginRoleHint.textContent = cloudLoginSummary();
    }
    setCloudStatus(`à¦¶à§‡à¦· cloud load: ${new Date().toLocaleString("bn-BD")}`);
    if (showAlert) alert("Cloud à¦¥à§‡à¦•à§‡ data load à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
    return true;
  } catch (error) {
    isApplyingCloudState = false;
    setCloudStatus(`Cloud load failed: ${error.message}`);
    if (showAlert) alert(`Cloud load failed: ${error.message}`);
    return false;
  }
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
    "à§¦": "0",
    "à§§": "1",
    "à§¨": "2",
    "à§©": "3",
    "à§ª": "4",
    "à§«": "5",
    "à§¬": "6",
    "à§­": "7",
    "à§®": "8",
    "à§¯": "9",
    "Ù ": "0",
    "Ù¡": "1",
    "Ù¢": "2",
    "Ù£": "3",
    "Ù¤": "4",
    "Ù¥": "5",
    "Ù¦": "6",
    "Ù§": "7",
    "Ù¨": "8",
    "Ù©": "9",
  };
  return String(value || "")
    .trim()
    .replace(/[à§¦-à§¯Ù -Ù©]/g, (digit) => digitMap[digit] || digit);
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

function money(value) {
  return `à§³${bn.format(Math.round(Number(value) || 0))}`;
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

function labelFor(category) {
  return categoryLabels[category] || category;
}

function activeFixedTotal() {
  return sum(state.fixedExpenses.filter((item) => item.active), "amount");
}

function employees() {
  return state.fixedExpenses
    .filter((item) => item.active && item.category === "salary")
    .map((item) => ({
      id: item.id,
      name: item.name.replace(/\s*à¦¬à§‡à¦¤à¦¨\s*$/u, "").trim(),
      salary: Number(item.amount || 0),
    }));
}

function ensureEmployeeAccess() {
  employees().forEach((employee, index) => {
    const existing = state.employeeAccess.find(
      (access) => access.employeeId === employee.id || normalizeName(access.employeeName) === normalizeName(employee.name),
    );
    if (existing) {
      existing.employeeId = employee.id;
      existing.employeeName = employee.name;
      if (existing.active === undefined) existing.active = true;
      return;
    }
    state.employeeAccess.push({
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      pin: index === 0 ? "3333" : "",
      active: index === 0,
    });
  });
}

function currentEmployeeId() {
  return currentUser.employeeId || "";
}

function employeeById(id) {
  return employees().find((employee) => employee.id === id);
}

function normalizeName(value) {
  return String(value || "")
    .replace(/\s*à¦¬à§‡à¦¤à¦¨\s*$/u, "")
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
      reject(new Error("à¦à¦‡ browser location support à¦•à¦°à§‡ à¦¨à¦¾à¥¤"));
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
  if (payload.checkIn && !isCheckInWindow(payload.checkIn)) {
    return `Check-in ${payload.checkIn} allowed window 09:45-10:10-à¦à¦° à¦¬à¦¾à¦‡à¦°à§‡`;
  }
  if (payload.checkOut && !isCheckoutAllowed(payload.checkOut)) {
    return `Check-out ${payload.checkOut} à¦¸à¦¨à§à¦§à§à¦¯à¦¾ 7:00 PM-à¦à¦° à¦†à¦—à§‡`;
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

function payrollLockFor(month) {
  return state.payrollLocks.find((item) => item.month === month && item.locked);
}

function calculatePayrollForMonth(month) {
  const start = `${month}-01`;
  const end = monthEnd(start);
  const days = getDaysInMonth(start);
  const payrollRows = employees().map((employee) => {
    const records = state.attendance.filter((item) => item.employeeId === employee.id && item.date >= start && item.date <= end);
    const present = records.filter((item) => item.status === "present").length;
    const leave = records.filter((item) => item.status === "leave").length;
    const absent = records.filter((item) => item.status === "absent").length;
    const cutDays = leave + absent;
    const dailySalary = employee.salary / days;
    const deduction = dailySalary * cutDays;
    const advance = sum(
      state.advances.filter((item) => item.status === "approved" && item.employeeId === employee.id && item.month === month),
      "amount",
    );

    return {
      ...employee,
      present,
      leave,
      absent,
      cutDays,
      deduction,
      advance,
      totalDeduction: deduction + advance,
      payable: employee.salary - deduction - advance,
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
  const date = els.selectedDate.value;
  const day = totalsForDate(date);
  const month = totalsForMonth(date);

  setText("todayIncome", money(day.income));
  setText("todayExpense", money(day.expense));
  setText("dailyFixedShare", money(day.fixedTotal));
  setText("todayNet", money(day.net));
  setText("todayNetHint", day.net >= 0 ? "à¦†à¦œ à¦²à¦¾à¦­à§‡ à¦†à¦›à§‡à¦¨" : "à¦†à¦œ à¦²à¦¸à§‡ à¦†à¦›à§‡à¦¨");
  setText("sidebarFixedTotal", money(activeFixedTotal()));
  setText("monthIncome", money(month.income));
  setText("monthBoost", money(month.boost));
  setText("monthFixed", money(activeFixedTotal()));
  setText("monthNet", money(month.net));
  setText("monthStatus", month.net >= 0 ? "à¦®à¦¾à¦¸à¦¿à¦• à¦²à¦¾à¦­" : "à¦®à¦¾à¦¸à¦¿à¦• à¦²à¦¸");
  setText("monthLabel", `${formatMonth(date)} à¦¸à¦¾à¦°à¦¾à¦‚à¦¶`);

  document.querySelector("#todayNet").className = day.net >= 0 ? "amount good" : "amount bad";
  document.querySelector("#monthNet").className = month.net >= 0 ? "amount good" : "amount bad";

  renderEntryCategories(els.entryType.value, els.entryCategory);
  renderEntryCategories(els.editType.value, els.editCategory);
  renderEntryCategories(els.bulkType.value, els.bulkCategory);
  renderTodayEntries(day.entries);
  renderEntriesTable();
  renderFixedList();
  renderCategories();
  renderManagers();
  renderApprovals();
  renderRoleUi();
  renderAttendance();
  renderBreaks();
  renderTimeline();
  renderCorrectionForm();
  renderPayroll();
  renderEmployeeHome();
  renderAdvance();
  renderLeave();
  renderEmployeeAccess();
  renderNotifications();
  renderActivityLog();
  renderCloudSettings();
  renderReports();
  renderMonthlyBreakReport();
  renderChart(date);
  renderBackupStatus();

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
    let visible = true;
    if (isManager()) visible = !["reports", "fixed", "settings"].includes(view);
    if (isEmployee()) visible = ["attendance", "advance"].includes(view);
    button.hidden = !visible;
    button.style.display = visible ? "" : "none";
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
    els.todayEntries.innerHTML = `<div class="empty">à¦à¦‡ à¦¤à¦¾à¦°à¦¿à¦–à§‡ à¦à¦–à¦¨à§‹ à¦•à§‹à¦¨à§‹ à¦†à§Ÿ à¦¬à¦¾ à¦–à¦°à¦š à¦¯à§‹à¦— à¦•à¦°à¦¾ à¦¹à§Ÿà¦¨à¦¿à¥¤</div>`;
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
          <small class="muted">${escapeHtml(entry.note || "à¦¨à§‹à¦Ÿ à¦¨à§‡à¦‡")}</small>
        </article>
      `,
    )
    .join("");
}

function renderEntriesTable() {
  const start = els.dailyStart.value || "0000-01-01";
  const end = els.dailyEnd.value || "9999-12-31";
  const filtered = entriesInRange(start, end);
  setText("entryTableHint", `${start} à¦¥à§‡à¦•à§‡ ${end} à¦ªà¦°à§à¦¯à¦¨à§à¦¤ ${bn.format(filtered.length)}à¦Ÿà¦¿ à¦à¦¨à§à¦Ÿà§à¦°à¦¿`);

  const rows = filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.date)}</td>
          <td><span class="type-pill">${entry.type === "income" ? "à¦†à§Ÿ" : "à¦–à¦°à¦š"}</span></td>
          <td>${escapeHtml(labelFor(entry.category))}</td>
          <td class="amount ${entry.type === "income" ? "good" : "bad"}">${money(entry.amount)}</td>
          <td>${escapeHtml(entry.note || "-")}</td>
          <td>
            <div class="action-row">
              <button class="small-action" data-edit-entry="${entry.id}" type="button">${isAdmin() ? "à¦à¦¡à¦¿à¦Ÿ" : "à¦à¦¡à¦¿à¦Ÿ à¦°à¦¿à¦•à§à§Ÿà§‡à¦¸à§à¦Ÿ"}</button>
              <button class="small-action danger" data-delete-entry="${entry.id}" type="button">${isAdmin() ? "à¦¡à¦¿à¦²à¦¿à¦Ÿ" : "à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦°à¦¿à¦•à§à§Ÿà§‡à¦¸à§à¦Ÿ"}</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");

  els.entriesTable.innerHTML = rows || `<tr><td colspan="6" class="empty">à¦à¦‡ à¦°à§‡à¦žà§à¦œà§‡ à¦•à§‹à¦¨à§‹ à¦à¦¨à§à¦Ÿà§à¦°à¦¿ à¦¨à§‡à¦‡à¥¤</td></tr>`;
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
            <small class="muted">${escapeHtml(labelFor(item.category))} Â· ${escapeHtml(item.note || "à¦¨à§‹à¦Ÿ à¦¨à§‡à¦‡")}</small>
            <span class="status-pill">${item.active ? "à¦¸à¦•à§à¦°à¦¿à§Ÿ" : "inactive"}</span>
          </div>
          <div class="action-row">
            <button class="small-action" data-edit-fixed="${item.id}" type="button">à¦à¦¡à¦¿à¦Ÿ</button>
            <button class="small-action" data-toggle-fixed="${item.id}" type="button">${item.active ? "Inactive" : "Active"}</button>
            <button class="small-action danger" data-delete-fixed="${item.id}" type="button">à¦¡à¦¿à¦²à¦¿à¦Ÿ</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderManagers() {
  if (!els.managerList) return;
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
              <button class="small-action danger" data-delete-manager="${manager.id}" type="button">à¦¡à¦¿à¦²à¦¿à¦Ÿ</button>
            </div>
          </article>
        `,
      )
      .join("") || `<div class="empty">Manager access à¦¨à§‡à¦‡à¥¤</div>`;
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
              <span class="status-pill">${escapeHtml(request.requestedBy)}</span>
            </div>
            <small class="muted">${new Date(request.createdAt).toLocaleString("bn-BD")} Â· ${escapeHtml(requestDescription(request))}</small>
            <div class="action-row">
              <button class="small-action" data-approve-request="${request.id}" type="button">Approve</button>
              <button class="small-action danger" data-reject-request="${request.id}" type="button">Reject</button>
            </div>
          </article>
        `,
      )
      .join("") || `<div class="empty">à¦•à§‹à¦¨à§‹ pending request à¦¨à§‡à¦‡à¥¤</div>`;
}

function renderPendingApprovalBadge(count = state.approvals.filter((request) => request.status === "pending").length) {
  if (!els.pendingApprovalBadge) return;
  els.pendingApprovalBadge.innerHTML = `<i data-lucide="bell"></i> ${bn.format(count)}`;
  els.pendingApprovalBadge.title = `${bn.format(count)} pending approval request`;
}

function renderAttendance() {
  if (!els.attendanceEmployee) return;
  const currentEmployee = els.attendanceEmployee.value;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  const employeeOptions = visibleEmployees
    .map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)} - ${money(employee.salary)}</option>`)
    .join("");
  els.attendanceEmployee.innerHTML = employeeOptions || `<option value="">à¦•à§‹à¦¨à§‹ active salary employee à¦¨à§‡à¦‡</option>`;
  if (visibleEmployees.some((employee) => employee.id === currentEmployee)) els.attendanceEmployee.value = currentEmployee;
  if (isEmployee()) els.attendanceEmployee.value = currentEmployeeId();

  const date = els.attendanceDate.value;
  setText("attendanceHint", `${date} à¦¤à¦¾à¦°à¦¿à¦–à§‡à¦° à¦¹à¦¾à¦œà¦¿à¦°à¦¾`);
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
            ${record && !isEmployee() ? `<button class="small-action danger" data-delete-attendance="${record.id}" type="button">à¦¡à¦¿à¦²à¦¿à¦Ÿ</button>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
  els.attendanceTable.innerHTML = rows || `<tr><td colspan="5" class="empty">à¦•à§‹à¦¨à§‹ employee à¦¨à§‡à¦‡à¥¤</td></tr>`;
  renderAttendanceActionState();
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

  els.attendanceCheckInNowBtn.disabled = hasCheckIn;
  els.attendanceCheckOutNowBtn.disabled = !hasCheckIn || hasCheckOut;
  els.attendanceCheckInNowBtn.title = hasCheckIn ? "à¦†à¦œ check-in already save à¦†à¦›à§‡à¥¤" : "à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦¸à¦®à§Ÿ à¦¦à¦¿à§Ÿà§‡ check-in à¦•à¦°à§à¦¨à¥¤";
  els.attendanceCheckOutNowBtn.title = !hasCheckIn
    ? "à¦†à¦—à§‡ check-in à¦•à¦°à¦¤à§‡ à¦¹à¦¬à§‡à¥¤"
    : hasCheckOut
      ? "à¦†à¦œ check-out already save à¦†à¦›à§‡à¥¤"
      : "à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦¸à¦®à§Ÿ à¦¦à¦¿à§Ÿà§‡ check-out à¦•à¦°à§à¦¨à¥¤";

  if (els.mobileCheckInBtn) els.mobileCheckInBtn.disabled = hasCheckIn;
  if (els.mobileCheckOutBtn) els.mobileCheckOutBtn.disabled = !hasCheckIn || hasCheckOut;
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

  els.employeeHomeTitle.textContent = `${employee.name} - à¦†à¦œà¦•à§‡à¦° à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸`;
  els.employeeTodayStatus.textContent = statusText;
  els.employeeTodayCheckIn.textContent = record?.checkIn || "à¦¬à¦¾à¦•à¦¿";
  els.employeeTodayCheckOut.textContent = record?.checkOut || "à¦¬à¦¾à¦•à¦¿";
  els.employeeMonthPayable.textContent = payrollRow ? money(payrollRow.payable) : money(0);
  els.employeePendingApproval.textContent = bn.format(pendingTotal);

  if (runningBreak) {
    els.employeeTodayHint.textContent = `${breakLabel(runningBreak.type)} à¦šà¦²à¦›à§‡à¥¤ Started: ${runningBreak.startTime}, Duration: ${formatDuration(breakDurationSeconds(runningBreak))}`;
  } else if (!hasCheckIn) {
    els.employeeTodayHint.textContent = "à¦†à¦œ check-in à¦¬à¦¾à¦•à¦¿ à¦†à¦›à§‡à¥¤ à¦…à¦«à¦¿à¦¸ à¦²à§‹à¦•à§‡à¦¶à¦¨à§‡ à¦—à¦¿à§Ÿà§‡ Check In Now à¦šà¦¾à¦ªà§à¦¨à¥¤";
  } else if (!hasCheckOut) {
    els.employeeTodayHint.textContent = "à¦†à¦œ check-out à¦¬à¦¾à¦•à¦¿ à¦†à¦›à§‡à¥¤ à¦•à¦¾à¦œ à¦¶à§‡à¦· à¦¹à¦²à§‡ Check Out Now à¦šà¦¾à¦ªà§à¦¨à¥¤";
  } else {
    els.employeeTodayHint.textContent = "à¦†à¦œà¦•à§‡à¦° attendance complete à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦¨à¦¿à¦šà§‡ à¦¨à¦¿à¦œà§‡à¦° payroll à¦“ request history à¦¦à§‡à¦–à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨à¥¤";
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
  setText("payrollHint", isEmployee() ? `${month} à¦®à¦¾à¦¸à§‡à¦° à¦†à¦ªà¦¨à¦¾à¦° payroll à¦¹à¦¿à¦¸à¦¾à¦¬` : `${month} à¦®à¦¾à¦¸à§‡à¦° payroll à¦¹à¦¿à¦¸à¦¾à¦¬`);
  setText("payrollGross", money(summary.gross));
  setText("payrollDeduction", money(summary.deduction));
  setText("payrollPayable", money(summary.payable));
  setText("payrollCutDays", bn.format(summary.cutDays));
  if (els.payrollLockBtn) {
    els.payrollLockBtn.hidden = !isAdmin();
    els.payrollLockBtn.innerHTML = locked ? `<i data-lucide="unlock"></i> Payroll Unlock` : `<i data-lucide="lock"></i> Payroll Lock`;
    els.payrollLockBtn.title = locked ? `${month} payroll locked à¦†à¦›à§‡` : `${month} payroll final à¦•à¦°à§‡ lock à¦•à¦°à§à¦¨`;
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
            <td>${bn.format(row.absent)}</td>
            <td class="amount bad">${money(row.deduction)}</td>
            <td class="amount bad">${money(row.advance)}</td>
            <td class="amount good">${money(row.payable)}</td>
            <td><button class="small-action" data-payslip="${row.id}" type="button">PDF</button></td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="9" class="empty">Payroll-à¦à¦° à¦œà¦¨à§à¦¯ à¦•à§‹à¦¨à§‹ employee à¦¨à§‡à¦‡à¥¤</td></tr>`;
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
              <strong>${escapeHtml(item.employeeName)} Â· ${money(item.amount)}</strong>
              <span class="status-pill">${escapeHtml(item.status)}</span>
            </div>
            <small class="muted">${escapeHtml(item.month)} Â· ${escapeHtml(item.reason || "No reason")} Â· Requested by ${escapeHtml(item.requestedBy)}</small>
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
      .join("") || `<div class="empty">Advance request à¦¨à§‡à¦‡à¥¤</div>`;
}

function leaveTypeLabel(type) {
  return {
    personal: "Personal Leave",
    sick: "Sick Leave",
    study: "Study Leave",
    other: "Other Leave",
  }[type] || type;
}

function renderLeave() {
  if (!els.leaveEmployee) return;
  const visibleEmployees = isEmployee() ? employees().filter((employee) => employee.id === currentEmployeeId()) : employees();
  els.leaveEmployee.innerHTML = visibleEmployees.map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  if (isEmployee()) els.leaveEmployee.value = currentEmployeeId();

  const visibleLeaves = isEmployee() ? state.leaveRequests.filter((item) => item.employeeId === currentEmployeeId()) : state.leaveRequests;
  const employeeId = isEmployee() ? currentEmployeeId() : els.leaveEmployee.value || visibleEmployees[0]?.id;
  const employeeLeaves = state.leaveRequests.filter((item) => item.employeeId === employeeId);
  const used = employeeLeaves.filter((item) => item.status === "approved").reduce((total, item) => total + (item.days || dateRange(item.start, item.end).length), 0);
  const pending = employeeLeaves.filter((item) => item.status === "pending").reduce((total, item) => total + (item.days || dateRange(item.start, item.end).length), 0);
  const total = 20;

  setText("leaveTotal", bn.format(total));
  setText("leaveUsed", bn.format(used));
  setText("leavePending", bn.format(pending));
  setText("leaveRemaining", bn.format(Math.max(total - used - pending, 0)));
  setText("leaveHint", isEmployee() ? "à¦†à¦ªà¦¨à¦¾à¦° leave balance à¦“ request history" : "à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¿à¦¤ à¦•à¦°à§à¦®à§€à¦° leave balance à¦à¦¬à¦‚ à¦¸à¦¬ request");

  els.leaveList.innerHTML =
    visibleLeaves
      .map(
        (item) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.employeeName)} Â· ${escapeHtml(leaveTypeLabel(item.type))}</strong>
              <span class="status-pill">${escapeHtml(item.status)}</span>
            </div>
            <small class="muted">${escapeHtml(item.start)} to ${escapeHtml(item.end)} Â· ${bn.format(item.days || 0)} days Â· ${escapeHtml(item.reason || "No reason")}</small>
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
      .join("") || `<div class="empty">Leave request à¦¨à§‡à¦‡à¥¤</div>`;
}

function renderEmployeeAccess() {
  if (!els.employeeAccessEmployee) return;
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
            <small class="muted">PIN: ${normalizePin(access.pin) ? "*".repeat(String(access.pin).length) : "à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¨à§‡à¦‡"}</small>
            <div class="action-row">
              <button class="small-action" data-toggle-employee-access="${access.id}" type="button">${access.active ? "Inactive" : "Active"}</button>
              <button class="small-action danger" data-delete-employee-access="${access.id}" type="button">à¦¡à¦¿à¦²à¦¿à¦Ÿ</button>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">Employee access à¦¨à§‡à¦‡à¥¤</div>`;
}

function renderNotifications() {
  if (!els.notificationList) return;
  els.notificationList.innerHTML =
    state.notifications
      .slice(0, 20)
      .map((item) => {
        const waPhone = item.phone.replace(/^0/, "880");
        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(item.message)}`;
        return `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(item.type)}</strong>
              <span class="status-pill">${item.sent ? "Sent" : "Pending"}</span>
            </div>
            <small class="muted">${escapeHtml(item.message)}</small>
            <div class="action-row">
              <a class="small-action" href="${url}" target="_blank" rel="noreferrer">WhatsApp</a>
              <button class="small-action" data-mark-notification="${item.id}" type="button">Sent Mark</button>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">Notification à¦¨à§‡à¦‡à¥¤</div>`;
}

function renderCloudSettings() {
  if (!els.cloudApiUrl) return;
  els.cloudApiUrl.value = cloudUrl();
  if (!cloudUrl()) setCloudStatus("Cloud sync à¦¬à¦¨à§à¦§ à¦†à¦›à§‡à¥¤ Apps Script Web App URL à¦¦à¦¿à¦²à§‡ live data sync à¦¹à¦¬à§‡à¥¤");
  renderOfficeLocationSettings();
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
    ? `Office location à¦šà¦¾à¦²à§: ${office.latitude}, ${office.longitude} | Radius ${bn.format(office.radiusMeters)}m`
    : "Office location à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¨à§‡à¦‡ à¦¬à¦¾ à¦¬à¦¨à§à¦§ à¦†à¦›à§‡à¥¤";
  if (els.officeLocationStatus) els.officeLocationStatus.textContent = text;
  if (els.attendanceLocationStatus) {
    els.attendanceLocationStatus.textContent = ready
      ? `Employee check-in/check-out office radius ${bn.format(office.radiusMeters)}m-à¦à¦° à¦­à¦¿à¦¤à¦°à§‡ à¦¹à¦¤à§‡ à¦¹à¦¬à§‡à¥¤`
      : "Office location verification à¦¬à¦¨à§à¦§ à¦†à¦›à§‡à¥¤";
  }
}

function statusLabel(status) {
  return {
    present: "Present",
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
  if (request.action === "add_entry") return `${labelFor(request.payload.category)} Â· ${money(request.payload.amount)} Â· ${request.payload.date}`;
  if (request.action === "bulk_entries") return `${labelFor(request.payload.category)} Â· ${money(request.payload.total)} Â· ${request.payload.start} to ${request.payload.end} Â· ${bn.format(request.payload.entries?.length || 0)} entries`;
  if (request.action === "attendance_punch") return `${request.payload.employeeName} Â· ${request.payload.date} Â· ${request.payload.reason}`;
  if (request.action === "correction_request") return `${correctionDescription(request.payload)} · ${request.payload.reason || ""}`;
  if (request.action === "edit_entry") return `${labelFor(request.payload.category)} Â· ${money(request.payload.amount)} Â· ${request.payload.date}`;
  if (request.action === "leave_request") return `${request.payload.employeeName} Â· ${request.payload.start} to ${request.payload.end} Â· ${bn.format(request.payload.days)} days`;
  if (request.action === "delete_entry") return `Entry ID: ${request.payload.id}`;
  if (request.action === "toggle_fixed" || request.action === "delete_fixed") return `Fixed ID: ${request.payload.id}`;
  if (request.action === "delete_category") return `${request.payload.type}: ${request.payload.category}`;
  if (request.action === "save_fixed") return `${request.payload.name} Â· ${money(request.payload.amount)}`;
  return "à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨à§‡à¦° à¦…à¦¨à§à¦°à§‹à¦§";
}

function renderCategories() {
  els.categoryList.innerHTML = ["income", "expense"]
    .flatMap((type) =>
      state.categories[type].map(
        (category) => `
          <div class="chip">
            <span>${type === "income" ? "à¦†à§Ÿ" : "à¦–à¦°à¦š"}: ${escapeHtml(labelFor(category))}</span>
            <button class="small-action danger" data-delete-category="${type}:${category}" type="button">à¦¡à¦¿à¦²à¦¿à¦Ÿ</button>
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
  setText("reportRangeLabel", `${start} à¦¥à§‡à¦•à§‡ ${end} à¦ªà¦°à§à¦¯à¦¨à§à¦¤ à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ`);
  setText("reportIncome", money(totals.income));
  setText("reportBoost", money(totals.boost));
  setText("reportFixed", money(totals.fixedTotal));
  setText("reportNet", money(totals.net));
  setText("reportStatus", totals.net >= 0 ? "à¦²à¦¾à¦­" : "à¦²à¦¸");
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
          <td>${row.category === "fixed_cost" ? "à¦«à¦¿à¦•à§à¦¸à¦¡ à¦–à¦°à¦š" : escapeHtml(labelFor(row.category))}</td>
          <td>${row.type === "income" ? "à¦†à§Ÿ" : "à¦–à¦°à¦š"}</td>
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
    els.backupStatus.textContent = "Auto backup à¦à¦–à¦¨à§‹ à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà¦¨à¦¿à¥¤";
    return;
  }
  const latest = new Date(backups[0].createdAt).toLocaleString("bn-BD");
  els.backupStatus.textContent = `à¦¶à§‡à¦· auto backup: ${latest} | à¦®à§‹à¦Ÿ snapshot: ${bn.format(backups.length)}`;
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
    ctx.fillText(`à§³${bn.format(Math.round(value))}`, 8, y + 5);
  }

  drawLine(ctx, points, "income", "#16804f", padding, plotW, plotH, maxValue);
  drawLine(ctx, points, "expense", "#b64242", padding, plotW, plotH, maxValue);
  ctx.fillStyle = "#17211d";
  ctx.fillText("à¦¸à¦¬à§à¦œ: à¦†à§Ÿ", padding.left, height - 13);
  ctx.fillStyle = "#b64242";
  ctx.fillText("à¦²à¦¾à¦²: à¦–à¦°à¦š", padding.left + 95, height - 13);
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
    alert("à¦¶à§‡à¦· à¦¤à¦¾à¦°à¦¿à¦– à¦¶à§à¦°à§ à¦¤à¦¾à¦°à¦¿à¦–à§‡à¦° à¦†à¦—à§‡ à¦¹à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡ à¦¨à¦¾à¥¤");
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
      note: note || `à¦°à§‡à¦žà§à¦œ à¦à¦¨à§à¦Ÿà§à¦°à¦¿: ${start} à¦¥à§‡à¦•à§‡ ${end}`,
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
        note: note || `à¦°à§‡à¦žà§à¦œ à¦à¦¨à§à¦Ÿà§à¦°à¦¿: ${start} à¦¥à§‡à¦•à§‡ ${end}`,
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
  if (isAdmin()) alert(`${bn.format(entries.length)}à¦Ÿà¦¿ à¦à¦¨à§à¦Ÿà§à¦°à¦¿ à¦¯à§‹à¦— à¦¹à§Ÿà§‡à¦›à§‡à¥¤`);
}

async function attachLocationIfNeeded(payload) {
  if (!isEmployee() || payload.status !== "present" || !officeLocationReady()) return true;

  try {
    if (els.attendanceLocationStatus) els.attendanceLocationStatus.textContent = "Location verify à¦•à¦°à¦¾ à¦¹à¦šà§à¦›à§‡...";
    const location = await verifyOfficeLocation();
    if (!location.allowed) {
      els.attendanceLocationStatus.textContent = `Office radius-à¦à¦° à¦¬à¦¾à¦‡à¦°à§‡: ${bn.format(location.distance)}m à¦¦à§‚à¦°à§‡à¥¤ Attendance save à¦¹à§Ÿà¦¨à¦¿à¥¤`;
      alert(`à¦†à¦ªà¦¨à¦¿ office radius-à¦à¦° à¦¬à¦¾à¦‡à¦°à§‡ à¦†à¦›à§‡à¦¨ (${location.distance}m)à¥¤ Attendance save à¦¹à§Ÿà¦¨à¦¿à¥¤`);
      return false;
    }
    payload.location = location;
    els.attendanceLocationStatus.textContent = `Location verified: office à¦¥à§‡à¦•à§‡ ${bn.format(location.distance)}m à¦¦à§‚à¦°à§‡à¥¤`;
    return true;
  } catch (error) {
    els.attendanceLocationStatus.textContent = `Location à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿: ${error.message}`;
    alert("Location permission allow à¦¨à¦¾ à¦•à¦°à¦²à§‡ employee attendance save à¦¹à¦¬à§‡ à¦¨à¦¾à¥¤");
    return false;
  }
}

function persistAttendance(payload, employee, resetForm = true) {
  const existing = attendanceFor(payload.date, payload.employeeId);

  if (existing) {
    Object.assign(existing, payload);
  } else {
    state.attendance.push({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() });
  }

  if (payload.status === "present" && isLate(payload.shift, payload.checkIn)) {
    addNotification("Late Arrival Alert", `${employee.name} ${payload.date} à¦¤à¦¾à¦°à¦¿à¦–à§‡ ${shiftLabel(payload.shift)}-à¦ late check-in à¦•à¦°à§‡à¦›à§‡: ${payload.checkIn}`);
  }
  if (payload.status === "leave") {
    addNotification("Leave Approval Alert", `${employee.name}-à¦à¦° ${payload.date} à¦¤à¦¾à¦°à¦¿à¦–à§‡à¦° leave marked/approved à¦¹à§Ÿà§‡à¦›à§‡à¥¤`);
  }

  if (resetForm) {
    els.attendanceForm.reset();
    els.attendanceDate.value = payload.date;
  }
  saveState();
  render();
}

function requestAttendanceApproval(payload, employee, reason) {
  addApproval("attendance_punch", {
    ...payload,
    employeeName: employee.name,
    reason,
    requestedAt: new Date().toISOString(),
  });
  addNotification("Attendance Approval Alert", `${employee.name} ${payload.date} attendance approval à¦¦à¦°à¦•à¦¾à¦°: ${reason}`);
  saveState();
  render();
}

async function saveAttendancePunch(kind) {
  const employee = isEmployee() ? employeeById(currentEmployeeId()) : employees().find((item) => item.id === els.attendanceEmployee.value);
  if (!employee) return;

  const date = today();
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
      alert("à¦†à¦œ check-in already save à¦†à¦›à§‡à¥¤ Update à¦¦à¦°à¦•à¦¾à¦° à¦¹à¦²à§‡ Admin/Manager correction à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨à¥¤");
      renderAttendanceActionState();
      return;
    }
    payload.checkIn = currentTimeValue();
  }

  if (kind === "out") {
    if (!payload.checkIn) {
      alert("à¦†à¦—à§‡ check-in à¦•à¦°à¦¤à§‡ à¦¹à¦¬à§‡, à¦¤à¦¾à¦°à¦ªà¦° check-out à¦•à¦°à¦¾ à¦¯à¦¾à¦¬à§‡à¥¤");
      renderAttendanceActionState();
      return;
    }
    if (payload.checkOut) {
      alert("à¦†à¦œ check-out already save à¦†à¦›à§‡à¥¤ Update à¦¦à¦°à¦•à¦¾à¦° à¦¹à¦²à§‡ Admin/Manager correction à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨à¥¤");
      renderAttendanceActionState();
      return;
    }
    payload.checkOut = currentTimeValue();
  }

  const verified = await attachLocationIfNeeded(payload);
  if (!verified) return;

  const reason = !isAdmin() ? attendanceApprovalReason(payload) : "";
  if (reason) {
    requestAttendanceApproval(payload, employee, reason);
    alert("à¦à¦‡ attendance admin approval à¦²à¦¾à¦—à¦¬à§‡à¥¤ Request à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
    return;
  }

  persistAttendance(payload, employee, false);
  alert(kind === "in" ? "Check-in save à¦¹à§Ÿà§‡à¦›à§‡à¥¤" : "Check-out save à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
}

async function saveAttendance(event) {
  event.preventDefault();
  const employee = employees().find((item) => item.id === els.attendanceEmployee.value);
  if (!employee) return;

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

  const verified = await attachLocationIfNeeded(payload);
  if (!verified) return;

  const reason = !isAdmin() ? attendanceApprovalReason(payload) : "";
  if (reason) {
    requestAttendanceApproval(payload, employee, reason);
    alert("à¦à¦‡ attendance admin approval à¦²à¦¾à¦—à¦¬à§‡à¥¤ Request à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
    return;
  }

  const existing = attendanceFor(payload.date, payload.employeeId);

  if (existing) {
    Object.assign(existing, payload);
  } else {
    state.attendance.push({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() });
  }

  if (payload.status === "present" && isLate(payload.shift, payload.checkIn)) {
    addNotification("Late Arrival Alert", `${employee.name} ${payload.date} à¦¤à¦¾à¦°à¦¿à¦–à§‡ ${shiftLabel(payload.shift)}-à¦ late check-in à¦•à¦°à§‡à¦›à§‡: ${payload.checkIn}`);
  }
  if (payload.status === "leave") {
    addNotification("Leave Approval Alert", `${employee.name}-à¦à¦° ${payload.date} à¦¤à¦¾à¦°à¦¿à¦–à§‡à¦° leave marked/approved à¦¹à§Ÿà§‡à¦›à§‡à¥¤`);
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
    alert("Break start à¦•à¦°à¦¾à¦° à¦†à¦—à§‡ à¦†à¦œà¦•à§‡à¦° check-in à¦¥à¦¾à¦•à¦¤à§‡ à¦¹à¦¬à§‡ à¦à¦¬à¦‚ check-out à¦¹à§Ÿà§‡ à¦—à§‡à¦²à§‡ à¦†à¦° break start à¦•à¦°à¦¾ à¦¯à¦¾à¦¬à§‡ à¦¨à¦¾à¥¤");
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
  if (!running) {
    alert("Running break à¦¨à§‡à¦‡à¥¤");
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
  const type = prompt("Break type à¦²à¦¿à¦–à§à¦¨: prayer, washroom, lunch, personal, official", item.type);
  if (!type || !breakLabels[type]) {
    alert("Valid break type à¦¦à¦¿à¦¨à¥¤");
    return;
  }
  const startTime = prompt("Start time à¦¦à¦¿à¦¨ (HH:MM)", item.startTime || "");
  if (!startTime || timeToMinutes(startTime) === null) return;
  const endTime = prompt("End time à¦¦à¦¿à¦¨ (HH:MM). Running à¦°à¦¾à¦–à¦¤à§‡ à¦–à¦¾à¦²à¦¿ à¦°à¦¾à¦–à§à¦¨à¥¤", item.endTime || "");
  if (endTime && timeToMinutes(endTime) === null) return;
  if (endTime && timeToMinutes(endTime) < timeToMinutes(startTime)) {
    alert("End time start time-à¦à¦° à¦†à¦—à§‡ à¦¹à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡ à¦¨à¦¾à¥¤");
    return;
  }
  const note = prompt("Note à¦²à¦¿à¦–à§à¦¨", item.note || "");

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
  if (!confirm("à¦à¦‡ break record delete à¦•à¦°à¦¬à§‡à¦¨?")) return;
  const item = state.breaks.find((breakItem) => breakItem.id === id);
  state.breaks = state.breaks.filter((item) => item.id !== id);
  logActivity("Delete Break", item ? `${item.employeeName} ${breakLabel(item.type)} deleted` : id, item?.employeeId || "");
  saveState();
  render();
}

function forceEndBreak(id) {
  if (!isAdmin() && !isManager()) return;
  const item = state.breaks.find((breakItem) => breakItem.id === id);
  if (!item || item.endAt) return;
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
  item.status = approved ? "approved" : "rejected";
  item.reviewedAt = new Date().toISOString();
  item.reviewedBy = "Admin";
  if (approved) {
    addNotification("Advance Approval Alert", `${item.employeeName}-à¦à¦° advance salary request approved à¦¹à§Ÿà§‡à¦›à§‡: ${money(item.amount)} (${item.month})`);
  }
  saveState();
  render();
}

function saveEmployeeAccess(event) {
  event.preventDefault();
  if (!isAdmin()) return;
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
  alert("Employee login PIN à¦¸à§‡à¦­ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦à¦–à¦¨ logout à¦•à¦°à§‡ à¦®à§‚à¦² login screen à¦¥à§‡à¦•à§‡ à¦à¦‡ PIN à¦¦à¦¿à§Ÿà§‡ à¦¢à§à¦•à§à¦¨à¥¤");
  render();
}

async function setOfficeLocationFromCurrentPosition() {
  if (!isAdmin()) return;
  try {
    if (els.officeLocationStatus) els.officeLocationStatus.textContent = "à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ location à¦¨à§‡à¦“à§Ÿà¦¾ à¦¹à¦šà§à¦›à§‡...";
    const position = await getCurrentPosition();
    els.officeLatitude.value = position.coords.latitude.toFixed(7);
    els.officeLongitude.value = position.coords.longitude.toFixed(7);
    els.officeLocationStatus.textContent = `Current location set à¦¹à§Ÿà§‡à¦›à§‡à¥¤ Accuracy: ${bn.format(Math.round(position.coords.accuracy || 0))}m`;
  } catch (error) {
    els.officeLocationStatus.textContent = `Location à¦¨à§‡à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿: ${error.message}`;
    alert("Browser location permission allow à¦•à¦°à§à¦¨, à¦¤à¦¾à¦°à¦ªà¦° à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤");
  }
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
  alert("Office location attendance settings à¦¸à§‡à¦­ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
}

function printPayslip(employeeId) {
  if (isEmployee() && employeeId !== currentEmployeeId()) return;
  const month = els.payrollMonth.value;
  const payroll = payrollForMonth(month);
  const row = payroll.rows.find((item) => item.id === employeeId);
  if (!row) return;
  addNotification("Salary Generated Alert", `${row.name}-à¦à¦° ${month} payslip generated à¦¹à§Ÿà§‡à¦›à§‡à¥¤ Net Salary: ${money(row.payable)}`);
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
          <tr><th>Attendance Summary</th><td>Present: ${row.present}, Leave: ${row.leave}, Absent: ${row.absent}</td></tr>
          <tr><th>Gross Salary</th><td>${money(row.salary)}</td></tr>
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
  dateRange(leave.start, leave.end).forEach((date) => {
    persistAttendance(
      {
        employeeId: employee.id,
        employeeName: employee.name,
        date,
        status: "leave",
        shift: "morning",
        checkIn: "",
        checkOut: "",
        breakMinutes: 0,
        note: `${leaveTypeLabel(leave.type)}: ${leave.reason || "Approved leave"}`,
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
  if (end < start) {
    alert("à¦¶à§‡à¦· à¦¤à¦¾à¦°à¦¿à¦– à¦¶à§à¦°à§ à¦¤à¦¾à¦°à¦¿à¦–à§‡à¦° à¦†à¦—à§‡ à¦¹à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡ à¦¨à¦¾à¥¤");
    return;
  }

  const leave = {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    employeeName: employee.name,
    type: els.leaveType.value,
    start,
    end,
    days: dateRange(start, end).length,
    reason: els.leaveReason.value.trim(),
    requestedBy: currentUser.name || employee.name,
    requestedAt: new Date().toISOString(),
    status: isAdmin() ? "approved" : "pending",
  };

  state.leaveRequests.unshift(leave);
  if (isAdmin()) {
    applyLeaveToAttendance(leave);
    addNotification("Leave Approval Alert", `${employee.name}-à¦à¦° leave approved à¦¹à§Ÿà§‡à¦›à§‡: ${start} to ${end}`);
  } else {
    addApproval("leave_request", leave);
    addNotification("Leave Approval Alert", `${employee.name}-à¦à¦° leave approval à¦¦à¦°à¦•à¦¾à¦°: ${start} to ${end}`);
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
    addNotification("Leave Approval Alert", `${leave.employeeName}-à¦à¦° leave approved à¦¹à§Ÿà§‡à¦›à§‡: ${leave.start} to ${leave.end}`);
  }
  saveState();
  render();
}

function togglePayrollLock() {
  if (!isAdmin()) return;
  const month = els.payrollMonth.value;
  const existing = state.payrollLocks.find((item) => item.month === month);
  if (existing?.locked) {
    if (!confirm(`${month} payroll unlock à¦•à¦°à¦¬à§‡à¦¨? à¦à¦°à¦ªà¦° attendance edit à¦•à¦°à¦²à§‡ payroll à¦¬à¦¦à¦²à¦¾à¦¬à§‡à¥¤`)) return;
    existing.locked = false;
    existing.unlockedAt = new Date().toISOString();
    existing.unlockedBy = "Admin";
    saveState();
    render();
    return;
  }

  if (!confirm(`${month} payroll final à¦•à¦°à§‡ lock à¦•à¦°à¦¬à§‡à¦¨? Lock à¦¹à¦²à§‡ unlock à¦¨à¦¾ à¦•à¦°à¦¾ à¦ªà¦°à§à¦¯à¦¨à§à¦¤ payroll à¦¬à¦¦à¦²à¦¾à¦¬à§‡ à¦¨à¦¾à¥¤`)) return;
  const snapshot = calculatePayrollForMonth(month);
  if (existing) {
    Object.assign(existing, { locked: true, snapshot, lockedAt: new Date().toISOString(), lockedBy: "Admin" });
  } else {
    state.payrollLocks.push({ id: crypto.randomUUID(), month, locked: true, snapshot, lockedAt: new Date().toISOString(), lockedBy: "Admin" });
  }
  addNotification("Salary Generated Alert", `${month} payroll generated and locked à¦¹à§Ÿà§‡à¦›à§‡à¥¤ Payable: ${money(snapshot.payable)}`);
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
    name: baseName.includes("à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°") ? baseName : `${baseName} (à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°)`,
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
  alert("Admin approval request à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
  render();
}

function applyApproval(id, approved) {
  const request = state.approvals.find((item) => item.id === id);
  if (!request) return;
  request.status = approved ? "approved" : "rejected";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = "Admin";

  if (approved) {
    if (request.action === "attendance_punch") {
      const employee = employeeById(request.payload.employeeId) || { id: request.payload.employeeId, name: request.payload.employeeName };
      persistAttendance(request.payload, employee, false);
    }
    if (request.action === "correction_request") {
      applyCorrection(request.payload);
      logActivity("Approve Correction", correctionDescription(request.payload), request.payload.employeeId);
    }
    if (request.action === "leave_request") {
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

  saveState();
  render();
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
    alert("Backup JSON paste à¦•à¦°à§à¦¨, à¦¤à¦¾à¦°à¦ªà¦° restore à¦šà¦¾à¦ªà§à¦¨à¥¤");
    return;
  }
  if (!confirm("à¦à¦‡ JSON restore à¦•à¦°à¦²à§‡ current dashboard data replace à¦¹à¦¬à§‡à¥¤ à¦šà¦¾à¦²à¦¾à¦¬à§‡à¦¨?")) return;
  try {
    const parsed = JSON.parse(text);
    const nextState = parsed.data || parsed.state || parsed.backups?.[0]?.data || parsed;
    if (!nextState || typeof nextState !== "object" || !Array.isArray(nextState.fixedExpenses)) {
      throw new Error("Valid dashboard backup à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤");
    }
    const defaults = defaultState();
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, {
      ...defaults,
      ...nextState,
      settings: { ...defaults.settings, ...(nextState.settings || {}) },
      categories: { ...defaults.categories, ...(nextState.categories || {}) },
      breaks: nextState.breaks || [],
      activityLogs: nextState.activityLogs || [],
      leaveRequests: nextState.leaveRequests || [],
      payrollLocks: nextState.payrollLocks || [],
    });
    saveState();
    render();
    alert("Backup restore à¦¹à§Ÿà§‡à¦›à§‡à¥¤ Cloud sync à¦šà¦¾à¦²à§ à¦¥à¦¾à¦•à¦²à§‡ data cloud-à¦à¦“ save à¦¹à¦¬à§‡à¥¤");
  } catch (error) {
    alert(`Restore failed: ${error.message}`);
  }
}

async function clearAppCache() {
  if (!confirm("Cache clear à¦•à¦°à¦²à§‡ à¦à¦‡ browser-à¦à¦° local data/session à¦®à§à¦›à§‡ à¦¯à¦¾à¦¬à§‡à¥¤ Google Sheets backend à¦¥à¦¾à¦•à¦²à§‡ reload-à¦à¦° à¦ªà¦° cloud à¦¥à§‡à¦•à§‡ data à¦†à¦¸à¦¬à§‡à¥¤ à¦šà¦¾à¦²à¦¿à§Ÿà§‡ à¦¯à¦¾à¦¬à§‡à¦¨?")) return;
  const savedCloudUrl = cloudUrl();

  sessionStorage.clear();
  localStorage.clear();
  if (savedCloudUrl) localStorage.setItem(CLOUD_URL_KEY, savedCloudUrl);

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  alert("Cache clear à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦ªà§‡à¦œ reload à¦¹à¦¬à§‡à¥¤");
  location.reload();
}

function copyCurrentLink() {
  navigator.clipboard
    ?.writeText(location.href)
    .then(() => alert("à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ dashboard link à¦•à¦ªà¦¿ à¦¹à§Ÿà§‡à¦›à§‡à¥¤"))
    .catch(() => alert("à¦²à¦¿à¦‚à¦• à¦•à¦ªà¦¿ à¦•à¦°à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤ address bar à¦¥à§‡à¦•à§‡ link à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨à¥¤"));
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
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
}

function lockApp() {
  sessionStorage.removeItem(SESSION_KEY);
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
  els.payrollMonth.value = now.slice(0, 7);
  if (els.breakReportMonth) els.breakReportMonth.value = now.slice(0, 7);
  els.advanceMonth.value = now.slice(0, 7);
  if (els.correctionDate) els.correctionDate.value = now;
  if (els.leaveStart) els.leaveStart.value = now;
  if (els.leaveEnd) els.leaveEnd.value = now;
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}View`).classList.add("active");
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

function finishLogin(user) {
  els.loginError.textContent = "";
  currentUser = user;
  unlockApp();
  render();
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = normalizePin(els.pinInput.value);
  const user = userForPin(password);
  if (user) {
    finishLogin(user);
    return;
  }

  if (cloudUrl()) {
    els.loginError.textContent = "Cloud à¦¥à§‡à¦•à§‡ data à¦†à¦¨à¦¾ à¦¹à¦šà§à¦›à§‡, à¦à¦•à¦Ÿà§ à¦…à¦ªà§‡à¦•à§à¦·à¦¾ à¦•à¦°à§à¦¨...";
    const loaded = await syncFromCloud(false);
    const cloudUser = userForPin(password);
    if (cloudUser) {
      finishLogin(cloudUser);
      return;
    }
    if (!loaded) {
      els.loginError.textContent = "Cloud à¦¥à§‡à¦•à§‡ data à¦†à¦¨à¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤ internet/Apps Script URL à¦šà§‡à¦• à¦•à¦°à§à¦¨à¥¤";
      return;
    }
  }

  els.loginError.textContent = `PIN à¦ à¦¿à¦• à¦¨à§Ÿà¥¤ ${cloudLoginSummary()}`;
});

document.querySelector("#logoutBtn").addEventListener("click", lockApp);
els.pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  state.settings.adminPin = normalizePin(els.newPin.value);
  els.newPin.value = "";
  saveState();
  alert("à¦¨à¦¤à§à¦¨ PIN à¦¸à§‡à¦­ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
});
els.managerForm.addEventListener("submit", addManager);
els.employeeAccessForm.addEventListener("submit", saveEmployeeAccess);

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
els.breakReportMonth?.addEventListener("change", renderMonthlyBreakReport);
els.breakReportEmployee?.addEventListener("change", renderMonthlyBreakReport);
els.breakReportType?.addEventListener("change", renderMonthlyBreakReport);
document.querySelector("#applyBreakReportFilter")?.addEventListener("click", renderMonthlyBreakReport);
els.mobileCheckInBtn?.addEventListener("click", () => saveAttendancePunch("in"));
els.mobileCheckOutBtn?.addEventListener("click", () => saveAttendancePunch("out"));
els.mobileStartBreakBtn?.addEventListener("click", () => els.breakForm?.requestSubmit());
els.mobileEndBreakBtn?.addEventListener("click", endBreak);
els.advanceForm.addEventListener("submit", saveAdvance);
els.leaveForm?.addEventListener("submit", saveLeaveRequest);
els.leaveEmployee?.addEventListener("change", renderLeave);
els.fixedForm.addEventListener("submit", saveFixed);
els.categoryForm.addEventListener("submit", addCategory);
els.editEntryForm.addEventListener("submit", saveEditEntry);
document.querySelector("#closeModal").addEventListener("click", closeModal);
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
els.payrollMonth.addEventListener("change", () => {
  renderPayroll();
  renderEmployeeHome();
});
document.querySelector("#csvExportBtn").addEventListener("click", exportCsv);
document.querySelector("#pdfExportBtn").addEventListener("click", printPdf);
document.querySelector("#exportBtn").addEventListener("click", exportJson);
document.querySelector("#downloadBackupBtn").addEventListener("click", downloadBackup);
document.querySelector("#restoreJsonBtn")?.addEventListener("click", restoreJson);
document.querySelector("#clearCacheBtn").addEventListener("click", clearAppCache);
document.querySelector("#copyLinkBtn").addEventListener("click", copyCurrentLink);
document.querySelector("#saveCloudUrlBtn").addEventListener("click", () => {
  localStorage.setItem(CLOUD_URL_KEY, els.cloudApiUrl.value.trim());
  setCloudStatus(cloudUrl() ? "Cloud URL à¦¸à§‡à¦­ à¦¹à§Ÿà§‡à¦›à§‡à¥¤" : "Cloud sync à¦¬à¦¨à§à¦§ à¦†à¦›à§‡à¥¤");
});
document.querySelector("#syncFromCloudBtn").addEventListener("click", () => syncFromCloud(true));
document.querySelector("#syncToCloudBtn").addEventListener("click", () => syncToCloud(true));
document.querySelector("#setOfficeLocationBtn")?.addEventListener("click", setOfficeLocationFromCurrentPosition);
document.querySelector("#saveOfficeLocationBtn")?.addEventListener("click", saveOfficeLocation);

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
  const attendanceDelete = event.target.closest("[data-delete-attendance]");
  const approveAdvance = event.target.closest("[data-approve-advance]");
  const rejectAdvance = event.target.closest("[data-reject-advance]");
  const approveLeave = event.target.closest("[data-approve-leave]");
  const rejectLeave = event.target.closest("[data-reject-leave]");
  const editBreakButton = event.target.closest("[data-edit-break]");
  const deleteBreakButton = event.target.closest("[data-delete-break]");
  const forceEndBreakButton = event.target.closest("[data-force-end-break]");
  const payslip = event.target.closest("[data-payslip]");
  const employeeAccessToggle = event.target.closest("[data-toggle-employee-access]");
  const employeeAccessDelete = event.target.closest("[data-delete-employee-access]");
  const notificationMark = event.target.closest("[data-mark-notification]");

  if (entryEdit) openEditEntry(entryEdit.dataset.editEntry);

  if (entryDelete && isManager()) {
    addApproval("delete_entry", { id: entryDelete.dataset.deleteEntry });
  } else if (entryDelete && confirm("à¦à¦‡ à¦à¦¨à§à¦Ÿà§à¦°à¦¿ à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¬à§‡à¦¨?")) {
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
  } else if (fixedDelete && confirm("à¦à¦‡ à¦«à¦¿à¦•à§à¦¸à¦¡ à¦–à¦°à¦š à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¬à§‡à¦¨?")) {
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
      alert("à¦à¦‡ à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿à¦¤à§‡ à¦à¦¨à§à¦Ÿà§à¦°à¦¿ à¦†à¦›à§‡, à¦¤à¦¾à¦‡ à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¾à¦° à¦†à¦—à§‡ à¦à¦¨à§à¦Ÿà§à¦°à¦¿à¦—à§à¦²à§‹ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨à¥¤");
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

  if (managerDelete && confirm("à¦à¦‡ manager access à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¬à§‡à¦¨?")) {
    state.managers = state.managers.filter((item) => item.id !== managerDelete.dataset.deleteManager);
    saveState();
    render();
  }

  if (approveRequest) applyApproval(approveRequest.dataset.approveRequest, true);
  if (rejectRequest) applyApproval(rejectRequest.dataset.rejectRequest, false);

  if (attendanceDelete && !isEmployee() && confirm("à¦à¦‡ à¦¹à¦¾à¦œà¦¿à¦°à¦¾ record à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¬à§‡à¦¨?")) {
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

  if (employeeAccessDelete && confirm("à¦à¦‡ employee access à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¬à§‡à¦¨?")) {
    state.employeeAccess = state.employeeAccess.filter((item) => item.id !== employeeAccessDelete.dataset.deleteEmployeeAccess);
    saveState();
    render();
  }

  if (notificationMark) {
    const item = state.notifications.find((notification) => notification.id === notificationMark.dataset.markNotification);
    if (item) item.sent = true;
    saveState();
    render();
  }
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("à¦¸à¦¬ à¦¡à§‡à¦Ÿà¦¾ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à§‡ à¦¡à¦¿à¦«à¦²à§à¦Ÿ à¦–à¦°à¦š à¦«à¦¿à¦°à¦¿à§Ÿà§‡ à¦†à¦¨à¦¬à§‡à¦¨?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  Object.assign(state, defaultState());
  saveState();
  render();
});

window.addEventListener("resize", () => renderChart(els.selectedDate.value));

initDates();
ensureEmployeeAccess();
breakTicker = setInterval(() => {
  renderBreaks();
  renderEmployeeHome();
}, 1000);

async function boot() {
  if (cloudUrl()) await syncFromCloud(false);
  try {
    const savedSession = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (savedSession?.role) {
      currentUser = savedSession;
      unlockApp();
    }
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
  if (els.loginRoleHint && currentUser.role === "guest") els.loginRoleHint.textContent = cloudLoginSummary();
}

boot();

