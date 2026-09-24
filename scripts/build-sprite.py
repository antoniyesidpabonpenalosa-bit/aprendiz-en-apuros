#!/usr/bin/env python3
"""Genera los atlas del aprendiz en img/: uno por conjunto de cuadros.

  img/aprendiz.png        · las 8 direcciones en reposo (arte/aprendiz/idle/)
  img/aprendiz-correr.png · los cuadros de la carrera  (arte/aprendiz/correr/)

Es el único recurso de imagen del juego; el resto se dibuja con código.
Uso:  python3 scripts/build-sprite.py

TODOS los conjuntos se recortan con la MISMA caja y a la misma escala, calculada
sobre la unión de todos los cuadros. Así el personaje no cambia de tamaño ni
"salta" de altura al pasar de estar quieto a correr: el pie cae siempre en la
misma línea. Por eso, al añadir una animación nueva hay que regenerar todo y
copiar el frameW/frameH que imprime este script a js/sprite.js.

Los originales viven en arte/aprendiz/<conjunto>/ (fuente, para regenerar); los
atlas resultantes se commitean."""
from PIL import Image
import os, json, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTE = os.path.join(RAIZ, 'arte', 'aprendiz')
ALTO = 74                          # alto de cada cuadro en el atlas (px)
COLORES = 24                       # tamaño de la paleta tras reducir

DIRS = ['south','south-east','east','north-east','north','north-west','west','south-west']

def cuadros_idle():
    """Las 8 direcciones, en el orden que espera js/sprite.js."""
    return [os.path.join(ARTE, 'idle', d + '.png') for d in DIRS]

def cuadros_anim(carpeta):
    """Los cuadros de una animación, en orden por nombre (frame_0, frame_1…)."""
    return sorted(glob.glob(os.path.join(ARTE, carpeta, '*.png')))

# conjunto -> (archivos, nombre del atlas). Solo se genera lo que exista.
CONJUNTOS = [
    ('idle',   cuadros_idle(),          'aprendiz.png'),
    ('correr', cuadros_anim('correr'),  'aprendiz-correr.png'),
]
CONJUNTOS = [(n, f, s) for n, f, s in CONJUNTOS if f and all(os.path.exists(x) for x in f)]
if not CONJUNTOS:
    raise SystemExit('no hay cuadros en arte/aprendiz/')

# ── caja común a TODOS los cuadros de todos los conjuntos ──
cajas = []
for _, archivos, _ in CONJUNTOS:
    for a in archivos:
        bb = Image.open(a).convert('RGBA').getbbox()
        if bb: cajas.append(bb)
L = min(b[0] for b in cajas); T = min(b[1] for b in cajas)
R = max(b[2] for b in cajas); B = max(b[3] for b in cajas)
anchoCaja, altoCaja = R - L, B - T
ancho = round(anchoCaja * ALTO / altoCaja)          # mantiene la proporción
print(f'caja común {anchoCaja}x{altoCaja} -> cada cuadro {ancho}x{ALTO}')

meta = {'dirs': DIRS, 'frameW': ancho, 'frameH': ALTO, 'sets': {}}
for nombre, archivos, salida in CONJUNTOS:
    atlas = Image.new('RGBA', (ancho * len(archivos), ALTO), (0,0,0,0))
    for i, a in enumerate(archivos):
        im = Image.open(a).convert('RGBA')
        atlas.paste(im.crop((L, T, R, B)).resize((ancho, ALTO), Image.NEAREST), (i * ancho, 0))
    # Reduce la paleta: aplana el suavizado y baja el peso. El alfa va aparte
    # porque quantize() no lo maneja, y los bordes semitransparentes se
    # redondean a todo o nada para que el pixel art quede limpio.
    alpha = atlas.getchannel('A')
    q = atlas.convert('RGB').quantize(colors=COLORES, method=Image.MEDIANCUT).convert('RGBA')
    q.putalpha(alpha.point(lambda a: 255 if a > 128 else 0))
    destino = os.path.join(RAIZ, 'img', salida)
    q.save(destino, optimize=True)
    meta['sets'][nombre] = {'archivo': 'img/' + salida, 'cuadros': len(archivos)}
    print(f'  {nombre}: {len(archivos)} cuadros -> img/{salida} ({os.path.getsize(destino)} bytes)')

print('meta para js/sprite.js:', json.dumps(meta, ensure_ascii=False))
