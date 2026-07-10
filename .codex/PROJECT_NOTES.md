# Project Notes

- Public site for `cenaskitchen.com`.
- Flask entrypoint: `main.py`; application factory: `cenas_website:create_app()`.
- Main single-page UI: `cenas_website/index.html`; static assets: `cenas_website/static/`.
- Dependencies are pinned in `requirements.txt` (`Flask`, `gunicorn`); there is no JavaScript package manager or build step.
- Local run: `python main.py`.
- Useful checks: `python -m compileall -q main.py cenas_website`, Flask test-client route assertions, and `git diff --check`.
- Production is hosted on Render from `main`; auto-deploy is disabled, so live changes require a manual deploy after pushing.
- Preserve the existing Cenas oxblood, cream, gold, Fraunces, and Hanken Grotesque visual language.
- Recent catering cards load from `https://app.cenaskitchen.com/public/catering-showcase` only when the showcase nears the viewport. The feed is newest-first, cursor-paginated, and contains only explicitly approved derivatives and curated public metadata.
- The showcase renders three cards on desktop, two on tablet, and one partial card on phones; it pauses for reduced motion, focus, hover, touch interaction, or a visitor's Pause control.
