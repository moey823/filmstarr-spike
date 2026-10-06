# filmstarr — portfolio spike

A minimal static portfolio prototype for Justin Starr. It separates the public filmstarr selection, broadcast/editorial cards, and Coldwell work. Built for GitHub Pages; no server, database, package install, or framework is required.

## Local preview on the Mac mini

```sh
cd /Users/mm/workspace/repos/personal/filmstarr-spike
python3 scripts/check.py
python3 -m http.server 8080 --directory site
```

## Deployment

The Pages export publishes **only `site/`** to the `gh-pages` branch. The client handoff, instructions, and implementation notes are not in the deployed artifact. Run `python3 scripts/export-pages.py`, publish `gh-pages`, and select that branch with `/` as the Pages source. The current account cannot enable Pages for a private repository; keep it private until repository visibility is explicitly approved or a supported plan is selected. Authenticated operations on the mini use its desktop helper. No custom Actions workflow or expanded OAuth permission is required. Private-repository Pages availability depends on the GitHub plan; a private source repository does not make the deployed Pages site private.

Every route uses relative paths and works at both a domain root and `/filmstarr-spike/`, without an SPA rewrite. Migrating hosts requires publishing the contents of `site/`.

## Scope and provisional choices

- Public: the ten revised videos; excludes Jerry and the retired DJ Nelson clout cut.
- Broadcast: five supplied artwork cards, preserving embedded credits; not five additional videos.
- Coldwell: seven videos, its own direct-link page, no published rates.
- Proposed concise copy, cleaned filename display titles, ordering, and logo choice remain reviewable design decisions. No invented project roles, testimonials, or contact details.
- Contact details and social URLs have not been supplied. Contact actions stay unconfigured; no inquiry or form is sent.
- Photography, 17hats, and testimonials are outside this spike.
- Source/review media comes from the client's Frame.io handoff; permanent video hosting remains undecided. Acquisition notes and the original client handoff stay locally on the mini, outside Git history. Two short 720p previews use native playback from the `spike-media` GitHub Release; the remaining video cards link to Frame.io review. MP4 files stay outside Git history. Release playback becomes available to signed-out visitors only when repository publication is approved.
- Search indexing is discouraged with `noindex` metadata and `robots.txt`, but this is not access control.

All development and test outputs remain on the Mac mini.

## Verification

`python3 scripts/check.py` validates the deployable artifact and inventory. `scripts/browser-check.mjs` optionally uses Playwright to verify all routes at 390px and 1440px, project-subdirectory navigation, enlarged text, available image counts, source-error fallback, and video-dialog keyboard/focus cleanup. Set `PLAYWRIGHT_MODULE` to an installed Playwright module, `SPIKE_CHROMIUM_EXECUTABLE` to the available headless browser if needed, and `SPIKE_TEST_BASE` to the preview URL. Test screenshots stay in ignored `.test-output/`. Dialog tests do not claim that unhosted video files play.

The two real preview files also passed `scripts/video-check.mjs` in a headless development browser: 1280×720 H.264 playback at 22.523s and 36.053s, with Escape cleanup and focus restoration. This check used the downloaded source bytes while the GitHub repository remained private; public CDN delivery is checked after publication.
