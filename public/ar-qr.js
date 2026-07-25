// AR indoor: detecta el QR pegado junto a una puerta y muestra el cartel
// del aula correspondiente. Tiene prioridad sobre el apuntado por
// GPS/brújula de ar-escena.js (ver la bandera compartida `qrActivo`).
const INTERVALO_ESCANEO_MS = 350
// Lecturas fallidas seguidas antes de ocultar el cartel del aula, para
// tolerar que el QR salga un instante del cuadro sin que parpadee.
const TOLERANCIA_QR = 4
const ANCHO_MUESTREO = 480

let aulasPorCodigo = {}
let nombresEdificiosPorId = {}
let ultimoCodigoQr = null
let scansSinLecturaQr = 0
let canvasQr = null
let ctxQr = null

function esperarVideoAR() {
  return new Promise(resolve => {
    const inicio = Date.now()
    let avisado = false
    const intento = () => {
      const video = document.getElementById('arjs-video')
      if (video && video.readyState >= 2) {
        resolve(video)
      } else {
        if (!avisado && Date.now() - inicio > 8000) {
          avisado = true
          console.warn('[ar-qr] el video de la cámara (#arjs-video) no está listo tras 8s; el escaneo de QR no puede iniciar todavía', { existe: !!video, readyState: video && video.readyState })
        }
        setTimeout(intento, 300)
      }
    }
    intento()
  })
}

function leerQrDeFrame(video) {
  if (!canvasQr) {
    canvasQr = document.createElement('canvas')
    ctxQr = canvasQr.getContext('2d', { willReadFrequently: true })
  }
  const proporcion = video.videoHeight / video.videoWidth || 0.75
  const ancho = ANCHO_MUESTREO
  const alto = Math.round(ancho * proporcion)
  if (canvasQr.width !== ancho || canvasQr.height !== alto) {
    canvasQr.width = ancho
    canvasQr.height = alto
  }
  ctxQr.drawImage(video, 0, 0, ancho, alto)
  const imageData = ctxQr.getImageData(0, 0, ancho, alto)
  return jsQR(imageData.data, ancho, alto, { inversionAttempts: 'dontInvert' })
}

function procesarLecturaQr(video) {
  let resultado = null
  try {
    resultado = leerQrDeFrame(video)
  } catch (error) {
    console.warn('[ar-qr] no se pudo leer el frame de video (se reintenta):', error)
    return
  }

  const codigo = resultado && resultado.data.startsWith(QR_PREFIJO_AULA)
    ? resultado.data.slice(QR_PREFIJO_AULA.length).trim()
    : null
  const aula = codigo ? aulasPorCodigo[codigo] : null

  if (aula) {
    scansSinLecturaQr = 0
    if (ultimoCodigoQr !== codigo) {
      ultimoCodigoQr = codigo
      qrActivo = true
      // El apuntado por GPS quedó "congelado" mientras había QR activo;
      // al volver, que reevalúe desde cero en vez de asumir que ya mostró algo.
      cartelIdActual = null
      mostrarCartelAula(aula, nombresEdificiosPorId[aula.edificio_id])
    }
    return
  }

  if (ultimoCodigoQr !== null) {
    scansSinLecturaQr++
    if (scansSinLecturaQr > TOLERANCIA_QR) {
      ultimoCodigoQr = null
      scansSinLecturaQr = 0
      qrActivo = false
      ocultarCartel()
    }
  }
}

async function iniciarQR() {
  const [aulas, edificios] = await Promise.all([cargarAulas(), cargarEdificios()])

  if (!aulas.length) {
    console.warn('[ar-qr] no se cargó ninguna aula desde Supabase; el escaneo de QR no se inicia')
    return
  }

  aulasPorCodigo = {}
  aulas.forEach(a => { aulasPorCodigo[a.codigo] = a })

  nombresEdificiosPorId = {}
  ;(Array.isArray(edificios) ? edificios : []).forEach(e => { nombresEdificiosPorId[e.id] = e.nombre })

  const video = await esperarVideoAR()
  setInterval(() => procesarLecturaQr(video), INTERVALO_ESCANEO_MS)
}

window.addEventListener('load', iniciarQR)
