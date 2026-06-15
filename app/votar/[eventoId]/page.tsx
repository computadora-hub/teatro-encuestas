'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

type Opcion = { id: string; texto: string; orden: number }
type Evento = { id: string; titulo: string; descripcion: string }

export default function VotarPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const searchParams = useSearchParams()
  const codigo = searchParams.get('codigo') || ''
  const router = useRouter()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [opciones, setOpciones] = useState<Opcion[]>([])
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!codigo) { router.replace('/'); return }
    fetch(`/api/publico/evento?id=${eventoId}`)
      .then(r => r.json())
      .then(d => { setEvento(d.evento); setOpciones(d.opciones) })
  }, [eventoId, codigo, router])

  async function handleVotar() {
    if (!seleccion) return
    setEnviando(true)
    setError('')
    const res = await fetch('/api/votar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, opcionId: seleccion, eventoId }),
    })
    if (res.ok) {
      router.replace('/gracias')
    } else {
      const d = await res.json()
      setError(d.error || 'Error al votar')
      setEnviando(false)
    }
  }

  if (!evento) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎭</div>
          <h1 className="text-2xl font-bold text-gray-800">{evento.titulo}</h1>
          {evento.descripcion && <p className="text-gray-500 mt-1">{evento.descripcion}</p>}
        </div>
        <p className="text-sm font-semibold text-gray-600 mb-3">Elegí una opción:</p>
        <div className="space-y-3 mb-6">
          {opciones.map(op => (
            <button
              key={op.id}
              onClick={() => setSeleccion(op.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition font-medium ${
                seleccion === op.id
                  ? 'border-purple-500 bg-purple-50 text-purple-800'
                  : 'border-gray-200 hover:border-purple-300 text-gray-700'
              }`}
            >
              {op.texto}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
        <button
          onClick={handleVotar}
          disabled={!seleccion || enviando}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Confirmar voto'}
        </button>
      </div>
    </main>
  )
}
