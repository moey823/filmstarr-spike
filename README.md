# filmstarr — portfolio spike

Live spike: https://moey823.github.io/filmstarr-spike/

Dedicated Coldwell view: https://moey823.github.io/filmstarr-spike/coldwell/

A minimal static portfolio prototype for Justin Starr. It separates the public filmstarr selection, broadcast/editorial cards, and Coldwell work. Built for GitHub Pages; no server, database, package install, or framework is required.

## Local preview on the Mac mini

```sh
cd /Users/mm/workspace/repos/personal/filmstarr-spike
python3 scripts/check.py
python3 -m http.server 8080 --directory site
```

## Deployment

The Pages export publishes **only `site/`** to the `gh-pages` branch. The client handoff, instructions, and implementation notes are not in the deployed artifact. Run `python3 scripts/export-pages.py`, publish `gh-pages`, and select that branch with `/` as the Pages source. The website source is public so the current GitHub plan can serve the spike. The original client handoff and acquisition notes remain excluded from Git history. Authenticated operations on the mini use its desktop helper. No custom Actions workflow or expanded OAuth permission is required. Private-repository Pages availability depends on the GitHub plan; a private source repository does not make the deployed Pages site private.

Every route uses relative paths and works at both a domain root and `/filmstarr-spike/`, without an SPA rewrite. Migrating hosts requires publishing the contents of `site/`.

## Scope and provisional choices

- Public: the ten revised videos; excludes Jerry and the retired DJ Nelson clout cut.
- Broadcast: five supplied artwork cards, preserving embedded credits; not five additional videos.
- Coldwell: seven videos, its own direct-link page, no published rates.
- Proposed concise copy, cleaned filename display titles, ordering, and logo choice remain reviewable design decisions. No invented project roles, testimonials, or contact details.
- Contact details and social URLs have not been supplied. Contact actions stay unconfigured; no inquiry or form is sent.
- Photography, 17hats, and testimonials are outside this spike.
- Source/review media comes from the client's Frame.io handoff; permanent video hosting remains undecided. Acquisition notes and the original client handoff stay locally on the mini, outside Git history. All seventeen video cards open their individual public Frame.io share viewers inside a modal, with a permanent “Open in Frame.io” fallback. This iframe integration is experimental: Frame.io has not documented supported website embedding and its [published staff guidance](https://forum.frame.io/t/embed-review-links/76) says it may break. We use stable public share links, never expiring API media URLs or account credentials. Two short 720p previews remain available for native playback from the `spike-media` GitHub Release if their Frame.io manifest links are removed. MP4 files stay outside Git history. The two preview release assets are public and support streaming byte-range requests.
- Search indexing is discouraged with `noindex` metadata and `robots.txt`, but this is not access control.

All development and test outputs remain on the Mac mini.

## Verification

`python3 scripts/check.py` validates the deployable artifact and inventory. `scripts/browser-check.mjs` optionally uses Playwright to verify all routes at 390px and 1440px, project-subdirectory navigation, enlarged text, available image counts, source-error fallback, and video-dialog keyboard/focus cleanup. Set `PLAYWRIGHT_MODULE` to an installed Playwright module, `SPIKE_CHROMIUM_EXECUTABLE` to the available headless browser if needed, and `SPIKE_TEST_BASE` to the preview URL. Test screenshots stay in ignored `.test-output/`. `scripts/frame-check.mjs` verifies actual public and Coldwell share viewers inside the headless development build, plus close-button cleanup and focus restoration.

The two real preview files also passed `scripts/video-check.mjs` in a headless development browser: 1280×720 H.264 playback at 22.523s and 36.053s, with Escape cleanup and focus restoration. This check used the downloaded source bytes while the GitHub repository remained private; Set `SPIKE_USE_HOSTED_VIDEO=1` to verify actual public CDN playback instead of serving downloaded preview bytes.

Publication verified: GitHub reports the site built successfully; all four routes plus the deployed manifest/scripts/styles match the validated source exactly; all 23 imagery URLs respond successfully. Both public release previews passed native playback from the headless development build using their real hosted URLs.

Frame.io embed verification: individual public and Coldwell viewers loaded at 1440px and 390px inside the local development build; their real supplied video decoded and advanced playback. The external share link remained visible, and close/Escape removed the iframe and restored focus. Frame.io emits a recoverable React hydration warning during initialization; its viewer recovered and playback checks passed. The embed includes Frame.io review controls and comments, and availability remains dependent on public share permissions and Frame.io browser behavior.
