# Active Plan — Recent Catering Showcase

## Goal

Add a fast, self-updating catering carousel to the public site. It should show approved catering photos newest-first with the event date, gathering type, guest count, and food category, then progressively move toward older events.

## Current understanding

- The public site is a single-page Flask app served from `cenas_website/index.html`.
- Driver delivery photos originate in the operations app and may include private proof such as maps, addresses, or receipts.
- The public feed must expose only explicitly suitable food/setup photos and sanitized event metadata.
- Performance should rely on small initial payloads, lazy image decoding, cursor pagination, and reduced-motion support.

## Files likely involved

- `cenas_website/index.html`
- `cenas_website/__init__.py`
- Operations-app media/API files identified during the audit

## Risks

- Publishing a receipt, route map, customer address, or other private proof.
- Missing or unreliable mappings for gathering type, guest count, or food category.
- Loading an unbounded photo history on initial page load.
- Auto-motion that is inaccessible or wasteful on mobile devices.

## Steps

- [x] Trace media, metadata, and access-control sources.
- [x] Define the sanitized public feed and approval rule.
- [x] Implement the feed and lightweight responsive carousel.
- [x] Verify data safety, performance, reduced motion, and mobile layout.
- [x] Commit, deploy, and verify the production site.

## Verification

- Targeted backend tests for filtering, ordering, pagination, and media access.
- Flask route checks and public-site markup checks.
- Browser verification at phone and desktop widths with no console/network errors.
- Production checks for newest-first data and lazy older-page loading.

## Rollback plan

Revert the public-site and operations-app commits independently. The existing catering page and internal driver-upload workflow must remain functional throughout.
