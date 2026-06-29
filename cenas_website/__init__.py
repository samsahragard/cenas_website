import os
from flask import Flask, Response, redirect

BASE = os.path.dirname(os.path.abspath(__file__))

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
    "/apply/copperfield": "/#careers",
    "/apply/tomball": "/#careers",
    "/contact": "/#contact",
    "/gallery": "/#about",
    "/thank-you": "/",
}


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(BASE, "static"),
        static_url_path="/static",
    )

    @app.route("/")
    def home():
        with open(os.path.join(BASE, "index.html"), encoding="utf-8") as f:
            return Response(f.read(), mimetype="text/html")

    for _old, _new in REDIRECTS.items():
        _ep = "redir_" + _old.strip("/").replace("/", "_")
        app.add_url_rule(
            _old, _ep,
            (lambda dest: (lambda: redirect(dest, code=301)))(_new),
        )

    @app.route("/favicon.ico")
    def favicon():
        try:
            return app.send_static_file("images/favicon.ico")
        except Exception:
            return ("", 204)

    @app.errorhandler(404)
    def not_found(_e):
        # any unknown/retired path -> the single-page site
        return redirect("/", code=302)

    return app
