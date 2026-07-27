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

let controlesOrientacion = null // instancia interna de arjs-device-orientation-controls, una vez encontrada
let headingActual = null // grados 0-360, sentido horario, 0 = norte real
let eventosOrientacion = 0 // cuántos eventos deviceorientation llegaron (diagnóstico)
let azimutCamara = null // grados 0-360: hacia dónde mira realmente la cámara en la escena 3D
let ultimaActualizacionDebug = 0

let qrActivo = false

function bucleApuntado() {
  requestAnimationFrame(bucleApuntado)
  if (qrActivo) return

  const camaraEl = document.querySelector('[gps-new-camera]')
  if (!camaraEl || !camaraEl.object3D || !window.AFRAME) return
  asegurarControlPorOrientacion(camaraEl)
  const THREE = AFRAME.THREE

  const camObj = camaraEl.object3D
  const rotacionCamara = new THREE.Quaternion()
  camObj.getWorldQuaternion(rotacionCamara)
  const adelante = new THREE.Vector3(0, 0, -1).applyQuaternion(rotacionCamara)
  const posicionCamara = new THREE.Vector3()
  camObj.getWorldPosition(posicionCamara)
  azimutCamara = ((Math.atan2(adelante.x, -adelante.z) * 180 / Math.PI) + 360) % 360

  let mejor = null
  let mejorAngulo = ANGULO_MAXIMO
  const infoDebug = []

  entidadesEdificios.forEach(item => {
    const obj = item.entidad.object3D
    if (obj.visible === false) return
    if (!miUbicacion) return

    // Posicionamos el cartel nosotros mismos con la distancia/rumbo real
    // (Haversine) entre el GPS ya validado (rastrearUbicacion, ar-datos.js)
    // y las coordenadas del edificio guardadas en Supabase, en vez de dejar
    // que gps-new-entity-place lo ubique con el GPS interno de AR.js: ese
    // GPS interno se quedaba sin actualizar la posición de la cámara,
    // dejando a los edificios "flotando" en coordenadas absolutas gigantes
    // que no correspondían a la posición real de la cámara en la escena.
    const distancia = distanciaMetros(
      miUbicacion.lat, miUbicacion.lon, item.edificio.latitud, item.edificio.longitud
    )
    const rumbo = rumboGrados(
      miUbicacion.lat, miUbicacion.lon, item.edificio.latitud, item.edificio.longitud
    )
    const rumboRad = rumbo * Math.PI / 180
    const dx = distancia * Math.sin(rumboRad)
    const dz = -distancia * Math.cos(rumboRad)
    obj.position.set(posicionCamara.x + dx, obj.position.y, posicionCamara.z + dz)

    const direccion = new THREE.Vector3(dx, 0, dz)
    if (direccion.lengthSq() < 0.0001) return
    direccion.normalize()

    const anguloGrados = THREE.MathUtils.radToDeg(adelante.angleTo(direccion))
    infoDebug.push({ nombre: item.edificio.nombre, anguloGrados, distancia, rumbo, dx, dz })

    if (anguloGrados >= mejorAngulo) return
    if (distancia > DISTANCIA_MAXIMA) return

    mejorAngulo = anguloGrados
    mejor = { item, distancia }
  })

  actualizarPanelDebug(camaraEl, infoDebug, posicionCamara)

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

function resumenDescripcion(descripcion, maxCaracteres = 90) {
  if (!descripcion) return 'Sin descripción disponible.'
  return descripcion.length > maxCaracteres
    ? `${descripcion.slice(0, maxCaracteres).trim()}…`
    : descripcion
}

function crearEntidadEdificio(edificio, scene) {
  const entidad = document.createElement('a-entity')
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

// Escucha el sensor de orientación directamente, sin depender de que AR.js
// haya logrado engancharse a él. Así el panel de diagnóstico puede mostrar
// "eventos brújula" y confirmar si el navegador realmente entrega datos del
// sensor en este dispositivo, en vez de mostrar siempre "—" sin explicación.
function manejarOrientacion(event) {
  eventosOrientacion++
  // iOS Safari entrega "webkitCompassHeading" ya en sentido horario (0=norte).
  // Android con "deviceorientationabsolute" debería, según el spec, entregar
  // "alpha" en sentido antihorario (heading = 360 - alpha), pero en la
  // práctica muchos Chrome/Android lo entregan ya en sentido horario, igual
  // que una brújula. Por eso tratamos ambos valores igual: si los
  // tratáramos distinto, norte/sur (y este/oeste) quedan invertidos en la
  // escena en Android, que es justo el bug que este código corrige.
  const heading = typeof event.webkitCompassHeading === 'number'
    ? event.webkitCompassHeading
    : (typeof event.alpha === 'number' ? event.alpha : null)
  if (heading == null) return

  headingActual = heading
  if (controlesOrientacion) {
    // arjs-device-orientation-controls espera el alpha en sentido
    // antihorario; lo reescribimos para que la cámara quede orientada al
    // norte real.
    controlesOrientacion.deviceOrientation = {
      alpha: (360 - heading + 360) % 360,
      beta: event.beta,
      gamma: event.gamma,
    }
  }
}

function iniciarBrujula() {
  window.addEventListener('deviceorientationabsolute', manejarOrientacion)
  window.addEventListener('deviceorientation', manejarOrientacion)
}

// gps-new-camera solo activa su propio control por orientación del
// dispositivo ("arjs-device-orientation-controls") cuando su detección de
// "es celular" por user-agent da positivo; si falla, la cámara queda
// controlada por look-controls, que solo gira al arrastrar la pantalla con
// el dedo (por eso los edificios parecen "congelados" al caminar con el
// celular en la mano). Forzamos el control por orientación nosotros mismos
// para no depender de esa detección.
function asegurarControlPorOrientacion(camaraEl) {
  if (controlesOrientacion) return
  if (!camaraEl.components['arjs-device-orientation-controls']) {
    camaraEl.setAttribute('look-controls-enabled', false)
    camaraEl.setAttribute('arjs-device-orientation-controls', true)
  }
  const orientacion = camaraEl.components['arjs-device-orientation-controls']
  if (orientacion && orientacion._orientationControls) {
    controlesOrientacion = orientacion._orientationControls
  }
}

function actualizarPanelDebug(camaraEl, infoDebug, posicionCamara) {
  const ahora = performance.now()
  if (ahora - ultimaActualizacionDebug < 150) return
  ultimaActualizacionDebug = ahora

  const panel = document.getElementById('compass-debug')
  if (!panel) return
  panel.classList.add('visible')

  const heading = headingActual != null ? headingActual.toFixed(1) : '—'
  const azimut = azimutCamara != null ? azimutCamara.toFixed(0) : '—'
  const ubicacionTexto = miUbicacion
    ? `${miUbicacion.lat.toFixed(6)}, ${miUbicacion.lon.toFixed(6)}`
    : 'esperando GPS...'

  const filas = infoDebug
    .slice()
    .sort((a, b) => a.anguloGrados - b.anguloGrados)
    .map(info => {
      const rumbo = info.rumbo != null ? `${info.rumbo.toFixed(0)}°` : '—'
      const dist = info.distancia != null ? `${Math.round(info.distancia)}m` : '—'
      return `${info.nombre.padEnd(14)} ang=${info.anguloGrados.toFixed(0).padStart(3)}° rumbo=${rumbo.padStart(4)} dist=${dist} dx=${info.dx.toFixed(0)} dz=${info.dz.toFixed(0)}`
    })
    .join('\n')

  const posCamTexto = `${posicionCamara.x.toFixed(0)}, ${posicionCamara.z.toFixed(0)}`

  panel.textContent =
    `heading (brújula): ${heading}°  eventos=${eventosOrientacion}\n` +
    `cámara mira (3D): ${azimut}°  cámara pos: ${posCamTexto}\n` +
    `mi ubicación: ${ubicacionTexto}\n` +
    `${filas}`
}

async function iniciarAR() {
  iniciarBrujula()
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
