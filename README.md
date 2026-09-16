# Practicante en Apuros 4 · SENA

Juego hecho con IA que representa lo que vive un aprendiz de programación
durante sus 10 días de etapa productiva. Hecho con **HTML, CSS y JavaScript
puro** — sin motores, sin librerías, sin dependencias.

**🎮 Juega en línea:** https://antoniyesidpabonpenalosa-bit.github.io/aprendiz-en-apuros/

---

## 📥 Cómo descargar e instalar

### Opción 1 · Jugar en línea (sin descargar nada)
Abre el enlace de arriba en cualquier navegador (celular o PC). En el celular,
el navegador te ofrecerá **"Agregar a pantalla de inicio"**: eso instala el
juego como una app que funciona incluso sin internet.

### Opción 2 · Descargar como ZIP
1. En esta página de GitHub pulsa el botón verde **`<> Code`**
2. Elige **Download ZIP**
3. Descomprime el archivo donde quieras
4. Haz doble clic en **`index.html`** — se abre en tu navegador y ya estás jugando

### Opción 3 · Clonar con Git
```bash
git clone https://github.com/antoniyesidpabonpenalosa-bit/aprendiz-en-apuros.git
cd aprendiz-en-apuros
```
Y abre `index.html` en el navegador.

> **Nota:** al abrir con doble clic todo funciona salvo la parte de "app
> instalable" (el service worker necesita un servidor). Si quieres probar
> también eso en local, sirve la carpeta con:
> ```bash
> python3 -m http.server 8080
> ```
> y entra a `http://localhost:8080`

---

## 🕹 Controles

| Acción | Táctil | Teclado | Mando 🎮 | Giroscopio 📱 |
|---|---|---|---|---|
| Menús y minijuegos | tocar | ratón | — | — |
| Runner: saltar | botón ▲ o tocar pantalla | `Espacio` / `↑` | botón **A** o cruceta ↑ | — |
| Runner: agacharse | botón ▼ | `↓` | cruceta ↓ | — |
| Code review | botones ✔ ✘ | `→` aprobar / `←` rechazar | — | — |
| Jefe final: moverse | botones ◀ ▶ | `←` `→` / `A` `D` | stick o cruceta | inclinar el teléfono* |

\* En iPhone hay que tocar el botón **📱 GIRO** para dar permiso al sensor.

El mando (Xbox, PlayStation o genérico) se detecta solo al conectarlo:
verás el aviso **🎮 ¡MANDO CONECTADO!**

---

## ✨ Características

- **2 modos visuales**: 🕹 RETRO 32-BIT (pixel art + CRT) y ✨ 4K HD PRO OLED
  (negros profundos, neón y alta resolución) — cambia desde la pantalla de título
- **3 niveles de dificultad**: 🌱 Práctica, ⚔️ Normal y 💀 Pesadilla — ajustan
  vidas, tiempo y la agresividad del jefe final
- **15 días en 2 temporadas**: la 🎓 **Etapa Productiva** (días 1-10) con
  mecanografía, caza-bugs, memoria, simon de Git, quiz, code review,
  conflictos de merge, runner y EL BUG FINAL oculto — y 📝 **El Contrato**
  (días 11-15) como dev junior: **consultas SQL**, **regex**, bugs con bombas,
  Git avanzado (rebase y stash) y un **deploy nocturno** con la revancha del jefe
- **Jefe final con 3 fases reales**: lluvia de errores, ráfagas en abanico y un
  **láser telegrafiado** que avisa antes de disparar · música chiptune tensa
  propia · casilla oculta **"???"** en el mapa para repetir la pelea
- **Racha/combo** en el runner: encadena cafés sin recibir golpes para multiplicar
- Diálogos con retratos pixel-art, cutscenes e interrupciones de oficina
- Puntos, XP, **6 rangos** (Aspirante → Dev Senior), vidas, estrellas,
  certificado y **contrato indefinido** al terminar la temporada 2
- **Tienda ampliada**: 9 accesorios (capa 🦸, gato 🐱, corona 👑…) y 5 mejoras
  con descripción (café premium 🧲, escudo dev 🛡️…)
- **⚡ Reto diario**: tres minijuegos, **los mismos para todo el mundo** ese día,
  con racha 🔥, multiplicador y premios que no se compran con puntos
