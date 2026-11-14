# Punto 2 — Título principal de Aprendiz en apuros

Base consultada: ZIP v26.1. Recursos independientes, no se ha editado el proyecto ni se ha comprobado el menú en navegador.

## Recursos
- `titulo-aprendiz-en-apuros.png`: 920 × 360 px RGBA, fondo transparente, construido con la tipografía pixel original del proyecto. Sin número de capítulo, sin personaje, sin fondo.
- `titulo-menu.css`: alternativa de texto real para conservar el h1 y evitar cargar un recurso adicional. El PNG y CSS son dos alternativas, no deben superponerse.
- `vista-previa.jpg`: composición ilustrativa sobre el fondo nocturno previo.

## Instrucciones para Claude
1. Revisar la rama actual. En v26.1, `js/menus.js`, función `rTitulo()`, contiene `.tit-logo`, `h1.tit-h1`, `.l1` y `.l2`, y dos guiones decorativos. `css/estilos.css` contiene los estilos. Mantener el subtítulo `t('sub')`, botones, datos y lógica.
2. Si se usa PNG, copiarlo a la carpeta de recursos gráficos vigente y mantener un h1 accesible con texto alternativo “Aprendiz en apuros”. Usar ancho máximo 100%, altura auto, `image-rendering: pixelated`, y conservar el texto original como fallback al fallar la imagen. No dejar ambos logos visibles. Ocultar guiones externos porque ya están integrados en el PNG. No usar el JPG de vista previa como fondo del juego.
3. Alternativa recomendada si se prefiere texto real: adaptar `titulo-menu.css` a los estilos actuales, mantener ambos spans y la fuente existente. No aplicar al resto de pantallas ni cambiar modos HD y legible. El CSS aproxima el diseño, no lo reproduce píxel a píxel.
4. Integrar exclusivamente el título; conservar el fondo animado ya aprobado. Si se utiliza el PNG, añadirlo a la caché de `sw.js` siguiendo la convención actual y usar ruta relativa. No se incluye ni se necesita una nueva fuente.
5. Validar en móvil y escritorio que no se desborde, que no tape los botones y que conserve el contraste, especialmente con modo legible/HD. Probar offline y correr las pruebas existentes. Preparar PR sin publicar sin aprobación.
