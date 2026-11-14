# Plan: diálogos cinematográficos (v39)

> Estado: **hecho (v39), solo la parte técnica y visual**. Paquete del autor sobre la v26.1:
> `js/cinematica.js`, `js/menus.js` (`rDialogo`, `rCutscene`), la prueba y las imágenes aplicaron
> limpios; el CSS, `index.html` y `sw.js` se completaron a mano. **La historia no cambió:** ni una
> frase de DIALOGOS, INTRO, FINAL, T2_INTRO, JEFE_INTRO, JEFE2_INTRO ni FINAL2.

## Qué hay

- `CINE` (js/cinematica.js): `pagina()` normaliza una página (`t`, `quien`, `gesto`, `fondo`,
  `ico`, `animar`); `dia()` acepta el par de siempre `[quien, texto]` o una lista de páginas;
  `escena()` pinta el marco; `montar()` pone el retrato y la máquina de escribir.
- Retrato grande con los 20 retratos ilustrados (`retratoDibujo`, 5 gestos); sin `quien`, el
  NARRADOR con el icono de la página; en las escenas del jefe, su dibujo de la fase 1.
- Fondos: `formacion` y `empresa` con imagen (`img/cine/`), `servidor` y `neutro` en CSS.
  Días 1-10 en formación, 11-15 en la empresa.
- Escenas: CONTINUAR y SALTAR, Enter/Espacio avanzan (sin repetir con la tecla mantenida), el fin
  se llama una sola vez. Días: máquina de escribir con «Mostrar texto»; con «reducir movimiento»,
  el texto entero al instante. Cambiar de idioma no cambia de página.

## Formato para la historia futura (aún NO usado)

Un día de DIALOGOS puede ser una lista de páginas:
`[{quien:'GUSTAVO · INSTRUCTOR', gesto:'normal', fondo:'formacion', t:'…'}, …]`, con el mismo
número y orden de páginas en ES y EN. `quien` lleva el rol (INSTRUCTOR, COMPAÑERA/COWORKER,
LÍDER/LEAD, VIGILANTE/GUARD) para que salga su retrato; sin `quien`, habla el narrador.

## Siguiente

La biblia narrativa y el arco de los 15 días, antes de escribir diálogos nuevos.
