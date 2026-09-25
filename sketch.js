/**
 * Autómata 2D Generativo con Morfismo Continuo de Imágenes
 * Optimizado para 3 imágenes (img/1.png, img/2.png, img/3.png)
 * Máxima nitidez, desplazamiento fluido y aceleración por tablas precalculadas (LUT)
 */

// Opciones de resolución de simulación
const RESOLUTION_MODES = [
  { val: 2, label: 'Alta Nitidez (2px)' },
  { val: 3, label: 'Equilibrado (3px)' },
  { val: 1, label: 'Ultra Máxima (1px)' }
];
let currentResIndex = 0;
let resolution = RESOLUTION_MODES[currentResIndex].val;

let cols, rows;

// Grillas de simulación numérica (Float32Array)
let gridR, nextR;
let gridG, nextG;
let gridB, nextB;

// Buffer de renderizado p5.Image
let caImage;

// Selección de las 3 mejores imágenes para máxima velocidad y ligereza
const LOCAL_IMAGE_PATHS = [
  'img/1.png',
  'img/6.png',
  'img/3.png'
];

let rawImages = [];
let imagesList = []; 
let currentIndex = 0;
let nextIndex = 1;

// Modos de Entrada VJ: 'IMAGENES' | 'CAMARA' | 'VIDEO'
let currentSource = 'IMAGENES';
let videoCapture = null;
let cameraReady = false;
let videoPlayer = null;
let videoReady = false;
let videoName = 'Ninguno';

// Buffer gráfico para alimentar cámara o video a la grilla
let liveFeedGfx = null;
let liveFeedData = null;

// Efectos de Rendimiento en Vivo (Punch-in FX por MIDI / Teclas)
let isStrobeActive = false;
let isGlitchActive = false;
let isFreezeActive = false;
let isRedLightActive = false;
let pitchBendWarpOffset = 0.0;

// Efecto de Deformación de Imagen en Ondas (Wave Deform) y Tinte Cromático
let waveDeformIntensity = 0.0; // 0.0 a 1.0 (0% a 100%)
let waveDeformPhase = 0.0;
let tintAngle = 0;             // 0° = Neutro / Desactivado, 1° a 360° = Tinte Cromático
let lastActiveTintAngle = 180; // Memoria de último color para alternar ON / OFF

// Presets de Tinte Cromático para cambio rápido vía MIDI (Teclas 10, 11, 12)
const TINT_PRESETS = [
  { label: 'Neutro (0°)', angle: 0 },
  { label: 'Ámbar Cálido (30°)', angle: 30 },
  { label: 'Dorado Lima (65°)', angle: 65 },
  { label: 'Esmeralda (120°)', angle: 120 },
  { label: 'Cian Eléctrico (180°)', angle: 180 },
  { label: 'Azul Cobalto (225°)', angle: 225 },
  { label: 'Púrpura Violeta (270°)', angle: 270 },
  { label: 'Magenta Fucsia (310°)', angle: 310 },
  { label: 'Rubí Carmín (345°)', angle: 345 }
];
let currentTintPresetIndex = 0;

// Estado Web MIDI
let midiConnected = false;
let midiDeviceName = 'Desconectado';

// Controles VJ Optimizados: Fusión, Estela Persistente, Zoom y Pincel
const FUSION_PRESETS = [
  { label: 'Desactivada (0%)', val: 0.0 },
  { label: 'Fusión Suave (40%)', val: 0.40 },
  { label: 'Fusión Equilibrada (70%)', val: 0.70 },
  { label: 'Fusión Total (100%)', val: 1.0 }
];
let currentFusionIndex = 0;
let fusionAmount = 0.0;

const TRAIL_PRESETS = [
  { label: 'Normal (Decay 1.1)', decay: 1.1 },
  { label: 'Larga (Decay 0.50)', decay: 0.50 },
  { label: 'Ultra Persistente (Decay 0.18)', decay: 0.18 },
  { label: 'Infinita / Eco Líquido (Decay 0.04)', decay: 0.04 }
];
let currentTrailIndex = 0;

const ZOOM_PRESETS = [
  { label: '1.0x (Normal)', factor: 1.0 },
  { label: '1.4x (Medio)', factor: 1.4 },
  { label: '2.0x (Primer Plano)', factor: 2.0 },
  { label: '3.0x (Macro Profundo)', factor: 3.0 }
];
let currentZoomIndex = 0;
let zoomFactor = 1.0;
let currentZoomDisplay = 1.0;

const BRUSH_PRESETS = [
  { label: 'Fino (20px)', radius: 20 },
  { label: 'Medio (50px)', radius: 50 },
  { label: 'Grueso (100px)', radius: 100 },
  { label: 'Gigante (180px)', radius: 180 }
];
let currentBrushIndex = 1; // 50px

// Parámetros de simulación, onda y deformación líquida
let decay = 1.1;               // Decaimiento de energía
let cycleDuration = 6.0;       // Segundos por flor
let cycleTimer = 0;
let isPaused = false;
let brushRadius = 50;          // Radio del pincel
let fluidWarpFactor = 1.0;     // Intensidad del desplazamiento líquido

// Modos de Color y Shaders
const COLOR_MODES = [
  'RGB Original',
  'Neón Ciber',
  'B&N Fotocopia',
  'B&N Orgánico',
  'Invertido / Rayos X'
];
let currentModeIndex = 0;

// Estado de UI
let uiVisible = true;

// =========================================================================
// AUDIO INTERACTIVO FX (Lista de canciones)
// =========================================================================
// Puedes agregar todas las canciones que quieras de tu carpeta 'sonido/':
const LOCAL_AUDIO_PATHS = [
  { name: 'Dark Drone', path: 'sonido/dark.wav' }
  // Para agregar más, ponlas en 'sonido/' y descomenta o agrega líneas aquí:
  // { name: 'Pista 2', path: 'sonido/cancion2.mp3' },
  // { name: 'Pista 3', path: 'sonido/cancion3.wav' }
];

let audioList = []; // Array de { name: string, sound: p5.SoundFile }
let currentAudioIndex = 0;
let soundEnabled = true;
let masterVolume = 0.8;
let audioStarted = false;

// =========================================================================
// TABLA PRECALCULADA (LUT) PARA ONDAS SUAVES (Rendimiento extremo)
// =========================================================================
const LUT_SIZE = 1024;
const LUT_SMOOTH_FOLD = new Float32Array(LUT_SIZE);

(function buildLUT() {
  for (let i = 0; i < LUT_SIZE; i++) {
    let m = i % 512;
    let tri = m < 256 ? m : 512 - m;
    let n = tri * 0.0039215686; // / 255.0
    // Curva cúbica suave (Hermite / Smoothstep)
    LUT_SMOOTH_FOLD[i] = (n * n * (3.0 - 2.0 * n)) * 255.0;
  }
})();

// =========================================================================
// PRELOAD
// =========================================================================
function preload() {
  // Cargar lista de pistas de audio
  for (let i = 0; i < LOCAL_AUDIO_PATHS.length; i++) {
    let item = LOCAL_AUDIO_PATHS[i];
    let snd = loadSound(
      item.path,
      () => {
        console.log(`Audio cargado con éxito: ${item.name}`);
        updateAudioLabel();
      },
      (err) => {
        console.warn(`No se pudo precargar audio ${item.path}`, err);
      }
    );
    audioList.push({ name: item.name, sound: snd });
  }

  // Cargar las 3 imágenes seleccionadas
  for (let i = 0; i < LOCAL_IMAGE_PATHS.length; i++) {
    rawImages[i] = loadImage(
      LOCAL_IMAGE_PATHS[i],
      () => {},
      (err) => {
        console.warn(`No se pudo precargar ${LOCAL_IMAGE_PATHS[i]}`);
      }
    );
  }
}

// =========================================================================
// SETUP
// =========================================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  initDimensions();

  // Cargar las 3 imágenes
  let loadedCount = 0;
  for (let i = 0; i < rawImages.length; i++) {
    let img = rawImages[i];
    if (img && img.width > 1) {
      let flowerNum = LOCAL_IMAGE_PATHS[i].replace('img/', '').replace('.png', '');
      addLoadedImage(img, `Flor ${flowerNum}`);
      loadedCount++;
    }
  }

  if (loadedCount === 0) {
    generateProceduralDefaults();
  }

  setupUIEvents();
  setupDragAndDrop();
  initWebMIDI();

  seedCurrentToNext(0, imagesList.length > 1 ? 1 : 0);
}

