import os
from urllib.parse import quote

from flask import Flask, Response, jsonify, redirect, request, send_from_directory

BASE = os.path.dirname(os.path.abspath(__file__))

# Product media uploaded by the old site lives on the service's persistent
# disk (/data/media/products). The app's corporate-order pages load these
# images via /media/<filename>, so keep serving them.
PRODUCT_MEDIA = "/data/media/products"
MEDIA_ROOT = "/data/media"

# Legacy path -> section on the new single-page site (301 permanent).
REDIRECTS = {
    "/menu": "/#menu",
    "/drinks": "/#menu",
    "/coffee": "/#menu",
    "/vegetarian_menu": "/#menu",
    "/orderlocation": "/#order",
    "/about-us": "/#about",
    "/catering": "/#catering",
    "/cateringmenu": "/#catering",
    "/catering/copperfield": "/#cater-copperfield",
    "/catering/tomball": "/#cater-tomball",
    "/community": "/#community",
    "/donations": "/#donations",
    "/career": "/#careers",
    "/careers": "/#careers",
    "/spirit": "/#spirit",
    "/contact": "/#contact",
    "/gallery": "/#about",
    "/thank-you": "/",
}


def _page(name):
    with open(os.path.join(BASE, name), encoding="utf-8") as f:
        return Response(f.read(), mimetype="text/html")


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(BASE, "static"),
        static_url_path="/static",
    )

    @app.route("/")
    def home():
        return _page("index.html")

    @app.route("/apply/<location>")
    def apply_redirect(location):
        loc = (location or "").strip().lower()
        if loc not in {"copperfield", "tomball"}:
            return redirect("/#careers", code=301)
        position = (request.args.get("position") or "").strip()
        query = f"?career_location={quote(loc)}"
        if position:
            query += f"&career_position={quote(position)}"
        return redirect(f"/{query}#careers", code=301)

    for _old, _new in REDIRECTS.items():
        _ep = "redir_" + _old.strip("/").replace("/", "_")
        app.add_url_rule(
            _old, _ep,
            (lambda dest: (lambda: redirect(dest, code=301)))(_new),
        )

    @app.route("/media/<path:filename>")
    def media(filename):
        # Same behavior as the old site's admin.media route: product images
        # from the persistent disk. Used by the app's corporate-order pages.
        return send_from_directory(PRODUCT_MEDIA, filename)

    @app.route("/media-index-cfa1fb2d631667eb5d8d9fa5")
    def media_index_temp():
        # TEMPORARY (token URL): full recursive listing of /data/media so the
        # files can be backed up off the disk. Remove after recovery.
        out = []
        for root, _dirs, files in os.walk(MEDIA_ROOT):
            for f in files:
                p = os.path.join(root, f)
                rel = os.path.relpath(p, MEDIA_ROOT).replace(os.sep, "/")
                try:
                    out.append({"path": rel, "size": os.path.getsize(p)})
                except OSError:
                    pass
        return jsonify(sorted(out, key=lambda x: x["path"]))

    @app.route("/media-file-cfa1fb2d631667eb5d8d9fa5/<path:filename>")
    def media_file_temp(filename):
        # TEMPORARY (token URL): serve any file under /data/media (not just
        # products) for the backup download. Remove after recovery.
        return send_from_directory(MEDIA_ROOT, filename)

    @app.route("/favicon.ico")
    def favicon():
        try:
            return app.send_static_file("images/favicon.ico")
        except Exception:
            return ("", 204)

    @app.errorhandler(404)
    def not_found(_e):
        return redirect("/", code=302)

    return app
