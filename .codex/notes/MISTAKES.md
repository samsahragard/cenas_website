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

## Entries

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
