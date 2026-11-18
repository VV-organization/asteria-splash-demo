# Verification · 2026-11-18

- Chromium, desktop 1440×1000 and mobile 390×844: original shader compiles, full playback completes, replay restarts immediately (including during playback), keyboard Enter works, no horizontal overflow or runtime errors.
- Reduced-motion preference: final frame without animation; preference changes also handled.
- WebGL disabled: artwork still animates over the original solid-background fallback.
- Hidden-tab pause/resume, landscape resize, reload and failed-image recovery instruction passed.
- JavaScript syntax check and staged diff whitespace check passed. The existing landing's `npm run build` also passed; this separate demo has no build step.
- Independent read-only source and screenshot audit found no high/medium issues. The reported low issue (narrow desktop controls on short windows) was fixed with a minimum width.
- Original and staged Flutter splash source, contours and shader compared identical. Browser source retains original timing, geometry, artwork and shader formula; navigation to the app is replaced by retaining the final frame.

Limitations: Safari/WebKit and physical devices were not tested. Browser rasterization and GPU precision can differ from Flutter. No independent end-user usability observation was performed.
