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
        self.assertIn("Cenas Kitchen Catering", page)
        self.assertNotIn("Houston keeps us catering", page)
        self.assertNotIn("From boardroom lunches to family celebrations", page)
        self.assertNotIn("data-showcase-prev", page)
        self.assertNotIn("data-showcase-pause", page)
        self.assertNotIn("data-showcase-next", page)
        self.assertNotIn("data-showcase-progress", page)
        self.assertIn('data-feed-url="https://app.cenaskitchen.com/public/catering-showcase"', page)
        self.assertIn('src="/static/js/catering_showcase.js" defer', page)

    def test_showcase_script_builds_continuous_marquee(self):
        response = self.client.get("/static/js/catering_showcase.js")
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        script = response.get_data(as_text=True)
        self.assertIn("IntersectionObserver", script)
        self.assertIn("prefers-reduced-motion: reduce", script)
        self.assertIn("loading = 'lazy'", script)
        self.assertIn("next_cursor", script)
        self.assertIn("var MARQUEE_SPEED = 28;", script)
        self.assertIn("catering-showcase-strip", script)
        self.assertIn("catering-card-date", script)
        # The old step-slideshow must be gone: date is the only overlay text.
        self.assertNotIn("AUTOPLAY_DELAY", script)
        self.assertNotIn("catering-card-overlay", script)
        self.assertNotIn("guests", script)


if __name__ == "__main__":
    unittest.main()
