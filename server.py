"""Local demonstration server. No Keyframe account or remote data access."""
import io
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).parent.resolve()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path != '/api/import-excel':
            self.send_error(404)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 5_000_000:
                raise ValueError('Choose an Excel workbook smaller than 5 MB.')
            book = load_workbook(io.BytesIO(self.rfile.read(size)), read_only=True, data_only=True)
            sheet = book.active
            rows = list(sheet.iter_rows(values_only=True))
            if not rows:
                raise ValueError('The first worksheet is empty.')
            headers = [str(c or '').strip().lower() for c in rows[0]]
            output = [dict(zip(headers, [v.isoformat()[:10] if hasattr(v, 'isoformat') else v for v in row])) for row in rows[1:] if any(v is not None for v in row)]
            book.close()
            payload = json.dumps({'rows': output}).encode()
            self.send_response(200)
        except Exception:
            payload = json.dumps({'error': 'Could not read workbook. Use .xlsx with activity_id, name, start, finish and footprint_id columns on the first worksheet.'}).encode()
            self.send_response(400)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '3000'))
    print(f'Keyframe concept demo on port {port}', flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
