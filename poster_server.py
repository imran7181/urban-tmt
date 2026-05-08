from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import base64
import json
import mimetypes
import os
import re
import time
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parent
SAVE_DIR = Path.home() / "Downloads" / "Urban TMT Posters"
UPLOAD_DIR = ROOT / "uploads"
CATALOG_PATH = ROOT / "poster_catalog.json"


def load_catalog():
    if not CATALOG_PATH.exists():
        return []
    try:
        return json.loads(CATALOG_PATH.read_text("utf-8"))
    except Exception:
        return []


def save_catalog(posters):
    CATALOG_PATH.write_text(json.dumps(posters, indent=2), "utf-8")


class PosterHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/" or self.path.startswith("/?"):
            self.path = "/index.html"
        if self.path.startswith("/api/posters"):
            self.send_json({"posters": load_catalog()})
            return
        return super().do_GET()

    def do_POST(self):
        if self.path.rstrip("/") == "/api/posters":
            self.save_uploaded_poster()
            return
        if self.path.rstrip("/") != "/save-poster":
            self.send_error(404, "Not found")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            raw_name = str(payload.get("fileName", "urban-tmt-poster.png"))
            safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", raw_name).strip(".-") or "urban-tmt-poster.png"
            if not safe_name.lower().endswith(".png"):
                safe_name += ".png"

            image_base64 = str(payload.get("imageBase64", ""))
            image_bytes = base64.b64decode(image_base64, validate=True)
            if not image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValueError("Uploaded image is not a PNG file")

            SAVE_DIR.mkdir(parents=True, exist_ok=True)
            output_path = SAVE_DIR / safe_name
            output_path.write_bytes(image_bytes)

            self.send_json(
                {
                    "ok": True,
                    "fileName": safe_name,
                    "path": str(output_path),
                }
            )
        except Exception as error:
            self.send_json({"ok": False, "error": str(error)}, status=400)

    def do_DELETE(self):
        if not self.path.startswith("/api/posters/"):
            self.send_error(404, "Not found")
            return

        poster_id = unquote(self.path.split("/api/posters/", 1)[1]).split("?", 1)[0]
        posters = load_catalog()
        poster = next((item for item in posters if item.get("id") == poster_id), None)
        if not poster:
            self.send_json({"ok": False, "error": "Poster not found"}, status=404)
            return

        posters = [item for item in posters if item.get("id") != poster_id]
        save_catalog(posters)
        image_path = ROOT / poster.get("imagePath", "")
        if image_path.exists() and UPLOAD_DIR in image_path.parents:
            image_path.unlink()
        self.send_json({"ok": True, "posters": posters})

    def save_uploaded_poster(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            raw_name = str(payload.get("name", "Urban TMT Poster")).strip() or "Urban TMT Poster"
            category = str(payload.get("category", "Uploaded Poster")).strip() or "Uploaded Poster"
            image_base64 = str(payload.get("imageBase64", ""))
            mime_type = str(payload.get("mimeType", "image/png"))
            extension = ".png" if "png" in mime_type else ".jpg"
            image_bytes = base64.b64decode(image_base64, validate=True)
            if not image_bytes.startswith((b"\x89PNG\r\n\x1a\n", b"\xff\xd8\xff")):
                raise ValueError("Upload a PNG or JPG poster image")

            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            poster_id = f"poster-{int(time.time() * 1000)}"
            safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", raw_name).strip(".-") or poster_id
            file_name = f"{poster_id}-{safe_stem}{extension}"
            output_path = UPLOAD_DIR / file_name
            output_path.write_bytes(image_bytes)

            poster = {
                "id": poster_id,
                "name": raw_name,
                "category": category,
                "description": "Urban TMT admin uploaded poster.",
                "accent": str(payload.get("accent", "#e53935")),
                "uploaded": True,
                "artwork": f"uploads/{file_name}",
                "imagePath": f"uploads/{file_name}",
            }
            posters = load_catalog()
            posters.insert(0, poster)
            save_catalog(posters)
            self.send_json({"ok": True, "poster": poster, "posters": posters})
        except Exception as error:
            self.send_json({"ok": False, "error": str(error)}, status=400)

    def send_json(self, data, status=200):
        encoded = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


if __name__ == "__main__":
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")
    port = int(os.environ.get("PORT", "4174"))
    server = ThreadingHTTPServer(("0.0.0.0", port), PosterHandler)
    print(f"Urban TMT Poster Studio running on port {port}")
    print(f"Generated posters will be saved in: {SAVE_DIR}")
    server.serve_forever()
