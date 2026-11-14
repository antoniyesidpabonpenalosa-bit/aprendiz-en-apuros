import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const ctx=createContext({t:k=>k});
runInContext(readFileSync(new URL('../js/graficos.js',import.meta.url),'utf8'),ctx);
const barra=runInContext('barraRpg',ctx);
test('XP usa los límites reales y es accesible',()=>{
  const s=barra('xp',37);assert.match(s,/aria-valuenow="37"/);assert.match(s,/--rpg-hasta:37%/);assert.match(s,/data-animar="false"/);
  assert.match(barra('xp',-1),/aria-valuenow="0"/);assert.match(barra('xp',140),/data-completo="true"/);
  assert.match(barra('xp',NaN),/aria-valuenow="0"/);
});
test('campaña: 15 segmentos, porcentaje exacto y tarjeta sin roles anidados',()=>{
  const s=barra('campana',7,15,null,true);assert.match(s,/--rpg-hasta:46\.666666666666664%/);assert.match(s,/aria-hidden="true"/);assert.doesNotMatch(s,/role=/);
  assert.match(barra('campana',15,15,null,true),/--rpg-hasta:100%/);
});
test('solo anima ganancia real, sin valores negativos ni retrocesos ficticios',()=>{
  const s=barra('xp',42,100,13);assert.match(s,/data-animar="true"/);assert.match(s,/--rpg-desde:13%/);
  assert.match(barra('xp',13,100,13),/data-animar="false"/);assert.match(barra('xp',13,100,42),/data-animar="false"/);
  assert.match(barra('xp',5,100,0),/data-animar="true"/);
});
