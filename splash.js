import { contours } from './contours.js';
import { createWordmark } from './wordmark.js';

// Port of Asteria's _LaunchPainter. Keep timing and 416-unit artwork coordinates.
const DURATION = 3.85;
const ramp = v => { const x = Math.max(0, Math.min(1, v)); return x * x * (3 - 2 * x); };
const stage = document.querySelector('.stage');
const background = document.querySelector('#silk');
const artwork = document.querySelector('#art');
const replay = document.querySelector('#replay');
const status = document.querySelector('#status');
const ctx = artwork.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const paths = contours.map(d => new Path2D(d));
const lengths = contours.map(d => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  return path.getTotalLength();
});
const layer = () => { const c = document.createElement('canvas'); c.width = c.height = 416; return c; };
const composite = layer(), revealLayer = layer(), mask = layer(), texture = layer();
const mix = composite.getContext('2d'), reveal = revealLayer.getContext('2d');
const maskCtx = mask.getContext('2d'), tex = texture.getContext('2d');
let drawWordmark;
let base, mark, silk, frame = 0, startedAt = null, elapsed = 0, ready = false;
let pausedAt = null;

async function loadImage(path) {
  const image = new Image(); image.src = new URL(path, import.meta.url).href;
  await image.decode(); return image;
}
async function setupSilk() {
  const gl = background.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return null;
  const response = await fetch(new URL('./assets/silk.frag', import.meta.url));
  if (!response.ok) throw new Error('Shader unavailable');
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}');
  const fragment = compile(gl.FRAGMENT_SHADER, await response.text());
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.deleteShader(vertex); gl.deleteShader(fragment); gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const size = gl.getUniformLocation(program, 'size'), time = gl.getUniformLocation(program, 'time');
  return {
    draw(t) { gl.viewport(0,0,background.width,background.height); gl.uniform2f(size,background.width,background.height); gl.uniform1f(time,t); gl.drawArrays(gl.TRIANGLES,0,6); },
    dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); }
  };
}
function draw(t) {
  elapsed = t; silk?.draw(t);
  const { width, height } = stage.getBoundingClientRect();
  const ratio = artwork.width / width;
  ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,width,height);
  const opacity = ramp((t - .35) / .85);
  if (!base || !mark || opacity <= 0) return;
  const side = Math.min(width * .49, height * .32);
  const finish = ramp((t - 2.75) / .58);
  reveal.clearRect(0,0,416,416);
  if (finish < 1) {
    reveal.globalAlpha = opacity;
    reveal.drawImage(base,base.width*30/1254,base.height*93/1254,base.width*1174/1254,base.height*1038/1254,10*416/312,23*416/312,292*416/312,265*416/312);
    reveal.globalAlpha = 1;
    paths.forEach((path,i) => {
      const start = i === 0 ? .84 : 1.97+(i-1)*.215;
      const since = t-start, duration = i === 0 ? 1.22 : .34;
      if (since <= 0) return;
      const progress = ramp(since/duration);
      const fill = ramp((since-duration*.64)/(i === 0 ? 1.04 : .38));
      reveal.strokeStyle = `rgba(255,233,210,${.9*(1-fill)})`;
      reveal.lineCap = 'round'; reveal.lineWidth = i === 0 ? 1.6 : 1;
      reveal.setLineDash([lengths[i]*progress, lengths[i]+1]); reveal.stroke(path); reveal.setLineDash([]);
      if (fill <= 0) return;
      maskCtx.clearRect(0,0,416,416); maskCtx.fillStyle = '#fff'; maskCtx.strokeStyle = '#fff';
      maskCtx.lineWidth = 21; maskCtx.lineJoin = 'round'; maskCtx.fill(path); maskCtx.stroke(path);
      if (fill < 1) {
        // SVG bounds match Flutter Path.getBounds; include its 11-unit inflation.
        // Bounds derived from the source quadratic control points.
        const bounds = boundsFor(i);
        const edge = bounds.top-12+(bounds.height+30)*fill;
        const gradient = maskCtx.createLinearGradient(0,edge-18,0,edge+12);
        gradient.addColorStop(0,'#fff'); gradient.addColorStop(1,'transparent');
        maskCtx.globalCompositeOperation = 'destination-in'; maskCtx.fillStyle = gradient; maskCtx.fillRect(0,0,416,416); maskCtx.globalCompositeOperation = 'source-over';
      }
      tex.clearRect(0,0,416,416); tex.drawImage(mark,0,0,416,416);
      tex.globalCompositeOperation = 'destination-in'; tex.drawImage(mask,0,0); tex.globalCompositeOperation = 'source-over';
      reveal.drawImage(texture,0,0);
    });
  }
  mix.clearRect(0,0,416,416);
  mix.globalAlpha = 1-finish; mix.drawImage(revealLayer,0,0);
  mix.globalCompositeOperation = 'lighter'; mix.globalAlpha = finish; mix.drawImage(mark,0,0,416,416);
  mix.globalAlpha = 1; mix.globalCompositeOperation = 'source-over';
  ctx.drawImage(composite,(width-side)/2,height*.4-side/2,side,side);
  drawWordmark(ctx, width, height, side, t);
}
// Flutter Path bounds include control points; these are generated from the same paths.
function boundsFor(i) {
  const values = contours[i].match(/-?\d+(?:\.\d+)?/g).map(Number);
  const ys = values.filter((_, index) => index%2 === 1);
  return {top: Math.min(...ys)-11, height: Math.max(...ys)-Math.min(...ys)+22};
}
function resize() {
  const {width,height} = stage.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1,2);
  for (const canvas of [background, artwork]) { canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); }
  if (ready) draw(elapsed);
}
function tick(now) {
  if (startedAt === null) startedAt = now;
  const t = Math.min(DURATION,(now-startedAt)/1000); draw(t);
  if (t < DURATION) frame = requestAnimationFrame(tick);
  else { frame = 0; status.textContent = 'Анимация завершена. Можно повторить.'; }
}
function restart() {
  if (!ready) return;
  cancelAnimationFrame(frame); frame = 0; startedAt = null; pausedAt = null;
  status.textContent = reducedMotion.matches ? 'Уменьшенное движение: показан итоговый знак.' : 'Анимация запущена.';
  if (reducedMotion.matches) draw(DURATION);
  else { draw(0); frame = requestAnimationFrame(tick); }
}
replay.addEventListener('click',restart);
reducedMotion.addEventListener('change',restart);
const observer = new ResizeObserver(resize); observer.observe(stage);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; pausedAt = performance.now(); }
  else if (!document.hidden && pausedAt !== null) { if (startedAt !== null) startedAt += performance.now()-pausedAt; pausedAt = null; frame = requestAnimationFrame(tick); }
});
background.addEventListener('webglcontextlost', event => { event.preventDefault(); silk = null; status.textContent = 'Показан упрощённый фон.'; });
background.addEventListener('webglcontextrestored', async () => { try { silk = await setupSilk(); draw(elapsed); } catch { /* Solid background remains usable. */ } });
window.addEventListener('pagehide',event => { if (event.persisted) return; cancelAnimationFrame(frame); observer.disconnect(); silk?.dispose(); });
try {
  [base,mark] = await Promise.all([loadImage('./assets/splash_clay_base.png'),loadImage('./assets/asteria_mark.png')]);
  try { silk = await setupSilk(); } catch (error) { console.warn('Silk fallback:',error.message); }
  drawWordmark = createWordmark(mark);
  ready = true; resize(); replay.disabled = false; restart();
} catch {
  status.classList.add('error'); status.textContent = 'Не удалось загрузить анимацию. Обновите страницу.';
}
