import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import MapaInteractivo from './components/MapaInteractivo'
import PanelAdmin from './components/PanelAdmin'

function App() {
  const [edificios, setEdificios] = useState([])
  const [vista, setVista] = useState('mapa')

  useEffect(() => {
    async function cargarEdificios() {
      const { data } = await supabase
        .from('edificios')
        .select('*')
      setEdificios(data || [])
    }
    cargarEdificios()
  }, [vista])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d3b7a 0%, #1a5bbf 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        boxShadow: '0 4px 20px rgba(13,59,122,0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        {/* Logo y título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'white',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '700',
            color: '#0d3b7a'
          }}>P</div>
          <div>
            <div style={{
              color: 'white', fontWeight: '600',
              fontSize: '15px', lineHeight: 1.2
            }}>
              Sistema de Orientación
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px', fontWeight: '300'
            }}>
              PUCE Ibarra
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'mapa', label: '🗺️ Mapa' },
            { id: 'admin', label: '⚙️ Admin' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setVista(btn.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '500',
                fontSize: '13px',
                transition: 'all 0.2s',
                background: vista === btn.id
                  ? 'white'
                  : 'rgba(255,255,255,0.15)',
                color: vista === btn.id ? '#0d3b7a' : 'white',
              }}
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={() => window.open('/ar.html', '_blank')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: '600',
              fontSize: '13px',
              background: '#22c55e',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(34,197,94,0.4)'
            }}
          >
            📷 Realidad Aumentada
          </button>
        </nav>
      </header>

      {/* Contenido */}
      <main>
        {vista === 'mapa' && (
          <div>
            {/* Banner informativo */}
            <div style={{
              background: 'white',
              borderBottom: '1px solid #dbeafe',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                background: '#dbeafe',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '24px'
              }}>🏛️</div>
              <div>
                <div style={{
                  fontWeight: '600', fontSize: '15px',
                  color: '#0d3b7a'
                }}>
                  Mapa interactivo del campus
                </div>
                <div style={{
                  fontSize: '13px', color: '#64748b',
                  marginTop: '2px'
                }}>
                  Haz clic en un marcador para ver información del edificio
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                background: '#dbeafe',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a5bbf'
              }}>
                {edificios.length} edificios registrados
              </div>
            </div>
            <MapaInteractivo edificios={edificios} />
          </div>
        )}
        {vista === 'admin' && <PanelAdmin />}
      </main>
    </div>
  )
}

export default App