import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/PanelAdmin.css'
import Login from './Login'
import PanelEdificios from './PanelEdificios'
import PanelAulas from './PanelAulas'

function PanelAdmin() {
  const [admin, setAdmin] = useState(null)
  const [edificios, setEdificios] = useState([])
  const [aulas, setAulas] = useState([])

  useEffect(() => {
    if (admin) {
      cargarEdificios()
      cargarAulas()
    }
  }, [admin])

  async function cargarEdificios() {
    const { data } = await supabase
      .from('edificios').select('*').order('nombre')
    setEdificios(data || [])
  }

  async function cargarAulas() {
    const { data } = await supabase
      .from('aulas').select('*').order('codigo')
    setAulas(data || [])
  }

  // ── LOGIN ────────────────────────────────
  if (!admin) {
    return <Login onLogin={setAdmin} />
  }

  // ── PANEL ────────────────────────────────
  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <div className="admin-titulo">Panel de Administración</div>
          <div className="admin-subtitulo">Bienvenido, {admin.nombre}</div>
        </div>
        <button className="btn-cerrar-sesion" onClick={() => setAdmin(null)}>
          🚪 Cerrar sesión
        </button>
      </div>

      <PanelEdificios edificios={edificios} onRecargar={cargarEdificios} />

      <PanelAulas edificios={edificios} aulas={aulas} onRecargar={cargarAulas} />
    </div>
  )
}

export default PanelAdmin
