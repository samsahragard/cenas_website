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
- Render public-site service: `srv-d28grg2dbo4c73fj2oo0` (`cenas_functional_demo`), with auto-deploy disabled. Showcase code commit `ffbfae2b399388b31b8cf75bed1c81612d35f7e7` was deployed as `dep-d98lu83eo5us73fbcuug` and verified live on 2026-07-10.
- Catering-photo curation rule: people are acceptable when the food setup is clearly the subject. Do not publish maps, receipts/paperwork, boxed or bagged deliveries, non-setup evidence, unusable/corrupt previews, or records without a trustworthy guest count.
- On 2026-07-10, all 39 eligible current delivery photos across both admin pages were reviewed; nine qualifying setups were live newest-first from June 29 through July 9.
