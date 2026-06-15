import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { codigo } = await req.json()
  if (!codigo) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  // Buscar el código en el evento activo
  const { data, error } = await supabaseAdmin
    .from('enc_codigos')
    .select('id, usado, evento_id, enc_eventos!inner(id, activo)')
    .eq('codigo', codigo)
    .eq('enc_eventos.activo', true)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Código no válido' }, { status: 404 })
  }

  if (data.usado) {
    return NextResponse.json({ error: 'Este código ya fue utilizado' }, { status: 409 })
  }

  return NextResponse.json({ eventoId: data.evento_id })
}
