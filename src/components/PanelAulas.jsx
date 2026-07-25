import { useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../supabaseClient'
import { textoQrAula } from '../config/aulaConfig'

const AULA_VACIA = { edificio_id: '', codigo: '', nombre: '', descripcion: '' }

function PanelAulas({ edificios, aulas, onRecargar }) {
  const [formularioAula, setFormularioAula] = useState(AULA_VACIA)
  const [editandoAulaId, setEditandoAulaId] = useState(null)
  const [mensajeAula, setMensajeAula] = useState({ texto: '', tipo: '' })
  const [qrVisible, setQrVisible] = useState(null) // { codigo, nombre, dataUrl }
  // Mientras esto sea true, elegir un edificio recalcula el código solo.
  // Se apaga en cuanto el usuario toca el campo código a mano.
  const [codigoAutoGenerado, setCodigoAutoGenerado] = useState(true)

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
    onRecargar()
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
    onRecargar()
    setTimeout(() => setMensajeAula({ texto: '', tipo: '' }), 3000)
  }

  async function mostrarQr(aula) {
    const dataUrl = await QRCode.toDataURL(textoQrAula(aula.codigo), { width: 280, margin: 4 })
    setQrVisible({ codigo: aula.codigo, nombre: aula.nombre, dataUrl })
  }

  function nombreEdificio(id) {
    return edificios.find(e => e.id === id)?.nombre || '—'
  }

  return (
    <>
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
    </>
  )
}

export default PanelAulas
