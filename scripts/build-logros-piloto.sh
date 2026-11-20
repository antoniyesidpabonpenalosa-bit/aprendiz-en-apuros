#!/bin/sh
# Reconstruye los 30 sprites de LOGROS desde las cinco hojas originales.
# Requiere ImageMagick 7. Los PNG finales son de 40×40 con fondo transparente.
set -eu
cd "$(dirname "$0")/.."
mkdir -p img/logros
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT HUP INT TERM
exportar() {
  fuente=$1; cuadricula=$2; shift 2
  magick "$fuente" -crop "$cuadricula@" +repage "$scratch/icono-%d.png"
  numero=0
  for nombre in "$@"; do
    magick "$scratch/icono-$numero.png" -trim +repage -filter box -resize 38x38 \
      -channel A -threshold '28%' +channel -seed 1 -colors 32 \
      -background none -gravity center -extent 40x40 -strip "img/logros/$nombre.png"
    numero=$((numero + 1))
  done
  rm "$scratch"/icono-*.png
}
exportar arte/logros-fuente.png 4x1 primer perfecto mitad secreto
exportar arte/logros/normales-a.png 4x2 comprador veloz cerebro gitmaster revisor resolutor jefe titulado
exportar arte/logros/normales-b.png 4x2 intacto combo coleccionista pesadilla maraton sql regex contrato
exportar arte/logros/secretos-a.png 5x1 s10 s6 s7 s4 s3
exportar arte/logros/secretos-b.png 5x1 s5 s9 s1 s8 s2
