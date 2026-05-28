import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import MapaInteractivo from './components/MapaInteractivo'
import PanelAdmin from './components/PanelAdmin'

function App() {
  const [edificios, setEdificios] = useState([])
  const [vista, setVista] = useState('mapa')
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    async function cargarEdificios() {
      const { data } = await supabase.from('edificios').select('*')
      setEdificios(data || [])
    }
    cargarEdificios()
  }, [vista])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Header responsive */}
      <header style={{
        background: 'linear-gradient(135deg, #0d3b7a 0%, #1a5bbf 100%)',
        padding: '0 20px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(13,59,122,0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'white', borderRadius: '8px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px', fontWeight: '700',
            color: '#0d3b7a', flexShrink: 0
          }}>P</div>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', lineHeight: 1.2 }}>
              Orientación Campus
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>
              PUCE Ibarra
            </div>
          </div>
        </div>

        {/* Nav escritorio — oculto en móvil */}
        <nav style={{
          display: 'flex', gap: '8px',
          '@media (max-width: 640px)': { display: 'none' }
        }} className="nav-desktop">
          {[
            { id: 'mapa', label: '🗺️ Mapa' },
            { id: 'admin', label: '⚙️ Admin' },
          ].map(btn => (
            <button key={btn.id} onClick={() => setVista(btn.id)} style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              fontWeight: '500', fontSize: '13px',
              background: vista === btn.id ? 'white' : 'rgba(255,255,255,0.15)',
              color: vista === btn.id ? '#0d3b7a' : 'white',
            }}>
              {btn.label}
            </button>
          ))}
          <button onClick={() => window.open('/ar.html', '_blank')} style={{
            padding: '7px 14px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            fontWeight: '600', fontSize: '13px',
            background: '#22c55e', color: 'white',
          }}>
            📷 AR
          </button>
        </nav>

        {/* Botón hamburguesa — solo móvil */}
        <button
          className="btn-menu"
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px', padding: '7px 10px',
            color: 'white', cursor: 'pointer',
            fontSize: '18px', display: 'none'
          }}>
          {menuAbierto ? '✕' : '☰'}
        </button>
      </header>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div style={{
          background: '#0d3b7a',
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          position: 'sticky', top: '60px', zIndex: 999
        }} className="nav-mobile">
          {[
            { id: 'mapa', label: '🗺️ Mapa' },
            { id: 'admin', label: '⚙️ Administración' },
          ].map(btn => (
            <button key={btn.id} onClick={() => { setVista(btn.id); setMenuAbierto(false) }} style={{
              padding: '10px 14px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              fontWeight: '500', fontSize: '14px', textAlign: 'left',
              background: vista === btn.id ? 'white' : 'rgba(255,255,255,0.1)',
              color: vista === btn.id ? '#0d3b7a' : 'white',
            }}>
              {btn.label}
            </button>
          ))}
          <button onClick={() => { window.open('/ar.html', '_blank'); setMenuAbierto(false) }} style={{
            padding: '10px 14px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            fontWeight: '600', fontSize: '14px', textAlign: 'left',
            background: '#22c55e', color: 'white',
          }}>
            📷 Realidad Aumentada
          </button>
        </div>
      )}

      {/* Banner informativo */}
      {vista === 'mapa' && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #dbeafe',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center',
          gap: '12px', flexWrap: 'wrap'
        }}>
          <div style={{
            background: '#dbeafe', borderRadius: '10px',
            padding: '8px', fontSize: '20px'
          }}>🏛️</div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#0d3b7a' }}>
              Mapa interactivo del campus
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Toca un marcador para ver información
            </div>
          </div>
          <div style={{
            background: '#dbeafe', borderRadius: '10px',
            padding: '6px 14px', fontSize: '13px',
            fontWeight: '600', color: '#1a5bbf'
          }}>
            {edificios.length} edificios
          </div>
        </div>
      )}

      {/* Contenido */}
      <main>
        {vista === 'mapa' && <MapaInteractivo edificios={edificios} />}
        {vista === 'admin' && <PanelAdmin />}
      </main>

      {/* CSS responsive */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .btn-menu { display: block !important; }
        }
        @media (min-width: 641px) {
          .nav-mobile { display: none !important; }
          .btn-menu { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default App