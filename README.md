# AUTÓMATA 2D VJ PRO · Morfismo Generativo, Web MIDI & Live Visuals

Consola visual interactiva para VJing y arte generativo en tiempo real basada en **autómatas celulares continuos (ecuaciones de difusión)**, desplazamiento vectorial orgánico, control físico por hardware vía **Web MIDI** y procesamiento multimodal en vivo (Galería de Fotos, Cámara Web en Vivo y Video Loops).

Desarrollado en **JavaScript nativo con p5.js, p5.sound y Web MIDI API**. Sin dependencias complejas ni frameworks pesados: 100% autocontenido y listo para correr en cualquier navegador moderno.

---

## Características Principales

- **Morfismo Celular Líquido:** Transición orgánica continua guiada por campos de energía celular y deformación vectorial (*Liquid Vector Warp*).
- **Rendimiento de 60 FPS Fijos:** Simulación multicanal RGB desacoplada con buffers numéricos `Float32Array` y tablas de plegado senoidal precalculadas (**LUT**).
- **Compatibilidad Web MIDI Nativa Plug & Play:** Mapeo completo para el controlador **Arturia MicroLab** (teclas 1 a 25) y cualquier controlador MIDI USB estándar.
- **Entrada Multimodal Tripartita:**
  - **Fotos:** Galería local con transiciones suaves y carga dinámica.
  - **Cámara:** Transmisión en tiempo real vía WebRTC (ideal para proyecciones en vivo).
  - **Video Loops:** Reproductor de bucles de video integrado.
- **Fusión de Elementos:** Capacidad de mezclar en capas transparentes la señal de la cámara/video sobre la galería fotográfica de fondo.
- **Paletas de Color & Shaders:**
  1. **RGB Original:** Fidelidad y color natural del input.
  2. **Neón Ciber:** Espectro ultravioleta, cian y magenta de alto impacto.
  3. **B&N Fotocopia (Xerox / Fanzine):** Umbralización estocástica con textura y grano de trama de tóner analógico. Al combinarse con el fader de tinte, produce un acabado de **Risografía Duotono**.
  4. **B&N Orgánico:** Gradiente continuo de escala de grises de alta precisión.
  5. **Invertido / Rayos X:** Negativo fotográfico de alto contraste.
- **Tinte Cromático Universal:** Deslizador fader de 0° a 360° para teñir la señal en tiempo real con memoria de último tono activo.
- **FX de Rendimiento en Vivo:**
  - **Wave Deform:** Desfiguración senoidal fluida de la imagen en ondas de impacto.
  - **Iluminación Escénica Roja:** Reflector frontal para momentos de clímax sonoro.
  - **Glitch Analógico & Freeze Frame:** Efectos *punch-in* momentáneos accionados por teclas MIDI.
  - **Zoom Óptico Central:** Acercamiento progresivo de 1.0x a 3.0x sin pixelación.
- **Audio Interactivo FX:** Modulación bidireccional de pitch, playback rate, paneo estéreo y volumen con el trazo del mouse y selector de pistas locales.
- **Interfaz Tech Minimalista:** Panel flotante con diseño de vidrio esmerilado (*frosted glassmorphism*), estética de consola cyber y opción de ocultar con un toque (`H`).

---

## Mapeo Físico de Teclas Arturia MicroLab (1 a 25)

El teclado Arturia MicroLab viene preconfigurado con asignaciones instantáneas en todas sus 25 teclas:

