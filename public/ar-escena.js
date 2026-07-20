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

function bucleApuntado() {
  requestAnimationFrame(bucleApuntado)

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

  entidadesEdificios.forEach(item => {
    const obj = item.entidad.object3D
    if (obj.visible === false) return

    const posicionEntidad = new THREE.Vector3()
    obj.getWorldPosition(posicionEntidad)
    const direccion = posicionEntidad.clone().sub(posicionCamara)
    if (direccion.lengthSq() < 0.0001) return
    direccion.normalize()

    const anguloGrados = THREE.MathUtils.radToDeg(adelante.angleTo(direccion))
    if (anguloGrados >= mejorAngulo) return

    const distancia = miUbicacion
      ? distanciaMetros(miUbicacion.lat, miUbicacion.lon, item.edificio.latitud, item.edificio.longitud)
      : null
    if (distancia != null && distancia > DISTANCIA_MAXIMA) return

    mejorAngulo = anguloGrados
    mejor = { item, distancia }
  })

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
  caja.setAttribute('height', '1.4')
  caja.setAttribute('depth', '0.12')

  const linea = document.createElement('a-box')
  linea.setAttribute('color', '#3b82f6')
  linea.setAttribute('width', '5')
  linea.setAttribute('height', '0.12')
  linea.setAttribute('depth', '0.13')
  linea.setAttribute('position', '0 0.64 0')

  const texto = document.createElement('a-text')
  texto.setAttribute('value', edificio.nombre)
  texto.setAttribute('color', '#ffffff')
  texto.setAttribute('align', 'center')
  texto.setAttribute('width', '4.6')
  texto.setAttribute('position', '0 0 0.07')

  const punto = document.createElement('a-sphere')
  punto.setAttribute('color', '#22c55e')
  punto.setAttribute('radius', '0.15')
  punto.setAttribute('position', '0 -1 0')

  entidad.appendChild(caja)
  entidad.appendChild(linea)
  entidad.appendChild(texto)
  entidad.appendChild(punto)
  scene.appendChild(entidad)

  entidadesEdificios.push({ edificio, entidad })
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
