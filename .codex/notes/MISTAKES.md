# Mistakes Log

## Active Rules

- Use single-quoted PowerShell arguments for `rg` patterns containing quotes or backslashes.
- Use `rg -g` for Windows filename patterns instead of wildcard path arguments.
- Use `rg -F` for exact symbols and strings; use regex only when pattern matching is needed.
- Pass only confirmed paths to `rg`; discover optional paths with `rg --files` first.
- Use repository paths already discovered instead of assuming conventional framework locations.
- Honor tool schemas, including collaboration wait minimums.
- Filter deferred tools by exact or prefix-matched tool names.
- Close Flask test-client responses backed by static files.
- Hard rule: Never include optional or unverified paths in a required diagnostic command; verify each path first or handle no-match separately.
- Confirm the shared browser runtime exists before selecting another browser; reinitialize it with the documented plugin entrypoint when missing.
- Hard rule: Never assume browser bindings persist across runtime reinitialization or user turns; check `globalThis` first, then reinitialize and reselect once when absent.
- Use PowerShell 5.1-compatible HTTP error handling; do not pass `-SkipHttpErrorCheck` to `Invoke-WebRequest` on this machine.
- Before declaring Cenas deployment access blocked, search prior Codex tasks for the established deployment workflow.
- Keep `list_threads` page sizes at 50 or fewer.
- Start Codex task reads with the minimal `{threadId}` shape; add pagination only after a successful read.
- If Chrome coordinate scrolling times out, switch once to the documented DOM scroll method instead of retrying the same gesture.
- On long Chrome forms, stop gesture scrolling after the first timeout and use scoped Playwright locators that auto-scroll to the target.
- Do not request full-page Chrome screenshots for large raw image documents; use the visible card preview or a bounded image clip.
- Read form-control values through scoped DOM evaluation when the Chrome locator wrapper does not expose `inputValue()`.
- Use encoding-stable headings or the smallest unique context when patching notes that contain mojibake.
- Prefer a direct stable CSS form selector over nested long-page locators when Chrome applies a three-second selector deadline.
- Avoid `locator.evaluate()` on the long catering approval page; use direct control locators and supported read helpers.
- Read the live form's exact control names before filling them; do not infer backend field names from display copy.
- Assign PowerShell `foreach` output to a variable before piping it to a formatter.
- Hard rule: Never query an assumed framework path; resolve every target from `rg --files` or an already-confirmed path first.
- Hard rule: Never make an optional `rg` discovery a required-success command; explicitly handle its no-match exit before running it.
- Do not click non-interactive headings to force long-page scrolling in Chrome; use keyboard navigation or network-level verification.
- Do not call a history carousel complete after publishing only sample records; populate the safe backlog and verify older-page coverage.
- For the catering carousel, allow people when the food setup is the subject; reject maps, boxed/bagged deliveries, receipts, paperwork, and non-setup evidence.
- Use the browser's documented user-tab attachment method; do not infer a `tabs.claim()` helper.
- Use the admin template's exact `.cs-photo` selector; do not infer private preview URL substrings.
- Submit one approval per browser navigation and verify it in the public feed before starting the next approval.
- Keep the public catering carousel free of redundant refresh-status copy. (SUPERSEDED 2026-07-15: Sam replaced step autoplay entirely with a slow continuous marquee — 28px/s linear infinite translateX loop, no prev/next/pause, date-only card badges, commit 61644c0. Do not restore interval-based autoplay or overlay text.)
- Cast diagnostic file contents to a plain string before placing them in JSON objects.
- Pass all four required Chrome scroll fields: `x`, `y`, `scrollX`, and `scrollY`.
- Hard rule: After one Chrome synthesized-scroll timeout, stop gesture scrolling and use DOM or network evidence.
- For this Quick Share archive, use controlled `bsdtar` staging; .NET `ZipArchive` misreads its ZIP64 sentinel metadata.
- If workspace dependency discovery hangs, terminate it once and use already-installed, task-specific image tools.
- Follow the app's production database URL precedence; do not assume Render's `DATABASE_URL` is the operational orders database.
- Inspect a generated JSON manifest's top-level type before indexing expected object properties.
- When inspecting a batch manifest, print only schema keys and a bounded sample; never serialize the full candidate array.

