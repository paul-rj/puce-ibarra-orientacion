import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../supabaseClient'
import '../styles/PanelAdmin.css'
import { LIMITES_CAMPUS, coordenadaValida } from '../config/mapaConfig'
import { textoQrAula } from '../config/aulaConfig'
import Login from './Login'

const TIPOS_EDIFICIO = ['Académico', 'Administrativo', 'Servicios', 'Deportivo']
const TIPO_OTRO = '__otro__'
const AULA_VACIA = { edificio_id: '', codigo: '', nombre: '', descripcion: '' }

function PanelAdmin() {
  const [admin, setAdmin] = useState(null)
  const [edificios, setEdificios] = useState([])
  const [formulario, setFormulario] = useState({
    nombre: '', descripcion: '', latitud: '', longitud: '', tipo: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [tipoPersonalizado, setTipoPersonalizado] = useState(false)

  const [aulas, setAulas] = useState([])
  const [formularioAula, setFormularioAula] = useState(AULA_VACIA)
  const [editandoAulaId, setEditandoAulaId] = useState(null)
  const [mensajeAula, setMensajeAula] = useState({ texto: '', tipo: '' })
  const [qrVisible, setQrVisible] = useState(null) // { codigo, nombre, dataUrl }
  // Mientras esto sea true, elegir un edificio recalcula el código solo.
  // Se apaga en cuanto el usuario toca el campo código a mano.
  const [codigoAutoGenerado, setCodigoAutoGenerado] = useState(true)

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
    setFormulario({ nombre: '', descripcion: '', latitud: '', longitud: '', tipo: '' })
    setTipoPersonalizado(false)
    cargarEdificios()
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
    cargarEdificios()
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
  }

  // ── AULAS (puertas/salones para el AR indoor con QR) ────────────────────

  // Genera el próximo código disponible para un edificio, ej: si "Edificio 4"
  // ya tiene ED4-P01 y ED4-P02 registradas, sugiere ED4-P03.
  function generarCodigoSugerido(edificioId) {
    const edificio = edificios.find(e => e.id === edificioId)
    if (!edificio) return ''
    const numero = (edificio.nombre.match(/\d+/) || [])[0]
    const prefijo = numero ? `ED${numero}` : edificio.nombre.slice(0, 3).toUpperCase()
    const existentes = aulas.filter(a => a.edificio_id === edificioId).length
    const consecutivo = String(existentes + 1).padStart(2, '0')
    return `${prefijo}-P${consecutivo}`
  }

  function handleCambioAula(e) {
    const { name, value } = e.target

    if (name === 'codigo') {
      setCodigoAutoGenerado(false)
      setFormularioAula({ ...formularioAula, codigo: value })
      return
    }

    if (name === 'edificio_id') {
      const siguiente = { ...formularioAula, edificio_id: value }
      if (!editandoAulaId && codigoAutoGenerado) {
        siguiente.codigo = generarCodigoSugerido(value)
      }
      setFormularioAula(siguiente)
      return
    }

    setFormularioAula({ ...formularioAula, [name]: value })
  }

  async function guardarAula(e) {
    e.preventDefault()
    const datos = {
      edificio_id: formularioAula.edificio_id,
      codigo: formularioAula.codigo.trim().toUpperCase(),
      nombre: formularioAula.nombre,
      descripcion: formularioAula.descripcion
    }
    if (editandoAulaId) {
      const { error } = await supabase
        .from('aulas').update(datos).eq('id', editandoAulaId)
      setMensajeAula({
        texto: error ? `Error al actualizar (${error.message})` : '✅ Aula actualizada',
        tipo: error ? 'error' : 'ok'
      })
      setEditandoAulaId(null)
    } else {
      const { error } = await supabase
        .from('aulas').insert([datos])
      setMensajeAula({
        texto: error ? `Error al agregar (${error.message})` : '✅ Aula agregada',
        tipo: error ? 'error' : 'ok'
      })
    }
    setFormularioAula(AULA_VACIA)
    setCodigoAutoGenerado(true)
    cargarAulas()
    setTimeout(() => setMensajeAula({ texto: '', tipo: '' }), 4000)
  }

  function editarAula(a) {
    setEditandoAulaId(a.id)
    setCodigoAutoGenerado(false)
    setFormularioAula({
      edificio_id: a.edificio_id,
      codigo: a.codigo,
      nombre: a.nombre,
      descripcion: a.descripcion || ''
    })
  }

  async function eliminarAula(id) {
    if (!window.confirm('¿Seguro que deseas eliminar esta aula? El QR impreso dejará de funcionar.')) return
    const { error } = await supabase
      .from('aulas').delete().eq('id', id)
    setMensajeAula({
      texto: error ? 'Error al eliminar' : '✅ Aula eliminada',
      tipo: error ? 'error' : 'ok'
    })
    cargarAulas()
    setTimeout(() => setMensajeAula({ texto: '', tipo: '' }), 3000)
  }

  async function mostrarQr(aula) {
    const dataUrl = await QRCode.toDataURL(textoQrAula(aula.codigo), { width: 280, margin: 2 })
    setQrVisible({ codigo: aula.codigo, nombre: aula.nombre, dataUrl })
  }

  function nombreEdificio(id) {
    return edificios.find(e => e.id === id)?.nombre || '—'
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
                  setFormulario({
                    nombre: '', descripcion: '',
                    latitud: '', longitud: '', tipo: ''
                  })
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

      {mensajeAula.texto && (
        <div className={`mensaje ${mensajeAula.tipo}`}>{mensajeAula.texto}</div>
      )}

      {/* Formulario aulas */}
      <div className="card">
        <div className="card-titulo">
          {editandoAulaId ? '✏️ Editar aula/puerta' : '➕ Agregar aula/puerta (QR indoor)'}
        </div>
        <form onSubmit={guardarAula}>
          <div className="form-grid">
            <div className="form-grid-full">
              <select name="edificio_id" value={formularioAula.edificio_id}
                onChange={handleCambioAula} required className="form-input">
                <option value="">Seleccionar edificio</option>
                {edificios.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <input name="codigo" placeholder="Código único (se genera solo al elegir edificio)"
              value={formularioAula.codigo} onChange={handleCambioAula}
              required className="form-input" />
            <input name="nombre" placeholder="Nombre (ej: Aula de Enfermería)"
              value={formularioAula.nombre} onChange={handleCambioAula}
              required className="form-input" />
            <div className="form-grid-full">
              <input name="descripcion" placeholder="Descripción de lo que hay ahí"
                value={formularioAula.descripcion} onChange={handleCambioAula}
                className="form-input" />
            </div>
          </div>
          <div className="form-acciones">
            <button type="submit" className="btn-primario">
              {editandoAulaId ? 'Actualizar' : 'Agregar aula'}
            </button>
            {editandoAulaId && (
              <button type="button" className="btn-secundario"
                onClick={() => {
                  setEditandoAulaId(null)
                  setFormularioAula(AULA_VACIA)
                  setCodigoAutoGenerado(true)
                }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla aulas */}
      <div className="card tabla-wrapper">
        <div className="card-titulo">
          🚪 Aulas / puertas registradas ({aulas.length})
        </div>
        <table className="tabla">
          <thead>
            <tr>
              {['Edificio', 'Código', 'Nombre', 'Acciones'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aulas.map(a => (
              <tr key={a.id}>
                <td style={{ color: '#64748b' }}>{nombreEdificio(a.edificio_id)}</td>
                <td><span className="badge-tipo">{a.codigo}</span></td>
                <td style={{ fontWeight: '600' }}>{a.nombre}</td>
                <td>
                  <button className="btn-editar" onClick={() => mostrarQr(a)}>QR</button>
                  <button className="btn-editar" onClick={() => editarAula(a)}>Editar</button>
                  <button className="btn-eliminar" onClick={() => eliminarAula(a.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrVisible && (
        <div className="modal-qr-fondo" onClick={() => setQrVisible(null)}>
          <div className="modal-qr-tarjeta" onClick={e => e.stopPropagation()}>
            <div className="card-titulo">{qrVisible.nombre}</div>
            <img src={qrVisible.dataUrl} alt={`QR de ${qrVisible.nombre}`} width={220} height={220} />
            <p style={{ fontSize: 13, color: '#64748b', margin: '10px 0' }}>
              Código: <strong>{qrVisible.codigo}</strong>. Imprime y pega este QR junto a la puerta correspondiente.
            </p>
            <div className="form-acciones">
              <a className="btn-primario" style={{ textDecoration: 'none' }}
                href={qrVisible.dataUrl} download={`qr-${qrVisible.codigo}.png`}>
                Descargar PNG
              </a>
              <button className="btn-secundario" onClick={() => setQrVisible(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PanelAdmin