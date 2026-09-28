'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

type Evento = { id: string; titulo: string; descripcion: string }

export default function ImprimirPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [url, setUrl] = useState('')

  useEffect(() => {
    const base = window.location.origin
    setUrl(`${base}/e/${eventoId}`)
    fetch(`/api/publico/evento?id=${eventoId}`)
      .then(r => r.json())
      .then(d => { if (d.evento) setEvento(d.evento) })
  }, [eventoId])

  if (!evento) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  return (
    <>
      {/* Botón imprimir - no aparece en la impresión */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <button
          onClick={() => window.print()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition"
        >
          🖨️ Imprimir
        </button>
      </div>

      {/* Hoja A4 */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-center justify-center p-8 print:p-0">
        <div
          className="bg-white print:shadow-none shadow-xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '14mm 20mm',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          {/* Ícono */}
          <div style={{ fontSize: '48px', lineHeight: 1 }}>🎭</div>

          {/* Título */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Votación
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', lineHeight: 1.2 }}>
              {evento.titulo}
            </h1>
            {evento.descripcion && (
              <p style={{ fontSize: '15px', color: '#6b7280', marginTop: '6px' }}>
                {evento.descripcion}
              </p>
            )}
          </div>

          {/* QR */}
          <div style={{
            border: '4px solid #7c3aed',
            borderRadius: '20px',
            padding: '20px',
            background: 'white',
          }}>
            {url && <QRCodeSVG value={url} size={440} level="H" />}
          </div>

          {/* Instrucciones */}
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
              ¿Cómo votar?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                '1. Escaneá el código QR con tu celular',
                '2. Ingresá el código que recibiste',
                '3. Elegí tu obra favorita y confirmá',
              ].map((paso, i) => (
                <p key={i} style={{ fontSize: '15px', color: '#4b5563' }}>{paso}</p>
              ))}
            </div>
          </div>

          {/* URL escrita */}
          <div style={{
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '10px 28px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
              O ingresá manualmente a:
            </p>
            <p style={{ fontSize: '38px', fontWeight: '800', color: '#7c3aed', letterSpacing: '0.05em' }}>
              T1.AR/VOTO
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