- **🌍 Marcador global**: tu puntaje se publica al terminar y compites con
  todos los que juegan — y si no hay internet, el juego sigue igual
- **18 logros**, récords, **estadísticas de por vida**, avatar
  personalizable, borrado de progreso y **botón de compartir** el resultado
- Transiciones suaves entre pantallas (respetan *prefers-reduced-motion*)
- **Código de guardado**: exporta tu partida y continúala en otro dispositivo
  (pantalla 📈 Estadísticas → 💾 Código de guardado)
- **Sonido en 3 estados**: 🔊 todo · 🔉 solo efectos · 🔇 silencio
- Sacudida de pantalla al recibir daño y vista previa bonita al compartir el
  enlace (Open Graph)
- Música chiptune y efectos con WebAudio, idiomas ES/EN
- **PWA instalable** con soporte offline
- Progreso guardado en el navegador (localStorage)

---

## 📁 Estructura del proyecto

```
aprendiz-en-apuros/
├── index.html            → página principal (solo estructura HTML)
├── manifest.webmanifest  → configuración de la app instalable (PWA)
├── sw.js                 → service worker: caché y modo offline
├── icon.svg              → ícono de la app
├── portada.png           → vista previa al compartir el enlace (Open Graph)
├── css/
│   └── estilos.css       → todos los estilos (temas retro y 4K OLED)
└── js/
    ├── datos.js          → constantes: niveles, textos ES/EN, quiz, diálogos
    ├── estado.js         → partida guardada, temporizadores y utilidades
    ├── audio.js          → efectos de sonido y música chiptune (WebAudio)
    ├── graficos.js       → retratos pixel-art, HUD y confeti
    ├── reto.js           → reto diario: semilla, racha y sesgo por fallos
    ├── ranking.js        → marcador global (Supabase vía fetch, sin SDK)
    ├── entrada.js        → soporte de mando (Gamepad API) y giroscopio
    ├── nucleo.js         → router de pantallas, logros, resultado/fallo
    ├── menus.js          → título, mapa, tienda, récords, avatar, certificado
    ├── retoui.js         → pantallas del reto diario
    ├── minijuegos.js     → los minijuegos de las 2 temporadas (15 días)
    ├── jefe.js           → la batalla final contra EL BUG FINAL
    └── principal.js      → arranque del juego y botones globales
db/
└── records.sql           → esquema y reglas del marcador global (Supabase)
test/
├── ayuda.mjs             → carga el juego fuera del navegador (node:vm)
├── logica.test.mjs       → pruebas de guardado, rangos, vidas y marcador
└── reto.test.mjs         → pruebas de semilla, racha y sesgo del reto diario
scripts/
├── validar.mjs           → sintaxis, referencias, HTML y caché del SW (CI + local)
└── build-ui-kit.mjs      → genera el UI kit de design-system/ (ver abajo)
design-system/            → catálogo de componentes extraído de css/estilos.css
├── README.md             → cómo regenerarlo y sincronizarlo con claude.ai/design
├── src/                  → fuente de cada fragmento de componente
└── dist/                 → generado — galería navegable en dist/index.html
```

Los módulos se cargan en orden como scripts clásicos (sin `type="module"`)
para que el juego siga funcionando al abrir `index.html` con doble clic.

**Validación:** `node scripts/validar.mjs` comprueba cuatro cosas: la sintaxis
de todos los `.js`, que `index.html` no referencie archivos inexistentes, que
todo el HTML del repo esté bien anidado y sin `id` repetidos (el juego y las
tarjetas del UI kit se escriben a mano), y que `sw.js` precargue todo lo que
`index.html` necesita para funcionar sin conexión. Se ejecuta
automáticamente en cada push mediante GitHub Actions (`.github/workflows/validar.yml`),
que también corre `node scripts/build-ui-kit.mjs --check` para asegurar que
el UI kit no quede desincronizado del CSS real.

