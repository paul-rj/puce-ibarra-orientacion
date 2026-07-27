// Tolerancia de puntería: ángulo (grados) y distancia (metros) dentro de los
// cuales se considera que la cámara está "apuntando" a un edificio.
const ANGULO_MAXIMO = 15
const DISTANCIA_MAXIMA = 300
// Frames de gracia antes de ocultar el cartel al perder el objetivo, para evitar parpadeos.
const FRAMES_TOLERANCIA = 12

let miUbicacion = null
let entidadesEdificios = [] // { edificio, entidad }
let cartelIdActual = null
let framesSinObjetivo = 0

// Diagnóstico temporal de brújula (ver también public/ar.css #compass-debug
// y el aviso al final de este archivo). Se actualiza cada ~150ms, no cada
// frame, para no saturar el DOM.
let ultimaActualizacionDebug = 0

// Cuando ar-qr.js detecta un QR de aula, toma control exclusivo del cartel
// (indoor manda sobre el apuntado por GPS/brújula, que es una guía más
// aproximada). Ver public/ar-qr.js.
let qrActivo = false

function bucleApuntado() {
  requestAnimationFrame(bucleApuntado)
  if (qrActivo) return

  const camaraEl = document.querySelector('[gps-new-camera]')
  if (!camaraEl || !camaraEl.object3D || !window.AFRAME) return
  const THREE = AFRAME.THREE

  const camObj = camaraEl.object3D
  const rotacionCamara = new THREE.Quaternion()
  camObj.getWorldQuaternion(rotacionCamara)
  const adelante = new THREE.Vector3(0, 0, -1).applyQuaternion(rotacionCamara)
  const posicionCamara = new THREE.Vector3()
  camObj.getWorldPosition(posicionCamara)

  let mejor = null
  let mejorAngulo = ANGULO_MAXIMO
  const infoDebug = []

  entidadesEdificios.forEach(item => {
    const obj = item.entidad.object3D
    if (obj.visible === false) return

    const posicionEntidad = new THREE.Vector3()
    obj.getWorldPosition(posicionEntidad)
    const direccion = posicionEntidad.clone().sub(posicionCamara)
    if (direccion.lengthSq() < 0.0001) return
    direccion.normalize()

    const anguloGrados = THREE.MathUtils.radToDeg(adelante.angleTo(direccion))
    const distancia = miUbicacion
      ? distanciaMetros(miUbicacion.lat, miUbicacion.lon, item.edificio.latitud, item.edificio.longitud)
      : null
    const rumbo = miUbicacion
      ? rumboGrados(miUbicacion.lat, miUbicacion.lon, item.edificio.latitud, item.edificio.longitud)
      : null
    infoDebug.push({ nombre: item.edificio.nombre, anguloGrados, distancia, rumbo })

    if (anguloGrados >= mejorAngulo) return
    if (distancia != null && distancia > DISTANCIA_MAXIMA) return

    mejorAngulo = anguloGrados
    mejor = { item, distancia }
  })

  actualizarPanelDebug(camaraEl, infoDebug)

  if (mejor) {
    framesSinObjetivo = 0
    if (mejor.item.edificio.id !== cartelIdActual) {
      cartelIdActual = mejor.item.edificio.id
      mostrarCartel(mejor.item.edificio, mejor.distancia)
    } else {
      actualizarDistanciaCartel(mejor.distancia)
    }
  } else if (cartelIdActual !== null) {
    framesSinObjetivo++
    if (framesSinObjetivo > FRAMES_TOLERANCIA) {
      cartelIdActual = null
      ocultarCartel()
    }
  }
}

// Descripción recortada para el cartel 3D: en el mundo AR un texto muy largo
// se vuelve ilegible (letras enormes o desbordadas), así que solo mostramos
// un resumen corto ahí; la descripción completa se ve en el panel de la
// interfaz (mostrarCartel, en ar-cartel.js).
function resumenDescripcion(descripcion, maxCaracteres = 90) {
  if (!descripcion) return 'Sin descripción disponible.'
  return descripcion.length > maxCaracteres
    ? `${descripcion.slice(0, maxCaracteres).trim()}…`
    : descripcion
}

