import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-token') === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { eventoId } = await req.json()
  if (!eventoId) return NextResponse.json({ error: 'eventoId requerido' }, { status: 400 })

  // Borrar todos los votos del evento
  await supabaseAdmin.from('enc_votos').delete().eq('evento_id', eventoId)

  // Liberar todos los códigos (marcar como no usados)
  await supabaseAdmin
    .from('enc_codigos')
    .update({ usado: false, usado_at: null })
    .eq('evento_id', eventoId)

  return NextResponse.json({ ok: true })
}
