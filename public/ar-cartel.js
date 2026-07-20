function mostrarCartel(edificio, distancia) {
  document.getElementById('cartel-icono').textContent = iconoPara(edificio.tipo)
  document.getElementById('cartel-nombre').textContent = edificio.nombre
  document.getElementById('cartel-tipo').textContent = edificio.tipo || 'Campus PUCE Ibarra'
  document.getElementById('cartel-descripcion').textContent =
    edificio.descripcion || 'Sin descripción disponible.'
  actualizarDistanciaCartel(distancia)
  document.getElementById('cartel-edificio').classList.add('visible')
  document.getElementById('instrucciones').classList.add('oculto')
  document.getElementById('mira').classList.add('activa')
}

// Cartel de aula/puerta detectada por QR (AR indoor). A diferencia de
// mostrarCartel, acá no hay distancia GPS: en su lugar mostramos que vino
// de un código leído.
function mostrarCartelAula(aula, nombreEdificio) {
  document.getElementById('cartel-icono').textContent = '🚪'
  document.getElementById('cartel-nombre').textContent = aula.nombre
  document.getElementById('cartel-tipo').textContent = nombreEdificio || 'Aula'
  document.getElementById('cartel-descripcion').textContent =
    aula.descripcion || 'Sin descripción disponible.'
  document.getElementById('cartel-distancia').textContent = '🔎 QR'
  document.getElementById('cartel-edificio').classList.add('visible')
  document.getElementById('instrucciones').classList.add('oculto')
  document.getElementById('mira').classList.add('activa')
}

function actualizarDistanciaCartel(distancia) {
  const texto = distancia == null ? '—' :
    distancia < 1000 ? `${Math.round(distancia)} m` : `${(distancia / 1000).toFixed(1)} km`
  document.getElementById('cartel-distancia').textContent = texto
}

function ocultarCartel() {
  document.getElementById('cartel-edificio').classList.remove('visible')
  document.getElementById('instrucciones').classList.remove('oculto')
  document.getElementById('mira').classList.remove('activa')
}
