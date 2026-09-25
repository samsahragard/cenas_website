import html
import json
import os
import re
import struct
import unicodedata
import unittest

from cenas_website import create_app

PKG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cenas_website")
DATA = os.path.join(PKG, "static", "data", "bar_shelf.json")

# Sam's Checkpoint 1 answers decide this (default: keep every bottle).
EXPECTED_BOTTLES = 110  # 109 + The Glenlivet Founders Reserve (Sam, 2026-09-24)

CATEGORY_ORDER = ["tequila", "mezcal", "vodka", "rum", "bourbon", "whiskey", "scotch", "gin", "wine", "beer"]
TEQUILA_TABS = {"Blanco", "Reposado", "Añejo", "Extra Añejo", "Cristalino", "Joven & Gold", "Infused"}
TOP_KEYS = {"version", "style_explainers", "categories", "bottles"}
CATEGORY_KEYS = {"id", "label", "featured", "styles"}
BOTTLE_KEYS = {"id", "name", "category", "style", "tab", "rank", "top_shelf", "img", "scale", "facts", "poured_in"}
IMG_KEYS = {"display", "side", "w", "h"}
FACT_KEYS = {"region", "country", "abv", "appellation"}
# Old misspellings that must never come back (case-sensitive on names and alt
# text; existing image file names such as cenas_paradise_daquiris.webp stay).
FORBIDDEN = ["Dessert Door", "Cariñosa", "Cari&ntilde;osa", "Dos XX", "Daquiri", "Uno Mas "]


def fold(name):
    """The id a display name must have: ASCII-folded, lower case, dashes."""
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"['’]", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def webp_size(path):
    """(width, height) of a WebP file, read from its header."""
    with open(path, "rb") as f:
        head = f.read(40)
    if head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        raise ValueError("not a WebP: " + path)
    chunk = head[12:16]
    if chunk == b"VP8X":
        w = int.from_bytes(head[24:27], "little") + 1
        h = int.from_bytes(head[27:30], "little") + 1
        return w, h
    if chunk == b"VP8L":
        bits = struct.unpack("<I", head[21:25])[0]
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if chunk == b"VP8 ":
        w, h = struct.unpack("<HH", head[26:30])
        return w & 0x3FFF, h & 0x3FFF
    raise ValueError("unknown WebP chunk %r in %s" % (chunk, path))


class BarShelfDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(DATA, encoding="utf-8") as f:
            cls.data = json.load(f)
        cls.bottles = cls.data["bottles"]
        cls.cats = {c["id"]: c for c in cls.data["categories"]}

    def test_only_public_fields_ship(self):
        self.assertEqual(set(self.data), TOP_KEYS)
        self.assertEqual(self.data["version"], 1)
        for c in self.data["categories"]:
            self.assertEqual(set(c), CATEGORY_KEYS, c["id"])
        for b in self.bottles:
            self.assertEqual(set(b), BOTTLE_KEYS, b["id"])
            self.assertEqual(set(b["img"]), IMG_KEYS, b["id"])
            self.assertLessEqual(set(b["facts"]), FACT_KEYS, b["id"])
            for v in b["facts"].values():
                self.assertTrue(isinstance(v, str) and v.strip(), b["id"])
        raw = json.dumps(self.data)
        for internal in ("purchase_record", "flags", "site_name_now", "site_group_now",
                         "distributor_text", "popularity_rank", "price", "_about"):
            self.assertNotIn(internal, raw)

    def test_bottle_count(self):
        self.assertEqual(len(self.bottles), EXPECTED_BOTTLES)

    def test_ids_are_unique_folded_names(self):
        ids = [b["id"] for b in self.bottles]
        self.assertEqual(len(ids), len(set(ids)))
        for b in self.bottles:
            self.assertRegex(b["id"], r"^[a-z0-9-]+$")
            self.assertEqual(b["id"], fold(b["name"]), "id must be the ASCII-folded name")

    def test_categories_styles_tabs_ranks(self):
        self.assertEqual([c["id"] for c in self.data["categories"]], CATEGORY_ORDER)
        explainers = self.data["style_explainers"]
        for b in self.bottles:
            cat = self.cats.get(b["category"])
            self.assertIsNotNone(cat, b["id"])
            self.assertTrue(b["style"], b["id"])
            if cat["styles"]:
                self.assertIn(b["style"], cat["styles"], b["id"])
            if b["category"] == "tequila":
                self.assertIn(b["tab"], TEQUILA_TABS, b["id"])
            else:
                self.assertEqual(b["tab"], b["style"], b["id"])
            self.assertIsInstance(b["top_shelf"], bool)
            self.assertIsInstance(b["poured_in"], list)
            self.assertTrue(0 < b["scale"] <= 1.5, b["id"])
        for key in explainers:
            self.assertTrue(any(b["style"] == key for b in self.bottles), key)
        for cid, cat in self.cats.items():
            members = [b for b in self.bottles if b["category"] == cid]
            self.assertTrue(members, cid)
            ranks = sorted(b["rank"] for b in members)
            self.assertEqual(ranks, list(range(1, len(members) + 1)), cid)
            featured = [b for b in members if b["id"] == cat["featured"]]
            self.assertEqual(len(featured), 1, cid)
            self.assertEqual(featured[0]["rank"], 1, cid)
        self.assertEqual(self.cats["tequila"]["featured"], "don-julio-blanco")

    def test_image_files_exist_with_matching_sizes(self):
        for b in self.bottles:
            for kind in ("display", "side"):
                url = b["img"][kind]
                self.assertEqual(url, "/static/images/bar/%s-%s.webp" % (b["id"], kind))
                path = os.path.join(PKG, url.lstrip("/").replace("/", os.sep))
                self.assertTrue(os.path.isfile(path), path)
            w, h = webp_size(os.path.join(PKG, "static", "images", "bar", b["id"] + "-display.webp"))
            self.assertEqual((w, h), (b["img"]["w"], b["img"]["h"]), b["id"])
            self.assertLessEqual(max(w, h), 720, b["id"])

    def test_known_fact_fixes(self):
        by_id = {b["id"]: b for b in self.bottles}
        self.assertEqual(by_id["budweiser"]["facts"]["abv"], "5%")
        self.assertEqual(by_id["pacifico"]["facts"]["abv"], "4.4%")
        self.assertNotEqual(by_id["tanqueray"]["facts"].get("country"), "England")
        self.assertEqual(by_id["crown-royal"]["facts"].get("region"), "Manitoba")


class BarShelfPageTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def get(self, url):
        response = self.client.get(url)
        self.addCleanup(response.close)
        return response

    def test_home_has_page_and_lazy_loader_only(self):
        response = self.get("/")
        self.assertEqual(response.status_code, 200)
        page = response.get_data(as_text=True)
        self.assertIn('id="page-bar"', page)
        self.assertIn('id="bar-shelf"', page)
        self.assertIn("/static/data/bar_shelf.json", page)
        # Loaded on demand by the inline loader, never as an eager tag.
        self.assertIn("/static/js/bar_shelf.js", page)
        self.assertNotIn('<script src="/static/js/bar_shelf.js', page)
        self.assertIn("ck:pageshow", page)
        self.assertIn("'bar'", page)
        self.assertIn('data-link="bar"', page)
        self.assertIn("split('/')[0]", page)
        # Bottle data lives only in the JSON.
        self.assertNotIn("static/images/bottles/", page)
        self.assertNotIn("bottle_modal", page)

    def test_no_old_misspellings(self):
        page = self.get("/").get_data(as_text=True)
        with open(DATA, encoding="utf-8") as f:
            data = f.read()
        for text in (page, html.unescape(page), data):
            for bad in FORBIDDEN:
                self.assertNotIn(bad, text)

    def test_data_and_images_serve_exactly_200(self):
        response = self.get("/static/data/bar_shelf.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/json")
        response = self.get("/static/images/bar/don-julio-blanco-display.webp")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "image/webp")
        response = self.get("/static/images/bar/don-julio-blanco-side.webp")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "image/webp")
        response = self.get("/static/js/bar_shelf.js")
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.mimetype, ("application/javascript", "text/javascript"))

    def test_shelf_script_rules(self):
        script = self.get("/static/js/bar_shelf.js").get_data(as_text=True)
        self.assertIn("'use strict'", script)
        self.assertIn("prefers-reduced-motion: reduce", script)
        self.assertIn("motion=reduce", script)
        self.assertIn("aria-roledescription", script)
        self.assertIn("history.replaceState", script)
        self.assertIn("cubic-bezier(.23,1,.32,1)", script)
        self.assertNotIn("location.hash =", script)
        self.assertNotIn("static/images/bottles", script)

    def test_drinks_redirects_to_bar(self):
        response = self.get("/drinks")
        self.assertEqual(response.status_code, 301)
        self.assertTrue(response.headers["Location"].endswith("/#bar"), response.headers["Location"])


if __name__ == "__main__":
    unittest.main()
