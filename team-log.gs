// Live log backend — Google Sheets edition.
// Lives inside a Google Sheet (Extensions -> Apps Script). Receives a row from
// the website on every download and appends it. Also serves the log back as
// JSON if you ever want it, though the site reads the published-CSV instead.

const SHEET_NAME = "log";
const HEADERS = ["time","kind","name","file","mode","size","capacity","settings_json"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
    }
    sh.appendRow([
      new Date(d.t || Date.now()),
      String(d.kind || "").slice(0, 10),
      String(d.name || "").slice(0, 120),
      String(d.file || "").slice(0, 200),
      String(d.mode || "").slice(0, 20),
      String(d.size || "").slice(0, 30),
      String(d.cap  || "").slice(0, 40),
      JSON.stringify(d.snap || null).slice(0, 6000)
    ]);
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("error: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  const rows = sh ? sh.getDataRange().getValues() : [];
  const out = rows.slice(1).map(function (r) {
    return {
      t: new Date(r[0]).getTime(), kind: r[1] || "", name: r[2] || null,
      file: r[3] || "", mode: r[4] || "", size: r[5] || "", cap: r[6] || null,
      snap: safeParse(r[7])
    };
  });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
function safeParse(s){ try { return JSON.parse(s); } catch (e) { return null; } }