function initDimensions() {
  cols = floor(width / resolution);
  rows = floor(height / resolution);

  let numCells = cols * rows;
  gridR = new Float32Array(numCells);
  nextR = new Float32Array(numCells);
  gridG = new Float32Array(numCells);
  nextG = new Float32Array(numCells);
  gridB = new Float32Array(numCells);
  nextB = new Float32Array(numCells);

  caImage = createImage(cols, rows);

  if (liveFeedGfx) liveFeedGfx.remove();
  liveFeedGfx = createGraphics(cols, rows);
  liveFeedGfx.pixelDensity(1);

  liveFeedData = {
    r: new Float32Array(numCells),
    g: new Float32Array(numCells),
    b: new Float32Array(numCells)
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rebuildAtCurrentResolution();
}

function rebuildAtCurrentResolution() {
  initDimensions();
  for (let item of imagesList) {
    if (item.sourceImg) {
      item.data = resampleP5Image(item.sourceImg);
    }
  }
  seedCurrentToNext(currentIndex, nextIndex);
}

// =========================================================================
// BUCLE PRINCIPAL (DRAW)
// =========================================================================
function draw() {
  let dt = min(deltaTime / 1000, 0.1);
  waveDeformPhase += dt * 4.5;

  if (!isPaused && imagesList.length > 0 && currentSource === 'IMAGENES') {
    cycleTimer += dt;
    if (imagesList.length > 1) {
      if (cycleTimer >= cycleDuration) {
        cycleTimer = 0;
        currentIndex = nextIndex;
        nextIndex = (nextIndex + 1) % imagesList.length;
        updateBadge();
      }
    }
  }

  let progress = 0;
  if (currentSource === 'IMAGENES') {
    if (imagesList.length > 1) {
      progress = cycleTimer / cycleDuration;
    } else if (imagesList.length === 1) {
      // Si hay una sola imagen, generamos una respiración ondulante continua
      progress = (sin(cycleTimer * 1.5) * 0.5 + 0.5) * 0.45;
    }

    // Actualizar indicador durante el morfismo
    if (progress > 0.65 && imagesList.length > 1) {
      let badge = document.getElementById('image-badge');
      if (badge) {
        let pct = Math.round(progress * 100);
        badge.textContent = `${imagesList[currentIndex].name} -> ${imagesList[nextIndex].name} (${pct}%)`;
      }
    }
  } else if (currentSource === 'CAMARA') {
    if (cameraReady && videoCapture) {
      updateLiveFeedData(videoCapture);
    }
  } else if (currentSource === 'VIDEO') {
    if (videoReady && videoPlayer) {
      updateLiveFeedData(videoPlayer);
    }
  }

  // 1. Simulación numérica del autómata celular (omitir si freeze está activo)
  if (!isFreezeActive) {
    stepAutomata(progress);
  }

  // 2. Renderizado optimizado con desplazamiento fluido
  renderWithOrganicDisplacement(progress);

  // 3. Filtrado bilineal por hardware para eliminar cualquier pixelación
  smooth();
  image(caImage, 0, 0, width, height);

  // 4. Pincel con el mouse
  handleMouseInteraction();
}

function updateLiveFeedData(sourceMedia) {
  if (!liveFeedGfx || !liveFeedData) return;
  liveFeedGfx.image(sourceMedia, 0, 0, cols, rows);
  liveFeedGfx.loadPixels();
  let pix = liveFeedGfx.pixels;
  let count = cols * rows;
  let r = liveFeedData.r;
  let g = liveFeedData.g;
  let b = liveFeedData.b;
  for (let i = 0; i < count; i++) {
    let p = i << 2;
    r[i] = pix[p];
    g[i] = pix[p + 1];
    b[i] = pix[p + 2];
  }
}

// =========================================================================
// SIMULACIÓN CELULAR (DIFUSIÓN Y ONDAS)
// =========================================================================
function stepAutomata(progress) {
  let currData, nextData;
  let morphWeight = 0;
  let injectStrength = 0.04;

  if (currentSource === 'CAMARA' || currentSource === 'VIDEO') {
    if (liveFeedData) {
      currData = liveFeedData;
      nextData = liveFeedData;
      morphWeight = 0;
      injectStrength = 0.12; // Inyección fluida continua del stream
    }
  } else {
    currData = imagesList[currentIndex]?.data;
    nextData = imagesList[nextIndex]?.data;

    if (progress > 0.65) {
      morphWeight = map(progress, 0.65, 1.0, 0.0, 1.0, true);
      injectStrength = map(progress, 0.65, 1.0, 0.05, 0.20);
    } else if (progress < 0.20) {
      injectStrength = map(progress, 0.0, 0.20, 0.18, 0.04);
    }
  }

  let effectiveDecay = decay;
  if (currentSource === 'IMAGENES' && progress >= 0.35 && progress <= 0.70) {
    effectiveDecay = decay * 1.35;
  }

  // Punch-In FX: Glitch caótico si la tecla MIDI está activa
  if (isGlitchActive) {
    for (let k = 0; k < 90; k++) {
      let rIdx = floor(random(cols * rows));
      gridR[rIdx] += random(160, 480);
      gridG[rIdx] += random(160, 480);
      gridB[rIdx] += random(160, 480);
    }
  }

  for (let y = 0; y < rows; y++) {
    let up = ((y - 1 + rows) % rows) * cols;
    let down = ((y + 1) % rows) * cols;
    let cur = y * cols;

    for (let x = 0; x < cols; x++) {
      let idx = cur + x;

      let left = (x - 1 + cols) % cols;
      let right = (x + 1) % cols;

      // 8 vecinos inmediatos
      let n0 = up + left,   n1 = up + x,   n2 = up + right;
      let n3 = cur + left,                 n4 = cur + right;
      let n5 = down + left, n6 = down + x, n7 = down + right;

      // Canal Rojo
      let sumR = gridR[n0] + gridR[n1] + gridR[n2] +
                 gridR[n3] +             gridR[n4] +
                 gridR[n5] + gridR[n6] + gridR[n7];
      let valR = sumR * 0.125 - effectiveDecay;

      // Canal Verde
      let sumG = gridG[n0] + gridG[n1] + gridG[n2] +
                 gridG[n3] +             gridG[n4] +
                 gridG[n5] + gridG[n6] + gridG[n7];
      let valG = sumG * 0.125 - effectiveDecay;

      // Canal Azul
      let sumB = gridB[n0] + gridB[n1] + gridB[n2] +
                 gridB[n3] +             gridB[n4] +
                 gridB[n5] + gridB[n6] + gridB[n7];
      let valB = sumB * 0.125 - effectiveDecay;

      // Inyección continua de la fuente (fotos, cámara o video)
      if (currData && nextData) {
        let srcR = lerp(currData.r[idx], nextData.r[idx], morphWeight);
        let srcG = lerp(currData.g[idx], nextData.g[idx], morphWeight);
        let srcB = lerp(currData.b[idx], nextData.b[idx], morphWeight);

        // FUSIÓN DE ELEMENTOS en la simulación
        if (fusionAmount > 0.01 && imagesList.length > 0 && imagesList[currentIndex]?.data) {
          let fData = imagesList[currentIndex].data;
          srcR = lerp(srcR, fData.r[idx], fusionAmount);
          srcG = lerp(srcG, fData.g[idx], fusionAmount);
          srcB = lerp(srcB, fData.b[idx], fusionAmount);
        }

        let targetR = srcR * 2.8;
        let targetG = srcG * 2.8;
        let targetB = srcB * 2.8;

        valR = valR * (1 - injectStrength) + targetR * injectStrength;
        valG = valG * (1 - injectStrength) + targetG * injectStrength;
        valB = valB * (1 - injectStrength) + targetB * injectStrength;
      }

      nextR[idx] = max(valR, 0);
      nextG[idx] = max(valG, 0);
      nextB[idx] = max(valB, 0);
    }
  }

  // Intercambiar punteros
  let tempR = gridR; gridR = nextR; nextR = tempR;
  let tempG = gridG; gridG = nextG; nextG = tempG;
  let tempB = gridB; gridB = nextB; nextB = tempB;
}

// =========================================================================
// RENDERIZADO CON DESPLAZAMIENTO ORGÁNICO ULTRA RÁPIDO
// =========================================================================
function renderWithOrganicDisplacement(progress) {
  caImage.loadPixels();
  let pix = caImage.pixels;

  let currData, nextData;
  let warpFactor = 0;
  let morphBlend = 0;

  if (currentSource === 'CAMARA' || currentSource === 'VIDEO') {
    currData = liveFeedData;
    nextData = liveFeedData;
    warpFactor = 0.65;
    morphBlend = 0;
  } else {
    currData = imagesList[currentIndex]?.data;
    nextData = imagesList[nextIndex]?.data;

    if (progress < 0.30) {
      warpFactor = map(progress, 0.0, 0.30, 0.0, 0.25);
      morphBlend = 0;
    } else if (progress < 0.70) {
      warpFactor = map(progress, 0.30, 0.55, 0.25, 1.0, true);
      if (progress > 0.55) {
        warpFactor = map(progress, 0.55, 0.70, 1.0, 0.85);
      }
      morphBlend = map(progress, 0.45, 0.70, 0.0, 0.5, true);
    } else {
      warpFactor = map(progress, 0.70, 0.95, 0.85, 0.0, true);
      morphBlend = map(progress, 0.70, 1.0, 0.5, 1.0, true);
    }
  }

  let totalWarp = (warpFactor * fluidWarpFactor) + pitchBendWarpOffset;
  let displacementScale = totalWarp * 0.045;
  let waveInfluence = constrain(map(totalWarp, 0, 1, 0.12, 0.58), 0.05, 0.90);
  let invWave = 1.0 - waveInfluence;

  let mask1023 = LUT_SIZE - 1;

  // Interpolar zoom suavemente
  currentZoomDisplay = lerp(currentZoomDisplay, zoomFactor, 0.14);
  let centerX = cols * 0.5;
  let centerY = rows * 0.5;
  let invZoom = 1.0 / currentZoomDisplay;

  // Precalcular factores de Tinte Cromático si está activo (Fader 0° - 360°)
  let tintRad = tintAngle * 0.0174532925; // DEG TO RAD
  let tr = (cos(tintRad) * 0.5 + 0.5);
  let tg = (cos(tintRad - 2.094395) * 0.5 + 0.5); // -120°
  let tb = (cos(tintRad - 4.18879) * 0.5 + 0.5);  // -240°

  for (let y = 0; y < rows; y++) {
    let cur = y * cols;
    let up = ((y - 1 + rows) % rows) * cols;
    let down = ((y + 1) % rows) * cols;

    for (let x = 0; x < cols; x++) {
      let idx = cur + x;
      let pIdx = idx << 2; // idx * 4 rápido

      let left = (x - 1 + cols) % cols;
      let right = (x + 1) % cols;

      // Gradiente de energía
      let gradX = (gridR[cur + right] - gridR[cur + left]) * 0.5 +
                  (gridG[cur + right] - gridG[cur + left]) * 0.3;
      let gradY = (gridR[down + x] - gridR[up + x]) * 0.5 +
                  (gridG[down + x] - gridG[up + x]) * 0.3;

      // Desplazamiento de coordenadas y Zoom Óptico Central
      let sx = x;
      let sy = y;
      if (displacementScale > 0.001) {
        sx = x + (gradX * displacementScale | 0);
        sy = y + (gradY * displacementScale | 0);
      }

      // DEFORMACIÓN EN ONDAS (Desfigura la imagen/video/cámara en ondulaciones fluidas)
      if (waveDeformIntensity > 0.001) {
        let waveX = sin(y * 0.075 + waveDeformPhase) * (waveDeformIntensity * 28.0) +
                    sin((x + y) * 0.045 + waveDeformPhase * 1.3) * (waveDeformIntensity * 12.0);
        let waveY = cos(x * 0.075 + waveDeformPhase * 0.85) * (waveDeformIntensity * 18.0);
        sx += waveX;
        sy += waveY;
      }

      let zx = centerX + (sx - centerX) * invZoom;
      let zy = centerY + (sy - centerY) * invZoom;
      let sampleX = zx < 0 ? 0 : (zx >= cols ? cols - 1 : (zx | 0));
      let sampleY = zy < 0 ? 0 : (zy >= rows ? rows - 1 : (zy | 0));
      let sampleIdx = sampleY * cols + sampleX;

      // Muestreo nítido de la fuente
      let photoR = 0, photoG = 0, photoB = 0;
      if (currData && nextData) {
        let rA = currData.r[sampleIdx], gA = currData.g[sampleIdx], bA = currData.b[sampleIdx];
        let rB = nextData.r[sampleIdx], gB = nextData.g[sampleIdx], bB = nextData.b[sampleIdx];
        photoR = rA + (rB - rA) * morphBlend;
        photoG = gA + (gB - gA) * morphBlend;
        photoB = bA + (bB - bA) * morphBlend;

        // FUSIÓN EN RENDER (Cámara/Video fusionada con foto de la galería)
        if (fusionAmount > 0.01 && imagesList.length > 0 && imagesList[currentIndex]?.data) {
          let fData = imagesList[currentIndex].data;
          let fR = fData.r[sampleIdx], fG = fData.g[sampleIdx], fB = fData.b[sampleIdx];
          photoR = photoR * (1.0 - fusionAmount) + fR * fusionAmount;
          photoG = photoG * (1.0 - fusionAmount) + fG * fusionAmount;
          photoB = photoB * (1.0 - fusionAmount) + fB * fusionAmount;
        }
      }

      // Ondas mediante tabla precalculada (LUT) de altísima velocidad
      let waveR = LUT_SMOOTH_FOLD[(gridR[idx] | 0) & mask1023];
      let waveG = LUT_SMOOTH_FOLD[(gridG[idx] | 0) & mask1023];
      let waveB = LUT_SMOOTH_FOLD[(gridB[idx] | 0) & mask1023];

      let finalR = photoR * invWave + waveR * waveInfluence;
      let finalG = photoG * invWave + waveG * waveInfluence;
      let finalB = photoB * invWave + waveB * waveInfluence;

      // ILUMINACIÓN ROJA ESCÉNICA (Ilumina con reflector rojo frontal manteniendo texturas y volumen)
      if (isRedLightActive) {
        finalR = min(finalR * 1.55 + 50, 255);
        finalG = finalG * 0.42;
        finalB = finalB * 0.46;
      }

      if (isStrobeActive) {
        // Flash destellante para remates
        pix[pIdx + 0] = 255;
        pix[pIdx + 1] = 255;
        pix[pIdx + 2] = 255;
        pix[pIdx + 3] = 255;
      } else if (currentModeIndex === 0) {
        // Color RGB Original
        pix[pIdx + 0] = finalR;
        pix[pIdx + 1] = finalG;
        pix[pIdx + 2] = finalB;
        pix[pIdx + 3] = 255;
      } else if (currentModeIndex === 1) {
        // Neón / Ciber
        let lum = finalR * 0.299 + finalG * 0.587 + finalB * 0.114;
        let t = lum * 0.0039215686;
        pix[pIdx + 0] = sin(t * PI) * 255;
        pix[pIdx + 1] = cos(t * HALF_PI) * 220 + 30;
        pix[pIdx + 2] = sin(t * TWO_PI + HALF_PI) * 200 + 55;
        pix[pIdx + 3] = 255;
      } else if (currentModeIndex === 2) {
        // Blanco y Negro Fotocopia (Xerox / Fanzine High-Contrast con trama y grano de toner)
        let lum = finalR * 0.299 + finalG * 0.587 + finalB * 0.114;
        let toner = lum + (((x * 29 + y * 53 + (frameCount & 3) * 11) & 31) - 15.5) * 1.85;
        let photoVal = toner > 142 ? 255 : (toner < 96 ? 0 : (toner - 96) * 5.54);
        pix[pIdx + 0] = photoVal;
        pix[pIdx + 1] = photoVal;
        pix[pIdx + 2] = photoVal;
        pix[pIdx + 3] = 255;
      } else if (currentModeIndex === 3) {
        // Blanco y Negro Orgánico
        let lum = finalR * 0.299 + finalG * 0.587 + finalB * 0.114;
        pix[pIdx + 0] = lum;
        pix[pIdx + 1] = lum;
        pix[pIdx + 2] = lum;
        pix[pIdx + 3] = 255;
      } else {
        // Invertido / Rayos X
        pix[pIdx + 0] = 255 - finalR;
        pix[pIdx + 1] = 255 - finalG;
        pix[pIdx + 2] = 255 - finalB;
        pix[pIdx + 3] = 255;
      }

      // TINTE CROMÁTICO MANUAL / FADER (Aplica sobre cualquier paleta activa o crea Risografía Duotono)
      if (tintAngle > 0 && !isStrobeActive) {
        let pr = pix[pIdx + 0];
        let pg = pix[pIdx + 1];
        let pb = pix[pIdx + 2];
        let lum = pr * 0.299 + pg * 0.587 + pb * 0.114;
        pix[pIdx + 0] = min(255, (pr * 0.25 + lum * tr * 1.65) | 0);
        pix[pIdx + 1] = min(255, (pg * 0.25 + lum * tg * 1.65) | 0);
        pix[pIdx + 2] = min(255, (pb * 0.25 + lum * tb * 1.65) | 0);
      }
    }
  }

  caImage.updatePixels();
}

// =========================================================================
// INTERACCIÓN CON EL MOUSE Y AUDIO FX
// =========================================================================
function handleMouseInteraction() {
  let isInteracting = mouseIsPressed && mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;

  if (isInteracting) {
    let gridX = floor(mouseX / resolution);
    let gridY = floor(mouseY / resolution);
    let r = floor(brushRadius / resolution);

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        let x = (gridX + dx + cols) % cols;
        let y = (gridY + dy + rows) % rows;
        let d = sqrt(dx * dx + dy * dy);

        if (d <= r) {
          let energy = (1 - d / r) * 260;
          let idx = y * cols + x;
          gridR[idx] += energy;
          gridG[idx] += energy * 0.85;
          gridB[idx] += energy * 1.25;
        }
      }
    }
  }

  // Modulación en tiempo real de Rate / Pitch / Pan de la pista actual
  handleAudioFX(isInteracting);
}

