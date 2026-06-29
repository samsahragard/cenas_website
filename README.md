# cenaskitchen.com

Public website for Cenas Kitchen (Houston Tex-Mex).

Single-page Flask app served by gunicorn `cenas_website:create_app()`:
- `/` serves the site; `/static` serves assets.
- Legacy URLs 301-redirect to the matching in-page section.

Run locally: `pip install -r requirements.txt && python main.py`
