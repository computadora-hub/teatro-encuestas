import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { codigo, opcionId, eventoId } = await req.json()
  if (!codigo || !opcionId || !eventoId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Verificar código
  const { data: cod, error: codErr } = await supabaseAdmin
    .from('enc_codigos')
    .select('id, usado')
    .eq('codigo', codigo)
    .eq('evento_id', eventoId)
    .maybeSingle()

  if (codErr || !cod) return NextResponse.json({ error: 'Código no válido' }, { status: 404 })
  if (cod.usado) return NextResponse.json({ error: 'Código ya utilizado' }, { status: 409 })

  // Registrar voto
  const { error: votoErr } = await supabaseAdmin
    .from('enc_votos')
    .insert({ evento_id: eventoId, opcion_id: opcionId, codigo_id: cod.id })

  if (votoErr) return NextResponse.json({ error: 'Error al registrar voto' }, { status: 500 })

  // Marcar código como usado
  await supabaseAdmin
    .from('enc_codigos')
    .update({ usado: true, usado_at: new Date().toISOString() })
    .eq('id', cod.id)

  return NextResponse.json({ ok: true })
}
