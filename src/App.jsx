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
    <div>
      <div style={{
        background: '#1565c0',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '18px' }}>
          Sistema de Orientación PUCE Ibarra
        </h1>
        <button
          onClick={() => setVista('mapa')}
          style={{
            background: vista === 'mapa' ? 'white' : 'transparent',
            color: vista === 'mapa' ? '#1565c0' : 'white',
            border: '1px solid white',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
          Mapa
        </button>
        <button
          onClick={() => setVista('admin')}
          style={{
            background: vista === 'admin' ? 'white' : 'transparent',
            color: vista === 'admin' ? '#1565c0' : 'white',
            border: '1px solid white',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
          Administración
        </button>
        <button
          onClick={() => window.open('/ar.html', '_blank')}
          style={{
            background: '#43a047',
            color: 'white',
            border: '1px solid white',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
          📷 Realidad Aumentada
        </button>
      </div>

      {vista === 'mapa' && <MapaInteractivo edificios={edificios} />}
      {vista === 'admin' && <PanelAdmin />}
    </div>
  )
}

export default App