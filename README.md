# Asteria Splash

Standalone live browser port of the existing Asteria Flutter splash. No application login, backend, tracking, external fonts, dependencies or build step.

Open the published GitHub Pages URL on a phone or desktop. The artwork runs once (3.85 seconds), followed by a 2-second hold with the silk still moving; use **Повторить** to replay. Reduced-motion preferences show the final frame. The background uses the actual iOS silk video and launch poster. If playback is blocked or unavailable, the app shader is used; without WebGL too, a solid background remains.

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
- `assets/silk.mp4` and `assets/silk-poster.png`: current iOS `SplashSilk.mp4` and launch poster, copied without conversion.
- `assets/*.png`: original splash artwork.

The demo retains the final frame rather than navigating to login. Replay resets both foreground and background. The iOS app may use a prepared alpha artwork movie for performance; this browser demo keeps its matching Dart vector artwork live, with the same 1.12× writing speed. Browser rasterization and GPU precision may differ from Flutter. Desktop uses a portrait preview; mobile uses the viewport. The replay controls are demo-only.

## Publication

GitHub Pages serves this directory directly from the `main` branch, with `.nojekyll`. No build or TestFlight is required for viewers. Only the splash source and its public artwork belong in this repository.
