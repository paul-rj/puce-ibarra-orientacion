// Misma conexión que usa el resto de la app (src/supabaseClient.js)
const SUPABASE_URL = 'https://uahymywduuozqscibvuq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHlteXdkdXVvenFzY2lidnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDU4MjEsImV4cCI6MjA5NDk4MTgyMX0.IX5vWlm_XWa7Dgo2jSAl4VebRVc9AhMC3QmqGTuHPOE'

// Mismos límites que src/config/mapaConfig.js, para descartar edificios con coordenadas inválidas
const LIMITES_CAMPUS = { latMin: 0.3368, latMax: 0.3568, lonMin: -78.1170, lonMax: -78.0970 }

function coordenadaValida(lat, lon) {
  const la = typeof lat === 'string' ? parseFloat(lat) : Number(lat)
  const lo = typeof lon === 'string' ? parseFloat(lon) : Number(lon)
  return (
    Number.isFinite(la) && Number.isFinite(lo) &&
    la >= LIMITES_CAMPUS.latMin && la <= LIMITES_CAMPUS.latMax &&
    lo >= LIMITES_CAMPUS.lonMin && lo <= LIMITES_CAMPUS.lonMax
  )
}

// Distancia real entre dos coordenadas GPS (fórmula de Haversine)
function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const ICONOS_TIPO = {
  'Académico': '📚',
  'Administrativo': '🏢',
  'Servicios': '🛠️',
  'Deportivo': '⚽',
}
function iconoPara(tipo) {
  return ICONOS_TIPO[tipo] || '🏛️'
}

async function cargarEdificios() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/edificios?select=*`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  return await res.json()
}

// Debe coincidir con QR_PREFIJO_AULA de src/config/aulaConfig.js (usado por
// el panel admin para generar los QR que se imprimen y pegan en las puertas).
const QR_PREFIJO_AULA = 'PUCEAR:AULA:'

async function cargarAulas() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/aulas?select=*`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  )
  const datos = await res.json()
  return Array.isArray(datos) ? datos : []
}

function rastrearUbicacion(onUbicacion) {
  if (!navigator.geolocation) return
  navigator.geolocation.watchPosition(
    (pos) => onUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
    (error) => console.log('Ubicación no disponible:', error.message),
    { enableHighAccuracy: true }
  )
}
