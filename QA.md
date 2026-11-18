# Verification · 2026-11-18

- Chromium, desktop 1440×1000 and mobile 390×844: original shader compiles, full playback completes, replay restarts immediately (including during playback), keyboard Enter works, no horizontal overflow or runtime errors.
- Reduced-motion preference: final frame without animation; preference changes also handled.
- WebGL disabled: artwork still animates over the original solid-background fallback.
- Hidden-tab pause/resume, landscape resize, reload and failed-image recovery instruction passed.
- JavaScript syntax check and staged diff whitespace check passed. The existing landing's `npm run build` also passed; this separate demo has no build step.
- Independent read-only source and screenshot audit found no high/medium issues. The reported low issue (narrow desktop controls on short windows) was fixed with a minimum width.
- Original and staged Flutter splash source, contours and shader compared identical. Browser source retains original timing, geometry, artwork and shader formula; navigation to the app is replaced by retaining the final frame.

Limitations: Safari/WebKit and physical devices were not tested. Browser rasterization and GPU precision can differ from Flutter. No independent end-user usability observation was performed.

## Wordmark update · 2026-11-18

- Added the current app's seven original handwritten glyphs and pen trajectories, preserving per-letter timing, multi-contour reveal, clay texture and soft bevel.
- Independently compared every generated path command and coordinate with `brand_wordmark.dart`; all seven glyphs and seven pen paths match.
- Chromium desktop/mobile: full playback, keyboard replay, frame reset and reduced-motion final-frame equality passed; no runtime errors or horizontal overflow. Mid-animation and final screenshots inspected.
- Existing logo assets and silk shader unchanged. Safari/physical-device limitations above still apply.

## Final app sync · 2026-11-18

- Re-read canonical final sources after the user's last edits. Regenerated brand paths from the final Dart files and copied the latest iOS silk video/poster byte-for-byte.
- Updated writing to `(t - .75) * 1.12`, independent background clock, 450ms video entrance, and a 2-second final hold after 3.85 seconds of artwork.
- Native iOS foreground MOV is a cached render of the same current Dart painter; the demo retains its live Canvas equivalent. Independent source audit confirmed the export painter and brand paths match canonical sources exactly.
- Chromium desktop/mobile: actual video playback; 5.85-second total timeline; unchanged artwork and moving silk during hold; keyboard replay and clock reset; reduced-motion final-frame equality; no runtime errors or horizontal overflow. Autoplay rejection falls back to the live app shader.
- Independent visual/source QA found no high/medium issues. No build step is required for this static demo. Safari and physical-device limits remain.
