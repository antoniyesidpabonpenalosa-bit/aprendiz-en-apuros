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
- **10 días** de etapa productiva con **7 minijuegos** + un **jefe final oculto** 👾:
  mecanografía, caza-bugs, memoria, simon de Git, quiz, code review,
  conflictos de merge, runner y la batalla contra EL BUG FINAL
- **Jefe final con 3 fases reales**: lluvia de errores, ráfagas en abanico y un
  **láser telegrafiado** que avisa antes de disparar · música chiptune tensa
  propia · casilla oculta **"???"** en el mapa para repetir la pelea
- **Racha/combo** en el runner: encadena cafés sin recibir golpes para multiplicar
- Diálogos con retratos pixel-art, cutscenes e interrupciones de oficina
- Puntos, XP, rangos (Aspirante → Titulado SENA), vidas, estrellas y certificado
- Tienda, **15 logros**, récords, **estadísticas de por vida**, avatar
  personalizable, borrado de progreso y **botón de compartir** el resultado
- Transiciones suaves entre pantallas (respetan *prefers-reduced-motion*)
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
├── css/
│   └── estilos.css       → todos los estilos (temas retro y 4K OLED)
└── js/
    ├── datos.js          → constantes: niveles, textos ES/EN, quiz, diálogos
    ├── estado.js         → partida guardada, temporizadores y utilidades
    ├── audio.js          → efectos de sonido y música chiptune (WebAudio)
    ├── graficos.js       → retratos pixel-art, HUD y confeti
    ├── entrada.js        → soporte de mando (Gamepad API) y giroscopio
    ├── nucleo.js         → router de pantallas, logros, resultado/fallo
    ├── menus.js          → título, mapa, tienda, récords, avatar, certificado
    ├── minijuegos.js     → los 8 minijuegos de los 10 días
    ├── jefe.js           → la batalla final contra EL BUG FINAL
    └── principal.js      → arranque del juego y botones globales
scripts/
└── validar.mjs           → chequeo de sintaxis y referencias (CI + local)
```

Los módulos se cargan en orden como scripts clásicos (sin `type="module"`)
para que el juego siga funcionando al abrir `index.html` con doble clic.

**Validación:** `node scripts/validar.mjs` comprueba la sintaxis de todos los
`.js` y que `index.html` no referencie archivos inexistentes. Se ejecuta
automáticamente en cada push mediante GitHub Actions (`.github/workflows/validar.yml`).

---

## 🛠 Tecnología

JavaScript vanilla (ES2020), Canvas 2D, WebAudio API, Gamepad API,
DeviceOrientation, Service Worker + Web App Manifest, localStorage.
Cero dependencias en tiempo de ejecución; las fuentes retro vienen de Google Fonts.
