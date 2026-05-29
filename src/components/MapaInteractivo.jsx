import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/MapaInteractivo.css'
import L from 'leaflet'
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