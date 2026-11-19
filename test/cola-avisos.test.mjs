import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('dos logros y un aviso comparten la burbuja en orden, sin duplicar recompensas', () => {
  const icono = {}, mensaje = {}, temporizadores = [], logros = [];
  const popup = { hidden: true, querySelector: s => s === 'p' ? mensaje : icono };
  let sonidos = 0;
  const entorno = { $: () => popup, S: { logros }, LOGROS: [{id:'a'}, {id:'b'}],
    guardar() {}, t: k => k, tj: l => l.id, SFX: { logro: () => sonidos++ },
    setTimeout: f => temporizadores.push(f) };
  const codigo = readFileSync(new URL('../js/nucleo.js', import.meta.url), 'utf8');
  runInNewContext(codigo + "\ndarLogro('a'); mostrarAviso('x','mensaje',2200); darLogro('b'); darLogro('a');", entorno);
  for (const esperado of ['logro\na', 'mensaje', 'logro\nb']) {
    assert.equal(mensaje.textContent, esperado);
    assert.equal(popup.hidden, false);
    assert.equal(temporizadores.length, 1);
    temporizadores.shift()();
  }
  assert.equal(popup.hidden, true);
  assert.equal(sonidos, 2);
  assert.deepEqual(logros, ['a','b']);
});
