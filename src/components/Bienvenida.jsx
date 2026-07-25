import { useEffect, useState } from 'react'
import '../styles/Bienvenida.css'
import mascota from '../assets/mascota.png'

const CLAVE_SESION = 'puce-bienvenida-vista'

function Bienvenida() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(CLAVE_SESION)
    } catch {
     
      return true
    }
  })

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  function cerrar() {
    try {
      sessionStorage.setItem(CLAVE_SESION, '1')
    } catch {
      // Sin almacenamiento disponible, no pasa nada
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bienvenida-fondo" onClick={cerrar}>
      <div className="bienvenida-tarjeta" onClick={e => e.stopPropagation()}>
        <button className="bienvenida-cerrar" onClick={cerrar} aria-label="Cerrar bienvenida">
          ✕
        </button>

        <img
          src={mascota}
          alt="Mascota de bienvenida"
          className="bienvenida-mascota"
        />

        <div className="bienvenida-titulo">¡Hola! Bienvenido/a a PUCE Ibarra 🐾</div>

        <p className="bienvenida-texto">
          Soy tu guía de campus y estoy aqui para que no te pierdas tu primer día 😄.
          En esta app vas a encontrar el <strong>mapa interactivo</strong> de todos los
          edificios y, si deseas un poco de magia, activá la
          <strong> Realidad Aumentada</strong>: apuntá la cámara a un edificio (o a una
          puerta con su código QR) y te digo que podras encontrar en esta.
        </p>

        <button className="bienvenida-boton" onClick={cerrar}>
          ¡Vamos a explorar! 🚀
        </button>
      </div>
    </div>
  )
}

export default Bienvenida
