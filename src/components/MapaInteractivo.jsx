import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Esto corrige un bug conocido de Leaflet con React
// que hace que los íconos de los marcadores no aparezcan
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const iconoPorDefecto = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
})
L.Marker.prototype.options.icon = iconoPorDefecto

function MapaInteractivo({ edificios }) {
  // Centro del mapa: coordenadas del campus PUCE Ibarra
  const centro = [0.34683632779255735, -78.10702320896105]
  return (
    <MapContainer
      center={centro}
      zoom={18}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {edificios.map(edificio => (
        <Marker
          key={edificio.id}
          position={[edificio.latitud, edificio.longitud]}
        >
          <Popup>
            <strong>{edificio.nombre}</strong>
            <br />
            {edificio.descripcion}
            <br />
            <small>{edificio.tipo}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapaInteractivo