const SHEET_NAME = "AppState";
const CHUNK_SIZE = 45000;

function doGet(e) {
  const action = (e.parameter.action || "getState").trim();

  if (action === "health") {
    return json({ ok: true, message: "Minus Style backend is running" });
  }

  if (action === "getState") {
    return json({ ok: true, state: readState(), updatedAt: readUpdatedAt() });
  }

  return json({ ok: false, error: "Unknown action" });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");

    if (payload.action === "saveState") {
      saveState(payload.state || {}, payload.updatedAt || new Date().toISOString());
      return json({ ok: true, updatedAt: readUpdatedAt(), chunks: countChunks() });
    }

    return json({ ok: false, error: "Unknown action" });
  } catch (error) {
    return json({ ok: false, error: error.message });
  }
}

function readState() {
  const sheet = getSheet();

  // New chunked storage.
  if (sheet.getLastRow() >= 2 && sheet.getRange("A1").getValue() === "chunk_index") {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    const jsonText = rows
      .filter((row) => row[0] !== "" && row[1] !== "")
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map((row) => row[1])
      .join("");
    return jsonText ? JSON.parse(jsonText) : null;
  }

  // Legacy single-cell storage fallback.
  const legacyValue = sheet.getRange("A2").getValue();
  if (!legacyValue) return null;
  return JSON.parse(legacyValue);
}

function saveState(state, updatedAt) {
  const sheet = getSheet();
  const jsonText = JSON.stringify(state);
  const chunks = [];

  for (let i = 0; i < jsonText.length; i += CHUNK_SIZE) {
    chunks.push([chunks.length, jsonText.slice(i, i + CHUNK_SIZE), updatedAt]);
  }

  sheet.clear();
  sheet.getRange(1, 1, 1, 3).setValues([["chunk_index", "state_chunk", "updated_at"]]);
  if (chunks.length) {
    sheet.getRange(2, 1, chunks.length, 3).setValues(chunks);
  }
  sheet.autoResizeColumns(1, 3);
}

function readUpdatedAt() {
  const sheet = getSheet();
  if (sheet.getRange("A1").getValue() === "chunk_index") {
    return sheet.getRange("C2").getValue();
  }
  return sheet.getRange("B2").getValue();
}

function countChunks() {
  const sheet = getSheet();
  if (sheet.getLastRow() < 2) return 0;
  return Math.max(sheet.getLastRow() - 1, 0);
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([["chunk_index", "state_chunk", "updated_at"]]);
  }
  return sheet;
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