function getCurrentSound() {
  if (audioList.length > 0 && audioList[currentAudioIndex]) {
    return audioList[currentAudioIndex].sound;
  }
  return null;
}

function handleAudioFX(isInteracting) {
  let currentSound = getCurrentSound();
  if (!currentSound || !soundEnabled) return;

  if (isInteracting) {
    // Iniciar contexto de audio al primer clic si el navegador lo tenía suspendido
    if (!audioStarted) {
      userStartAudio();
      audioStarted = true;
    }

    // Iniciar loop si aún no está reproduciendo
    if (!currentSound.isPlaying()) {
      currentSound.setVolume(0.001);
      currentSound.loop();
    }

    // Velocidad a la que el usuario mueve el mouse
    let mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);

    // MODULACIÓN DE RATE / PITCH:
    // Eje Vertical (Y):
    // Arriba (Y=0) => Tono agudo y acelerado (~1.7x a 2.0x)
    // Abajo (Y=height) => Tono grave, oscuro y lento (~0.35x a 0.5x)
    let basePitch = map(mouseY, height, 0, 0.42, 1.85, true);

    // La velocidad del movimiento deforma el tono dinámicamente
    let speedWarp = map(mouseSpeed, 0, 45, 0.0, 0.35, true);
    let finalRate = constrain(basePitch + speedWarp, 0.25, 2.6);

    // PANNING ESTÉREO según la posición horizontal (X):
    let panVal = map(mouseX, 0, width, -0.75, 0.75, true);

    // VOLUMEN DINÁMICO:
    let strokeVol = map(mouseSpeed, 0, 30, 0.45, 1.0, true) * masterVolume;

    // Aplicar a la pista activa
    currentSound.rate(finalRate);
    currentSound.pan(panVal);
    currentSound.setVolume(strokeVol, 0.05);

  } else {
    // Cuando se suelta el mouse, desvanecer suavemente (fade out)
    if (currentSound.isPlaying()) {
      currentSound.setVolume(0.0, 0.28);
    }
  }
}

