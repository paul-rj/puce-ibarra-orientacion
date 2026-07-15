export const CENTRO_CAMPUS = [0.3468, -78.1070]
export const ZOOM_INICIAL = 18

// Límites aproximados del campus y su entorno inmediato (~1.1 km desde el
// centro). Sirven para validar que una coordenada ingresada realmente
// corresponde al campus y así evitar marcadores/popups que aparezcan en
// una ubicación equivocada del mapa.
export const LIMITES_CAMPUS = {
  latMin: 0.3368,
  latMax: 0.3568,
  lonMin: -78.1170,
  lonMax: -78.0970,
}

// Convierte a número de forma segura (acepta strings desde inputs o BD).
export function aCoordenada(valor) {
  const numero = typeof valor === 'string' ? parseFloat(valor) : Number(valor)
  return Number.isFinite(numero) ? numero : null
}

// Verifica que un par lat/lon sea numérico y esté dentro de los límites del campus.
export function coordenadaValida(lat, lon) {
  const latitud = aCoordenada(lat)
  const longitud = aCoordenada(lon)
  return (
    latitud !== null &&
    longitud !== null &&
    latitud >= LIMITES_CAMPUS.latMin && latitud <= LIMITES_CAMPUS.latMax &&
    longitud >= LIMITES_CAMPUS.lonMin && longitud <= LIMITES_CAMPUS.lonMax
  )
}