## Entries

### 2026-07-10 — manifest inspection serialized all 35 candidates
- What happened: The corrected manifest-shape command included the top-level object as `First`, producing a large truncated output containing every candidate.
- Root cause: The bounded schema inspection still embedded the full object instead of selecting a small candidate sample.
- Fix: Use `candidate_count`, top-level keys, candidate-field names, and one explicitly selected candidate only.
- Rule: When inspecting a batch manifest, print only schema keys and a bounded sample; never serialize the full candidate array.

### 2026-07-10 — assumed the crop manifest was an object
- What happened: The first manifest-shape check indexed `$manifest.items[0]`, but the generated manifest is not shaped as an object with an `items` property.
- Root cause: The top-level JSON type was assumed instead of inspected first.
- Fix: Read only the parsed type and top-level count, then branch to the actual array/object schema.
- Rule: Inspect a generated JSON manifest's top-level type before indexing expected object properties.

### 2026-07-10 — database-config search repeated invalid optional paths
- What happened: A `CORPORATE_DB_URL` search included nonexistent root `config.py` and an invalid Windows `*.py` path argument, so the command exited 1 despite useful matches.
- Root cause: The existing confirmed-path and Windows-glob hard rules were violated during database diagnosis.
- Fix: Stop optional root-path searches and inspect only the confirmed `app/services/corporate_shop.py` reference plus the service environment keys.
- Rule: Never include optional or unverified paths in a required diagnostic command; verify each path first or handle no-match separately.

### 2026-07-10 — queried the wrong configured database URL
- What happened: The first read-only order-match query used Render's `DATABASE_URL` and connected to a SQLite database with no `orders` table.
- Root cause: The operational app's database URL precedence was not checked before selecting the environment key.
- Fix: Inspect `app/db.py` and use the same production URL selection as the running application, without printing any credential value.
- Rule: Follow the app's production database URL precedence; do not assume Render's `DATABASE_URL` is the operational orders database.

### 2026-07-10 — workspace dependency discovery hung during ZIP review
- What happened: A delegated `load_workspace_dependencies` call hung for about 60 seconds while preparing image inspection.
- Root cause: The broad dependency discovery path stalled even though installed Pillow and Windows OCR were sufficient.
- Fix: The agent terminated the call and completed all 72-image validation with installed Python/Pillow and local OCR.
- Rule: If workspace dependency discovery hangs, terminate it once and use already-installed, task-specific image tools.

### 2026-07-10 — delegated audit ran git in the wrapper workspace
- What happened: The import/crop audit first ran `git status` in the task wrapper, whose `.git` is not a usable project repository.
- Root cause: It did not use the two confirmed Cenas repository paths supplied in the task.
- Fix: It switched to the confirmed public-site and backend worktrees.
- Rule: Use repository paths already discovered instead of assuming the current wrapper directory is a Git worktree.

### 2026-07-10 — truncated tar listing closed the producer pipe
- What happened: `tar -tvf | Select-Object -First` exited with code 1 after the consumer closed the pipe, even though the listing confirmed 72 entries.
- Root cause: A short-circuiting pipeline was used for an archive command that reports the closed pipe as failure.
- Fix: Use archive APIs or capture the complete bounded listing before selecting rows.
- Rule: Do not truncate `tar` output through a consumer that closes the pipe early; capture it first, then slice it.

### 2026-07-10 — delegated audit used a Windows wildcard path with rg
- What happened: The audit passed `requirements*.txt` directly to `rg`, repeating the known Windows glob-path error.
- Root cause: It skipped manifest discovery with `rg --files`.
- Fix: It discovered actual requirement filenames first and searched only confirmed paths.
- Rule: Use `rg -g` for Windows filename patterns instead of wildcard path arguments.

