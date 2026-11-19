"""Actualiza la marcha frontal a partir del arte integrado de la v40.18."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FW = 44
# Orden de los apoyos en la vista frontal, por columna del atlas.
APOYOS = [
    ((-1,-1,72),(0,1,67)),
    ((0,0,72),(-2,-2,64)),
    ((0,-1,67),(1,1,72)),
    ((2,2,64),(0,0,72)),
]

def leg(draw, hip, side, pose):
    knee_dx, shoe_dx, floor = pose
    ankle = hip + shoe_dx
    knee = hip + knee_dx
    width = 5
    knee_y = 59 if floor >= 67 else 58
    ink, denim, light, shade = ('#0c0f27', '#27304c', '#34405b', '#14192e')
    draw.polygon([(hip-width,51),(hip+width,51),(knee+width,knee_y),
                  (ankle+width-1,floor-4),(ankle-width,floor-4),(knee-width,knee_y+2)],fill=ink)
    draw.polygon([(hip-width+1,52),(hip+width-1,52),(knee+width-1,knee_y),
                  (ankle+width-2,floor-5),(ankle-width+1,floor-5),(knee-width+1,knee_y+1)],fill=denim)
    draw.line([(hip+width-2,53),(knee+width-2,knee_y+1),(ankle+width-3,floor-5)],fill=shade,width=2)
    draw.line([(hip-width+2,53),(knee-width+2,knee_y-1),(knee-1,knee_y)],fill=light)
    draw.line([(ankle-width+1,floor-6),(ankle+width-2,floor-6)],fill=shade)
    # Punta ligeramente hacia fuera, talón que se recoge en el paso de cruce.
    toe = ankle + (side if floor >= 70 else 0)
    draw.polygon([(ankle-width+1,floor-5),(ankle+width-2,floor-5),
                  (toe+width,floor-3),(toe+width,floor-1),(toe+width-1,floor),
                  (toe-width,floor),(toe-width-1,floor-1),(toe-width-1,floor-2)],fill=ink)
    leather,shine,shadow = ('#6f3e24','#a96535','#42251b')
    draw.polygon([(ankle-width+2,floor-4),(ankle+width-3,floor-4),(toe+width-1,floor-2),
                  (toe+width-1,floor-1),(toe-width,floor-1),(toe-width,floor-2)],fill=leather)
    draw.line([(toe-width+1,floor-2),(toe-1,floor-3),(toe+1,floor-3)],fill=shine)
    draw.line([(toe-width+1,floor-1),(toe+width-2,floor-1)],fill=shadow)



def paso_frontal(celda, columna):
    piernas = Image.new('RGBA', celda.size)
    dibujo = ImageDraw.Draw(piernas)
    poses = APOYOS[columna]
    for lado in sorted(range(2), key=lambda i: poses[i][2]):
        leg(dibujo, (16,27)[lado], (-1,1)[lado], poses[lado])
    # Conservar cintura y manos del atlas premium, incluidos sus anclajes.
    piernas.alpha_composite(celda.crop((0,0,FW,55)))
    return piernas


if __name__ == '__main__':
    fuente = ROOT / 'arte/aprendiz/caminar/masculino-v40.18.png'
    atlas = Image.open(fuente).convert('RGBA')
    # La columna cero también se usa al detenerse en mapa, pasillo y combate.
    for columna in (1, 2, 3):
        x = columna * FW
        original = atlas.crop((x, 0, x + FW, 74))
        atlas.paste(paso_frontal(original, columna), (x, 0))
    atlas.save(ROOT / 'img/aprendiz-masculino-premium-caminar.png', optimize=True)
