import unittest

from cenas_website import create_app


class CateringShowcasePageTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_home_includes_lazy_recent_catering_showcase(self):
        response = self.client.get("/")
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        page = response.get_data(as_text=True)
        self.assertIn('id="recent-caterings"', page)
        self.assertIn("Houston keeps us catering", page)
        self.assertNotIn("Newest first", page)
        self.assertNotIn("catering-showcase-kicker", page)
        self.assertIn('data-feed-url="https://app.cenaskitchen.com/public/catering-showcase"', page)
        self.assertIn('src="/static/js/catering_showcase.js" defer', page)

    def test_showcase_script_uses_progressive_loading_and_motion_controls(self):
        response = self.client.get("/static/js/catering_showcase.js")
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        script = response.get_data(as_text=True)
        self.assertIn("IntersectionObserver", script)
        self.assertIn("prefers-reduced-motion: reduce", script)
        self.assertIn("loading = 'lazy'", script)
        self.assertIn("next_cursor", script)
        self.assertIn("atRightEdge", script)
        self.assertIn("var AUTOPLAY_DELAY = 4000;", script)


if __name__ == "__main__":
    unittest.main()
