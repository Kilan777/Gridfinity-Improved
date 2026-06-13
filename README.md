# Team Gridfinity Holder Generator

A single-file web app for generating our standard Gridfinity parts — screw bins, cable bins, PCB holders, and baseplates — with the house defaults baked in (half pitch, no screws/magnets, minimum lip, rounded finger slide r20, 14 mm labels).

**Live site:** enable GitHub Pages on this repo (Settings → Pages → deploy from `main`, root) and it serves at `https://<user>.github.io/<repo>/`

## Features
- **Build with controls** — pick part type, footprint (presets from our printed history), and the few settings that actually change per part
- **Describe it · AI** — type "holder for 10 PCBs, 60 × 35 mm, on edge with finger room" and Claude sizes it for you
- Live top-down diagram with mm dimensions; PCB mode shows slot layout and warns if boards won't fit
- **Downloads:** print-ready STL (generated in-browser), `.scad` overrides for [gridfinity_extended_openscad](https://github.com/ostat/gridfinity_extended_openscad), OpenSCAD customizer `.json`, or copy the settings for the MakerWorld customizer

## The AI tab
- Inside claude.ai (as an artifact): works automatically, no setup
- On this hosted version: click "Use your own API key" and paste a key from [console.anthropic.com](https://console.anthropic.com). Keys are held in memory only — never stored, never sent anywhere except api.anthropic.com. A few dollars of credit lasts years at this usage.
- Everything else (controls, diagram, STL/scad downloads) needs no key and works offline

## Build log
- Name a part and downloads become `Name gridfinity bin for 8 compartments.stl` / `... holder for 24 boards.stl` etc.
- Every download and named part is logged — searchable, with one-click **Load** to restore exact settings
- "My log" is each person's instant per-browser history. The **Team log** is permanent: every event is committed as a row in [`log.csv`](log.csv) in this repo (append-only, lives in git history, not clearable from the site). Any entry can be reopened on the site or regenerated and downloaded. Setup: [`team-log-setup.md`](team-log-setup.md)

## PCB height logic
Set a slot depth and the bin height auto-sizes to depth + 2 mm structural floor + the 4.75 mm gridfinity base, rounded up to 7 mm units. Slot depth 0 = slots run the full bin height.

## Notes
- Browser STLs are print-ready but approximate the minimum lip as flat — bins sit on baseplates perfectly, stacking is loose. Use the `.scad` path for the exact lip profile.
- Baseplate weight cavities are `.scad`-only.
- No build step, no dependencies — it's one HTML file. The triangulation library (earcut, ISC) is inlined.