function crearEntidadEdificio(edificio, scene) {
  const entidad = document.createElement('a-entity')
  entidad.setAttribute('gps-new-entity-place', {
    latitude: edificio.latitud,
    longitude: edificio.longitud
  })
  // El cartel siempre gira para quedar de frente a la cámara del usuario
  entidad.setAttribute('look-at', '[gps-new-camera]')

  const caja = document.createElement('a-box')
  caja.setAttribute('color', '#0d3b7a')
  caja.setAttribute('opacity', '0.88')
  caja.setAttribute('width', '5')
  caja.setAttribute('height', '2.6')
  caja.setAttribute('depth', '0.12')

  const linea = document.createElement('a-box')
  linea.setAttribute('color', '#3b82f6')
  linea.setAttribute('width', '5')
  linea.setAttribute('height', '0.08')
  linea.setAttribute('depth', '0.13')
  linea.setAttribute('position', '0 0.55 0')

  const titulo = document.createElement('a-text')
  titulo.setAttribute('value', edificio.nombre)
  titulo.setAttribute('color', '#ffffff')
  titulo.setAttribute('align', 'center')
  titulo.setAttribute('width', '4.6')
  titulo.setAttribute('position', '0 0.9 0.07')

  const descripcion = document.createElement('a-text')
  descripcion.setAttribute('value', resumenDescripcion(edificio.descripcion))
  descripcion.setAttribute('color', '#dbeafe')
  descripcion.setAttribute('align', 'center')
  descripcion.setAttribute('width', '4.3')
  descripcion.setAttribute('wrap-count', '32')
  descripcion.setAttribute('position', '0 0.1 0.07')

  const punto = document.createElement('a-sphere')
  punto.setAttribute('color', '#22c55e')
  punto.setAttribute('radius', '0.15')
  punto.setAttribute('position', '0 -1.9 0')

  entidad.appendChild(caja)
  entidad.appendChild(linea)
  entidad.appendChild(titulo)
  entidad.appendChild(descripcion)
  entidad.appendChild(punto)
  scene.appendChild(entidad)

  entidadesEdificios.push({ edificio, entidad })
}

// Panel de diagnóstico temporal: muestra el heading crudo que reporta
// gps-new-camera (brújula) y, para cada edificio, el rumbo real (GPS→GPS)
// contra el ángulo que el motor AR calcula respecto a hacia dónde mira la
// cámara. Sirve para confirmar en el celular si la brújula del dispositivo
// está invertida o desfasada (síntoma: edificios que aparecen intercambiados
// o que nunca entran en el rango de puntería). Girar el teléfono lentamente
// en sentido horario debería subir el "heading"; si baja, la brújula está
// invertida. Quitar esta función y su llamada una vez resuelto el problema.
function actualizarPanelDebug(camaraEl, infoDebug) {
  const ahora = performance.now()
  if (ahora - ultimaActualizacionDebug < 150) return
  ultimaActualizacionDebug = ahora

  const panel = document.getElementById('compass-debug')
  if (!panel) return
  panel.classList.add('visible')

  const comp = camaraEl.components && camaraEl.components['gps-new-camera']
  const heading = comp && typeof comp.heading === 'number' ? comp.heading.toFixed(1) : '—'
  const ubicacionTexto = miUbicacion
    ? `${miUbicacion.lat.toFixed(6)}, ${miUbicacion.lon.toFixed(6)}`
    : 'esperando GPS...'

  const filas = infoDebug
    .slice()
    .sort((a, b) => a.anguloGrados - b.anguloGrados)
    .map(info => {
      const rumbo = info.rumbo != null ? `${info.rumbo.toFixed(0)}°` : '—'
      const dist = info.distancia != null ? `${Math.round(info.distancia)}m` : '—'
      return `${info.nombre.padEnd(14)} ang=${info.anguloGrados.toFixed(0).padStart(3)}° rumbo=${rumbo.padStart(4)} dist=${dist}`
    })
    .join('\n')

  panel.textContent =
    `heading (brújula): ${heading}°\n` +
    `mi ubicación: ${ubicacionTexto}\n` +
    `${filas}`
}

async function iniciarAR() {
  rastrearUbicacion((ubicacion) => { miUbicacion = ubicacion })
  document.getElementById('status-texto').textContent = 'Cargando edificios...'
  const edificiosCrudos = await cargarEdificios()
  const edificios = Array.isArray(edificiosCrudos)
    ? edificiosCrudos.filter(e => coordenadaValida(e.latitud, e.longitud))
    : []
  const scene = document.querySelector('a-scene')

  document.getElementById('loading').style.display = 'none'
  document.getElementById('contador').style.display = 'block'
  document.getElementById('num-edificios').textContent = edificios.length
  document.getElementById('status-texto').textContent =
    `GPS activo · ${edificios.length} edificios`

  edificios.forEach(edificio => crearEntidadEdificio(edificio, scene))

  requestAnimationFrame(bucleApuntado)
}

window.addEventListener('load', iniciarAR)
