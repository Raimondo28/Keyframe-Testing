# Keyframe · Spatial programme concepts

Westport (Perth/Kwinana) is the default example. Brisbane Airport remains available in the project selector. Both are concept demonstrations, separate from live Keyframe projects.

The interface uses a compact Keyframe header and working canvas, without the promotional title or introductory banner. Brand SVGs in `assets/` recreate the supplied logo reference; an approved master SVG can replace them directly for exact production artwork. They are embedded in the standalone HTML.

## Open the demonstration

Download the `westport-demo` branch as a ZIP, extract it and double-click **OPEN-DEMO.html**. No installation is needed for drawing footprints, CSV import, playback, clash checking or workspace export. Excel `.xlsx` import uses the Python server described below.

Westport's satellite layer requests Esri World Imagery for the Kwinana/Cockburn Sound extent. It needs internet access unless imagery has been cached and embedded. If the imagery cannot load, the application explicitly displays a **context diagram**, not a satellite image. The standalone builder embeds `assets/westport-satellite.jpg` when present.

## Westport evidence status

**Not ready for a sourced client presentation yet.** The cloud proxy currently denies the official Westport/WA Government websites and the imagery provider. Network additions have been saved in the environment configuration but must be applied with **Save draft** in environment settings.

- All seven area envelopes are illustrative locations around Kwinana/Cockburn Sound. They are **not** approved Westport boundaries, surveyed extents, land reservations or confirmed work packages.
- The nine linked activities form an editable **2027–2039 scenario**, including design/approvals, enabling, marine, terminal, access/corridor, rail and commissioning examples. These dates have **not** been checked against the current Westport delivery programme.
- Reference links appear under **Basis & sources**. They are labelled as awaiting live verification. Do not describe them as sources for the scenario's detailed dates until the research is completed.
- Westport's map uses a common Web Mercator (EPSG:3857) extent for raster placement and longitude/latitude-to-canvas conversion. Exports include geographic footprint coordinates. This preserves image/polygon registration; it does not establish the planning accuracy of the illustrative polygons.

Required domains saved in the draft: `westport.wa.gov.au`, `www.westport.wa.gov.au`, `www.wa.gov.au`, `services.arcgisonline.com`. After they are applied, verify the programme's published milestones and preferred project-area maps, replace the scenario assumptions as appropriate, and run:

```sh
python scripts/cache_westport_imagery.py
python scripts/build_offline.py
```

The caching script preserves TLS verification, reads provider attribution, verifies returned image extent/dimensions, and saves attribution, retrieval time and checksum in `assets/westport-imagery.json`. Image acquisition dates vary; imagery is not live. The optional caching helper uses Pillow; the normal application needs only openpyxl.

## Demonstrate

1. Open Westport on 1 June 2033. Seven concept areas and nine activities illustrate marine, terminal and transport coordination. The sample contains deliberate space/time overlaps.
2. Select **Clashes**, then a result to jump to its first date and highlight the overlap area. A spatial intersection creates a clash only while its activity dates overlap.
3. Select an area and edit its linked activity dates. Save to recalculate overlaps.
4. Draw a new area, give it a name and link its ID in an imported CSV/Excel programme.
5. Play or scrub the multi-year timeline. Playback advances adaptively; activities and map areas update without recreating the slider during dragging.
6. Export/reopen a workspace or download a clash report. Scenario, image extent and geographic coordinates are preserved in Westport exports.
7. Switch to Brisbane to view the original airport example. Browser storage and reset are isolated per project example.

The concept uses simple 2D polygons plus calendar time. It does not assess elevations, work-zone buffers, safety clearances, time of day or engineering/design clashes. Shared boundaries alone are not a clash. Detailed dates are inclusive calendar dates. Several activities may link to one area.

## Run the full application

Python 3.12+, Node 24 for tests. Openpyxl enables Excel import.

```sh
cd /workspace/Keyframe-Testing
python -m venv --system-site-packages .venv
.venv/bin/python -m pip install --disable-pip-version-check -r requirements.txt
.venv/bin/python server.py
```

The development server uses port 3000; `PORT` overrides it. No API keys, database, npm dependencies or application build step are required. Use in a trusted demo environment; this development server does not implement production authentication.

Programme columns: `activity_id,name,start,finish,footprint_id`. Dates must be `YYYY-MM-DD`; footprint IDs must already exist. Imports replace the selected scenario's activity list only after validating every row. Limits: 5 MB per upload, 500 activities, first worksheet for Excel.

Workspace edits persist in browser storage. Export uses a versioned **demo JSON format** (`.kfm.json`), not native KFM. Native integration requires Keyframe's documented API/storage contracts.

## Verification

```sh
npm test
npm run build:offline
```

Fifteen model/scenario tests cover polygon intersection, concavity/containment/shared edges, import validation, geographic projection round trips, scenario isolation, multi-year range/ticks and leap-day handling. Browser checks exercise Westport seed data, image-failure fallback, project switching, dates/playback, drawing, geographic export/reimport, CSV and Excel linking, persistence/reset and mobile layout.

Satellite retrieval and current official programme alignment remain **unverified**, separately from those passing application checks.
