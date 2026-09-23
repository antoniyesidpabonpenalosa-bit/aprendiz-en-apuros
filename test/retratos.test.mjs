/* Pruebas del parpadeo de los retratos: que cerrar los ojos cambie SOLO los
   ojos, y que un retrato sin el campo nuevo salga exactamente como antes.
   Uso:  node --test test/*.test.mjs

   cara() y cara32() solo necesitan un lienzo con getContext('2d'), así que
   se les da uno de mentira que apunta cada fillRect con su color. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = createContext({});
runInContext(readFileSync(join(RAIZ, 'js/graficos.js'), 'utf8'), ctx, { filename: 'js/graficos.js' });
const cara = runInContext('cara', ctx), cara32 = runInContext('cara32', ctx);

/* Dibuja y devuelve la lista de trazos: "color x,y wxh" en celdas de la rejilla. */
function trazos(fn, rejilla, o) {
  const lista = [];
  const c2d = { fillStyle: '', fillRect(x, y, w, h) { lista.push(`${this.fillStyle} ${x / 4},${y / 4} ${w / 4}x${h / 4}`); } };
  fn({ width: rejilla * 4, getContext: () => c2d }, o);
  return lista;
}
const persona = { skin: '#f4c898', camisa: '#39a900', pelo: '#2a1c10', feliz: true, gafas: true, gorra: true };
const OJO = '#101018';

for (const [nombre, fn, rejilla] of [['cara (16×16)', cara, 16], ['cara32 (32×32)', cara32, 32]]) {
  test(`${nombre}: sin el campo parpadeo se dibuja igual que antes`, () => {
    assert.deepEqual(trazos(fn, rejilla, persona), trazos(fn, rejilla, { ...persona, parpadeo: false }));
  });

  test(`${nombre}: parpadeando no quedan pupilas, hay párpado, y lo demás no cambia`, () => {
    const abiertos = trazos(fn, rejilla, persona);
    const cerrados = trazos(fn, rejilla, { ...persona, parpadeo: true });
    assert.ok(abiertos.some(t => t.startsWith(OJO)), 'con los ojos abiertos hay pupilas');
    assert.ok(!cerrados.some(t => t.startsWith(OJO)), 'con los ojos cerrados no');
    // Quitando lo que cae en las celdas de los ojos (pupila, brillo o párpado,
    // del color que sea), el resto del dibujo es idéntico: el parpadeo no
    // mueve el pelo, las gafas, la gorra ni la boca.
    const CELDAS_OJO = rejilla === 16
      ? ['6,6 1x1', '9,6 1x1']
      : ['12,12 2x2', '18,12 2x2', '12,12 1x1', '18,12 1x1', '12,13 2x1', '18,13 2x1'];
    const resto = l => l.filter(t => !CELDAS_OJO.some(c => t.endsWith(' ' + c)));
    assert.deepEqual(resto(cerrados), resto(abiertos));
    // Y en su lugar hay párpado: la cara no se queda sin ojos.
    assert.equal(cerrados.length - resto(cerrados).length, 2, 'un trazo de párpado por ojo');
  });
}
