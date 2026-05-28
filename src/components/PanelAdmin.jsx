import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const estilos = {
  container: {
    padding: '24px',
    maxWidth: '900px',
    margin: '0 auto'
  },
  titulo: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0d3b7a',
    marginBottom: '4px'
  },
  subtitulo: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px'
  },
  card: {
    background: 'white',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(13,59,122,0.08)',
    marginBottom: '24px'
  },
  cardTitulo: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0d3b7a',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #dbeafe'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #dbeafe',
    fontSize: '14px',
    fontFamily: 'Outfit, sans-serif',
    width: '100%',
    outline: 'none',
    color: '#0d3b7a',
    transition: 'border 0.2s'
  },
  inputFull: {
    gridColumn: '1 / -1'
  },
  btnPrimario: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #0d3b7a, #1a5bbf)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(13,59,122,0.25)'
  },
  btnSecundario: {
    padding: '10px 24px',
    background: '#f0f4f8',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: '500',
    fontSize: '14px'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#f8fafc',
    borderBottom: '1px solid #dbeafe'
  },
  td: {
    padding: '12px 14px',
    fontSize: '14px',
    color: '#0d3b7a',
    borderBottom: '1px solid #f0f4f8'
  },
  badge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#dbeafe',
    color: '#1a5bbf'
  },
  btnEditar: {
    padding: '5px 12px',
    background: '#fef3c7',
    color: '#b45309',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'Outfit, sans-serif',
    marginRight: '6px'
  },
  btnEliminar: {
    padding: '5px 12px',
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'Outfit, sans-serif'
  }
}

function PanelAdmin() {
  const [edificios, setEdificios] = useState([])
  const [formulario, setFormulario] = useState({
    nombre: '', descripcion: '', latitud: '', longitud: '', tipo: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  useEffect(() => { cargarEdificios() }, [])

  async function cargarEdificios() {
    const { data } = await supabase.from('edificios').select('*').order('nombre')
    setEdificios(data || [])
  }

  function handleCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  async function guardar(e) {
    e.preventDefault()
    const datos = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      latitud: parseFloat(formulario.latitud),
      longitud: parseFloat(formulario.longitud),
      tipo: formulario.tipo
    }
    if (editandoId) {
      const { error } = await supabase.from('edificios').update(datos).eq('id', editandoId)
      setMensaje({ texto: error ? 'Error al actualizar' : '✅ Edificio actualizado', tipo: error ? 'error' : 'ok' })
      setEditandoId(null)
    } else {
      const { error } = await supabase.from('edificios').insert([datos])
      setMensaje({ texto: error ? 'Error al agregar' : '✅ Edificio agregado', tipo: error ? 'error' : 'ok' })
    }
    setFormulario({ nombre: '', descripcion: '', latitud: '', longitud: '', tipo: '' })
    cargarEdificios()
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
  }

  function editar(e) {
    setEditandoId(e.id)
    setFormulario({
      nombre: e.nombre, descripcion: e.descripcion || '',
      latitud: e.latitud, longitud: e.longitud, tipo: e.tipo || ''
    })
  }

  async function eliminar(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este edificio?')) return
    const { error } = await supabase.from('edificios').delete().eq('id', id)
    setMensaje({ texto: error ? 'Error al eliminar' : '✅ Edificio eliminado', tipo: error ? 'error' : 'ok' })
    cargarEdificios()
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
  }

  return (
    <div style={estilos.container}>
      <div style={estilos.titulo}>Panel de Administración</div>
      <div style={estilos.subtitulo}>Gestiona los edificios y espacios del campus</div>

      {mensaje.texto && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          fontSize: '14px', fontWeight: '500',
          background: mensaje.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario */}
      <div style={estilos.card}>
        <div style={estilos.cardTitulo}>
          {editandoId ? '✏️ Editar edificio' : '➕ Agregar nuevo edificio'}
        </div>
        <form onSubmit={guardar}>
          <div style={estilos.grid}>
            <div style={estilos.inputFull}>
              <input name="nombre" placeholder="Nombre del edificio (ej: Bloque A)"
                value={formulario.nombre} onChange={handleCambio}
                required style={estilos.input} />
            </div>
            <div style={estilos.inputFull}>
              <input name="descripcion" placeholder="Descripción"
                value={formulario.descripcion} onChange={handleCambio}
                style={estilos.input} />
            </div>
            <input name="latitud" placeholder="Latitud (ej: 0.3521)"
              value={formulario.latitud} onChange={handleCambio}
              required style={estilos.input} />
            <input name="longitud" placeholder="Longitud (ej: -78.1098)"
              value={formulario.longitud} onChange={handleCambio}
              required style={estilos.input} />
            <div style={estilos.inputFull}>
              <select name="tipo" value={formulario.tipo}
                onChange={handleCambio} style={estilos.input}>
                <option value="">Seleccionar tipo</option>
                <option value="Académico">Académico</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Servicios">Servicios</option>
                <option value="Deportivo">Deportivo</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" style={estilos.btnPrimario}>
              {editandoId ? 'Actualizar' : 'Agregar edificio'}
            </button>
            {editandoId && (
              <button type="button" onClick={() => {
                setEditandoId(null)
                setFormulario({ nombre: '', descripcion: '', latitud: '', longitud: '', tipo: '' })
              }} style={estilos.btnSecundario}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ ...estilos.card, overflowX: 'auto' }}>
        <div style={estilos.cardTitulo}>
          🏛️ Edificios registrados ({edificios.length})
        </div>
        <table style={estilos.tabla}>
          <thead>
            <tr>
              {['Nombre', 'Tipo', 'Latitud', 'Longitud', 'Acciones'].map(h => (
                <th key={h} style={estilos.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {edificios.map(e => (
              <tr key={e.id}>
                <td style={{ ...estilos.td, fontWeight: '600' }}>{e.nombre}</td>
                <td style={estilos.td}>
                  <span style={estilos.badge}>{e.tipo}</span>
                </td>
                <td style={{ ...estilos.td, color: '#64748b' }}>{e.latitud}</td>
                <td style={{ ...estilos.td, color: '#64748b' }}>{e.longitud}</td>
                <td style={estilos.td}>
                  <button onClick={() => editar(e)} style={estilos.btnEditar}>Editar</button>
                  <button onClick={() => eliminar(e.id)} style={estilos.btnEliminar}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PanelAdmin