### 2026-07-10 — delegated audit searched a missing optional env file
- What happened: The order-matching audit included a nonexistent `.env.example` path in a read-only `rg` call.
- Root cause: The delegated lane repeated the existing optional-path violation instead of discovering the file first.
- Fix: Stop using the missing path and rely only on confirmed model, route, and config files; the existing hard rule remains in force.
- Rule: Never include optional or unverified paths in a required diagnostic command; verify each path first or handle no-match separately.

### 2026-07-10 — .NET misread the Quick Share ZIP metadata
- What happened: `.NET ZipArchive` reported every JPG as 4,294,967,295 bytes and could not open the first entry, making the 54 MB archive look like a 309 GB zip-bomb.
- Root cause: The Quick Share ZIP uses ZIP64 sentinel metadata that this .NET reader does not resolve correctly.
- Fix: A delegated check validated and extracted the archive once with Windows `bsdtar`: 72 regular JPGs totaling 56,237,022 bytes, with no nested archives.
- Rule: For this Quick Share archive, use controlled `bsdtar` staging; .NET `ZipArchive` misreads its ZIP64 sentinel metadata.

### 2026-07-10 — Chrome synthesized scrolling timed out again
- What happened: The correctly shaped upward scroll still timed out in Chrome while trying to bring the production carousel into view.
- Root cause: The known unreliable synthesized-scroll path was used again on the long public page.
- Fix: Stop gesture scrolling, promote the rule to a hard rule, and verify timing through the deployed script plus read-only DOM state when available.
- Rule: After one Chrome synthesized-scroll timeout, stop gesture scrolling and use DOM or network evidence.

### 2026-07-10 — used the wrong Chrome scroll field name
- What happened: The first live-page upward scroll was rejected because it passed `deltaY` instead of the required `scrollX` and `scrollY` fields.
- Root cause: A generic wheel-event field was assumed instead of the Chrome control method's exact schema.
- Fix: Retry once with `x`, `y`, `scrollX: 0`, and the negative `scrollY` value.
- Rule: Pass all four required Chrome scroll fields: `x`, `y`, `scrollX`, and `scrollY`.

### 2026-07-10 — local-server diagnostic serialized a rich file object
- What happened: The local-server check produced a very large JSON object instead of the short stderr string.
- Root cause: `Get-Content` was embedded directly in a conditional property and PowerShell serialized its extended file metadata.
- Fix: The listener and server status were already confirmed; future diagnostics will cast content to a plain string or omit it.
- Rule: Cast diagnostic file contents to a plain string before placing them in JSON objects.

### 2026-07-10 — catering badge and motion cadence missed the preferred feel
- What happened: The live carousel still showed the redundant `Newest first · refreshed automatically` badge and advanced too slowly for the intended moving-gallery effect.
- Root cause: The validation cadence and explanatory copy were treated as final visual choices instead of checking whether the motion felt active enough on the live page.
- Fix: Remove the badge and shorten the autoplay interval, then verify the live carousel advances at the new cadence.
- Rule: Keep the public catering carousel free of redundant refresh-status copy and use the user-approved faster motion cadence.

### 2026-07-10 — chained a second approval before redirect settled
- What happened: In each two-item browser batch, the first approval reached production but the second did not, even though the helper returned metadata for both.
- Root cause: The button click resolved before the post-approval redirect fully settled, so the next form interaction ran against the outgoing document and was lost.
- Fix: Resubmit the two missing approvals one at a time in separate browser calls, then verify each in the public feed.
- Rule: Submit one approval per browser navigation and verify it in the public feed before starting the next approval.

### 2026-07-10 — candidate-audit search included nonexistent paths
- What happened: A delegated read-only audit started with an overly broad `rg` command that included nonexistent paths and produced unusable output.
- Root cause: The audit did not first constrain its search to paths returned by file discovery.
- Fix: It switched to targeted reads of confirmed route, service, and template files.
- Rule: Never query an assumed framework path; resolve every target from `rg --files` or an already-confirmed path first.

### 2026-07-10 — candidate-audit PowerShell regex quoting failed
- What happened: A delegated PowerShell regex search failed because its quoting was not valid for the active shell.
- Root cause: Regex punctuation and quotes were not isolated in a single-quoted PowerShell argument.
- Fix: It abandoned the brittle regex and used targeted source reads.
- Rule: Use single-quoted PowerShell arguments for `rg` patterns containing quotes or backslashes.

