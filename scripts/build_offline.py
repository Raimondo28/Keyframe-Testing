#!/usr/bin/env python3
"""Build a self-contained double-clickable CSV demo from the maintained sources."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(source: str, old: str, new: str) -> str:
    if source.count(old) != 1:
        raise ValueError(f'Expected one source fragment: {old[:70]!r}')
    return source.replace(old, new, 1)


def build() -> Path:
    css = (ROOT / 'src/style.css').read_text()
    model = re.sub(r'^export\s+', '', (ROOT / 'src/model.js').read_text(), flags=re.MULTILINE)
    app = (ROOT / 'src/app.js').read_text()
    app = re.sub(r'^import\s+[^\n]+\n', '', app, count=1)
    app = replace_once(
        app,
        "const r=await fetch('/api/import-excel',{method:'POST',body:file});const result=await r.json();if(!r.ok)throw Error(result.error);rows=result.rows;",
        "throw Error('Excel import needs the Python server. Save your workbook as CSV for this offline demo, or run server.py and open the server version.');",
    )
    app = replace_once(
        app,
        'Prepared for Brisbane Airport · Demonstration only',
        'Offline demo · CSV import · Run server for Excel',
    )
    app = replace_once(
        app,
        'Import a CSV or Excel workbook. Each activity links to a saved footprint using its unique ID.',
        'Import a CSV programme. Each activity links to a saved footprint using its unique ID. For Excel workbooks, run the Python server version.',
    )
    app = replace_once(
        app,
        "const save=()=>localStorage.setItem('kfm-demo',JSON.stringify(model));",
        "const save=()=>{try{localStorage.setItem('kfm-demo',JSON.stringify(model));}catch{toast('Browser storage is unavailable. Export your workspace to keep changes.');}};",
    )
    js = model + '\n' + app
    if re.search(r'^\s*(?:import|export)\s', js, re.MULTILINE):
        raise ValueError('Generated demo still contains a module dependency.')
    if '</script' in js.lower() or '</style' in css.lower():
        raise ValueError('Source contains an unsafe inline closing tag.')
    document = (
        '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="description" content="Self-contained Keyframe Brisbane Airport spatial programme concept. Open this file in your browser; no installation needed.">'
        '<title>Keyframe · Brisbane Airport demo</title><link rel="icon" href="data:,">\n<style>' + css + '</style>\n'
        '</head><body><div id="app"></div><div id="toast" role="status"></div>\n'
        '<script>\n' + js + '\n</script></body></html>\n'
    )
    target = ROOT / 'OPEN-DEMO.html'
    target.write_text(document)
    return target


if __name__ == '__main__':
    target = build()
    print(f'Built {target.name}: {target.stat().st_size:,} bytes; no external dependencies.')
