const STORAGE_KEY = "minus-style-affiliate-dashboard-v2";
const LEGACY_KEY = "minus-style-affiliate-dashboard-v1";
const BACKUP_KEY = "minus-style-affiliate-backups-v1";
const SESSION_KEY = "minus-style-admin-session";
const CLOUD_URL_KEY = "minus-style-cloud-api-url";
const CLOUD_PUSH_DELAY = 900;

const bn = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
const state = loadState();
let editingFixedId = null;
let currentUser = { role: "guest", name: "" };
let cloudPushTimer = null;
let isApplyingCloudState = false;

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

const els = {
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  pinInput: document.querySelector("#pinInput"),
  loginError: document.querySelector("#loginError"),
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
  attendanceNote: document.querySelector("#attendanceNote"),
  attendanceTable: document.querySelector("#attendanceTable"),
  advanceForm: document.querySelector("#advanceForm"),
  advanceEmployee: document.querySelector("#advanceEmployee"),
  advanceMonth: document.querySelector("#advanceMonth"),
  advanceAmount: document.querySelector("#advanceAmount"),
  advanceReason: document.querySelector("#advanceReason"),
  advanceList: document.querySelector("#advanceList"),
  entryForm: document.querySelector("#entryForm"),
  entryType: document.querySelector("#entryType"),
  entryCategory: document.querySelector("#entryCategory"),
  entryAmount: document.querySelector("#entryAmount"),
  entryDate: document.querySelector("#entryDate"),
  entryNote: document.querySelector("#entryNote"),
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
    },
    managers: [{ id: crypto.randomUUID(), name: "ফাইজুর (ম্যানেজার)", pin: "2222", active: true }],
    employeeAccess: [],
    approvals: [],
    attendance: [],
    advances: [],
    notifications: [],
    fixedExpenses: [
      fixed("ফাইজুর বেতন", "salary", 15000, true, "এমপ্লয়ী"),
      fixed("অমিত বেতন", "salary", 13000, true, "এমপ্লয়ী"),
      fixed("শুভ ভাই বেতন", "salary", 12000, true, "এমপ্লয়ী"),
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
      employeeAccess: parsed.employeeAccess || defaults.employeeAccess,
      approvals: parsed.approvals || defaults.approvals,
      attendance: parsed.attendance || defaults.attendance,
      advances: parsed.advances || defaults.advances,
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
  return localStorage.getItem(CLOUD_URL_KEY) || "";
}

function setCloudStatus(message) {
  if (els.cloudStatus) els.cloudStatus.textContent = message;
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
    setCloudStatus(`শেষ cloud save: ${new Date().toLocaleString("bn-BD")}`);
    if (showAlert) alert("Cloud-এ data save হয়েছে।");
  } catch (error) {
    setCloudStatus(`Cloud save failed: ${error.message}`);
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
      isApplyingCloudState = false;
      ensureEmployeeAccess();
      render();
    }
    setCloudStatus(`শেষ cloud load: ${new Date().toLocaleString("bn-BD")}`);
    if (showAlert) alert("Cloud থেকে data load হয়েছে।");
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
  return `৳${bn.format(Math.round(Number(value) || 0))}`;
}

function today() {
  return formatYmd(new Date());
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
      name: item.name.replace(/\s*বেতন\s*$/u, "").trim(),
      salary: Number(item.amount || 0),
    }));
}

function ensureEmployeeAccess() {
  if (state.employeeAccess.length) return;
  const first = employees()[0];
  if (!first) return;
  state.employeeAccess.push({ id: crypto.randomUUID(), employeeId: first.id, pin: "3333", active: true });
}

function currentEmployeeId() {
  return currentUser.employeeId || "";
}

function employeeById(id) {
  return employees().find((employee) => employee.id === id);
}

