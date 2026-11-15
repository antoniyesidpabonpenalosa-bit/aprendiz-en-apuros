#!/usr/bin/env python3
"""Reproduce el atlas masculino premium desde los atlas HD originales.
Requiere Pillow. No modifica los archivos originales. Píxel nativo 44×74.
"""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
FW,FH=44,74
# Las mismas rampas de material que la apariencia femenina (identidad v40).
CAM=[(16,47,91),(20,67,116),(23,87,143),(32,110,171),(54,137,195),(86,165,217)]
PIEL=[(145,82,49),(187,116,72),(217,150,99),(239,182,125),(250,204,153),(255,225,183)]
C_SRC={(16,63,105):0,(19,76,122):1,(23,104,157):2,(36,123,178):3,(56,145,195):4}
P_SRC={(210,169,108):2,(216,165,116):2,(228,181,132):3,(245,203,154):4,(255,223,183):5}
H_SRC={(35,22,15):(39,24,19),(58,37,19):(70,39,26),(88,52,29):(99,54,32),(120,76,43):(145,81,43),(65,35,24):(69,36,25),(35,22,18):(39,24,19)}
J_SRC={(22,28,48):(20,25,46),(43,58,92):(39,48,76),(54,68,100):(52,64,91)}
OUT=(10,12,28); INK=(23,20,32); WHITE=(247,244,233)
def rgba(c):return (*c,255)
def frame(src,d,pose=None):
    out=src.copy(); raw=src.load(); p=out.load()
    # Materiales exactos: no se recolorean pelo, ojos, cinturón ni zapatos.
    for y in range(FH):
        for x in range(FW):
            r,g,b,a=raw[x,y]; k=(r,g,b)
            if not a:continue
            if k in C_SRC:
                n=C_SRC[k]
                # grupos de 2–4 píxeles de luz y sombra, sin ruido aleatorio
                if n==3 and 35<=y<=40 and ((x+2*y)%23 in (0,1,2,3)): n=4
                if n==4 and y<37 and ((x+2*y)%19<4):n=5
                p[x,y]=rgba(CAM[n])
            elif k in P_SRC:p[x,y]=rgba(PIEL[P_SRC[k]])
            elif k in H_SRC and y<32:
                col=H_SRC[k]
                if y<12 and k in ((88,52,29),(120,76,43)):
                    if (x+2*y)%21<5:col=(155,89,45)
                    elif (x+2*y)%21<10:col=(124,68,38)
                if y>23 and d in (0,1,2,6,7): col=(82,44,30) if k!=(35,22,15) else (45,27,23)
                p[x,y]=rgba(col)
            elif k in J_SRC:p[x,y]=rgba(J_SRC[k])
            elif y>=64 and k in ((106,62,42),(142,86,55),(65,35,24)):
                p[x,y]=rgba({(106,62,42):(111,62,36),(142,86,55):(169,101,53),(65,35,24):(66,37,27)}[k])
    def put(x,y,c):
        if 0<=x<FW and 0<=y<FH and raw[x,y][3]:p[x,y]=rgba(c)
    def shirt(x,y,c):
        if 0<=x<FW and 0<=y<FH and raw[x,y][:3] in C_SRC:put(x,y,c)
    def skin(x,y,c):
        if 0<=x<FW and 0<=y<FH and raw[x,y][:3] in P_SRC:put(x,y,c)
    # Flequillo escalonado y mechones: formas estables entre fotogramas.
    # En frente/diagonales la línea del cabello gana relieve, sin cambiar la identidad.
    if d in (0,1,7):
        dd=ImageDraw.Draw(out)
        if d==0:
            # Copete asimétrico sobre la silueta plana de la versión anterior.
            dd.polygon([(12,5),(12,3),(15,3),(15,1),(20,1),(20,3),(24,3),(24,2),(27,2),(27,4),(31,4),(34,7),(33,10),(29,10),(25,8),(21,10),(17,12),(12,13),(10,11),(10,7)],fill=rgba((39,24,19)))
            dd.polygon([(12,6),(16,3),(20,3),(23,5),(27,4),(31,6),(32,8),(27,8),(24,6),(20,8),(16,10),(12,11)],fill=rgba((99,54,32)))
            dd.line([(14,7),(17,5),(20,5),(22,6)],fill=rgba((174,104,58)),width=1)
            dd.line([(15,8),(19,6),(23,7),(27,6),(30,7)],fill=rgba((145,81,43)),width=1)
            dd.line([(12,10),(16,9),(20,8)],fill=rgba((124,68,38)),width=1)
        else:
            # Reflejos de perfil siguiendo la orientación del peinado.
            coords=[(12,7),(16,5),(20,4),(25,4),(29,5)] if d==1 else [(14,5),(18,4),(23,5),(27,7)]
            for x,y in coords:
                for dx in (0,1):
                    if raw[x+dx,y][:3] in H_SRC:put(x+dx,y,(174,104,58))
    # Ojos, con esclerótica y pupila. Coordenadas verificadas en las 32 celdas.
    eyes={0:[(16,17,18,21),(25,27,18,21)],1:[(22,23,18,22),(29,30,18,22)],2:[(29,30,18,21)],6:[(13,14,18,21)],7:[(12,13,19,22),(20,21,19,22)]}
    if d in eyes and pose!=1:
        for x0,x1,y0,y1 in eyes[d]:
            # No se tocan orejas, contorno ni pelo.
            for y in range(y0+1,y1+1):
                skin(x0-1,y,WHITE);skin(x1+1,y,WHITE)
            for y in range(y0,y1+1):
                for x in range(x0,x1+1):put(x,y,INK)
            put(x0,y0+1,WHITE)
    if d==0 and pose==1:
        for x in range(15,19):skin(x,20,INK)
        for x in range(24,29):skin(x,20,INK)
    # Nariz y sonrisa pequeña: la barba sigue siendo un rasgo del Aprendiz.
    if d in (0,1,7):
        cx={0:22,1:28,7:16}[d]
        skin(cx,23,PIEL[3]);skin(cx+1,23,PIEL[2]);skin(cx,24,PIEL[4])
        for x in range(cx-2,cx+3):
            y=27 if abs(x-cx)<2 else 26
            if raw[x,y][3] and raw[x,y][:3] in H_SRC:put(x,y,(39,24,19))
        if pose in (2,3):
            for x in range(cx-1,cx+2):put(x,27,(194,122,85))
    # Cuello de camisa, costura central y solapa en el mismo material azul.
    cx={0:22,1:25,2:26,3:22,4:22,5:22,6:17,7:18}[d]
    if d in (0,1,7):
        for i in range(5):
            for j in (0,1):
                shirt(cx-5+i,32+i+j,CAM[0]);shirt(cx+5-i,32+i+j,CAM[0])
            if i<4:
                shirt(cx-5+i,31+i,CAM[5]);shirt(cx+5-i,31+i,CAM[4])
        for y in range(37,48):shirt(cx,y,CAM[2])
        for y in (39,44):shirt(cx,y,CAM[5])
    elif d in (2,6):
        for i in range(5):shirt(cx+(i//2 if d==2 else -i//2),31+i,CAM[0])
    else:
        for x in range(cx-5,cx+6):shirt(x,33+abs(x-cx)//4,CAM[2])
    # Cinturón independiente, hebilla frontal. Usar solo píxeles del borde interno.
    for y in (49,50):
        for x in range(12,33):
            if raw[x,y][:3]==(12,15,39):put(x,y,(91,52,35) if y==49 else (58,34,29))
    if d in (0,1,7):
        bx={0:22,1:25,7:18}[d]
        for y in (49,50):
            for x in range(bx-1,bx+2):
                if raw[x,y][:3]==(12,15,39):put(x,y,(190,191,200) if y==49 else (106,116,137))
    # Costuras de los jeans, reflejos cortos en las botas.
    for y in range(54,66):
        for x in range(8,36):
            if raw[x,y][:3]==(54,68,100) and y in (55,56,64) and (x%9 in (2,3)):put(x,y,(69,82,111))
    for y in range(65,72):
        for x in range(6,38):
            if raw[x,y][:3]==(142,86,55) and y in (68,69) and x%6<3:put(x,y,(201,132,75))
    if pose in (2,3):
        # Saludo articulado. Sustituye la mano estrecha del recurso anterior.
        # El codo, la muñeca y la mano quedan dentro de la celda, con contorno continuo.
        dd=ImageDraw.Draw(out)
        dd.rectangle((36,27,43,49),fill=(0,0,0,0))
        # Hombro/codo de la camisa, mano hacia arriba. Dos inclinaciones del saludo.
        dd.polygon([(31,34),(35,34),(38,39),(39,35),(42,35),(42,42),(39,45),(35,45),(31,40)],fill=rgba(OUT))
        dd.polygon([(32,35),(34,35),(37,40),(40,40),(40,36),(41,36),(41,41),(38,43),(36,43),(32,39)],fill=rgba(CAM[2]))
        dd.line([(33,35),(36,39),(37,40)],fill=rgba(CAM[4]),width=1)
        # Palma y dedos; ligera rotación al alternar las poses.
        if pose==2:
            dd.polygon([(37,36),(36,32),(35,30),(35,28),(36,27),(37,29),(37,25),(38,24),(39,25),(39,24),(40,23),(41,24),(42,24),(43,26),(43,32),(41,37)],fill=rgba(OUT))
            dd.polygon([(38,35),(37,31),(36,29),(37,29),(38,31),(38,25),(39,25),(39,28),(40,25),(41,25),(42,26),(42,31),(40,35)],fill=rgba(PIEL[4]))
            dd.line([(38,32),(39,33),(40,32)],fill=rgba(PIEL[2]),width=1)
        else:
            dd.polygon([(38,36),(37,32),(36,30),(36,28),(37,27),(38,29),(38,25),(39,24),(40,25),(41,24),(42,25),(43,26),(43,32),(42,36)],fill=rgba(OUT))
            dd.polygon([(39,35),(38,31),(37,29),(38,29),(39,31),(39,25),(40,25),(40,28),(41,25),(42,26),(42,31),(41,35)],fill=rgba(PIEL[4]))
            dd.line([(39,32),(40,33),(41,32)],fill=rgba(PIEL[2]),width=1)
    return out

def build(old,new,menu=False):
    src=Image.open(ROOT/'img'/old).convert('RGBA'); result=Image.new('RGBA',src.size)
    for row in range(src.height//FH):
        for col in range(4):
            f=src.crop((col*FW,row*FH,(col+1)*FW,(row+1)*FH));out=frame(f,row, col if menu else None)
            result.paste(out,(col*FW,row*FH))
    result.save(ROOT/'img'/new,optimize=True)
if __name__=='__main__':
    build('aprendiz-caminar-hd.png','aprendiz-masculino-premium-caminar.png')
    build('aprendiz-portada-hd.png','aprendiz-masculino-premium-portada.png',True)
