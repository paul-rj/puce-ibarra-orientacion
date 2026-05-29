import { useState, useEffect } from 'react'
import { useEdificios } from './hooks/useEdificios'
import MapaInteractivo from './components/MapaInteractivo'
import PanelAdmin from './components/PanelAdmin'
import './styles/App.css'

function App() {
  const { edificios } = useEdificios()
  const [vista, setVista] = useState('mapa')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [ubicacion, setUbicacion] = useState(null)

  useEffect(() => {
    function escucharMensaje(e) {
      if (e.data === 'volver') setVista('mapa')
    }
    window.addEventListener('message', escucharMensaje)
    return () => window.removeEventListener('message', escucharMensaje)
  }, [])

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="header-icono">P</div>
          <div>
            <div className="header-titulo">Orientación Campus</div>
            <div className="header-subtitulo">PUCE Ibarra</div>
          </div>
        </div>

        {/* Nav desktop */}
        <nav className="nav-desktop">
          {[
            { id: 'mapa', label: '🗺️ Mapa' },
            { id: 'admin', label: '⚙️ Admin' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setVista(btn.id)}
              className={`nav-btn ${vista === btn.id ? 'activo' : ''}`}
            >
              {btn.label}
            </button>
          ))}
          <button
            className={`nav-btn-ar ${vista === 'ar' ? 'activo' : ''}`}
            onClick={() => setVista('ar')}
          >
            📷 AR
          </button>
        </nav>
        <button
          className="btn-menu"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </header>

      {/* Menú móvil */}
      {menuAbierto && (
        <div className="nav-mobile">
          {[
            { id: 'mapa', label: '🗺️ Mapa' },
            { id: 'admin', label: '⚙️ Administración' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setVista(btn.id); setMenuAbierto(false) }}
              className={`nav-mobile-btn ${vista === btn.id ? 'activo' : ''}`}
            >
              {btn.label}
            </button>
          ))}
          <button
            className="nav-mobile-btn-ar"
            onClick={() => { setVista('ar'); setMenuAbierto(false) }}
          >
            📷 Realidad Aumentada
          </button>
        </div>
      )}

      {/* Banner mapa */}
      {vista === 'mapa' && (
        <div className="banner-mapa">
          <div className="banner-icono">🏛️</div>
          <div>
            <div className="banner-titulo">Mapa interactivo del campus</div>
            <div className="banner-subtitulo">Toca un marcador para ver información</div>
          </div>
          <div className="banner-contador">{edificios.length} edificios</div>
        </div>
      )}

      {/* Contenido */}
      <main>
        {vista === 'mapa' && (
          <MapaInteractivo
            edificios={edificios}
            ubicacion={ubicacion}
            setUbicacion={setUbicacion}
          />
        )}
        {vista === 'admin' && <PanelAdmin />}
        {vista === 'ar' && (
          <iframe
            src="/ar.html"
            style={{
              width: '100%',
              height: 'calc(100vh - 60px)',
              border: 'none',
              display: 'block'
            }}
            allow="camera *; geolocation *; microphone *"
            allowFullScreen
            title="Realidad Aumentada"
          />
        )}
      </main>
    </div>
  )
}

export default App