function shiftStart(shift) {
  return { morning: "09:00", evening: "15:00", night: "21:00" }[shift] || "09:00";
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
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

function attendanceFor(date, employeeId) {
  return state.attendance.find((item) => item.date === date && item.employeeId === employeeId);
}

function payrollForMonth(month) {
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

function fixedForRange(start, end) {
  return dateRange(start, end).reduce((total, date) => total + activeFixedTotal() / getDaysInMonth(date), 0);
}

function entriesInRange(start, end) {
  return state.entries.filter((entry) => entry.date >= start && entry.date <= end);
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
  setText("todayNetHint", day.net >= 0 ? "আজ লাভে আছেন" : "আজ লসে আছেন");
  setText("sidebarFixedTotal", money(activeFixedTotal()));
  setText("monthIncome", money(month.income));
  setText("monthBoost", money(month.boost));
  setText("monthFixed", money(activeFixedTotal()));
  setText("monthNet", money(month.net));
  setText("monthStatus", month.net >= 0 ? "মাসিক লাভ" : "মাসিক লস");
  setText("monthLabel", `${formatMonth(date)} সারাংশ`);

  document.querySelector("#todayNet").className = day.net >= 0 ? "amount good" : "amount bad";
  document.querySelector("#monthNet").className = month.net >= 0 ? "amount good" : "amount bad";

  renderEntryCategories(els.entryType.value, els.entryCategory);
  renderEntryCategories(els.editType.value, els.editCategory);
  renderTodayEntries(day.entries);
  renderEntriesTable();
  renderFixedList();
  renderCategories();
  renderManagers();
  renderApprovals();
  renderRoleUi();
  renderAttendance();
  renderPayroll();
  renderAdvance();
  renderEmployeeAccess();
  renderNotifications();
  renderCloudSettings();
  renderReports();
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
  els.approvalList.innerHTML =
    pending
      .map(
        (request) => `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(requestTitle(request))}</strong>
              <span class="status-pill">${escapeHtml(request.requestedBy)}</span>
            </div>
            <small class="muted">${new Date(request.createdAt).toLocaleString("bn-BD")} · ${escapeHtml(requestDescription(request))}</small>
            <div class="action-row">
              <button class="small-action" data-approve-request="${request.id}" type="button">Approve</button>
              <button class="small-action danger" data-reject-request="${request.id}" type="button">Reject</button>
            </div>
          </article>
        `,
      )
      .join("") || `<div class="empty">কোনো pending request নেই।</div>`;
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
          <td>${bn.format(record?.breakMinutes || 0)} min</td>
          <td>${escapeHtml(record?.note || "-")}</td>
          <td>${escapeHtml(record?.markedBy || "Default")}</td>
          <td>
            ${record ? `<button class="small-action danger" data-delete-attendance="${record.id}" type="button">ডিলিট</button>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
  els.attendanceTable.innerHTML = rows || `<tr><td colspan="5" class="empty">কোনো employee নেই।</td></tr>`;
}

function renderPayroll() {
  if (!els.payrollMonth) return;
  const month = els.payrollMonth.value;
  const payroll = payrollForMonth(month);
  setText("payrollHint", `${month} মাসের payroll হিসাব`);
  setText("payrollGross", money(payroll.gross));
  setText("payrollDeduction", money(payroll.deduction));
  setText("payrollPayable", money(payroll.payable));
  setText("payrollCutDays", bn.format(payroll.cutDays));
  document.querySelector("#payrollTable").innerHTML =
    payroll.rows
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
      .join("") || `<tr><td colspan="9" class="empty">Payroll-এর জন্য কোনো employee নেই।</td></tr>`;
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

function renderEmployeeAccess() {
  if (!els.employeeAccessEmployee) return;
  els.employeeAccessEmployee.innerHTML = employees().map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`).join("");
  els.employeeAccessList.innerHTML =
    state.employeeAccess
      .map((access) => {
        const employee = employeeById(access.employeeId);
        return `
          <article class="fixed-item">
            <div class="item-line">
              <strong>${escapeHtml(employee?.name || "Unknown employee")}</strong>
              <span class="status-pill">${access.active ? "Active" : "Inactive"}</span>
            </div>
            <small class="muted">PIN: ${"*".repeat(String(access.pin).length)}</small>
            <div class="action-row">
              <button class="small-action" data-toggle-employee-access="${access.id}" type="button">${access.active ? "Inactive" : "Active"}</button>
              <button class="small-action danger" data-delete-employee-access="${access.id}" type="button">ডিলিট</button>
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">Employee access নেই।</div>`;
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
      .join("") || `<div class="empty">Notification নেই।</div>`;
}

function renderCloudSettings() {
  if (!els.cloudApiUrl) return;
  els.cloudApiUrl.value = cloudUrl();
  if (!cloudUrl()) setCloudStatus("Cloud sync বন্ধ আছে। Apps Script Web App URL দিলে live data sync হবে।");
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
    edit_entry: "Entry edit request",
    delete_entry: "Entry delete request",
    toggle_fixed: "Fixed expense update request",
    delete_fixed: "Fixed expense delete request",
    delete_category: "Category delete request",
    save_fixed: "Fixed expense save request",
  }[request.action] || request.action;
}

function requestDescription(request) {
  if (request.action === "edit_entry") return `${labelFor(request.payload.category)} · ${money(request.payload.amount)} · ${request.payload.date}`;
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
    return;
  }
  const latest = new Date(backups[0].createdAt).toLocaleString("bn-BD");
  els.backupStatus.textContent = `শেষ auto backup: ${latest} | মোট snapshot: ${bn.format(backups.length)}`;
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
  state.entries.push({
    id: crypto.randomUUID(),
    type: els.entryType.value,
    category: els.entryCategory.value,
    amount: Number(els.entryAmount.value),
    date: els.entryDate.value,
    note: els.entryNote.value.trim(),
    createdBy: currentUser.name || "Admin",
    createdAt: new Date().toISOString(),
  });
  saveState();
  els.entryForm.reset();
  els.entryDate.value = els.selectedDate.value;
  render();
}

function saveAttendance(event) {
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
    addNotification("Advance Approval Alert", `${item.employeeName}-এর advance salary request approved হয়েছে: ${money(item.amount)} (${item.month})`);
  }
  saveState();
  render();
}

function saveEmployeeAccess(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  const existing = state.employeeAccess.find((item) => item.employeeId === els.employeeAccessEmployee.value);
  if (existing) {
    existing.pin = els.employeeAccessPin.value.trim();
    existing.active = true;
  } else {
    state.employeeAccess.push({
      id: crypto.randomUUID(),
      employeeId: els.employeeAccessEmployee.value,
      pin: els.employeeAccessPin.value.trim(),
      active: true,
    });
  }
  els.employeeAccessForm.reset();
  saveState();
  render();
}

function printPayslip(employeeId) {
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
  const pin = els.managerPin.value.trim();
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
  saveState();
  alert("Admin approval request পাঠানো হয়েছে।");
  render();
}

function applyApproval(id, approved) {
  const request = state.approvals.find((item) => item.id === id);
  if (!request) return;
  request.status = approved ? "approved" : "rejected";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = "Admin";

  if (approved) {
    if (request.action === "edit_entry") {
      const entry = state.entries.find((item) => item.id === request.payload.id);
      if (entry) Object.assign(entry, request.payload);
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
  }

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
    Object.assign(entry, payload);
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

function copyCurrentLink() {
  navigator.clipboard
    ?.writeText(location.href)
    .then(() => alert("বর্তমান dashboard link কপি হয়েছে।"))
    .catch(() => alert("লিংক কপি করা যায়নি। address bar থেকে link কপি করুন।"));
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
  els.reportStart.value = monthStart(now);
  els.reportEnd.value = monthEnd(now);
  els.payrollMonth.value = now.slice(0, 7);
  els.advanceMonth.value = now.slice(0, 7);
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}View`).classList.add("active");
  });
});

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (els.pinInput.value === state.settings.adminPin) {
    els.loginError.textContent = "";
    currentUser = { role: "admin", name: "Admin" };
    unlockApp();
    render();
    return;
  }

  const manager = state.managers.find((item) => item.active && item.pin === els.pinInput.value);
  if (manager) {
    els.loginError.textContent = "";
    currentUser = { role: "manager", name: manager.name };
    unlockApp();
    render();
    return;
  }

  const employeeAccess = state.employeeAccess.find((item) => item.active && item.pin === els.pinInput.value);
  if (employeeAccess) {
    const employee = employeeById(employeeAccess.employeeId);
    if (employee) {
      els.loginError.textContent = "";
      currentUser = { role: "employee", name: employee.name, employeeId: employee.id };
      unlockApp();
      render();
      return;
    }
  }

  els.loginError.textContent = "PIN ঠিক নয়।";
});

document.querySelector("#logoutBtn").addEventListener("click", lockApp);
els.pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  state.settings.adminPin = els.newPin.value.trim();
  els.newPin.value = "";
  saveState();
  alert("নতুন PIN সেভ হয়েছে।");
});
els.managerForm.addEventListener("submit", addManager);
els.employeeAccessForm.addEventListener("submit", saveEmployeeAccess);

els.selectedDate.addEventListener("change", () => {
  els.entryDate.value = els.selectedDate.value;
  render();
});
els.entryType.addEventListener("change", () => renderEntryCategories(els.entryType.value, els.entryCategory));
els.editType.addEventListener("change", () => renderEntryCategories(els.editType.value, els.editCategory));
els.entryForm.addEventListener("submit", addEntry);
els.attendanceForm.addEventListener("submit", saveAttendance);
els.advanceForm.addEventListener("submit", saveAdvance);
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
els.attendanceDate.addEventListener("change", renderAttendance);
els.payrollMonth.addEventListener("change", renderPayroll);
document.querySelector("#csvExportBtn").addEventListener("click", exportCsv);
document.querySelector("#pdfExportBtn").addEventListener("click", printPdf);
document.querySelector("#exportBtn").addEventListener("click", exportJson);
document.querySelector("#downloadBackupBtn").addEventListener("click", downloadBackup);
document.querySelector("#copyLinkBtn").addEventListener("click", copyCurrentLink);
document.querySelector("#saveCloudUrlBtn").addEventListener("click", () => {
  localStorage.setItem(CLOUD_URL_KEY, els.cloudApiUrl.value.trim());
  setCloudStatus(cloudUrl() ? "Cloud URL সেভ হয়েছে।" : "Cloud sync বন্ধ আছে।");
});
document.querySelector("#syncFromCloudBtn").addEventListener("click", () => syncFromCloud(true));
document.querySelector("#syncToCloudBtn").addEventListener("click", () => syncToCloud(true));

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
  const payslip = event.target.closest("[data-payslip]");
  const employeeAccessToggle = event.target.closest("[data-toggle-employee-access]");
  const employeeAccessDelete = event.target.closest("[data-delete-employee-access]");
  const notificationMark = event.target.closest("[data-mark-notification]");

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

  if (attendanceDelete && confirm("এই হাজিরা record ডিলিট করবেন?")) {
    state.attendance = state.attendance.filter((item) => item.id !== attendanceDelete.dataset.deleteAttendance);
    saveState();
    render();
  }

  if (approveAdvance) reviewAdvance(approveAdvance.dataset.approveAdvance, true);
  if (rejectAdvance) reviewAdvance(rejectAdvance.dataset.rejectAdvance, false);
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

  if (notificationMark) {
    const item = state.notifications.find((notification) => notification.id === notificationMark.dataset.markNotification);
    if (item) item.sent = true;
    saveState();
    render();
  }
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("সব ডেটা রিসেট করে ডিফল্ট খরচ ফিরিয়ে আনবেন?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  Object.assign(state, defaultState());
  saveState();
  render();
});

window.addEventListener("resize", () => renderChart(els.selectedDate.value));

initDates();
ensureEmployeeAccess();
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
  saveState();
  render();
}

boot();
