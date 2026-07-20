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