**Pruebas:** `node --test test/*.test.mjs` comprueba la lógica que no se ve al
jugar un rato — sobre todo el **código de guardado**, que es lo que puede hacer
que alguien pierda su partida al cambiar de dispositivo sin que nadie se entere.
Cubre la ida y vuelta del código (con tildes y emoji), el rechazo de códigos
manipulados, la migración de partidas viejas de 10 días a 15, los umbrales de
cada rango, las vidas por dificultad, el escape de los nombres del marcador,
los límites de lo que se publica, y toda la lógica del reto diario (semilla,
racha con perdón y sesgo por fallos). Usa `node:test`, que viene incluido en Node:
**sigue sin haber dependencias**. El juego no se tocó para poder probarlo — se
carga en un contexto aislado con `node:vm`, así que sigue siendo `<script>`
clásicos que funcionan con doble clic.

---

## 🌍 Marcador global

La pantalla de récords tiene dos tablas: **el marcador global**, compartido por
todos los que juegan, y **tus marcas**, que siguen viviendo solo en tu navegador.
Al terminar el día 10 y el día 15 tu puntaje se publica automáticamente.

El marcador se puede **filtrar por dificultad** (🌱 Práctica · ⚔️ Normal ·
💀 Pesadilla), porque no compite igual quien juega con vidas de más que quien
juega con vidas de menos. En la vista "TODAS" cada marca lleva el icono de la
dificultad con la que se logró; el otro icono dice si terminó el día 10 (🎓) o
llegó hasta el día 15 (📝).

Está montado sobre [Supabase](https://supabase.com) y se habla con su API REST
usando `fetch` a secas (`js/ranking.js`): sin SDK ni build, así que el juego se
sigue abriendo con doble clic. **Si no hay internet el juego funciona igual** —
el marcador muestra un aviso y tus marcas locales siguen ahí.

La clave que viaja en el JS es pública a propósito (Supabase la llama
*publishable*). Lo que protege los datos son las reglas del servidor:

- Cualquiera puede **leer** el marcador y **publicar** su marca.
- **Nadie puede editar ni borrar** una marca, ni siquiera quien la publicó.
- La base rechaza nombres de más de 10 caracteres y puntajes fuera de rango.
- Los nombres se escapan antes de dibujarlos: un nombre con HTML se ve como
  texto, no se ejecuta.

Aun así, como la clave es pública, **alguien decidido puede publicar un puntaje
que no jugó**. Es el precio de no pedir cuenta de usuario; las reglas de arriba
bloquean lo absurdo, no la mala fe.

---

## ⚡ Reto diario

Tres minijuegos seguidos, **los mismos para todo el mundo ese día**, en unos
3 minutos. La semilla sale de la **fecha local**, no del servidor: por eso el
reto es idéntico para todos y además funciona sin internet.

Puedes repetirlo para practicar, pero **solo cuenta el primer intento**. Así
nadie reintenta hasta que le salga bien, y a nadie se le arruina el día porque
se le cayó la conexión a la mitad.

**Racha 🔥** — jugar días seguidos sube un multiplicador de ×1 a ×2 (al séptimo
día). Saltarse un día **se perdona una vez al mes**: una ausencia no borra tres
semanas de esfuerzo, pero dos en el mismo mes sí.

**Premios por constancia** — 🔥 a los 3 días · ⭐ a los 7 · 💎 a los 14 · 🏆 a
los 30. No se compran con puntos: solo se ganan. Y se miden contra tu mejor
racha histórica, así que lo ganado no se pierde al romperla.

**Marcador del día**, aparte del histórico: se reinicia cada jornada, así que
hoy cualquiera puede ser primero. En la tabla de todos los tiempos eso es
imposible para quien empieza.

El reto **no toca la campaña**: no avanza días ni desbloquea etapas del mapa.

### Lo que no se ve

El reto elige sus preguntas **sesgadas hacia lo que has fallado**. Cada ítem
lleva un peso que sube al fallarlo (hasta 4×) y baja al acertarlo, hasta
desaparecer. Lo que no te sabes vuelve pronto; lo que dominas se espacia — que
es, según la evidencia sobre repetición espaciada, lo que de verdad hace que
algo se quede. Sin historial el sorteo es normal, así que no cambia nada hasta
que hay datos tuyos.

---

## 🛠 Tecnología

JavaScript vanilla (ES2020), Canvas 2D, WebAudio API, Gamepad API,
DeviceOrientation, Service Worker + Web App Manifest, localStorage,
y Supabase (API REST vía `fetch`) para el marcador global.
Cero dependencias en tiempo de ejecución; las fuentes retro vienen de Google Fonts.
