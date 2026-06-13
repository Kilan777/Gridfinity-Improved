# Team log setup — permanent log.csv in this repo

Every download and named part gets committed as a row in `log.csv` in this repo.
The website's Log tab → "Team log" reads that file, and every entry can be
reopened (Load) or regenerated and downloaded (↓) right from the site. The log
is append-only and lives in git history — nobody can clear it from the website.

The page can't hold a GitHub write token (it's public source), so writes go
through a tiny Google Apps Script that keeps the token server-side. ~10 minutes:

## 1. Make a GitHub token (fine-grained, this repo only)
1. github.com → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token
2. Repository access: **Only select repositories** → `Gridfinity-Improved`
3. Permissions → Repository permissions → **Contents: Read and write** (nothing else)
4. Generate, copy the token (shown once)

## 2. Create the webhook
1. script.google.com → **New project**
2. Paste in everything from `team-log.gs` (the GH_OWNER/GH_REPO at the top are already set to this repo)
3. Left sidebar gear (Project Settings) → **Script properties** → Add property:
   - Property: `GITHUB_TOKEN`
   - Value: the token from step 1
4. **Deploy → New deployment** → type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Deploy, authorize, copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`)

## 3. Wire the page
In `index.html`, near the top of the main script:
```js
const TEAM_LOG_URL = "";   // ← paste the web app URL here
```
Commit & push. Done — the seed `log.csv` is already in the repo.

## How it behaves
- Each event commits within a few seconds (check the repo's commit history — every download is a commit)
- The site reads `log.csv` with a cache-buster; GitHub Pages redeploys the file, so brand-new rows can take ~30–60 s to appear in the Team tab
- First download asks each person for a name/initials once
- The "My log" view stays as each person's instant private history; "Team log" is the permanent shared record
- `settings_json` column holds the complete configuration, so the CSV alone is enough to recreate any part — on the site or by hand

## Security notes
- The token never appears in the page or the repo — only in Apps Script's properties
- It's scoped to Contents on this one repo; worst case if the webhook URL leaks is junk log rows, which are visible as commits and revertable
- Rotate the token by generating a new one and updating the script property
