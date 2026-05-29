import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/PanelAdmin.css'

function PanelAdmin() {
  const [admin, setAdmin] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [cargandoLogin, setCargandoLogin] = useState(false)
  const [edificios, setEdificios] = useState([])
  const [formulario, setFormulario] = useState({
    nombre: '', descripcion: '', latitud: '', longitud: '', tipo: ''
  })
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  useEffect(() => {
    if (admin) cargarEdificios()
  }, [admin])

  async function iniciarSesion(e) {
    e.preventDefault()
    setCargandoLogin(true)
    setErrorLogin('')
    const { data, error } = await supabase
      .from('administradores')
      .select('*')
      .eq('email', email.trim())
      .eq('password', password)
      .single()
    setCargandoLogin(false)
    if (error || !data) {
      setErrorLogin('Correo o contraseña incorrectos.')
      setPassword('')
    } else {
      setAdmin(data)
    }
  }

  async function cargarEdificios() {
    const { data } = await supabase
      .from('edificios').select('*').order('nombre')
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
    const { error } = await supabase
      .from('edificios').delete().eq('id', id)
    setMensaje({
      texto: error ? 'Error al eliminar' : '✅ Edificio eliminado',
      tipo: error ? 'error' : 'ok'
    })
    cargarEdificios()
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
  }

  // ── LOGIN ────────────────────────────────────────────
  if (!admin) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-icono">🔒</div>
          <h2 className="login-titulo">Acceso restringido</h2>
          <p className="login-subtitulo">
            Exclusivo para personal autorizado de la PUCE Ibarra
          </p>
          <form className="login-form" onSubmit={iniciarSesion}>
            <input
              type="email"
              placeholder="Correo institucional"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrorLogin('') }}
              required
              className="form-input"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrorLogin('') }}
              required
              className={`form-input ${errorLogin ? 'error' : ''}`}
            />
            {errorLogin && (
              <p className="login-error">⚠️ {errorLogin}</p>
            )}
            <button
              type="submit"
              className="btn-login"
              disabled={cargandoLogin}
            >
              {cargandoLogin ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── PANEL ────────────────────────────────────────────
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
            <input name="latitud" placeholder="Latitud (ej: 0.3521)"
              value={formulario.latitud} onChange={handleCambio}
              required className="form-input" />
            <input name="longitud" placeholder="Longitud (ej: -78.1098)"
              value={formulario.longitud} onChange={handleCambio}
              required className="form-input" />
            <div className="form-grid-full">
              <select name="tipo" value={formulario.tipo}
                onChange={handleCambio} className="form-input">
                <option value="">Seleccionar tipo</option>
                <option value="Académico">Académico</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Servicios">Servicios</option>
                <option value="Deportivo">Deportivo</option>
              </select>
            </div>
          </div>
          <div className="form-acciones">
            <button type="submit" className="btn-primario">
              {editandoId ? 'Actualizar' : 'Agregar edificio'}
            </button>
            {editandoId && (
              <button type="button" className="btn-secundario"
                onClick={() => {
                  setEditandoId(null)
                  setFormulario({ nombre: '', descripcion: '', latitud: '', longitud: '', tipo: '' })
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
    </div>
  )
}

export default PanelAdmin