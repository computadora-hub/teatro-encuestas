import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  return req.headers.get('x-admin-token') === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { eventoId, codigos } = await req.json()
  const rows = codigos.map((c: string) => ({ evento_id: eventoId, codigo: c.trim().toUpperCase(), usado: false }))
  // upsert: ignora duplicados
  const { error } = await supabaseAdmin
    .from('enc_codigos')
    .upsert(rows, { onConflict: 'evento_id,codigo', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cargados: rows.length })
}
