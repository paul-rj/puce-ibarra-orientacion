import { useEffect, useState } from 'react'
import '../styles/Bienvenida.css'

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
          src="/mascota.png"
          className="bienvenida-mascota"
        />

        <div className="bienvenida-titulo">¡Hola! Bienvenido/a a PUCE Ibarra 🐾</div>

        <p className="bienvenida-texto">
          Soy tu guía de campus y estoy acá para que no te pierdas ni el primer día 😄.
          En esta app vas a encontrar el <strong>mapa interactivo</strong> de todos los
          edificios y, si querés ponerle un poco de magia, activá la
          <strong> Realidad Aumentada</strong>: apuntá la cámara a un edificio (o a una
          puerta con su código QR) y te digo al toque qué es.
        </p>

        <button className="bienvenida-boton" onClick={cerrar}>
          ¡Vamos a explorar! 🚀
        </button>
      </div>
    </div>
  )
}

export default Bienvenida
