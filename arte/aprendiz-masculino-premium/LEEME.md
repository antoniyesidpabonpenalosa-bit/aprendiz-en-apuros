# Arte masculino premium · identidad, parte 2

Refinamiento pixel a pixel sobre los atlas HD originales de v39, no sustitución de identidad. Conserva cabello castaño, barba, camisa, pantalón y botas; se agregan mechones, ojos expresivos, cuello y costuras de camisa, cinturón, reflejos y dos poses de saludo articulado.

Fuentes reproducibles: `img/aprendiz-caminar-hd.png` y `img/aprendiz-portada-hd.png` (se conservan intactos). Ejecutar `python scripts/build-aprendiz-masculino.py` con Pillow instalado para regenerar los nuevos PNG.

Contrato: 44×74 px por celda, pies al fondo, 4 columnas. Caminata: 8 filas en orden S, SE, E, NE, N, NW, W, SW (reposo, paso A, transición, paso B). Portada: una fila, reposo, parpadeo, saludo A, saludo B. Las celdas se pintan con el tamaño lógico original; no cambiar hitboxes. Se mantienen las fases de piernas del atlas anterior. El nuevo arte usa las rampas exactas de piel y camisa compartidas con el femenino; pelo, ojos, cinturón y botas quedan fuera del recoloreo.

No son cuadros de animación dibujados enteramente desde cero: se refinó el atlas anterior mediante un generador de píxeles con trazos específicos para cada orientación. No incluye los retratos nuevos ni los accesorios de cuerpo entero, que serán otra entrega.

Después de regenerar este atlas hay que correr `node scripts/build-caras-cuerpo.mjs`, que repinta la cara (v40.6).