### 2026-07-10 — inferred the candidate-image URL pattern
- What happened: The candidate inventory found all 23 publish forms but zero images because it searched for an assumed preview URL substring.
- Root cause: The private image route pattern was inferred instead of using the template's stable `img.cs-photo` class.
- Fix: Use the audited `.cs-photo` selector and pair each image with its same-index publish form.
- Rule: Use the admin template's exact `.cs-photo` selector; do not infer private preview URL substrings.

### 2026-07-10 — inferred a nonexistent Chrome tab-claim helper
- What happened: Reattaching the signed-in catering tab failed because `chrome.tabs.claim()` does not exist in this browser runtime.
- Root cause: The tab-attachment method was inferred instead of using the previously documented user-tab API.
- Fix: Inspect the available browser/user-tab methods once and use the supported attachment call without resetting the browser.
- Rule: Use the browser's documented user-tab attachment method; do not infer a `tabs.claim()` helper.

### 2026-07-10 — over-restricted catering photos containing people
- What happened: The review criteria excluded every photo containing a person, reducing the usable catering history more than Sam intended.
- Root cause: A stricter privacy assumption was applied without preserving the user's actual visual goal: showing presented food setups.
- Fix: Allow people when a visible catering setup is the photo's subject, while continuing to reject maps, boxed/bagged deliveries, receipts, paperwork, and non-setup proof.
- Rule: For the catering carousel, allow people when the food setup is the subject; reject maps, boxed/bagged deliveries, receipts, paperwork, and non-setup evidence.

### 2026-07-10 — shipped only two carousel photos
- What happened: The live catering carousel contained only two manually approved examples even though the requested experience was a substantial newest-to-oldest catering history.
- Root cause: Successful end-to-end validation with two records was mistaken for sufficient production population.
- Fix: Review the remaining eligible delivery-photo backlog, publish every privacy-safe food/setup image with conservative metadata, and verify both the live count and older traversal.
- Rule: Do not call a history carousel complete after publishing only sample records; populate the safe backlog and verify older-page coverage.

### 2026-07-10 — heading click did not force lazy-load scrolling
- What happened: Clicking the carousel heading to bring the lazy section into view exceeded the Chrome selector/CDP deadline.
- Root cause: A non-interactive heading click was used as a scrolling surrogate on a long production page.
- Fix: Stop selector-driven scrolling on this page and use a browser keyboard scroll once, with the already-passing live feed and media checks as the authoritative fallback.
- Rule: Do not click non-interactive headings to force long-page scrolling in Chrome; use keyboard navigation or network-level verification.

### 2026-07-10 — treated a no-match file discovery as required success
- What happened: `rg --files` found no repository-local `CODEX.md` or `AGENTS.md`, and its normal no-match exit code was surfaced as a failed command.
- Root cause: The already-promoted no-match handling rule was violated again during hard-rule discovery.
- Fix: Use `Test-Path` against the confirmed task root and branch on the result instead of requiring a match.
- Rule: Never make an optional `rg` discovery a required-success command; explicitly handle its no-match exit before running it.

### 2026-07-10 — repeated conventional-path assumption
- What happened: A source-class lookup again targeted assumed root `templates` and `static` paths that do not exist in this website repository.
- Root cause: The already-active rule to use discovered repository paths was not followed.
- Fix: Stop the source lookup, use the live DOM's semantic controls for verification, and promote the repeated rule to the repository hard rules.
- Rule: Never query an assumed framework path; resolve every target from `rg --files` or an already-confirmed path first.

### 2026-07-10 — piped a PowerShell `foreach` block directly
- What happened: The media-header verification command hit an `EmptyPipeElement` parser error after a top-level `foreach` block.
- Root cause: Windows PowerShell 5.1 does not accept that compound statement directly as the left side of the pipeline in this form.
- Fix: Assign the `foreach` results to a variable, then format that variable separately.
- Rule: Assign PowerShell `foreach` output to a variable before piping it to a formatter.

