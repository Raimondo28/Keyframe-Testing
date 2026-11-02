# Keyframe · Spatial programme concept

Interactive Brisbane Airport demonstration inspired by the supplied Keyframe layout. Illustrative, non-georeferenced airport plan and synthetic project data. No connection to a Keyframe account or live project.

## Open the demo without installing anything

Download this branch as a ZIP, extract it, then double-click **OPEN-DEMO.html**. This offline version supports footprint drawing, CSV programme imports, timeline playback and clash checks. To import Excel workbooks, use the full server version below.

The captioned video is [demo/Keyframe-Brisbane-Airport-demo.mp4](demo/Keyframe-Brisbane-Airport-demo.mp4).

## Run

Python 3.12+, Node 24 for geometry tests. Openpyxl enables Excel import.

```sh
cd /workspace/Keyframe-Testing
python -m venv --system-site-packages .venv
.venv/bin/python -m pip install --disable-pip-version-check -r requirements.txt
.venv/bin/python server.py
```

Open the application on port 3000 in a browser. `PORT` overrides the port. No API keys, databases, build step or npm dependencies are required. Use only in a trusted demo environment: the development server does not implement authentication or production file isolation.

## Demonstrate

1. Start on 15 February 2027. Three activities are active, with one clash between apron works and the service corridor.
2. Select **Clashes**, then the result to jump to its first day. The hatched map area shows the spatial intersection; dates overlap for eight inclusive days.
3. Select **Footprints → Taxiway service corridor**. Move its start to 20 February 2027 and save: the clash clears.
4. Use **Draw footprint**, place at least three vertices, finish, name and save it. The new footprint receives a persistent ID such as `FP-005`.
5. Use **Link programme** to download the CSV example or import CSV / `.xlsx`. Imports replace the activity list after validating every row; footprints remain. Excel reads the first worksheet, including native Excel dates.
6. Play or scrub the programme. Inactive footprints fade. Click programme rows to inspect the linked footprint.
7. Export and reopen a workspace or export the clash report. Reset restores the original sample.

Programme columns: `activity_id,name,start,finish,footprint_id`. Dates must be `YYYY-MM-DD`; finish dates are inclusive. Footprint IDs must already exist. Several activities may link to one footprint. Workbook uploads are limited to 5 MB and programme imports to 500 activities.

Workspace edits persist in this browser's local storage. Export uses a versioned **demo JSON format** (`.kfm.json`), not Keyframe's native KFM format. A real integration requires Keyframe's documented storage/API contracts and georeferenced model data. Spatial tests use simple 2D polygons plus calendar time (4D planning concept); no elevation, buffers, safety clearances, time-of-day, live synchronization or engineering collision assessment is included. Programme visualization covers 1 February–7 March 2027; clash calculations cover all imported dates. Edge contact alone is not a clash.

## Validate

```sh
node tests/model.test.js
```

Seven substantive tests cover inclusive schedule overlaps, rescheduling, shared edges/vertices, containment, concave geometry, invalid polygons and programme/CSV validation. Browser verification additionally exercises drawing, export/reimport, invalid import rejection, Excel upload, persistence, reset, playback and mobile layout.

The recorded walkthrough and interface screenshot are in `demo/`. The walkthrough uses sample data only.
