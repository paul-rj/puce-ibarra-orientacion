import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useEdificios() {
  const [edificios, setEdificios] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargarEdificios() {
    setCargando(true)
    const { data } = await supabase
      .from('edificios')
      .select('*')
      .order('nombre')
    setEdificios(data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargarEdificios()
  }, [])

  return { edificios, cargando, cargarEdificios }
}