function switchNextAudioTrack() {
  if (audioList.length <= 1) return;

  // Detener la canción actual antes de cambiar
  let currentSound = getCurrentSound();
  if (currentSound && currentSound.isPlaying()) {
    currentSound.stop();
  }

  currentAudioIndex = (currentAudioIndex + 1) % audioList.length;
  updateAudioLabel();
}

function updateAudioLabel() {
  let label = document.getElementById('audio-track-label');
  if (label && audioList.length > 0 && audioList[currentAudioIndex]) {
    label.textContent = audioList[currentAudioIndex].name;
  }
}

// =========================================================================
// MUESTREO DE IMÁGENES
// =========================================================================
function seedCurrentToNext(curr, next) {
  currentIndex = curr;
  nextIndex = next;
  cycleTimer = 0;

  if (imagesList[curr]?.data) {
    let d = imagesList[curr].data;
    for (let i = 0; i < cols * rows; i++) {
      gridR[i] = d.r[i] * 2.6;
      gridG[i] = d.g[i] * 2.6;
      gridB[i] = d.b[i] * 2.6;
    }
  }
  updateBadge();
}

function resampleP5Image(img) {
  let gfx = createGraphics(cols, rows);
  gfx.pixelDensity(1);
  gfx.background(0);

  let imgAspect = img.width / img.height;
  let canvasAspect = cols / rows;
  let drawW, drawH, drawX, drawY;

  let margin = 0.95;
  if (imgAspect > canvasAspect) {
    drawW = cols * margin;
    drawH = (cols / imgAspect) * margin;
  } else {
    drawH = rows * margin;
    drawW = (rows * imgAspect) * margin;
  }
  drawX = (cols - drawW) / 2;
  drawY = (rows - drawH) / 2;

  gfx.image(img, drawX, drawY, drawW, drawH);
  gfx.loadPixels();

  let count = cols * rows;
  let rArr = new Float32Array(count);
  let gArr = new Float32Array(count);
  let bArr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    let p = i * 4;
    let alpha = gfx.pixels[p + 3] / 255.0;
    rArr[i] = gfx.pixels[p + 0] * alpha;
    gArr[i] = gfx.pixels[p + 1] * alpha;
    bArr[i] = gfx.pixels[p + 2] * alpha;
  }

  gfx.remove();
  return { r: rArr, g: gArr, b: bArr };
}

function addLoadedImage(img, name = "Imagen") {
  let processed = {
    name: name,
    sourceImg: img,
    data: resampleP5Image(img)
  };
  imagesList.push(processed);
  updateBadge();
}

function generateProceduralDefaults() {
  let g1 = createGraphics(600, 600);
  g1.pixelDensity(1);
  g1.background(10, 15, 25);
  g1.translate(300, 300);
  for (let i = 0; i < 16; i++) {
    g1.rotate(TWO_PI / 16);
    g1.stroke(255, 100, 180, 220);
    g1.noFill();
    g1.ellipse(0, 80, 110, 180);
  }
  addLoadedImage(g1, "Demo");
  g1.remove();
}