### 2026-07-10 — inferred the accessibility field name
- What happened: The direct control audit found no `textarea[name="image_alt"]` on the live approval form.
- Root cause: The field name was inferred from its display label instead of read from the rendered form.
- Fix: Inspect the form's two textarea `name` attributes and use the exact live value.
- Rule: Read the live form's exact control names before filling them; do not infer backend field names from display copy.

### 2026-07-10 — direct form evaluation also timed out
- What happened: Even the unique publish-form locator timed out when invoking `locator.evaluate()` on the long approval page, although `count()` resolved instantly.
- Root cause: The Chrome wrapper's evaluation path has a fixed three-second selector deadline that is unreliable on this document.
- Fix: Stop evaluating this page and use the already-verified unique form plus direct, counted control locators for the submission.
- Rule: Avoid `locator.evaluate()` on the long catering approval page; use direct control locators and supported read helpers.

### 2026-07-10 — nested approval-card evaluation timed out
- What happened: A read-only evaluation through the long approval region and second article exceeded Chrome's three-second selector deadline.
- Root cause: The nested role-region/article locator forced an expensive long-page selector resolution.
- Fix: Switch to the unique publish-form action selector and scope all reads and controls from that stable form.
- Rule: Prefer a direct stable CSS form selector over nested long-page locators when Chrome applies a three-second selector deadline.

### 2026-07-10 — mistake-log patch used unstable encoded context
- What happened: The first attempt to log the Chrome helper limitation failed because the patch matched a mojibake-rendered em dash from terminal output.
- Root cause: Terminal-rendered encoding artifacts were used as patch context.
- Fix: Retried with only encoding-stable headings and exact ASCII context.
- Rule: Use encoding-stable headings or the smallest unique context when patching notes that contain mojibake.

### 2026-07-10 — Chrome locator wrapper lacked `inputValue()`
- What happened: The catering-approval verification call failed because this Chrome locator wrapper does not implement Playwright's `inputValue()` helper.
- Root cause: The wrapper was assumed to expose the full Playwright locator API instead of its supported subset.
- Fix: Keep the uniquely scoped locator and read the control's value with a read-only DOM evaluation before continuing.
- Rule: Read form-control values through scoped DOM evaluation when the Chrome locator wrapper does not expose `inputValue()`.

### 2026-07-10 — full-page raw image capture timed out
- What happened: A full-page screenshot of a tall private delivery image exceeded the Chrome capture timeout.
- Root cause: The raw image document was too large for the fixed full-page capture budget.
- Fix: Stop full-page raw-image capture and rely on bounded previews or other clearly visible candidates.
- Rule: Do not request full-page Chrome screenshots for large raw image documents; use the visible card preview or a bounded image clip.

### 2026-07-10 — gesture scrolling remained unreliable on approval page
- What happened: A later DOM scroll on the long approval form timed out after an earlier DOM scroll had succeeded.
- Root cause: Both coordinate and DOM scroll helpers depend on the same unreliable synthesized Chrome gesture for this page.
- Fix: Stop manual scrolling and use a uniquely scoped Playwright card locator, which can bring the intended form control into view during interaction.
- Rule: On long Chrome forms, stop gesture scrolling after the first timeout and use scoped Playwright locators that auto-scroll to the target.

### 2026-07-10 — Chrome coordinate scroll timed out
- What happened: The first attempt to scroll the live approval gallery timed out while synthesizing a coordinate-based scroll gesture.
- Root cause: The Chrome control path did not complete that low-level gesture on the long form page.
- Fix: Use the documented DOM page scroll once and take a fresh screenshot; do not retry the failed coordinate gesture.
- Rule: If Chrome coordinate scrolling times out, switch once to the documented DOM scroll method instead of retrying the same gesture.

### 2026-07-10 — over-specified prior-task reads
- What happened: Four prior-task reads were rejected when optional host, output, and size fields were supplied together.
- Root cause: The established minimal `read_thread` workflow was not followed even though the task IDs were already local and known.
- Fix: Retry each task with only `threadId`, then use returned cursors if older turns are needed.
- Rule: Start Codex task reads with the minimal `{threadId}` shape; add pagination only after a successful read.

