import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAdmin(req: NextRequest) {
  const auth = req.headers.get('x-admin-token')
  return auth === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data } = await supabaseAdmin
    .from('enc_eventos')
    .select('*, enc_opciones(id, texto, orden), enc_codigos(id, usado)')
    .order('created_at', { ascending: false })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { titulo, descripcion } = await req.json()
  // Desactivar eventos previos
  await supabaseAdmin.from('enc_eventos').update({ activo: false }).eq('activo', true)
  const { data, error } = await supabaseAdmin
    .from('enc_eventos')
    .insert({ titulo, descripcion, activo: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id, activo } = await req.json()
  // Si se reactiva, cerrar los demás primero
  if (activo) {
    await supabaseAdmin.from('enc_eventos').update({ activo: false }).neq('id', id)
  }
  const { data, error } = await supabaseAdmin
    .from('enc_eventos')
    .update({ activo })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