// =========================================================================
// EVENTOS Y CONTROLES UI
// =========================================================================
function setupUIEvents() {
  // Selectores de fuentes VJ
  let btnSrcImg = document.getElementById('src-images');
  let btnSrcCam = document.getElementById('src-camera');
  let btnSrcVid = document.getElementById('src-video');
  if (btnSrcImg) btnSrcImg.addEventListener('click', () => setSourceMode('IMAGENES'));
  if (btnSrcCam) btnSrcCam.addEventListener('click', () => setSourceMode('CAMARA'));
  if (btnSrcVid) btnSrcVid.addEventListener('click', () => setSourceMode('VIDEO'));

  // Botón y file input para subir videos
  let btnVideoUpload = document.getElementById('btn-video-upload');
  let videoFileInput = document.getElementById('video-file-input');
  if (btnVideoUpload && videoFileInput) {
    btnVideoUpload.addEventListener('click', () => videoFileInput.click());
  }
  if (videoFileInput) {
    videoFileInput.addEventListener('change', (e) => {
      let files = e.target.files;
      if (files && files.length > 0) {
        loadCustomVideoFile(files[0]);
      }
      videoFileInput.value = '';
    });
  }

  // Botón directo de carga de fotos
  let btnUpload = document.getElementById('btn-upload');
  let fileInput = document.getElementById('file-input');
  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => fileInput.click());
  }
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      let files = e.target.files;
      if (files && files.length > 0) {
        loadFilesIntoGallery(files);
      }
      fileInput.value = '';
    });
  }

  // Botón abrir/cerrar panel lateral
  let btnToggle = document.getElementById('btn-toggle-ui');
  let btnClose = document.getElementById('btn-close-ui');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => setUIVisible(true));
  }
  if (btnClose) {
    btnClose.addEventListener('click', () => setUIVisible(false));
  }

  // Botón siguiente foto
  let btnNext = document.getElementById('btn-next');
  if (btnNext) {
    btnNext.addEventListener('click', triggerNextTransition);
  }

  // Efectos en vivo: Iluminación Roja, Wave Deform y Pausa
  let btnRedLight = document.getElementById('btn-red-light');
  if (btnRedLight) {
    btnRedLight.addEventListener('click', toggleRedLight);
  }

  let btnWaveToggle = document.getElementById('btn-wave-toggle');
  if (btnWaveToggle) {
    btnWaveToggle.addEventListener('click', cycleWaveDeform);
  }

  let btnPause = document.getElementById('btn-pause');
  if (btnPause) {
    btnPause.addEventListener('click', togglePause);
  }

  // Deslizadores visuales manuales
  let waveSlider = document.getElementById('wave-slider');
  let waveVal = document.getElementById('wave-val');
  if (waveSlider) {
    waveSlider.addEventListener('input', (e) => {
      waveDeformIntensity = parseFloat(e.target.value) / 100.0;
      if (waveVal) waveVal.textContent = e.target.value + '%';
      syncUIControls();
    });
  }

  let zoomSlider = document.getElementById('zoom-slider');
  let zoomVal = document.getElementById('zoom-val');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
      zoomFactor = parseFloat(e.target.value);
      if (zoomVal) zoomVal.textContent = zoomFactor.toFixed(1) + 'x';
      syncUIControls();
    });
  }

  let fusionSlider = document.getElementById('fusion-slider');
  let fusionVal = document.getElementById('fusion-val');
  if (fusionSlider) {
    fusionSlider.addEventListener('input', (e) => {
      fusionAmount = parseFloat(e.target.value) / 100.0;
      if (fusionVal) fusionVal.textContent = e.target.value + '%';
      syncUIControls();
    });
  }

  let decaySlider = document.getElementById('decay-slider');
  let decayVal = document.getElementById('decay-val');
  if (decaySlider) {
    decaySlider.addEventListener('input', (e) => {
      decay = parseFloat(e.target.value);
      if (decayVal) decayVal.textContent = decay.toFixed(2);
      syncUIControls();
    });
  }

  let tintSlider = document.getElementById('tint-slider');
  let tintVal = document.getElementById('tint-val');
  if (tintSlider) {
    tintSlider.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      setTintAngle(val, false);
      if (tintVal) tintVal.textContent = getTintName(tintAngle);
    });
    tintSlider.addEventListener('change', (e) => {
      showMidiHUD(`Tinte: ${getTintName(tintAngle)}`);
    });
  }

  let warpSlider = document.getElementById('warp-slider');
  let warpVal = document.getElementById('warp-val');
  if (warpSlider) {
    warpSlider.addEventListener('input', (e) => {
      fluidWarpFactor = parseFloat(e.target.value) / 100.0;
      if (warpVal) warpVal.textContent = e.target.value + '%';
      syncUIControls();
    });
  }

  let brushSlider = document.getElementById('brush-slider');
  let brushVal = document.getElementById('brush-val');
  if (brushSlider) {
    brushSlider.addEventListener('input', (e) => {
      brushRadius = parseInt(e.target.value);
      if (brushVal) brushVal.textContent = brushRadius + 'px';
      syncUIControls();
    });
  }

  // Paleta de Color Interactiva (Chips)
  document.querySelectorAll('.palette-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      let mode = parseInt(chip.getAttribute('data-mode'));
      if (!isNaN(mode)) {
        setColorMode(mode);
      }
    });
  });

  // Audio FX
  let btnSound = document.getElementById('btn-sound');
  if (btnSound) {
    btnSound.addEventListener('click', toggleSound);
  }

  let btnAudioNext = document.getElementById('btn-audio-next');
  if (btnAudioNext) {
    btnAudioNext.addEventListener('click', switchNextAudioTrack);
  }

  // Carga manual de canciones
  let btnAudioUpload = document.getElementById('btn-audio-upload');
  let audioFileInput = document.getElementById('audio-file-input');
  if (btnAudioUpload && audioFileInput) {
    btnAudioUpload.addEventListener('click', () => audioFileInput.click());
  }
  if (audioFileInput) {
    audioFileInput.addEventListener('change', (e) => {
      let files = e.target.files;
      if (files && files.length > 0) {
        loadCustomAudioFile(files[0]);
      }
      audioFileInput.value = '';
    });
  }

  // Nitidez / Resolución
  let btnRes = document.getElementById('btn-res');
  if (btnRes) {
    btnRes.addEventListener('click', cycleResolution);
  }

  // Pantalla Completa
  let btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreen);
  }

  // Sincronizar UI con el estado inicial
  syncUIControls();
  setUIVisible(true);
}

