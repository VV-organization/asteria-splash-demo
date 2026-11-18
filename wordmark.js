import { wordmarkData } from './wordmark-data.js';

const WIDTH = 705.25, HEIGHT = 195.5, PADDING = 24;
const DURATIONS = [.88, .38, .32, .33, .38, .26, .38];
const ramp = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
function surface() {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(WIDTH + PADDING * 2);
  canvas.height = Math.ceil(HEIGHT + PADDING * 2);
  const ctx = canvas.getContext('2d');
  ctx.translate(PADDING, PADDING);
  return { canvas, ctx };
}
function clear({ canvas, ctx }) {
  ctx.clearRect(-PADDING, -PADDING, canvas.width, canvas.height);
}
const glyphs = wordmarkData.wordmarkGlyphs.map(glyph => ({ ...glyph, path: new Path2D(glyph.d) }));
const strokes = wordmarkData.penStrokes.map(stroke => {
  const contours = stroke.d.match(/M[^M]+/g).map(d => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('d', d);
    return { path: new Path2D(d), length: svg.getTotalLength() };
  });
  return { contours, length: contours.reduce((sum, contour) => sum + contour.length, 0) };
});

// Cache the app's matte cheek texture and the bevel for each original glyph.
export function createWordmark(mark) {
  const letters = glyphs.map(({ path, bounds }) => {
    const letter = surface(), outside = surface();
    const { ctx } = letter;
    const sides = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sides.addColorStop(0, '#ac9076'); sides.addColorStop(1, '#72564c');
    ctx.save(); ctx.translate(.6, 1.8); ctx.fillStyle = sides; ctx.fill(path); ctx.restore();
    ctx.save(); ctx.clip(path);
    ctx.drawImage(mark, mark.width * 146 / 312, mark.height * 108 / 312,
      mark.width * 52 / 312, mark.height * 67 / 312,
      bounds.x - 1, bounds.y - 1, bounds.width + 2, bounds.height + 2);
    // Rasterized rectangle-minus-glyph equals Flutter's PathOperation.difference,
    // including the counters. Clip the blurred complement back to the glyph.
    function edge(color, x, y, blur) {
      clear(outside);
      outside.ctx.fillStyle = color;
      outside.ctx.fillRect(bounds.x - 20, bounds.y - 20, bounds.width + 40, bounds.height + 40);
      outside.ctx.globalCompositeOperation = 'destination-out'; outside.ctx.fillStyle = '#fff'; outside.ctx.fill(path);
      outside.ctx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(outside.canvas, x - PADDING, y - PADDING); ctx.restore();
    }
    edge('rgba(128,96,78,0.7647058824)', -2.6, -3.8, 2.2);
    edge('rgba(255,240,217,0.9019607843)', 1.8, 2.4, 1.55);
    ctx.restore();
    return letter;
  });
  const written = surface(), paint = surface();
  function mask(index, progress) {
    clear(written);
    const { ctx } = written;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 31; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let remaining = strokes[index].length * progress;
    for (const contour of strokes[index].contours) {
      if (remaining <= 0) break;
      ctx.setLineDash(remaining >= contour.length ? [] : [remaining, contour.length + 1]);
      ctx.stroke(contour.path);
      remaining -= contour.length;
    }
    ctx.setLineDash([]);
  }
  function applyMask() {
    paint.ctx.globalCompositeOperation = 'destination-in';
    paint.ctx.drawImage(written.canvas, -PADDING, -PADDING);
    paint.ctx.globalCompositeOperation = 'source-over';
  }
  return function drawWordmark(ctx, width, height, side, t) {
    const wordWidth = side * 1.15;
    ctx.save(); ctx.translate((width - wordWidth) / 2, height * .4 + side * .55);
    ctx.scale(wordWidth / WIDTH, wordWidth / WIDTH);
    const writingTime = (t - .75) * 1.12;
    let start = 0;
    for (let i = 0; i < glyphs.length; i++) {
      const elapsed = writingTime - start, duration = DURATIONS[i];
      if (elapsed <= 0) break;
      start += duration;
      const progress = ramp(elapsed / duration), fill = ramp((elapsed - .075) / duration);
      if (fill < 1) {
        clear(paint); paint.ctx.strokeStyle = '#ffe9d2'; paint.ctx.lineWidth = 1.5;
        paint.ctx.stroke(glyphs[i].path);
        if (progress < 1) { mask(i, progress); applyMask(); }
        ctx.drawImage(paint.canvas, -PADDING, -PADDING);
      }
      if (fill <= 0) continue;
      if (fill < 1) {
        clear(paint); paint.ctx.drawImage(letters[i].canvas, -PADDING, -PADDING);
        mask(i, fill); applyMask(); ctx.drawImage(paint.canvas, -PADDING, -PADDING);
      } else ctx.drawImage(letters[i].canvas, -PADDING, -PADDING);
    }
    ctx.restore();
  };
}
