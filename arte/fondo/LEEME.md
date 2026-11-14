# Fondo animado — Aprendiz en apuros
Recurso original corregido: el archivo anterior tenía extensión PNG, pero su contenido era GIF.
- fondo_menu_animado.gif: 6 cuadros de 549×466, duración original 180 ms por cuadro, bucle.
- fondo_menu_atlas.png: 3 columnas × 2 filas; orden de lectura por filas.
- fondo_menu_estatico.png: primer cuadro, para movimiento reducido.

Para Claude: integrar únicamente detrás del menú principal, sin alterar lógica, HUD, controles, progreso ni navegación. Mantener contraste, usar background-size: cover y ajustar encuadre al dispositivo. El original no es 16:9; no estirarlo. Si el GIF resulta demasiado rápido, usar el atlas con un ritmo más lento. Respetar prefers-reduced-motion, caché offline y rutas relativas. Validar en móvil y escritorio antes de publicar.
