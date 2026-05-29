import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/MapaInteractivo.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// Ícono por defecto para edificios
const iconoPorDefecto = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
})
L.Marker.prototype.options.icon = iconoPorDefecto

// Ícono especial para la ubicación del usuario
const iconoUsuario = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 20px; height: 20px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
    "></div>
  `,
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
})

// Componente que solicita ubicación y centra el mapa
function UbicacionUsuario({ setUbicacion, ubicacion }) {
  const map = useMap()

  useEffect(() => {
    if (!navigator.geolocation) return

    // Solicitar permiso de ubicación
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUbicacion([latitude, longitude])
        map.flyTo([latitude, longitude], 18, { duration: 1.5 })
      },
      (error) => {
        console.log('Ubicación no disponible:', error.message)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    // Actualizar posición en tiempo real
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUbicacion([latitude, longitude])
      },
      null,
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return null
}

function MapaInteractivo({ edificios, ubicacion, setUbicacion }) {
  const centro = [0.3468, -78.1070]

  return (
    <MapContainer
      center={centro}
      zoom={18}
      className="mapa-container"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {/* Solicitar y mostrar ubicación del usuario */}
      <UbicacionUsuario
        setUbicacion={setUbicacion}
        ubicacion={ubicacion}
      />

      {/* Marcador de posición del usuario */}
      {ubicacion && (
        <Marker position={ubicacion} icon={iconoUsuario}>
          <Popup>
            <strong>📍 Tu ubicación actual</strong>
          </Popup>
        </Marker>
      )}

      {/* Marcadores de edificios */}
      {edificios.map(edificio => (
        <Marker
          key={edificio.id}
          position={[edificio.latitud, edificio.longitud]}
        >
          <Popup>
            <strong>{edificio.nombre}</strong><br />
            {edificio.descripcion}<br />
            <small>{edificio.tipo}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapaInteractivo