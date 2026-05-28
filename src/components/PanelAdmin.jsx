import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function PanelAdmin() {
  const [edificios, setEdificios] = useState([])
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    latitud: '',
    longitud: '',
    tipo: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarEdificios()
  }, [])

  async function cargarEdificios() {
    const { data } = await supabase
      .from('edificios')
      .select('*')
      .order('nombre')
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
      // Actualizar edificio existente
      const { error } = await supabase
        .from('edificios')
        .update(datos)
        .eq('id', editandoId)

      if (error) {
        setMensaje('Error al actualizar: ' + error.message)
      } else {
        setMensaje('Edificio actualizado correctamente')
        setEditandoId(null)
      }
    } else {
      // Agregar edificio nuevo
      const { error } = await supabase
        .from('edificios')
        .insert([datos])

      if (error) {
        setMensaje('Error al agregar: ' + error.message)
      } else {
        setMensaje('Edificio agregado correctamente')
      }
    }

    setFormulario({
      nombre: '', descripcion: '',
      latitud: '', longitud: '', tipo: ''
    })
    cargarEdificios()
  }

  function editar(edificio) {
    setEditandoId(edificio.id)
    setFormulario({
      nombre: edificio.nombre,
      descripcion: edificio.descripcion || '',
      latitud: edificio.latitud,
      longitud: edificio.longitud,
      tipo: edificio.tipo || ''
    })
    setMensaje('')
  }

  async function eliminar(id) {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este edificio?'
    )
    if (!confirmar) return

    const { error } = await supabase
      .from('edificios')
      .delete()
      .eq('id', id)

    if (error) {
      setMensaje('Error al eliminar: ' + error.message)
    } else {
      setMensaje('Edificio eliminado correctamente')
      cargarEdificios()
    }
  }

  function cancelar() {
    setEditandoId(null)
    setFormulario({
      nombre: '', descripcion: '',
      latitud: '', longitud: '', tipo: ''
    })
    setMensaje('')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Panel de Administración — Edificios del Campus</h2>

      {mensaje && (
        <p style={{
          padding: '10px',
          background: mensaje.includes('Error') ? '#ffebee' : '#e8f5e9',
          color: mensaje.includes('Error') ? '#c62828' : '#2e7d32',
          borderRadius: '6px'
        }}>
          {mensaje}
        </p>
      )}

      {/* Formulario */}
      <form onSubmit={guardar} style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>{editandoId ? 'Editar edificio' : 'Agregar nuevo edificio'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            name="nombre"
            placeholder="Nombre del edificio (ej: Bloque A)"
            value={formulario.nombre}
            onChange={handleCambio}
            required
            style={estiloInput}
          />
          <input
            name="descripcion"
            placeholder="Descripción"
            value={formulario.descripcion}
            onChange={handleCambio}
            style={estiloInput}
          />
          <input
            name="latitud"
            placeholder="Latitud (ej: 0.3521)"
            value={formulario.latitud}
            onChange={handleCambio}
            required
            style={estiloInput}
          />
          <input
            name="longitud"
            placeholder="Longitud (ej: -78.1098)"
            value={formulario.longitud}
            onChange={handleCambio}
            required
            style={estiloInput}
          />
          <select
            name="tipo"
            value={formulario.tipo}
            onChange={handleCambio}
            style={estiloInput}
          >
            <option value="">Seleccionar tipo</option>
            <option value="Académico">Académico</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Servicios">Servicios</option>
            <option value="Deportivo">Deportivo</option>
          </select>
        </div>

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button type="submit" style={estiloBotonPrimario}>
            {editandoId ? 'Actualizar' : 'Agregar'}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={cancelar}
              style={estiloBotonSecundario}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista de edificios */}
      <h3>Edificios registrados ({edificios.length})</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#e3f2fd' }}>
            <th style={estiloTh}>Nombre</th>
            <th style={estiloTh}>Tipo</th>
            <th style={estiloTh}>Latitud</th>
            <th style={estiloTh}>Longitud</th>
            <th style={estiloTh}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {edificios.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={estiloTd}>{e.nombre}</td>
              <td style={estiloTd}>{e.tipo}</td>
              <td style={estiloTd}>{e.latitud}</td>
              <td style={estiloTd}>{e.longitud}</td>
              <td style={estiloTd}>
                <button
                  onClick={() => editar(e)}
                  style={estiloBotonEditar}
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(e.id)}
                  style={estiloBotonEliminar}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const estiloInput = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '14px',
  width: '100%'
}
const estiloBotonPrimario = {
  padding: '10px 20px',
  background: '#1565c0',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
}
const estiloBotonSecundario = {
  padding: '10px 20px',
  background: '#757575',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
}
const estiloBotonEditar = {
  padding: '5px 12px',
  background: '#f57c00',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '6px',
  fontSize: '13px'
}
const estiloBotonEliminar = {
  padding: '5px 12px',
  background: '#c62828',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px'
}
const estiloTh = {
  padding: '10px',
  textAlign: 'left',
  fontWeight: '500'
}
const estiloTd = {
  padding: '10px'
}

export default PanelAdmin