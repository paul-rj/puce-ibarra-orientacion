import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [cargandoLogin, setCargandoLogin] = useState(false)

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
      onLogin(data)
    }
  }

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

export default Login
