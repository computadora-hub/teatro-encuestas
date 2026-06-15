import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-token') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const eventoId = req.nextUrl.searchParams.get('eventoId')
  if (!eventoId) return NextResponse.json({ error: 'eventoId requerido' }, { status: 400 })

  const { data: opciones } = await supabaseAdmin
    .from('enc_opciones')
    .select('id, texto, orden')
    .eq('evento_id', eventoId)
    .order('orden')

  const { data: votos } = await supabaseAdmin
    .from('enc_votos')
    .select('opcion_id')
    .eq('evento_id', eventoId)

  const { count: totalCodigos } = await supabaseAdmin
    .from('enc_codigos')
    .select('id', { count: 'exact', head: true })
    .eq('evento_id', eventoId)

  const conteo: Record<string, number> = {}
  for (const v of (votos || [])) {
    conteo[v.opcion_id] = (conteo[v.opcion_id] || 0) + 1
  }

  const resultado = (opciones || []).map(o => ({
    id: o.id,
    texto: o.texto,
    votos: conteo[o.id] || 0,
  }))

  const { data: evento } = await supabaseAdmin
    .from('enc_eventos')
    .select('titulo')
    .eq('id', eventoId)
    .maybeSingle()

  return NextResponse.json({
    resultado,
    totalVotos: votos?.length || 0,
    totalCodigos: totalCodigos || 0,
    titulo: evento?.titulo || '',
  })
}