| N° Tecla | Nota | Función VJ | Detalle de Operación |
| :---: | :---: | :---: | :--- |
| **1** | Do (48) | **Fotos** | Activa la fuente de fotos locales |
| **3** | Re (50) | **Cámara Web** | Conecta la cámara web en vivo |
| **5** | Mi (52) | **Video Loop** | Cambia a la reproducción de bucle de video |
| **6** | Fa (53) | **Fusión de Elementos** | Alterna entre 0%, 40%, 70% y 100% de mezcla |
| **8** | Sol (55) | **Estela Persistente** | Cicla entre Normal, Larga, Ultra y Eco Infinito |
| **9** | Sol# (56) *(negra)* | **Tinte Neutro** | Desactiva el tinte cromático (0°) |
| **10** | La (57) | **Tinte Siguiente** | Avanza en el círculo cromático (Ámbar, Esmeralda, Cian, Azul, etc.) |
| **11** | La# (58) *(negra)* | **Tinte Toggle** | Conmuta el tinte ON / OFF recordando el color seleccionado |
| **12** | Si (59) | **Tinte Anterior** | Retrocede en el círculo cromático |
| **13** | Do (60) | **Paleta RGB** | Colores naturales de la toma |
| **15** | Re (62) | **Paleta Neón Ciber** | Paleta ultravioleta y cian |
| **17** | Mi (64) | **Zoom Óptico** | Cicla entre 1.0x, 1.4x, 2.0x y 3.0x |
| **18** | Fa (65) | **B&N Fotocopia** | Alto contraste Xerox + grano de tóner (*Risografía si hay tinte*) |
| **20** | Sol (67) | **B&N Orgánico** | Blanco y negro continuo de escala de grises |
| **21** | Sol# (68) *(negra)* | **Rayos X** | Negativo invertido de alta intensidad |
| **22** | La (69) | **Wave Deform** | Cicla intensidades de desfiguración en ondas |
| **23** | La# (70) *(negra)* | **Glitch Analógico** | Destrozo momentáneo de la señal (*Punch-in* al mantener pulsada) |
| **24** | Si (71) | **Iluminación Roja** | Reflector escénico rojo ON / OFF |
| **25** | Do (72) | **Ancho de Pincel** | Cicla entre radio fino, medio, grueso y gigante |

### Tiras Táctiles (*Touch Strips*)
- **Tira de Modulación (Modulation / CC 1):** Controla de 0% a 200% la Fluidez Líquida (*Liquid Warp Factor*).
- **Tira de Pitch Bend:** Acelera la dinámica de onda inyectando turbulencia momentánea.

---

## Atajos de Teclado PC

- **`T`**: Ciclar Tinte Cromático
- **`C`**: Ciclar Paletas de Color (RGB $\to$ Neón $\to$ Fotocopia $\to$ B&N $\to$ Rayos X)
- **`W`**: Ciclar intensidades de Deformación en Ondas (Wave)
- **`R`**: Activar / Desactivar Iluminación Escénica Roja
- **`Z`**: Ciclar Zoom Óptico (1.0x, 1.4x, 2.0x, 3.0x)
- **`X`**: Ciclar Fusión de Fuentes (0%, 40%, 70%, 100%)
- **`E`**: Ciclar Estela Persistente (Decay)
- **`B`**: Ciclar Ancho de Pincel
- **`1` / `2` / `3`**: Conmutar entre Fotos, Cámara y Video
- **`Espacio` / `→`**: Pasar a la siguiente foto
- **`←`**: Volver a la foto anterior
- **`P`**: Pausar / Reanudar la simulación
- **`A`**: Siguiente pista de audio
- **`M`**: Silenciar / Activar audio
- **`H`**: Ocultar / Mostrar el panel de control
- **`F`**: Pantalla completa (*fullscreen*)

---

## Cómo Ejecutarlo

1. **Localmente (Recomendado):**
   - Abre la carpeta en VS Code y lanza la extensión **Live Server** (o cualquier servidor HTTP como `npx serve`, `python -m http.server`, etc.).
   - Abre `http://localhost:5500` en **Google Chrome** o **Microsoft Edge** (para habilitar Web MIDI y acceso a la cámara).
2. **GitHub Pages (En la Nube):**
   - Sube este repositorio a GitHub.
   - Ve a `Settings` > `Pages` y activa la rama `main` como raíz (`/`).
   - Tendrás tu consola VJ accesible en vivo desde cualquier lugar con soporte HTTPS.

---

## Estructura del Proyecto

```text
├── index.html           # Estructura semántica, panel VJ y HUD flotante
├── style.css            # Estilos Frosted Glassmorphism y diseño responsive
├── sketch.js            # Motor del autómata, Web MIDI, WebRTC y shaders
├── README.md            # Documentación completa
├── .gitignore           # Archivos temporales ignorados
├── libraries/           # Bibliotecas locales autónomas (p5.js y p5.sound)
├── img/                 # Galería base de imágenes optimizadas
└── sonido/              # Pistas de audio locales
```
