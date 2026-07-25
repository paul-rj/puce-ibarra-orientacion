import { useState, useEffect } from 'react'
import { useEdificios } from './hooks/useEdificios'
import MapaInteractivo from './components/MapaInteractivo'
import PanelAdmin from './components/PanelAdmin'
import Bienvenida from './components/Bienvenida'
import logo from './assets/logo.png'
import './styles/App.css'

function App() {
  const { edificios } = useEdificios()
  const [vista, setVista] = useState('mapa')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [ubicacion, setUbicacion] = useState(null)

  return (
    <div>
      <Bienvenida />

      {/* Header */}
      <header className="header">
        <button
          className="header-logo"
          onClick={() => setVista('mapa')}
          onDoubleClick={() => setVista('admin')}
          aria-label="Ir al inicio"
        >
          <img src={logo} alt="Logo PUCE Ibarra" className="header-icono" />
          <div>
            <div className="header-titulo">Orientación Campus</div>
            <div className="header-subtitulo">PUCE Ibarra</div>
          </div>
        </button>

        {/* Nav desktop */}
        <nav className="nav-desktop">
          {[
            { id: 'mapa', label: '🗺️ Mapa' },
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
            className="nav-btn-ar"
            onClick={() => window.location.href = '/ar.html'}
          >
            📷 AR
          </button>
        </nav>

        {/* Botón hamburguesa */}
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
            onClick={() => { window.location.href = '/ar.html'; setMenuAbierto(false) }}
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
      </main>
    </div>
  )
}

export default App