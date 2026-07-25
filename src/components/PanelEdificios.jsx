import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { LIMITES_CAMPUS, coordenadaValida } from '../config/mapaConfig'

const TIPOS_EDIFICIO = ['Académico', 'Administrativo', 'Servicios', 'Deportivo']
const TIPO_OTRO = '__otro__'
const FORMULARIO_VACIO = { nombre: '', descripcion: '', latitud: '', longitud: '', tipo: '' }

function PanelEdificios({ edificios, onRecargar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [tipoPersonalizado, setTipoPersonalizado] = useState(false)

  function handleCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  function handleCambioTipo(e) {
    const valor = e.target.value
    if (valor === TIPO_OTRO) {
      setTipoPersonalizado(true)
      setFormulario({ ...formulario, tipo: '' })
    } else {
      setTipoPersonalizado(false)
      setFormulario({ ...formulario, tipo: valor })
    }
  }

  async function guardar(e) {
    e.preventDefault()
    const latitud = parseFloat(formulario.latitud)
    const longitud = parseFloat(formulario.longitud)

    if (!coordenadaValida(latitud, longitud)) {
      setMensaje({
        texto: `⚠️ Coordenadas fuera del campus. Latitud entre ${LIMITES_CAMPUS.latMin} y ${LIMITES_CAMPUS.latMax}, longitud entre ${LIMITES_CAMPUS.lonMin} y ${LIMITES_CAMPUS.lonMax}.`,
        tipo: 'error'
      })
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000)
      return
    }

    const datos = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      latitud,
      longitud,
      tipo: formulario.tipo
    }
    if (editandoId) {
      const { error } = await supabase
        .from('edificios').update(datos).eq('id', editandoId)
      setMensaje({
        texto: error ? 'Error al actualizar' : '✅ Edificio actualizado',
        tipo: error ? 'error' : 'ok'
      })
      setEditandoId(null)
    } else {
      const { error } = await supabase
        .from('edificios').insert([datos])
      setMensaje({
        texto: error ? 'Error al agregar' : '✅ Edificio agregado',
        tipo: error ? 'error' : 'ok'
      })
    }
    setFormulario(FORMULARIO_VACIO)
    setTipoPersonalizado(false)
    onRecargar()
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
  }

  function editar(e) {
    setEditandoId(e.id)
    setFormulario({
      nombre: e.nombre, descripcion: e.descripcion || '',
      latitud: e.latitud, longitud: e.longitud, tipo: e.tipo || ''
    })
    setTipoPersonalizado(!!e.tipo && !TIPOS_EDIFICIO.includes(e.tipo))
  }

  async function eliminar(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este edificio?')) return
    const { error } = await supabase
      .from('edificios').delete().eq('id', id)
    setMensaje({
      texto: error ? 'Error al eliminar' : '✅ Edificio eliminado',
      tipo: error ? 'error' : 'ok'
    })
    onRecargar()
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
  }

  return (
    <>
      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {/* Formulario */}
      <div className="card">
        <div className="card-titulo">
          {editandoId ? '✏️ Editar edificio' : '➕ Agregar nuevo edificio'}
        </div>
        <form onSubmit={guardar}>
          <div className="form-grid">
            <div className="form-grid-full">
              <input name="nombre" placeholder="Nombre del edificio"
                value={formulario.nombre} onChange={handleCambio}
                required className="form-input" />
            </div>
            <div className="form-grid-full">
              <input name="descripcion" placeholder="Descripción"
                value={formulario.descripcion} onChange={handleCambio}
                className="form-input" />
            </div>
            <input type="number" name="latitud" placeholder="Latitud (ej: 0.3521)"
              step="0.000001" min={LIMITES_CAMPUS.latMin} max={LIMITES_CAMPUS.latMax}
              value={formulario.latitud} onChange={handleCambio}
              required className="form-input" />
            <input type="number" name="longitud" placeholder="Longitud (ej: -78.1098)"
              step="0.000001" min={LIMITES_CAMPUS.lonMin} max={LIMITES_CAMPUS.lonMax}
              value={formulario.longitud} onChange={handleCambio}
              required className="form-input" />
            <div className="form-grid-full">
              <select
                value={tipoPersonalizado ? TIPO_OTRO : formulario.tipo}
                onChange={handleCambioTipo} className="form-input">
                <option value="">Seleccionar tipo</option>
                {TIPOS_EDIFICIO.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value={TIPO_OTRO}>Otro (especificar)</option>
              </select>
            </div>
            {tipoPersonalizado && (
              <div className="form-grid-full">
                <input name="tipo" placeholder="Especifica el tipo (ej: Capilla, Estadio)"
                  value={formulario.tipo} onChange={handleCambio}
                  required className="form-input" />
              </div>
            )}
          </div>
          <div className="form-acciones">
            <button type="submit" className="btn-primario">
              {editandoId ? 'Actualizar' : 'Agregar edificio'}
            </button>
            {editandoId && (
              <button type="button" className="btn-secundario"
                onClick={() => {
                  setEditandoId(null)
                  setFormulario(FORMULARIO_VACIO)
                  setTipoPersonalizado(false)
                }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="card tabla-wrapper">
        <div className="card-titulo">
          🏛️ Edificios registrados ({edificios.length})
        </div>
        <table className="tabla">
          <thead>
            <tr>
              {['Nombre', 'Tipo', 'Latitud', 'Longitud', 'Acciones'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {edificios.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: '600' }}>{e.nombre}</td>
                <td><span className="badge-tipo">{e.tipo}</span></td>
                <td style={{ color: '#64748b' }}>{e.latitud}</td>
                <td style={{ color: '#64748b' }}>{e.longitud}</td>
                <td>
                  <button className="btn-editar" onClick={() => editar(e)}>Editar</button>
                  <button className="btn-eliminar" onClick={() => eliminar(e.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default PanelEdificios
