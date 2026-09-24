#!/usr/bin/env python3
"""Genera img/aprendiz.png: un atlas horizontal con las 8 direcciones del
aprendiz, recortadas a su caja común, escaladas y con la paleta reducida para
que pese poco. Es el ÚNICO recurso de imagen del juego; el resto se dibuja con
código. Uso:  python3 scripts/build-sprite.py

Los originales viven en arte/aprendiz/idle/ (fuente, para poder regenerar). El
atlas resultante se commitea. El orden de los cuadros lo fija DIRS, y tiene que
coincidir con js/sprite.js."""
from PIL import Image
import os, json

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RAIZ, 'arte', 'aprendiz', 'idle')
OUT = os.path.join(RAIZ, 'img', 'aprendiz.png')
DIRS = ['south','south-east','east','north-east','north','north-west','west','south-west']
ALTO = 74                          # alto de cada cuadro en el atlas (px)

imgs = [Image.open(os.path.join(SRC, d + '.png')).convert('RGBA') for d in DIRS]
# caja común: mismo recorte para todos, así el pie no salta al girar
boxes = [im.getbbox() for im in imgs]
L = min(b[0] for b in boxes); T = min(b[1] for b in boxes)
R = max(b[2] for b in boxes); B = max(b[3] for b in boxes)
anchoCaja, altoCaja = R - L, B - T
ancho = round(anchoCaja * ALTO / altoCaja)          # mantiene la proporción
print(f'caja común {anchoCaja}x{altoCaja} -> cada cuadro {ancho}x{ALTO}')

atlas = Image.new('RGBA', (ancho * len(DIRS), ALTO), (0,0,0,0))
for i, im in enumerate(imgs):
    cuadro = im.crop((L, T, R, B)).resize((ancho, ALTO), Image.NEAREST)
    atlas.paste(cuadro, (i * ancho, 0))

# Reduce la paleta: aplana el suavizado y baja el peso. El alfa se preserva
# aparte porque quantize() no lo maneja bien.
alpha = atlas.getchannel('A')
q = atlas.convert('RGB').quantize(colors=24, method=Image.MEDIANCUT).convert('RGBA')
q.putalpha(alpha)
# bordes semitransparentes -> del todo o nada, para que el pixel art quede limpio
q.putalpha(alpha.point(lambda a: 255 if a > 128 else 0))
q.save(OUT, optimize=True)

meta = {'dirs': DIRS, 'frameW': ancho, 'frameH': ALTO, 'frames': len(DIRS)}
print('escrito', os.path.relpath(OUT, RAIZ), os.path.getsize(OUT), 'bytes')
print('meta para js/sprite.js:', json.dumps(meta))