// =========================================================================
// SINCRONIZACIÓN DE CONTROLES MANUALES Y MIDI EN PANTALLA
// =========================================================================
function syncUIControls() {
  // 1. Iluminación Escénica Roja
  let btnRedLight = document.getElementById('btn-red-light');
  if (btnRedLight) {
    if (isRedLightActive) {
      btnRedLight.classList.add('active-red');
    } else {
      btnRedLight.classList.remove('active-red');
    }
  }

  // 2. Wave Deform (Botón + Slider)
  let btnWave = document.getElementById('btn-wave-toggle');
  let waveSlider = document.getElementById('wave-slider');
  let waveVal = document.getElementById('wave-val');
  let wavePct = Math.round(waveDeformIntensity * 100);
  if (waveSlider && document.activeElement !== waveSlider) waveSlider.value = wavePct;
  if (waveVal) waveVal.textContent = wavePct + '%';
  if (btnWave) {
    if (waveDeformIntensity > 0.01) {
      btnWave.classList.add('active-cyan');
    } else {
      btnWave.classList.remove('active-cyan');
    }
  }

  // 3. Pausa
  let btnPause = document.getElementById('btn-pause');
  let pauseLabel = document.getElementById('pause-label');
  if (btnPause) {
    if (isPaused) {
      btnPause.classList.add('active-blue');
      if (pauseLabel) pauseLabel.textContent = 'Reanudar';
    } else {
      btnPause.classList.remove('active-blue');
      if (pauseLabel) pauseLabel.textContent = 'Pausa';
    }
  }

  // 4. Zoom Óptico
  let zoomSlider = document.getElementById('zoom-slider');
  let zoomVal = document.getElementById('zoom-val');
  if (zoomSlider && document.activeElement !== zoomSlider) zoomSlider.value = zoomFactor.toFixed(1);
  if (zoomVal) zoomVal.textContent = zoomFactor.toFixed(1) + 'x';

  // 5. Fusión de Elementos
  let fusionSlider = document.getElementById('fusion-slider');
  let fusionVal = document.getElementById('fusion-val');
  let fusionPct = Math.round(fusionAmount * 100);
  if (fusionSlider && document.activeElement !== fusionSlider) fusionSlider.value = fusionPct;
  if (fusionVal) fusionVal.textContent = fusionPct + '%';

  // 6. Estela Persistente (Decay)
  let decaySlider = document.getElementById('decay-slider');
  let decayVal = document.getElementById('decay-val');
  if (decaySlider && document.activeElement !== decaySlider) decaySlider.value = decay.toFixed(2);
  if (decayVal) decayVal.textContent = decay.toFixed(2);

  // 6b. Tinte Cromático
  let tintSlider = document.getElementById('tint-slider');
  let tintVal = document.getElementById('tint-val');
  if (tintSlider && document.activeElement !== tintSlider) tintSlider.value = tintAngle;
  if (tintVal) tintVal.textContent = getTintName(tintAngle);

  // 7. Fluidez Líquida (Warp)
  let warpSlider = document.getElementById('warp-slider');
  let warpVal = document.getElementById('warp-val');
  let warpPct = Math.round(fluidWarpFactor * 100);
  if (warpSlider && document.activeElement !== warpSlider) warpSlider.value = warpPct;
  if (warpVal) warpVal.textContent = warpPct + '%';

  // 8. Ancho de Pincel
  let brushSlider = document.getElementById('brush-slider');
  let brushVal = document.getElementById('brush-val');
  if (brushSlider && document.activeElement !== brushSlider) brushSlider.value = brushRadius;
  if (brushVal) brushVal.textContent = brushRadius + 'px';

  // 9. Paleta de Color
  document.querySelectorAll('.palette-chip').forEach(chip => {
    let mode = parseInt(chip.getAttribute('data-mode'));
    if (mode === currentModeIndex) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // 10. Audio & Resolución
  let soundLabel = document.getElementById('sound-label');
  if (soundLabel) soundLabel.textContent = soundEnabled ? 'ON' : 'OFF';

  let resLabel = document.getElementById('res-label');
  if (resLabel && RESOLUTION_MODES[currentResIndex]) {
    resLabel.textContent = RESOLUTION_MODES[currentResIndex].label;
  }
}

// =========================================================================
// ACCIONES VJ: TINTE CROMÁTICO, LUZ ROJA, WAVE DEFORM, PAUSA, AUDIO
// =========================================================================
function getTintName(angle) {
  if (angle <= 0) return 'Neutro';
  if (angle <= 45) return `Ámbar (${angle}°)`;
  if (angle <= 90) return `Dorado (${angle}°)`;
  if (angle <= 150) return `Esmeralda (${angle}°)`;
  if (angle <= 200) return `Cian (${angle}°)`;
  if (angle <= 250) return `Azul (${angle}°)`;
  if (angle <= 290) return `Púrpura (${angle}°)`;
  if (angle <= 335) return `Magenta (${angle}°)`;
  return `Rubí (${angle}°)`;
}

function setTintAngle(val, showHUD = true) {
  tintAngle = constrain(Math.round(val), 0, 360);
  if (tintAngle > 0) {
    lastActiveTintAngle = tintAngle;
  }
  let closestIdx = 0;
  let minDiff = 999;
  for (let i = 0; i < TINT_PRESETS.length; i++) {
    let diff = Math.abs(TINT_PRESETS[i].angle - tintAngle);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  currentTintPresetIndex = closestIdx;
  syncUIControls();
  if (showHUD) {
    showMidiHUD(`Tinte: ${getTintName(tintAngle)}`);
  }
}

function cycleTintColor(direction = 1) {
  currentTintPresetIndex = (currentTintPresetIndex + direction + TINT_PRESETS.length) % TINT_PRESETS.length;
  tintAngle = TINT_PRESETS[currentTintPresetIndex].angle;
  if (tintAngle > 0) {
    lastActiveTintAngle = tintAngle;
  }
  syncUIControls();
  showMidiHUD(`Tinte: ${TINT_PRESETS[currentTintPresetIndex].label}`);
}

function toggleTint() {
  if (tintAngle > 0) {
    lastActiveTintAngle = tintAngle;
    tintAngle = 0;
    currentTintPresetIndex = 0;
    syncUIControls();
    showMidiHUD("Tinte: Desactivado");
  } else {
    tintAngle = lastActiveTintAngle > 0 ? lastActiveTintAngle : 180;
    setTintAngle(tintAngle, false);
    showMidiHUD(`Tinte: ${getTintName(tintAngle)}`);
  }
}

function resetTint() {
  tintAngle = 0;
  currentTintPresetIndex = 0;
  syncUIControls();
  showMidiHUD("Tinte: Neutro");
}
function toggleRedLight() {
  isRedLightActive = !isRedLightActive;
  syncUIControls();
  showMidiHUD(isRedLightActive ? "Iluminación Roja ON" : "Iluminación Roja OFF");
}

function togglePause() {
  isPaused = !isPaused;
  syncUIControls();
  showMidiHUD(isPaused ? "Pausado" : "Reanudado");
}

const WAVE_PRESETS = [
  { label: '0% (Desactivado)', val: 0.0 },
  { label: '35% (Ondas Suaves)', val: 0.35 },
  { label: '70% (Deformación Intensa)', val: 0.70 },
  { label: '100% (Tsunami Líquido)', val: 1.0 }
];
let currentWaveIndex = 0;

function cycleWaveDeform() {
  currentWaveIndex = (currentWaveIndex + 1) % WAVE_PRESETS.length;
  waveDeformIntensity = WAVE_PRESETS[currentWaveIndex].val;
  triggerIntenseWave(120);
  syncUIControls();
  showMidiHUD(`Wave: ${WAVE_PRESETS[currentWaveIndex].label}`);
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  showMidiHUD(!fs ? "Pantalla Completa" : "Ventana Normal");
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  let currentSound = getCurrentSound();
  if (!soundEnabled && currentSound && currentSound.isPlaying()) {
    currentSound.setVolume(0.0, 0.1);
  }
  if (soundEnabled && !audioStarted) {
    userStartAudio();
    audioStarted = true;
  }
  syncUIControls();
  showMidiHUD(soundEnabled ? "Audio ON" : "Audio Silenciado");
}

function cycleResolution() {
  currentResIndex = (currentResIndex + 1) % RESOLUTION_MODES.length;
  resolution = RESOLUTION_MODES[currentResIndex].val;
  rebuildAtCurrentResolution();
  syncUIControls();
  showMidiHUD(`Nitidez: ${RESOLUTION_MODES[currentResIndex].label}`);
}

function setUIVisible(show) {
  uiVisible = show;
  let ui = document.getElementById('ui-container');
  let btnToggle = document.getElementById('btn-toggle-ui');
  if (ui) {
    if (uiVisible) ui.classList.remove('hidden');
    else ui.classList.add('hidden');
  }
  if (btnToggle) {
    btnToggle.style.display = uiVisible ? 'none' : 'flex';
  }
}

function setupDragAndDrop() {
  let overlay = document.getElementById('drop-overlay');

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (overlay) overlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null && overlay) {
      overlay.classList.remove('active');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (overlay) overlay.classList.remove('active');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let files = Array.from(e.dataTransfer.files);
      let audioFiles = files.filter(f => f.type.startsWith('audio/') || /\.(wav|mp3|ogg|m4a|aac|flac)$/i.test(f.name));
      let videoFiles = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|ogv|m4v)$/i.test(f.name));
      let imageFiles = files.filter(isImageFile);

      if (videoFiles.length > 0) {
        loadCustomVideoFile(videoFiles[0]);
      }
      if (audioFiles.length > 0) {
        loadCustomAudioFile(audioFiles[0]);
      }
      if (imageFiles.length > 0) {
        loadFilesIntoGallery(imageFiles);
      }
    }
  });
}

function loadCustomAudioFile(file) {
  let cleanName = file.name.replace(/\.[^/.]+$/, "");
  let blobUrl = URL.createObjectURL(file);
  loadSound(blobUrl, (snd) => {
    let currentSound = getCurrentSound();
    if (currentSound && currentSound.isPlaying()) {
      currentSound.stop();
    }
    audioList.push({ name: cleanName, sound: snd });
    currentAudioIndex = audioList.length - 1;
    updateAudioLabel();
    showMidiHUD(`Canción: ${cleanName}`);
    console.log("Canción cargada con éxito:", cleanName);
  }, (err) => {
    console.error("Error al cargar archivo de audio:", err);
    showMidiHUD("Error al leer audio");
  });
}

function isImageFile(f) {
  return f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(f.name);
}

function loadFilesIntoGallery(files) {
  let validFiles = Array.from(files).filter(isImageFile);
  if (validFiles.length === 0) return;

  let newImages = [];
  let loadedCount = 0;

  for (let file of validFiles) {
    let reader = new FileReader();
    reader.onload = (event) => {
      loadImage(event.target.result, (p5Img) => {
        let cleanName = file.name.replace(/\.[^/.]+$/, "");
        newImages.push({
          name: cleanName,
          sourceImg: p5Img,
          data: resampleP5Image(p5Img)
        });
        loadedCount++;
        if (loadedCount === validFiles.length) {
          // Reemplazar la galería por las imágenes subidas
          imagesList = newImages;
          currentIndex = 0;
          nextIndex = imagesList.length > 1 ? 1 : 0;
          seedCurrentToNext(currentIndex, nextIndex);
          updateBadge();
        }
      }, (err) => {
        console.error("Error al decodificar la imagen:", err);
      });
    };
    reader.readAsDataURL(file);
  }
}

function triggerNextTransition() {
  if (imagesList.length <= 1) return;
  currentIndex = nextIndex;
  nextIndex = (nextIndex + 1) % imagesList.length;
  seedCurrentToNext(currentIndex, nextIndex);
}

function triggerPrevTransition() {
  if (imagesList.length <= 1) return;
  nextIndex = currentIndex;
  currentIndex = (currentIndex - 1 + imagesList.length) % imagesList.length;
  seedCurrentToNext(currentIndex, nextIndex);
}

function updateBadge() {
  let badge = document.getElementById('image-badge');
  if (badge && imagesList.length > 0) {
    badge.textContent = `${imagesList[currentIndex].name} (${currentIndex + 1} de ${imagesList.length})`;
  }
}

