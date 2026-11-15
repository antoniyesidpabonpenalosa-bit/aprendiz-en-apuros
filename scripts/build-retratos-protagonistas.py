"""Arte reproducible desde los atlas de portada aprobados; no requiere red.
Genera fuentes PNG y los datos del pintor de retratos dinámicos.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'arte'/'retratos-protagonistas'; OUT.mkdir(parents=True,exist_ok=True)
SKIN=[(145,82,49),(187,116,72),(217,150,99),(239,182,125),(250,204,153),(255,225,183)]
SHIRT=[(16,47,91),(20,67,116),(23,87,143),(32,110,171),(54,137,195),(86,165,217)]
GESTOS=['normal','feliz','enojado','sorprendido','preocupado']
# Los materiales conservan la paleta del cuerpo; el resto se deja fijo.
basefiles={'masculina':'aprendiz-masculino-premium-portada.png','femenina':'aprendiz-femenina-portada.png'}
INK=(23,20,32,255); WHITE=(247,244,233,255); MOUTH=(116,51,42,255); LIP=(177,78,51,255)
FACE=(*SKIN[4],255); SHADE=(*SKIN[3],255); BRIGHT=(*SKIN[5],255); BROW=(99,54,32,255)

def art(base,sex,gesture,blink):
 im=base.copy(); d=ImageDraw.Draw(im)
 # Coordenadas nativas del atlas: no cambiar cabello ni silueta.
 male=sex=='masculina'; eyes=[(15,18,19,22),(24,18,28,22)] if male else [(16,19,19,22),(26,19,29,22)]
 if gesture!='normal' or blink:
  for l,t,r,b in eyes:
   if gesture=='feliz' and not blink:continue
   d.rectangle((l,t,r,b),fill=FACE)
   if blink:
    d.line((l,t+3,r,t+3),fill=INK); continue
   if gesture=='sorprendido':
    d.rectangle((l,t,r,b),fill=INK); d.point((l+1,t+1),fill=WHITE); d.point((r,b),fill=WHITE)
   else:
    d.rectangle((l+1,t+1,r-1,b-1),fill=INK); d.point((l+1,t+1),fill=WHITE); d.point((r,b-1),fill=SHADE)
  # Cejas: la izquierda de la femenina queda en parte bajo el flequillo.
  if gesture in ('enojado','sorprendido','preocupado'):
   if male:
    d.rectangle((14,14,19,17),fill=FACE);d.rectangle((24,14,29,17),fill=FACE)
    if gesture=='enojado':
     d.line([(14,14),(19,17)],fill=BROW,width=2);d.line([(24,17),(29,14)],fill=BROW,width=2)
    elif gesture=='preocupado':
     d.line([(14,17),(19,14)],fill=BROW,width=2);d.line([(24,14),(29,17)],fill=BROW,width=2)
    else:
     d.line((14,14,19,14),fill=BROW,width=1);d.line((24,14,29,14),fill=BROW,width=1)
   else:
    d.rectangle((25,15,28,17),fill=FACE)
    if gesture=='enojado':d.line([(25,17),(28,15)],fill=BROW,width=1)
    elif gesture=='preocupado':d.line([(25,15),(28,17)],fill=BROW,width=1)
    else:d.line((25,14,28,14),fill=BROW,width=1)
  if gesture!='normal':
   if male:
    d.rectangle((20,24,24,27),fill=(82,44,30,255));d.rectangle((20,24,24,24),fill=FACE)
    if gesture=='feliz':
     d.rectangle((20,25,24,26),fill=INK);d.line((21,25,23,25),fill=WHITE);d.line((21,27,23,27),fill=LIP)
    elif gesture=='sorprendido':d.rectangle((21,25,23,27),fill=INK);d.point((22,27),fill=LIP)
    elif gesture=='enojado':d.line((20,26,24,26),fill=INK);d.point((20,25),fill=INK);d.point((24,25),fill=INK)
    else:d.line([(20,26),(21,25),(23,25),(24,26)],fill=INK)
   else:
    d.rectangle((21,24,25,27),fill=FACE)
    if gesture=='feliz':d.rectangle((21,25,25,26),fill=MOUTH);d.line((22,25,24,25),fill=WHITE);d.point((23,27),fill=LIP)
    elif gesture=='sorprendido':d.rectangle((22,24,24,26),fill=MOUTH);d.point((23,26),fill=LIP)
    elif gesture=='enojado':d.line((21,26,25,26),fill=MOUTH)
    else:d.line([(21,26),(22,25),(24,25),(25,26)],fill=MOUTH)
 # Margen uniforme para corona, gorra y auriculares; base de busto al borde.
 result=Image.new('RGBA',(48,48));result.paste(im,(2,4));return result

palette=[(0,0,0,0)]; lookup={palette[0]:0}; frames={}
for sex,name in basefiles.items():
 base=Image.open(ROOT/'img'/name).convert('RGBA').crop((0,0,44,44))
 # No hay semitransparencias en el motor; limpia únicamente alpha residual.
 base.putdata([(*p[:3],255) if p[3]>=128 else (0,0,0,0) for p in base.get_flattened_data()])
 frames[sex]={}
 for gesture in GESTOS:
  for blink in (False,True):
   im=art(base,sex,gesture,blink); key=gesture+('-blink' if blink else '')
   if not blink:
    im.save(OUT/f'{sex}-{gesture}-cine.png')
    if gesture=='normal':
     for size in (16,32):
      mini=im.resize((size,size),Image.Resampling.NEAREST)
      if size==16:
       for x in (6,9):ImageDraw.Draw(mini).line((x,7,x,8),fill=INK)
      mini.save(OUT/f'{sex}-{size}.png')
   seq=[]; prev=-1
   for p in im.get_flattened_data():
    if p not in lookup:lookup[p]=len(palette);palette.append(p)
    i=lookup[p]
    if i==prev:seq[-2]+=1
    else:seq.extend([1,i]);prev=i
   frames[sex][key]=seq
roles=[]
for r,g,b,a in palette:
 rgb=(r,g,b); role=1 if rgb in SKIN else 2 if rgb in SHIRT else 0
 roles.append([f'#{r:02x}{g:02x}{b:02x}',role])
text='// Generado por scripts/build-retratos-protagonistas.py. No editar a mano.\nconst ARTE_RETRATOS_APRENDIZ='+json.dumps({'size':48,'palette':roles,'frames':frames},separators=(',',':'))+';\n'
(ROOT/'js'/'retratos-aprendiz-arte.js').write_text(text)
print(len(palette),'colores;',len(text),'bytes;',sum(len(x) for x in frames.values()),'poses')
