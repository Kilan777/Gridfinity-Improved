// Team log backend — receives events from the Gridfinity Holder Generator
// and COMMITS each one as a row in log.csv in the GitHub repo.
// The GitHub token lives in Script Properties (server-side), never in the page.
//
// Setup: see team-log-setup.md in the repo.

var GH_OWNER  = "Kilan777";
var GH_REPO   = "Gridfinity-Improved";
var GH_PATH   = "log.csv";
var GH_BRANCH = "main";
var CSV_HEADER = "time,by,kind,name,file,mode,size,capacity,settings_json\n";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
    if (!token) return out("error: GITHUB_TOKEN script property not set");

    var api = "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + GH_PATH;
    var headers = { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" };

    // read current log.csv (or start a new one)
    var sha = null, csv = CSV_HEADER;
    var get = UrlFetchApp.fetch(api + "?ref=" + GH_BRANCH, { headers: headers, muteHttpExceptions: true });
    if (get.getResponseCode() === 200) {
      var j = JSON.parse(get.getContentText());
      sha = j.sha;
      csv = Utilities.newBlob(Utilities.base64Decode(j.content.replace(/\n/g, ""))).getDataAsString();
      if (csv.slice(-1) !== "\n") csv += "\n";
    }

    // append the new row, CSV-escaped
    var esc = function (v) { v = String(v == null ? "" : v); return '"' + v.replace(/"/g, '""') + '"'; };
    csv += [
      new Date(d.t || Date.now()).toISOString(),
      "",  // (by) unused — single shared log
      String(d.kind || "").slice(0, 10),
      String(d.name || "").slice(0, 120),
      String(d.file || "").slice(0, 200),
      String(d.mode || "").slice(0, 20),
      String(d.size || "").slice(0, 30),
      String(d.cap  || "").slice(0, 40),
      JSON.stringify(d.snap || null)
    ].map(esc).join(",") + "\n";

    // commit it back (retry once on a concurrent-write conflict)
    for (var attempt = 0; attempt < 2; attempt++) {
      var body = {
        message: "log: " + (d.kind || "event") + " " + (d.name || d.file || ""),
        content: Utilities.base64Encode(csv, Utilities.Charset.UTF_8),
        branch: GH_BRANCH
      };
      if (sha) body.sha = sha;
      var put = UrlFetchApp.fetch(api, {
        method: "put", headers: headers, contentType: "application/json",
        payload: JSON.stringify(body), muteHttpExceptions: true
      });
      if (put.getResponseCode() < 300) return out("ok");
      if (put.getResponseCode() === 409 && attempt === 0) {
        var re = UrlFetchApp.fetch(api + "?ref=" + GH_BRANCH, { headers: headers, muteHttpExceptions: true });
        if (re.getResponseCode() === 200) sha = JSON.parse(re.getContentText()).sha;
        continue;
      }
      return out("error: github " + put.getResponseCode() + " " + put.getContentText().slice(0, 200));
    }
    return out("error: conflict");
  } catch (err) {
    return out("error: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out("gridfinity team log webhook is alive"); }
function out(s) { return ContentService.createTextOutput(s); }
