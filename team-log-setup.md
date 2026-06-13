# Live log setup — Google Sheet as the database (~10 min, free, no token)

Every downloaded file becomes a row in a Google Sheet. The website reads the
sheet live and shows it in the Log tab — but never links to the sheet itself.
The sheet is the database; the site just consumes its data.

Two URLs make this work:
- a **webhook** (Apps Script) the page POSTs each download to → appends a row
- a **published-CSV link** the page reads the log back from

## 1. Make the sheet + script
1. Create a new Google Sheet (this is your live log — name it whatever)
2. **Extensions → Apps Script**
3. Delete the placeholder, paste in all of `team-log.gs` from this repo, save

## 2. Deploy the webhook
1. **Deploy → New deployment** → gear icon → **Web app**
2. Execute as: **Me** · Who has access: **Anyone**
3. **Deploy**, authorize when asked (it only touches this sheet)
4. Copy the **Web app URL** — looks like `https://script.google.com/macros/s/…/exec`
   → this is your **TEAM_LOG_URL**

## 3. Publish the sheet as CSV (so the site can read it)
1. Back in the sheet: **File → Share → Publish to web**
2. In the dialog: pick the **`log`** sheet (not "Entire document"), format **Comma-separated values (.csv)**
3. Click **Publish**, confirm, copy the link it gives you
   → this is your **SHEET_CSV_URL** (ends in `output=csv`)
   *(If the `log` tab isn't listed yet, do one test download first so the script
   creates it, or add a sheet named `log` manually, then publish.)*

## 4. Wire the page
In `index.html`, near the top of the main script:
```js
const TEAM_LOG_URL  = "";   // ← paste the Web app URL
const SHEET_CSV_URL = "";   // ← paste the published-CSV link
```
Commit & push.

## How it behaves
- Each download POSTs a row; it lands in the sheet within a second or two
- The Log tab reads the published CSV (Google caches it briefly, so brand-new
  rows can take ~1–2 min to appear in the site — they show instantly for the
  person who made them, via the local merge)
- One shared log for everyone, no per-person split, no names collected
- Logging happens only on a file download — naming a part alone doesn't log
- `settings_json` holds the full configuration, so any row → **Load** (reopen
  on the site) or **↓** (regenerate and download)
- The sheet doubles as your sortable/filterable master record

## Notes
- "Anyone" access on the webhook means anyone with that URL can append rows.
  The URL isn't guessable and the script only appends to one sheet — worst case
  is junk rows you can delete in the sheet. Don't reuse this for anything sensitive.
- Publishing the CSV makes that sheet's data readable by anyone with the link.
  That's required for the site to read it. Keep nothing private in this sheet.
- To change the script later: edit → Deploy → Manage deployments → edit → Deploy
  (URL stays the same).
