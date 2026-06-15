import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { data: evento } = await supabaseAdmin
    .from('enc_eventos')
    .select('id, titulo, descripcion')
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle()

  if (!evento) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { data: opciones } = await supabaseAdmin
    .from('enc_opciones')
    .select('id, texto, orden')
    .eq('evento_id', id)
    .order('orden')

  return NextResponse.json({ evento, opciones })
}
