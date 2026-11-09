#!/usr/bin/env python3
"""Bundle the spatial coordination demo into one double-clickable HTML file."""
from pathlib import Path
import base64
import json
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MODULES = ('imagery.js', 'model.js', 'scenarios.js', 'airport-map.js', 'app.js')
EXCEL_REQUEST = "const r=await fetch('/api/import-excel',{method:'POST',body:file});const result=await r.json();if(!r.ok)throw Error(result.error);rows=result.rows;"


def replace_once(source: str, old: str, new: str) -> str:
    if source.count(old) != 1:
        raise ValueError(f'Expected one source fragment: {old[:70]!r}')
    return source.replace(old, new, 1)


def inline_module(source: str) -> str:
    """Flatten this project's named imports/exports in dependency order."""
    source = re.sub(r'(?m)^[ \t]*import\s+[^;]+;[ \t]*\n?', '', source)
    source = re.sub(r'(?m)^[ \t]*export\s+(?=(?:const|let|var|function|class|async)\b)', '', source)
    source = re.sub(r'(?m)^[ \t]*export\s*\{[^}]*\}\s*;?[ \t]*\n?', '', source)
    if re.search(r'^\s*(?:import|export)\s', source, re.MULTILINE):
        raise ValueError('A module uses an unsupported import/export form.')
    return source


def check_javascript(source: str) -> None:
    path = None
    try:
        with tempfile.NamedTemporaryFile('w', suffix='.js', encoding='utf-8', delete=False) as script:
            script.write(source)
            path = Path(script.name)
        subprocess.run(['node', '--check', str(path)], check=True)
    finally:
        if path is not None:
            path.unlink(missing_ok=True)


def build() -> Path:
    css = (ROOT / 'src/style.css').read_text(encoding='utf-8')
    image_path = ROOT / 'assets/westport-satellite.jpg'
    cached_image = image_path.is_file()
    modules = []
    for name in MODULES:
        source = (ROOT / 'src' / name).read_text(encoding='utf-8')
        if name == 'app.js':
            source = replace_once(
                source,
                EXCEL_REQUEST,
                "throw Error('Excel import needs the Python server. Save your workbook as CSV for this offline demo, or run server.py and open the server version.');",
            )
            import_note = 'Import a CSV programme. Each activity links to a saved footprint using its unique ID. For direct Excel imports, run the Python server version.'
            if not cached_image:
                import_note += ' Satellite imagery needs an internet connection; the context diagram is available offline.'
            source = replace_once(
                source,
                'Import a CSV or Excel workbook. Each activity links to a saved footprint using its unique ID.',
                import_note,
            )
        modules.append(f'// Bundled from src/{name}\n' + inline_module(source))
        if name == 'imagery.js':
            if cached_image:
                image = image_path.read_bytes()
                if not image.startswith(b'\xff\xd8'):
                    raise ValueError('The cached satellite file is not a JPEG image.')
                uri = 'data:image/jpeg;base64,' + base64.b64encode(image).decode('ascii')
                modules.append('WESTPORT_IMAGERY.imageData=' + json.dumps(uri) + ';')
            else:
                # An absent optional cache must not leave an unusable relative URL.
                modules.append('WESTPORT_IMAGERY.imagePath=null;')
    js = '\n\n'.join(modules)
    if '</script' in js.lower() or '</style' in css.lower():
        raise ValueError('Source contains an unsafe inline closing tag.')
    check_javascript(js)
    description = ('Keyframe Westport and Brisbane Airport spatial coordination concepts. '
                   'Open this file in your browser; CSV tools require no installation. '
                   + ('Satellite imagery is bundled.' if cached_image else 'Satellite imagery requires an internet connection.'))
    document = (
        '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<meta name="description" content="{description}">'
        '<title>Keyframe · Westport spatial coordination demo</title>'
        '<link rel="icon" href="data:,">\n<style>' + css + '</style>\n'
        '</head><body><div id="app"></div><div id="toast" role="status"></div>\n'
        '<script>\n' + js + '\n</script></body></html>\n'
    )
    target = ROOT / 'OPEN-DEMO.html'
    target.write_text(document, encoding='utf-8')
    return target


if __name__ == '__main__':
    target = build()
    satellite = 'bundled satellite imagery' if (ROOT / 'assets/westport-satellite.jpg').is_file() else 'satellite imagery requires internet'
    print(f'Built {target.name}: {target.stat().st_size:,} bytes; inline JavaScript/CSS; {satellite}; JavaScript syntax verified.')
