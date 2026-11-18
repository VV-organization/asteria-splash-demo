# Asteria Splash

Standalone live browser port of the existing Asteria Flutter splash. No application login, backend, tracking, external fonts, dependencies or build step.

Open the published GitHub Pages URL on a phone or desktop. Playback runs once (3.85 seconds); use **Повторить** to replay. Reduced-motion preferences show the final frame. If WebGL is unavailable, the original solid-background fallback is used.

## Local preview

```sh
python3 -m http.server 8768 --bind 127.0.0.1
```

Open `http://127.0.0.1:8768/`.

## Source fidelity

- `splash.js`: browser Canvas port of `_LaunchPainter` in `lib/features/splash/presentation/screens/splash_screen.dart`.
- `wordmark.js` and `wordmark-data.js`: original handwritten glyphs, sequential pen masks, cheek clay texture and bevel from `brand_wordmark.dart` and `_paintWordmark`.
- `contours.js`: original quadratic brand paths from `brand_contours.dart`, in the same 416-unit space.
- `assets/silk.frag`: original `assets/shaders/splash_fluid.frag`, adapted for WebGL fragment coordinates/output.
- `assets/*.png`: original auth splash artwork.

The demo retains the final frame rather than navigating to login. Browser rasterization and GPU precision may differ from Flutter. Desktop uses a portrait preview; mobile uses the viewport. The replay controls are demo-only.

## Publication

GitHub Pages serves this directory directly from the `main` branch, with `.nojekyll`. No build or TestFlight is required for viewers. Only the splash source and its public artwork belong in this repository.
