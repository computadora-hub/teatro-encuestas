'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

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
      setError(data.error || 'Error al verificar el código')
      setCargando(false)
      return
    }
    router.push(`/votar/${data.eventoId}?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎭</div>
          <h1 className="text-2xl font-bold text-gray-800">Votación</h1>
          <p className="text-gray-500 mt-2">Ingresá tu código para votar</p>
        </div>
        <form onSubmit={handleVotar} className="space-y-4">
          <input
            type="text"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="Tu código"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-400"
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
        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/admin" className="hover:underline">Administrador</a>
        </p>
      </div>
    </main>
  )
}
