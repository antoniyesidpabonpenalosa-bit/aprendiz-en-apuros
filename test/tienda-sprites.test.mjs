import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const mejoras=['vida','tiempo','iman','doble','escudo'];

test('los cinco sprites de las mejoras son de 40×40, uno por cada mejora del juego, y están disponibles sin conexión',()=>{
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const datos=readFileSync(new URL('../js/datos.js',import.meta.url),'utf8');
  const ids=[...datos.match(/const MEJORAS=\[([\s\S]*?)\];/)[1].matchAll(/id:'(\w+)'/g)].map(m=>m[1]);
  assert.deepEqual(ids,mejoras,'cada mejora del juego tiene su sprite');
  for(const id of mejoras){
    const ruta=`img/tienda/${id}.png`;
    const png=readFileSync(new URL('../'+ruta,import.meta.url));
    assert.equal(png.readUInt32BE(16),40,`${id}: ancho`);
    assert.equal(png.readUInt32BE(20),40,`${id}: alto`);
    assert.ok(sw.includes(`'./${ruta}'`),`${id}: caché offline`);
  }
  assert.ok(sw.includes("'./img/tienda/oficina-nocturna.webp'"),'fondo disponible sin conexión');
});

test('la tienda dibuja los accesorios desde el avatar (canvas) y solo las mejoras usan sprite',()=>{
  const codigo=readFileSync(new URL('../js/tienda.js',import.meta.url),'utf8');
  assert.match(codigo,/class="tienda-acc-arte"/,'los accesorios siguen siendo el dibujo del avatar');
  assert.match(codigo,/img\/tienda\/\$\{m\.id\}\.png/,'las mejoras usan su sprite');
  assert.ok(!/img\/tienda\/\$\{a\.id\}/.test(codigo),'ningún accesorio usa sprite propio');
});
