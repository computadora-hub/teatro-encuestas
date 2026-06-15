'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Evento = { id: string; titulo: string; descripcion: string }

export default function EntradaEvento() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const router = useRouter()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    fetch(`/api/publico/evento?id=${eventoId}`)
      .then(r => { if (!r.ok) setNotFound(true); return r.json() })
      .then(d => { if (d.evento) setEvento(d.evento) })
  }, [eventoId])

  async function handleVotar(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return
    setCargando(true)
    setError('')
    const res = await fetch('/api/verificar-codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: codigo.trim().toUpperCase() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Código no válido')
      setCargando(false)
      return
    }
    router.push(`/votar/${eventoId}?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`)
  }

  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-500">Este evento no existe o ya cerró.</p>
      </div>
    </main>
  )

  if (!evento) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎭</div>
          <h1 className="text-2xl font-bold text-gray-800">{evento.titulo}</h1>
          {evento.descripcion && <p className="text-gray-500 mt-2">{evento.descripcion}</p>}
          <p className="text-gray-400 text-sm mt-3">Ingresá tu código para votar</p>
        </div>
        <form onSubmit={handleVotar} className="space-y-4">
          <input
            type="text"
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setError('') }}
            placeholder="Tu código"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={cargando || !codigo.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {cargando ? 'Verificando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </main>
  )
}