// =========================================================================
// ATAJOS DE TECLADO
// =========================================================================
function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    triggerNextTransition();
  } else if (keyCode === RIGHT_ARROW) {
    triggerNextTransition();
  } else if (keyCode === LEFT_ARROW) {
    triggerPrevTransition();
  } else if (key === 'c' || key === 'C') {
    setColorMode((currentModeIndex + 1) % COLOR_MODES.length);
  } else if (key === 't' || key === 'T') {
    cycleTintColor(1);
  } else if (key === 'p' || key === 'P') {
    togglePause();
  } else if (key === '1') {
    setSourceMode('IMAGENES');
  } else if (key === '2') {
    setSourceMode('CAMARA');
  } else if (key === '3') {
    setSourceMode('VIDEO');
  } else if (key === 'f' || key === 'F') {
    toggleFullscreen();
  } else if (key === 'a' || key === 'A') {
    switchNextAudioTrack();
  } else if (key === 'm' || key === 'M') {
    toggleSound();
  } else if (key === 'x' || key === 'X') {
    cycleFusion();
  } else if (key === 'e' || key === 'E') {
    cycleTrail();
  } else if (key === 'z' || key === 'Z') {
    cycleZoom();
  } else if (key === 'b' || key === 'B') {
    cycleBrushSize();
  } else if (key === 'r' || key === 'R') {
    toggleRedLight();
  } else if (key === 'w' || key === 'W') {
    cycleWaveDeform();
  } else if (key === 'h' || key === 'H') {
    setUIVisible(!uiVisible);
  }
}

function setColorMode(idx) {
  currentModeIndex = idx % COLOR_MODES.length;
  syncUIControls();
  showMidiHUD(`Paleta: ${COLOR_MODES[currentModeIndex]}`);
}

// =========================================================================
// GESTIÓN DE FUENTES VJ (FOTOS, CÁMARA EN VIVO, VIDEO LOOPS)
// =========================================================================
function setSourceMode(newMode) {
  currentSource = newMode;
  syncUIControls();

  let btnUploadImg = document.getElementById('btn-upload');
  let btnUploadVid = document.getElementById('btn-video-upload');

  if (newMode === 'IMAGENES') {
    document.getElementById('src-images')?.classList.add('active');
    if (btnUploadImg) btnUploadImg.style.display = 'flex';
    if (btnUploadVid) btnUploadVid.style.display = 'none';
    showMidiHUD("Modo Fotos");
    updateBadge();
  } else if (newMode === 'CAMARA') {
    document.getElementById('src-camera')?.classList.add('active');
    if (btnUploadImg) btnUploadImg.style.display = 'none';
    if (btnUploadVid) btnUploadVid.style.display = 'none';
    showMidiHUD("Cámara Web en Vivo");
    let badge = document.getElementById('image-badge');
    if (badge) badge.textContent = "Cámara Web en Vivo";

    if (!videoCapture) {
      initWebcam();
    }
  } else if (newMode === 'VIDEO') {
    document.getElementById('src-video')?.classList.add('active');
    if (btnUploadImg) btnUploadImg.style.display = 'none';
    if (btnUploadVid) btnUploadVid.style.display = 'flex';
    showMidiHUD("Modo Video Loop");
    let badge = document.getElementById('image-badge');
    if (badge) badge.textContent = `Video: ${videoName}`;

    if (videoPlayer && videoReady) {
      videoPlayer.loop();
      videoPlayer.play();
    } else {
      let videoFileInput = document.getElementById('video-file-input');
      if (videoFileInput && !videoReady) {
        showMidiHUD("Cargá o arrastrá un video");
      }
    }
  }
}

function initWebcam() {
  let badge = document.getElementById('image-badge');
  if (badge) badge.textContent = "Conectando Cámara...";
  videoCapture = createCapture(VIDEO, () => {
    cameraReady = true;
    if (badge && currentSource === 'CAMARA') badge.textContent = "Cámara Web Activa";
    console.log("Cámara web lista.");
  });
  videoCapture.size(320, 240);
  videoCapture.hide();
}

function loadCustomVideoFile(file) {
  let cleanName = file.name.replace(/\.[^/.]+$/, "");
  let blobUrl = URL.createObjectURL(file);
  let badge = document.getElementById('image-badge');
  if (badge) badge.textContent = `Cargando video: ${cleanName}...`;

  if (videoPlayer) {
    videoPlayer.stop();
    videoPlayer.remove();
  }

  videoPlayer = createVideo(blobUrl, () => {
    videoReady = true;
    videoName = cleanName;
    videoPlayer.volume(0); // Loops sin audio para no colisionar con la música
    videoPlayer.loop();
    videoPlayer.hide();
    setSourceMode('VIDEO');
    showMidiHUD(`Video: ${cleanName}`);
    console.log("Video loop cargado con éxito:", cleanName);
  });
}

// =========================================================================
// RETROALIMENTACIÓN VISUAL HUD FLOTANTE
// =========================================================================
let hudTimeout = null;
function showMidiHUD(arg1, arg2) {
  let text = arg2 !== undefined ? arg2 : arg1;
  if (!text) return;
  text = String(text).replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}]/gu, '').trim();
  let hud = document.getElementById('midi-hud');
  if (!hud) return;
  hud.innerHTML = `<span class="hud-val">${text}</span>`;
  hud.classList.add('active');
  if (hudTimeout) clearTimeout(hudTimeout);
  hudTimeout = setTimeout(() => {
    hud.classList.remove('active');
  }, 1200);
}

// =========================================================================
// ONDA DE CHOQUE LÍQUIDA POR SENSIBILIDAD MIDI (VELOCITY)
// =========================================================================
function injectShockwave(gridX, gridY, velocity) {
  let r = floor(map(velocity, 0, 127, 8, brushRadius * 1.6) / resolution);
  let power = map(velocity, 0, 127, 90, 520);

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      let x = (gridX + dx + cols) % cols;
      let y = (gridY + dy + rows) % rows;
      let d = sqrt(dx * dx + dy * dy);
      if (d <= r) {
        let energy = (1 - d / r) * power;
        let idx = y * cols + x;
        gridR[idx] += energy;
        gridG[idx] += energy * 0.9;
        gridB[idx] += energy * 1.35;
      }
    }
  }
}

// =========================================================================
// ONDA DE CHOQUE LÍQUIDA MASIVA (WAVE INTENSO)
// =========================================================================
function triggerIntenseWave(velocity = 127) {
  let centerX = floor(cols * 0.5);
  let centerY = floor(rows * 0.5);
  let maxR = floor(max(cols, rows) * 0.75);
  let power = map(velocity, 0, 127, 450, 1400);

  // Inyectar ondas sinusoidales concéntricas masivas por toda la pantalla
  for (let y = 0; y < rows; y++) {
    let dy = y - centerY;
    let cur = y * cols;
    for (let x = 0; x < cols; x++) {
      let dx = x - centerX;
      let d = sqrt(dx * dx + dy * dy);
      if (d < maxR) {
        let wave = sin(d * 0.28) * (1.0 - d / maxR) * power;
        let idx = cur + x;
        gridR[idx] += wave;
        gridG[idx] += wave * 0.85;
        gridB[idx] += wave * 1.45;
      }
    }
  }

  // Aceleración y distorsión líquida momentánea (tsunami visual)
  pitchBendWarpOffset = 2.4;
  setTimeout(() => {
    pitchBendWarpOffset = 0.0;
  }, 450);

  showMidiHUD(`WAVE INTENSO (${velocity})`);
}

// =========================================================================
// MOTOR WEB MIDI (ARTURIA MICROLAB Y CONTROLADORES ESTÁNDAR)
// =========================================================================
function initWebMIDI() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: false })
      .then(onMIDISuccess, onMIDIFailure);
  } else {
    console.warn("Web MIDI API no soportada en este navegador.");
    let badge = document.getElementById('midi-badge');
    if (badge) badge.textContent = "MIDI: Usá Chrome / Edge";
  }
}

function onMIDISuccess(midiAccess) {
  let badge = document.getElementById('midi-badge');
  let inputs = midiAccess.inputs.values();
  let count = 0;
  for (let input of inputs) {
    input.onmidimessage = handleMIDIMessage;
    midiDeviceName = input.name || "Arturia MicroLab";
    count++;
  }

  if (count > 0) {
    midiConnected = true;
    if (badge) {
      badge.textContent = `MIDI: ${midiDeviceName}`;
      badge.classList.add('connected');
    }
    showMidiHUD(`${midiDeviceName} Conectado`);
  } else {
    if (badge) {
      badge.textContent = "MIDI: Conecta tu Arturia por USB";
      badge.classList.remove('connected');
    }
  }

  midiAccess.onstatechange = (e) => {
    if (e.port.type === 'input') {
      if (e.port.state === 'connected') {
        e.port.onmidimessage = handleMIDIMessage;
        midiConnected = true;
        midiDeviceName = e.port.name || "Arturia MicroLab";
        if (badge) {
          badge.textContent = `MIDI: ${midiDeviceName}`;
          badge.classList.add('connected');
        }
        showMidiHUD(`${midiDeviceName} Conectado`);
      } else {
        midiConnected = false;
        if (badge) {
          badge.textContent = "MIDI: Desconectado";
          badge.classList.remove('connected');
        }
        showMidiHUD("MIDI Desconectado");
      }
    }
  };
}

