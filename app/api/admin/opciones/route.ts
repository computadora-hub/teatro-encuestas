import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-token') === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { eventoId, opciones } = await req.json()
  // Borrar opciones previas del evento
  await supabaseAdmin.from('enc_opciones').delete().eq('evento_id', eventoId)
  const rows = opciones.map((texto: string, i: number) => ({
    evento_id: eventoId,
    texto,
    orden: i,
  }))
  const { error } = await supabaseAdmin.from('enc_opciones').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