### 2026-07-10 — exceeded the thread-list page size
- What happened: A recent-task listing call was rejected when requesting 100 threads.
- Root cause: The tool schema omitted its effective maximum and the call used an oversized page.
- Fix: Limit task listings to 50 and paginate or narrow by query when needed.
- Rule: Keep `list_threads` page sizes at 50 or fewer.

### 2026-07-10 — declared deploy access blocked before checking prior tasks
- What happened: After finding Render signed out, the agent asked Sam to log in instead of first recovering the deployment method already used in other Cenas tasks.
- Root cause: The current browser state was treated as the only deployment path despite known cross-task history.
- Fix: Search prior Codex tasks and reuse the proven deployment workflow before asking for account access.
- Rule: Before declaring Cenas deployment access blocked, search prior Codex tasks for the established deployment workflow.

### 2026-07-10 — Chrome binding did not persist into resumed deploy
- What happened: The resumed Render deployment attempted to name the prior Chrome session, but the `chrome` binding was absent in the new browser runtime.
- Root cause: The earlier browser-binding lifetime assumption recurred across a user turn.
- Fix: Promote the binding check to a hard rule and reinitialize/reselect Chrome once before discovering the signed-in tab.
- Rule: Never assume browser bindings persist across runtime reinitialization or user turns; check `globalThis` first, then reinitialize and reselect once when absent.

### 2026-07-10 — used an unavailable PowerShell HTTP flag
- What happened: The first live feed probe produced a null feed result because this PowerShell version does not support `Invoke-WebRequest -SkipHttpErrorCheck`.
- Root cause: A PowerShell 7 parameter was assumed available under Windows PowerShell 5.1.
- Fix: Preserve the valid health and website results, then use explicit `try/catch` handling to capture non-2xx feed status without the unsupported flag.
- Rule: Use PowerShell 5.1-compatible HTTP error handling; do not pass `-SkipHttpErrorCheck` to `Invoke-WebRequest` on this machine.

### 2026-07-10 — reused a browser binding after runtime reinitialization
- What happened: The fallback Render-session check failed because the prior in-app browser binding no longer existed after reconnecting the shared browser runtime for Chrome.
- Root cause: Browser bindings were assumed to survive runtime reinitialization.
- Fix: Reselect the already-documented in-app browser once, then verify its authentication state without retrying the missing binding.
- Rule: After browser-runtime reinitialization, verify each browser binding still exists before reusing it; reselect the known browser once when absent.

### 2026-07-10 — assumed shared browser runtime still existed
- What happened: The first Chrome connection call failed because the previously selected tab binding remained but the shared `agent` runtime binding was absent.
- Root cause: Browser and runtime lifetimes were assumed to be identical.
- Fix: Reinitialize the documented browser runtime without resetting the existing session, then select Chrome once.
- Rule: Confirm the shared browser runtime exists before selecting another browser; reinitialize it with the documented plugin entrypoint when missing.

### 2026-07-10 — hard-rule violation in deployment-memory lookup
- What happened: A deployment-history lookup combined three optional ripgrep searches and the no-match exit code made the command fail.
- Root cause: The root agent repeated the already-promoted optional-path/no-match batching mistake instead of handling each lookup result explicitly.
- Fix: Stopped optional deployment-memory searches and limited subsequent deployment discovery to confirmed files and APIs with explicit result handling.
- Rule: Never include optional or unverified paths in a required diagnostic command; verify each path first or handle no-match separately.

### 2026-07-10 — searched nonexistent deployment paths
- What happened: A combined deployment search failed because it passed root-level `render.yaml` and wildcard README paths that do not exist in both repositories.
- Root cause: The search assumed conventional deployment-file locations instead of using the repository layouts already available.
- Fix: Used `rg --files` with include globs first and limited follow-up inspection to returned paths.
- Rule: Discover deployment files before searching them; do not batch nonexistent optional paths into `rg`.