function onMIDIFailure(err) {
  console.warn("No se pudo acceder a Web MIDI:", err);
}

function handleMIDIMessage(event) {
  let status = event.data[0];
  let cmd = status >> 4;
  let ch = status & 0xf;
  let d1 = event.data[1];
  let d2 = event.data.length > 2 ? event.data[2] : 0;

  // 1. TIRA DE PITCH BEND (0xE)
  if (cmd === 0xE) {
    let bendRaw = (d2 << 7) | d1;
    let bendNorm = (bendRaw - 8192) / 8192.0; // -1.0 a +1.0
    if (bendNorm > 0.05) {
      pitchBendWarpOffset = bendNorm * 3.5;
      showMidiHUD(`Warp Glitch: +${Math.round(bendNorm * 100)}%`);
    } else {
      pitchBendWarpOffset = 0.0;
    }
    return;
  }

  // 2. CONTROL CHANGE (0xB) - Tira MOD de Arturia MicroLab (CC 1)
  if (cmd === 0xB) {
    let ccNum = d1;
    let ccVal = d2;
    if (ccNum === 1) { // Modulation Strip
      fluidWarpFactor = (ccVal / 127.0) * 2.0;
      syncUIControls();
      showMidiHUD(`Fluidez: ${Math.round(fluidWarpFactor * 100)}%`);
    } else if (ccNum === 74 || ccNum === 71 || ccNum === 7) {
      masterVolume = ccVal / 127.0;
      let volSlider = document.getElementById('vol-slider');
      let volVal = document.getElementById('vol-val');
      if (volSlider) volSlider.value = Math.round(masterVolume * 100);
      if (volVal) volVal.textContent = Math.round(masterVolume * 100) + '%';
      showMidiHUD(`Volumen: ${Math.round(masterVolume * 100)}%`);
    }
    return;
  }

  // 3. NOTE ON (0x9 con velocity > 0)
  if (cmd === 0x9 && d2 > 0) {
    handleNoteOn(d1, d2);
    return;
  }

  // 4. NOTE OFF (0x8 o Note On con velocity 0)
  if (cmd === 0x8 || (cmd === 0x9 && d2 === 0)) {
    handleNoteOff(d1);
    return;
  }
}

function handleNoteOn(note, velocity) {
  // Onda de choque en pantalla según la tecla pulsada
  let relIndex = (note - 48);
  if (relIndex < 0 || relIndex > 24) {
    relIndex = ((note % 25) + 25) % 25;
  }
  let gx = floor(map(relIndex, 0, 24, cols * 0.08, cols * 0.92));
  let gy = floor(rows * 0.5 + sin(note * 0.5) * (rows * 0.22));
  injectShockwave(gx, gy, velocity);

  let pitch = note % 12; // 0=Do, 2=Re, 4=Mi, 5=Fa, 7=Sol, etc.

  // ZONA 1: GRAVES (Notas < 56 / Teclas 1 a 8) -> Fuentes, Fusión y Estela
  if (note < 56) {
    if (pitch === 0) { // Do (Nota 48 / Tecla 1): Fuente FOTOS
      setSourceMode('IMAGENES');
    } else if (pitch === 2) { // Re (Nota 50 / Tecla 3): Fuente CÁMARA
      setSourceMode('CAMARA');
    } else if (pitch === 4) { // Mi (Nota 52 / Tecla 5): Fuente VIDEO LOOP
      setSourceMode('VIDEO');
    } else if (pitch === 5) { // Fa (Nota 53 / Tecla 6): FUSIÓN DE ELEMENTOS
      cycleFusion();
    } else if (pitch === 7) { // Sol (Nota 55 / Tecla 8): MAYOR ESTELA PERSISTENTE
      cycleTrail();
    }
    return;
  }

  // ZONA 2A: CONTROL DE TINTE CROMÁTICO (Notas 56 a 59 / Teclas 9 a 12)
  if (note >= 56 && note < 60) {
    if (note === 56) { // Sol#2 (Nota 56 / Tecla 9): Reset Tinte Neutro (0°)
      resetTint();
    } else if (note === 57) { // La2 (Nota 57 / Tecla 10): Ciclar Tinte Siguiente
      cycleTintColor(1);
    } else if (note === 58) { // La#2 (Nota 58 / Tecla 11): Alternar Tinte ON / OFF
      toggleTint();
    } else if (note === 59) { // Si2 (Nota 59 / Tecla 12): Ciclar Tinte Anterior
      cycleTintColor(-1);
    }
    return;
  }

  // ZONA 2B: MEDIOS (Notas 60 a 67 / Teclas 13 a 20) -> Paletas y Zoom
  if (note >= 60 && note < 68) {
    if (pitch === 0) { // Do3 (Nota 60 / Tecla 13): RGB Original
      setColorMode(0);
    } else if (pitch === 2) { // Re3 (Nota 62 / Tecla 15): Neón Ciber
      setColorMode(1);
    } else if (pitch === 4) { // Mi3 (Nota 64 / Tecla 17): ZOOM ÓPTICO
      cycleZoom();
    } else if (pitch === 5) { // Fa3 (Nota 65 / Tecla 18): B&N FOTOCOPIA
      setColorMode(2);
    } else if (pitch === 7) { // Sol3 (Nota 67 / Tecla 20): B&N ORGÁNICO
      setColorMode(3);
    }
    return;
  }

  // ZONA 3: AGUDOS (Notas >= 68 / Teclas 21 a 25) -> Rayos X, Wave, Glitch, Luz Roja y Pincel
  if (note >= 68) {
    if (note === 68) { // Sol#3 (Nota 68 / Tecla 21): INVERTIDO / RAYOS X
      setColorMode(4);
    } else if (pitch === 9) { // La3 (Nota 69 / Tecla 22): WAVE DEFORMACIÓN EN ONDAS
      cycleWaveDeform();
    } else if (pitch === 10 || note === 70) { // La#3 (Nota 70 / Tecla 23): GLITCH ANALÓGICO PUNCH-IN
      isGlitchActive = true;
      showMidiHUD("Glitch Analógico");
    } else if (pitch === 11) { // Si3 (Nota 71 / Tecla 24): FX ILUMINACIÓN ROJA
      toggleRedLight();
    } else if (pitch === 0) { // Do4 (Nota 72 / Tecla 25): ANCHO DEL PINCEL
      cycleBrushSize();
    } else if (pitch === 2) { // Re agudo: Glitch
      isGlitchActive = true;
      showMidiHUD("Glitch Analógico");
    } else if (pitch === 4) { // Mi agudo: Freeze Frame
      isFreezeActive = true;
      showMidiHUD("Freeze Frame");
    } else {
      triggerIntenseWave(velocity);
    }
  }
}

function handleNoteOff(note) {
  let pitch = note % 12;
  if (note >= 68) {
    if (pitch === 2 || pitch === 10 || note === 70) {
      isGlitchActive = false;
    } else if (pitch === 4) {
      isFreezeActive = false;
    }
  }
}

// =========================================================================
// FUNCIONES DE CONTROL VJ (FUSIÓN, ESTELA, ZOOM, PINCEL)
// =========================================================================
function cycleFusion() {
  currentFusionIndex = (currentFusionIndex + 1) % FUSION_PRESETS.length;
  fusionAmount = FUSION_PRESETS[currentFusionIndex].val;
  syncUIControls();
  showMidiHUD(`Fusión: ${FUSION_PRESETS[currentFusionIndex].label}`);
}

function cycleTrail() {
  currentTrailIndex = (currentTrailIndex + 1) % TRAIL_PRESETS.length;
  decay = TRAIL_PRESETS[currentTrailIndex].decay;
  syncUIControls();
  showMidiHUD(`Estela: ${TRAIL_PRESETS[currentTrailIndex].label}`);
}

function cycleZoom() {
  currentZoomIndex = (currentZoomIndex + 1) % ZOOM_PRESETS.length;
  zoomFactor = ZOOM_PRESETS[currentZoomIndex].factor;
  syncUIControls();
  showMidiHUD(`Zoom: ${ZOOM_PRESETS[currentZoomIndex].label}`);
}

function cycleBrushSize() {
  currentBrushIndex = (currentBrushIndex + 1) % BRUSH_PRESETS.length;
  brushRadius = BRUSH_PRESETS[currentBrushIndex].radius;
  syncUIControls();
  showMidiHUD(`Pincel: ${BRUSH_PRESETS[currentBrushIndex].label}`);
}
