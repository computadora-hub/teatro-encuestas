'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Evento = {
  id: string
  titulo: string
  descripcion: string
  activo: boolean
  enc_opciones: { id: string; texto: string; orden: number }[]
  enc_codigos: { id: string; usado: boolean }[]
}
type Resultado = { id: string; texto: string; votos: number }

const COLORES = ['#7c3aed','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe','#8b5cf6','#6d28d9','#5b21b6','#4c1d95','#f5f3ff']

export default function Dashboard() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [tab, setTab] = useState<'evento'|'opciones'|'codigos'|'resultados'>('evento')

  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null)

  // Formulario nuevo evento
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [creando, setCreando] = useState(false)

  // Opciones
  const [opciones, setOpciones] = useState<string[]>(Array(10).fill(''))
  const [guardandoOpciones, setGuardandoOpciones] = useState(false)

  // Códigos
  const fileRef = useRef<HTMLInputElement>(null)
  const [cargandoCodigos, setCargandoCodigos] = useState(false)
  const [msgCodigos, setMsgCodigos] = useState('')

  // Resultados
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [totalVotos, setTotalVotos] = useState(0)
  const [totalCodigos, setTotalCodigos] = useState(0)
  const [cargandoResultados, setCargandoResultados] = useState(false)

  useEffect(() => {
    const t = sessionStorage.getItem('adminToken')
    if (!t) { router.replace('/admin'); return }
    setToken(t)
    cargarEventos(t)
  }, [router])

  async function cargarEventos(t: string) {
    const res = await fetch('/api/admin/evento', { headers: { 'x-admin-token': t } })
    if (res.status === 401) { router.replace('/admin'); return }
    const data: Evento[] = await res.json()
    setEventos(data)
    const activo = data.find(e => e.activo) || null
    setEventoActivo(activo)
    if (activo?.enc_opciones?.length) {
      const ops = Array(10).fill('')
      activo.enc_opciones.sort((a,b) => a.orden - b.orden).forEach((o, i) => { ops[i] = o.texto })
      setOpciones(ops)
    }
  }

  async function crearEvento(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setCreando(true)
    await fetch('/api/admin/evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ titulo: titulo.trim(), descripcion: descripcion.trim() }),
    })
    setTitulo(''); setDescripcion('')
    await cargarEventos(token)
    setCreando(false)
    setTab('opciones')
  }

  async function guardarOpciones(e: React.FormEvent) {
    e.preventDefault()
    if (!eventoActivo) return
    const validas = opciones.filter(o => o.trim())
    if (validas.length < 2) return alert('Necesitás al menos 2 opciones')
    setGuardandoOpciones(true)
    await fetch('/api/admin/opciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ eventoId: eventoActivo.id, opciones: validas }),
    })
    await cargarEventos(token)
    setGuardandoOpciones(false)
    setTab('codigos')
  }

  async function cargarArchivoCodigos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!eventoActivo || !e.target.files?.[0]) return
    setCargandoCodigos(true)
    setMsgCodigos('')
    const text = await e.target.files[0].text()
    const codigos = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const res = await fetch('/api/admin/codigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ eventoId: eventoActivo.id, codigos }),
    })
    const data = await res.json()
    await cargarEventos(token)
    setMsgCodigos(res.ok ? `✅ ${data.cargados} códigos cargados` : `❌ ${data.error}`)
    setCargandoCodigos(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function verResultados() {
    if (!eventoActivo) return
    setCargandoResultados(true)
    const res = await fetch(`/api/admin/resultados?eventoId=${eventoActivo.id}`, {
      headers: { 'x-admin-token': token },
    })
    const data = await res.json()
    setResultados(data.resultado || [])
    setTotalVotos(data.totalVotos || 0)
    setTotalCodigos(data.totalCodigos || 0)
    setCargandoResultados(false)
    setTab('resultados')
  }

  async function toggleActivo() {
    if (!eventoActivo) return
    await fetch('/api/admin/evento', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id: eventoActivo.id, activo: !eventoActivo.activo }),
    })
    await cargarEventos(token)
  }

  const codigosTotal = eventoActivo?.enc_codigos?.length || 0
  const codigosUsados = eventoActivo?.enc_codigos?.filter(c => c.usado).length || 0

  return (
    <main className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">🎭 Panel Admin</h1>
          <button onClick={() => { sessionStorage.clear(); router.replace('/admin') }}
            className="text-sm text-gray-400 hover:text-gray-600">Salir</button>
        </div>

        {/* Estado del evento activo */}
        {eventoActivo && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-800">{eventoActivo.titulo}</p>
              <p className="text-xs text-purple-600 mt-1">
                {codigosTotal} códigos · {codigosUsados} votos recibidos · {eventoActivo.enc_opciones?.length || 0} opciones
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${eventoActivo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {eventoActivo.activo ? 'Activo' : 'Cerrado'}
              </span>
              <button onClick={toggleActivo}
                className="text-xs text-purple-600 underline hover:no-underline">
                {eventoActivo.activo ? 'Cerrar' : 'Abrir'}
              </button>
            </div>
          </div>
        )}

        {/* Links del evento */}
        {eventoActivo && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links</p>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-gray-700">🗳️ Para votantes</p>
                <p className="text-xs text-gray-400 font-mono">/e/{eventoActivo.id.slice(0,8)}...</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/e/${eventoActivo.id}`)}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition font-medium">
                Copiar link
              </button>
            </div>
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-gray-700">📊 Resultados</p>
                <p className="text-xs text-gray-400 font-mono">/resultados/{eventoActivo.id.slice(0,8)}...</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/resultados/${eventoActivo.id}`)}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium">
                Copiar link
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm">
          {(['evento','opciones','codigos','resultados'] as const).map(t => (
            <button key={t} onClick={() => t === 'resultados' ? verResultados() : setTab(t)}
              className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg font-medium transition ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              <span className="hidden sm:inline">{t === 'evento' ? '📋 Evento' : t === 'opciones' ? '📝 Opciones' : t === 'codigos' ? '🔑 Códigos' : '📊 Resultados'}</span>
              <span className="sm:hidden text-base">{t === 'evento' ? '📋' : t === 'opciones' ? '📝' : t === 'codigos' ? '🔑' : '📊'}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">

          {/* TAB EVENTO */}
          {tab === 'evento' && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-4">Crear nuevo evento</h2>
              <form onSubmit={crearEvento} className="space-y-3">
                <input value={titulo} onChange={e => setTitulo(e.target.value)}
                  placeholder="Título del evento (ej: Obra favorita 2025)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <button type="submit" disabled={creando || !titulo.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                  {creando ? 'Creando...' : 'Crear evento'}
                </button>
              </form>
              {eventos.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Eventos anteriores</h3>
                  <div className="space-y-2">
                    {eventos.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
                        <span className="text-gray-700">{ev.titulo}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ev.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ev.activo ? 'Activo' : 'Cerrado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB OPCIONES */}
          {tab === 'opciones' && (
            <div>
              {!eventoActivo ? (
                <p className="text-gray-400 text-center py-8">Primero creá un evento</p>
              ) : (
                <form onSubmit={guardarOpciones} className="space-y-3">
                  <h2 className="font-semibold text-gray-700 mb-1">Opciones para: <span className="text-purple-700">{eventoActivo.titulo}</span></h2>
                  <p className="text-xs text-gray-400 mb-3">Podés cargar hasta 10. Dejá vacías las que no uses.</p>
                  {opciones.map((op, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs text-gray-400 w-5">{i+1}.</span>
                      <input value={op} onChange={e => { const n=[...opciones]; n[i]=e.target.value; setOpciones(n) }}
                        placeholder={`Opción ${i+1}`}
                        className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                  ))}
                  <button type="submit" disabled={guardandoOpciones}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-2">
                    {guardandoOpciones ? 'Guardando...' : 'Guardar opciones'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB CODIGOS */}
          {tab === 'codigos' && (
            <div>
              {!eventoActivo ? (
                <p className="text-gray-400 text-center py-8">Primero creá un evento</p>
              ) : (
                <div className="space-y-4">
                  <h2 className="font-semibold text-gray-700">Códigos para: <span className="text-purple-700">{eventoActivo.titulo}</span></h2>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-purple-700">{codigosTotal}</p>
                    <p className="text-sm text-gray-500">códigos cargados</p>
                    <p className="text-xs text-gray-400 mt-1">{codigosUsados} usados · {codigosTotal - codigosUsados} disponibles</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Subí un archivo <strong>.txt</strong> o <strong>.csv</strong> con un código por línea:</p>
                    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${cargandoCodigos ? 'border-gray-200 bg-gray-50' : 'border-purple-300 hover:bg-purple-50'}`}>
                      <span className="text-2xl mb-2">📄</span>
                      <span className="text-sm text-gray-500">{cargandoCodigos ? 'Cargando...' : 'Hacer click para seleccionar archivo'}</span>
                      <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={cargarArchivoCodigos} disabled={cargandoCodigos} />
                    </label>
                    {msgCodigos && <p className="text-sm text-center mt-2">{msgCodigos}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB RESULTADOS */}
          {tab === 'resultados' && (
            <div>
              {!eventoActivo ? (
                <p className="text-gray-400 text-center py-8">No hay evento activo</p>
              ) : cargandoResultados ? (
                <p className="text-gray-400 text-center py-8">Cargando...</p>
              ) : (
                <div className="space-y-4">
                  <h2 className="font-semibold text-gray-700">Resultados: <span className="text-purple-700">{eventoActivo.titulo}</span></h2>
                  <div className="flex gap-4 text-center">
                    <div className="flex-1 bg-purple-50 rounded-xl p-3">
                      <p className="text-2xl font-bold text-purple-700">{totalVotos}</p>
                      <p className="text-xs text-gray-500">votos totales</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3">
                      <p className="text-2xl font-bold text-gray-700">{totalCodigos}</p>
                      <p className="text-xs text-gray-500">códigos emitidos</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3">
                      <p className="text-2xl font-bold text-gray-700">{totalCodigos > 0 ? Math.round(totalVotos/totalCodigos*100) : 0}%</p>
                      <p className="text-xs text-gray-500">participación</p>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="space-y-2">
                    {[...resultados].sort((a,b) => b.votos - a.votos).map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-gray-400 w-4">{i+1}</span>
                          <span className="text-sm text-gray-700 truncate">{r.texto}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: totalVotos > 0 ? `${r.votos/totalVotos*100}%` : '0%' }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-800 w-20 text-right">
                            {r.votos} <span className="text-gray-400 font-normal text-xs">({totalVotos > 0 ? Math.round(r.votos/totalVotos*100) : 0}%)</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gráfico */}
                  {resultados.length > 0 && (
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[...resultados].sort((a,b) => b.votos - a.votos).map((r,i) => ({...r, num: i+1}))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                          <XAxis dataKey="num" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v, _, p) => [`${v} votos`, p.payload.texto]} />
                          <Bar dataKey="votos" radius={[6,6,0,0]}>
                            {resultados.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <p className="text-xs text-gray-400 text-center mt-1">El número en el eje X corresponde al orden de la tabla</p>
                    </div>
                  )}

                  <button onClick={verResultados} className="w-full text-sm text-purple-600 border border-purple-200 rounded-xl py-2 hover:bg-purple-50 transition">
                    🔄 Actualizar resultados
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
