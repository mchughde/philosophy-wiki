#!/usr/bin/env python3
"""
Philosophy Wiki — Local Server
Serves the wiki and auto-saves entries.js whenever the app sends updated content.
"""

import http.server
import json
import os
import sys
import tempfile
import traceback

PORT = 8080
WIKI_DIR = os.path.dirname(os.path.abspath(__file__))
ENTRIES_FILE = os.path.join(WIKI_DIR, 'entries.js')


def write_entries_js(entries):
    """Write the entries list back to entries.js."""
    content = (
        '// ============================================================\n'
        '// Philosophy Wiki — Content Source\n'
        '// Auto-saved by server.py — edit here or via the in-app editor\n'
        '// ============================================================\n\n'
        'const ENTRIES = '
        + json.dumps(entries, indent=2, ensure_ascii=False)
        + ';\n\nexport default ENTRIES;\n'
    )
    with open(ENTRIES_FILE, 'w', encoding='utf-8') as f:
        f.write(content)


class WikiHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WIKI_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/save-entries':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length)
                entries = json.loads(body)
                write_entries_js(entries)
                self._respond(200, {'ok': True})
            except Exception as e:
                self._respond(500, {'error': str(e)})

        elif self.path == '/export-docx':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length))
                slug = body.get('slug', '').strip()
                if not slug:
                    self._respond(400, {'error': 'slug required'})
                    return

                # Import export logic from export_entry.py (same folder)
                if WIKI_DIR not in sys.path:
                    sys.path.insert(0, WIKI_DIR)
                import export_entry as ex

                entries = ex.load_entries()
                entry = next((e for e in entries if e['slug'] == slug), None)
                if not entry:
                    self._respond(404, {'error': f'Entry not found: {slug}'})
                    return

                image_path = ex.find_local_image(entry['title'])
                if not image_path and entry.get('photo'):
                    tmp_img = os.path.join(tempfile.gettempdir(), f'wiki_{slug}_img.jpg')
                    if ex.download_image(entry['photo'], tmp_img):
                        image_path = tmp_img

                with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp:
                    tmp_path = tmp.name

                ex.build_docx(entry, image_path, tmp_path)

                with open(tmp_path, 'rb') as f:
                    docx_bytes = f.read()
                os.unlink(tmp_path)

                filename = f"{slug}.docx"
                self.send_response(200)
                self.send_header('Content-Type',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                self.send_header('Content-Length', str(len(docx_bytes)))
                self.end_headers()
                self.wfile.write(docx_bytes)

            except Exception as e:
                traceback.print_exc()
                self._respond(500, {'error': str(e)})

        elif self.path == '/export-all-docx':
            try:
                if WIKI_DIR not in sys.path:
                    sys.path.insert(0, WIKI_DIR)
                import export_entry as ex

                entries = ex.load_entries()
                if not entries:
                    self._respond(400, {'error': 'No entries found'})
                    return

                # Sort oldest to youngest (None born values go last)
                entries.sort(key=lambda e: (e.get('born') is None, e.get('born', 0)))

                # Build a temp docx for each entry, then merge
                tmp_files = []
                for entry in entries:
                    image_path = ex.find_local_image(entry['title'])
                    if not image_path and entry.get('photo'):
                        tmp_img = os.path.join(tempfile.gettempdir(), f'wiki_{entry["slug"]}_img.jpg')
                        if ex.download_image(entry['photo'], tmp_img):
                            image_path = tmp_img
                    tmp = tempfile.mktemp(suffix='.docx')
                    ex.build_docx(entry, image_path, tmp)
                    tmp_files.append(tmp)

                combined = tempfile.mktemp(suffix='.docx')
                ex.merge_docx_files(tmp_files, combined)

                with open(combined, 'rb') as f:
                    docx_bytes = f.read()

                # Clean up temp files
                for t in tmp_files:
                    try: os.unlink(t)
                    except: pass
                os.unlink(combined)

                self.send_response(200)
                self.send_header('Content-Type',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                self.send_header('Content-Disposition', 'attachment; filename="philosophy-wiki.docx"')
                self.send_header('Content-Length', str(len(docx_bytes)))
                self.end_headers()
                self.wfile.write(docx_bytes)

            except Exception as e:
                traceback.print_exc()
                self._respond(500, {'error': str(e)})

        else:
            self._respond(404, {'error': 'Not found'})

    def _respond(self, status, data):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(payload))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        # Only log POST requests so the terminal isn't swamped with GETs
        if args and args[0].startswith('POST'):
            print(fmt % args, flush=True)


if __name__ == '__main__':
    server = http.server.HTTPServer(('localhost', PORT), WikiHandler)
    print(f'Philosophy Wiki running at http://localhost:{PORT}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
