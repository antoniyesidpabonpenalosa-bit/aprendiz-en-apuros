/* Pruebas de js/efectos.js: la cuenta de cada partícula (FX.paso) y que los
   efectos no suelten nada cuando el sistema pide menos movimiento.
   Uso:  node --test test/*.test.mjs

   Se carga con node:vm dándole solo los globales que toca; sin documento, el
   lienzo no se crea y nada se dibuja, que es justo lo que se quiere probar. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
function cargar({ quieto = false } = {}) {
  const llamadas = [];
  const ctx = createContext({
    SFX: { ok() { llamadas.push('ok'); }, mal() { llamadas.push('mal'); }, star() {}, logro() {} },
    quieto: () => quieto, sacudir: f => llamadas.push('sacudir' + f),
    performance: { now: () => 0 }, setTimeout, requestAnimationFrame: () => {},
    innerWidth: 400, innerHeight: 700,
    document: { body: null, activeElement: null, getElementById: () => null, querySelectorAll: () => [] },
  });
  runInContext(readFileSync(join(RAIZ, 'js/efectos.js'), 'utf8'), ctx, { filename: 'js/efectos.js' });
  return { ctx, llamadas, FX: runInContext('FX', ctx) };
}

test('una partícula cae con la gravedad, avanza y muere al cumplir su vida', () => {
  const { FX } = cargar();
  const p = { edad: 0, vida: 1, x: 0, y: 0, vx: 100, vy: 0, g: 400 };
  assert.equal(FX.paso(p, .5), true);
  assert.equal(p.x, 50);
  assert.equal(p.vy, 200, 'la gravedad le suma velocidad hacia abajo');
  assert.equal(p.y, 100);
  assert.equal(FX.paso(p, .5), false, 'a los 1.0 s ya no vive');
});

test('el rozamiento frena la partícula y nunca la invierte', () => {
  const { FX } = cargar();
  const p = { edad: 0, vida: 9, x: 0, y: 0, vx: 100, vy: -50, arr: 3 };
  FX.paso(p, 1);                       // 1 - 3*1 < 0 → se queda en 0, no sale negativo
  assert.equal(p.vx, 0);
  assert.ok(p.vy === 0, 'vy queda en 0 (no cambia de signo)');
});

test('con "reducir movimiento" no se suelta ningún efecto', () => {
  const { FX } = cargar({ quieto: true });
  FX.chispas(10, 10); FX.onda(10, 10); FX.flotante(10, 10, '+1'); FX.estrellas(10, 10);
  FX.destello('red'); FX.confeti(); FX.explosion(10, 10);
  assert.equal(FX._vivas(), 0);
});

test('sin lienzo (pruebas) los efectos no rompen nada', () => {
  const { FX } = cargar();
  assert.doesNotThrow(() => { FX.chispas(1, 1); FX.confeti(); FX.acierto(); FX.fallo(); });
  assert.equal(FX._vivas(), 0, 'sin lienzo no se acumula nada');
});

test('SFX.ok y SFX.mal siguen sonando aunque ahora también se vean', () => {
  const { ctx, llamadas } = cargar();
  runInContext('SFX.ok(); SFX.mal();', ctx);
  assert.deepEqual(llamadas, ['ok', 'mal']);
});

test('FX.deCanvas convierte coordenadas del juego a las de la ventana', () => {
  const { FX } = cargar();
  const el = { getBoundingClientRect: () => ({ left: 100, top: 50, width: 640, height: 360 }) };
  assert.deepEqual({ ...FX.deCanvas(el, 160, 90, 320, 180) }, { x: 420, y: 230 });
});

test('los efectos nuevos tampoco sueltan nada con "reducir movimiento"', () => {
  const { FX } = cargar({ quieto: true });
  const el = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 10 }), classList: { add() {}, remove() {} } };
  FX.fuegos(); FX.cohete(0, 0, 10, 10, 'red'); FX.monedas(10, 10, el, 6); FX.cortina(); FX.glitch(); FX.contar();
  assert.equal(FX._vivas(), 0);
  assert.equal(FX.rotulo('¡RACHA x3!'), false, 'devuelve false para que quien llama ponga su texto de siempre');
});

test('sin pantalla, el rótulo y la cortina no rompen nada', () => {
  const { FX } = cargar();
  assert.doesNotThrow(() => { FX.cortina(); FX.glitch(); FX.peligro(false); FX.alPintar(true); });
  assert.equal(FX.rotulo('x'), false);
});

test('una partícula avisa al morir (la moneda que llega al marcador)', () => {
  const { FX } = cargar();
  const p = { edad: 0, vida: .5, x: 0, y: 0, vx: 0, vy: 0 };
  assert.equal(FX.paso(p, .3), true);
  assert.equal(FX.paso(p, .3), false, 'al cumplir su vida, paso() da false y tick() llama a p.fin');
});
