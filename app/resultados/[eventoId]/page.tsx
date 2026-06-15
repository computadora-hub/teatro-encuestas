'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Resultado = { id: string; texto: string; votos: number }

const COLORES = ['#7c3aed','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe','#8b5cf6','#6d28d9','#5b21b6','#4c1d95','#f5f3ff']

export default function ResultadosPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [errorAuth, setErrorAuth] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [totalVotos, setTotalVotos] = useState(0)
  const [totalCodigos, setTotalCodigos] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    const res = await fetch(`/api/admin/resultados?eventoId=${eventoId}`, {
      headers: { 'x-admin-token': password },
    })
    if (res.status === 401) {
      setErrorAuth('Contraseña incorrecta')
      setCargando(false)
      return
    }
    const data = await res.json()
    setResultados(data.resultado || [])
    setTotalVotos(data.totalVotos || 0)
    setTotalCodigos(data.totalCodigos || 0)
    setTitulo(data.titulo || '')
    sessionStorage.setItem('adminToken', password)
    setAutenticado(true)
    setCargando(false)
  }

  async function actualizar() {
    const token = sessionStorage.getItem('adminToken') || password
    const res = await fetch(`/api/admin/resultados?eventoId=${eventoId}`, {
      headers: { 'x-admin-token': token },
    })
    const data = await res.json()
    setResultados(data.resultado || [])
    setTotalVotos(data.totalVotos || 0)
    setTotalCodigos(data.totalCodigos || 0)
  }

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken')
    if (!token || !autenticado) return
    const interval = setInterval(actualizar, 30000)
    return () => clearInterval(interval)
  }, [autenticado, eventoId])

  if (!autenticado) return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📊</div>
          <h1 className="text-xl font-bold text-gray-800">Ver resultados</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setErrorAuth('') }}
            placeholder="Contraseña de administrador"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            autoFocus
          />
          {errorAuth && <p className="text-red-500 text-sm text-center">{errorAuth}</p>}
          <button type="submit" disabled={cargando || !password.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
            {cargando ? 'Cargando...' : 'Ver resultados'}
          </button>
        </form>
      </div>
    </main>
  )

  const sorted = [...resultados].sort((a, b) => b.votos - a.votos)

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📊</div>
          <h1 className="text-2xl font-bold text-gray-800">{titulo || 'Resultados'}</h1>
        </div>

        <div className="flex gap-4 text-center mb-6">
          <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
            <p className="text-3xl font-bold text-purple-700">{totalVotos}</p>
            <p className="text-xs text-gray-500 mt-1">votos totales</p>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
            <p className="text-3xl font-bold text-gray-700">{totalCodigos}</p>
            <p className="text-xs text-gray-500 mt-1">códigos emitidos</p>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
            <p className="text-3xl font-bold text-gray-700">
              {totalCodigos > 0 ? Math.round(totalVotos / totalCodigos * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">participación</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="space-y-3 mb-6">
            {sorted.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-800 font-medium">{r.texto}</span>
                <div className="w-32 bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full" style={{
                    width: totalVotos > 0 ? `${r.votos / totalVotos * 100}%` : '0%',
                    backgroundColor: COLORES[i % COLORES.length]
                  }} />
                </div>
                <span className="text-sm font-bold text-gray-800 w-20 text-right">
                  {r.votos} <span className="text-gray-400 font-normal">({totalVotos > 0 ? Math.round(r.votos / totalVotos * 100) : 0}%)</span>
                </span>
              </div>
            ))}
          </div>

          {resultados.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sorted.map((r,i) => ({...r, num: i+1}))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <XAxis dataKey="num" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, _, p) => [`${v} votos`, p.payload.texto]} />
                <Bar dataKey="votos" radius={[6, 6, 0, 0]}>
                  {sorted.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-400 text-center">El número en el gráfico corresponde al orden de la tabla</p>
        </div>

        <button onClick={actualizar}
          className="w-full text-sm text-purple-600 border border-purple-200 bg-white rounded-xl py-3 hover:bg-purple-50 transition">
          🔄 Actualizar resultados
        </button>
      </div>
    </main>
  )
}
