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
    "/contact": "/#contact",
    "/gallery": "/#about",
    "/thank-you": "/",
}
# NOTE: /apply/copperfield and /apply/tomball are served (job applications),
# reached from the Careers position picker with ?position=... NOT redirected.


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

    @app.route("/apply/copperfield")
    def apply_copperfield():
        return _page("apply_copperfield.html")

    @app.route("/apply/tomball")
    def apply_tomball():
        return _page("apply_tomball.html")

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
        return redirect("/", code=302)

    return app
