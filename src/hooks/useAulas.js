import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useAulas() {
  const [aulas, setAulas] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargarAulas() {
    setCargando(true)
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .order('codigo')
    if (!error) setAulas(data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargarAulas()
  }, [])

  return { aulas, cargando, cargarAulas }
}
