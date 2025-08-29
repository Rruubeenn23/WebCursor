import { NextRequest } from 'next/server'
import PDFDocument from 'pdfkit'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // PDFKit necesita Node, no Edge

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart') // yyyy-mm-dd
  if (!weekStart) {
    return new Response('Missing weekStart', { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Authenticated user (required to bind to RLS)
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: weekLoad } = await supabase
    .from('v_weekly_load')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle()

  const { data: perEx } = await supabase
    .from('v_weekly_load_exercise')
    .select('exercise_id, tonnage_kg, sets')
    .eq('user_id', userId)
    .eq('week_start', weekStart)

  const exIds = (perEx ?? []).map(x => x.exercise_id)
  const { data: exercises } = exIds.length
    ? await supabase.from('exercises').select('id, name').in('id', exIds)
    : { data: [] as any[] }

  const nameMap = new Map((exercises ?? []).map((e: any) => [e.id, e.name]))

  // --- Generar PDF ---
  const doc = new PDFDocument({ margin: 40 })
  const chunks: Buffer[] = []

  doc.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
  const done = new Promise<Uint8Array>((resolve) => {
    doc.on('end', () => {
      const buf = Buffer.concat(chunks) // Buffer Node
      // Convertimos a Uint8Array
      resolve(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength))
    })
  })

  doc.fontSize(18).text('Informe semanal', { underline: true })
  doc.moveDown(0.5)
  doc.fontSize(12).text(`Semana que empieza: ${weekStart}`)
  doc.moveDown()

  doc.fontSize(14).text('Resumen')
  doc.fontSize(12)
  doc.text(`Sesiones: ${weekLoad?.sessions ?? 0}`)
  doc.text(`Sets: ${weekLoad?.sets ?? 0}`)
  doc.text(`Tonnage: ${Math.round(weekLoad?.tonnage_kg ?? 0)} kg`)
  doc.moveDown()

  doc.fontSize(14).text('Por ejercicio')
  doc.moveDown(0.5)
  for (const row of (perEx ?? [])) {
    doc.fontSize(12).text(
      `${nameMap.get(row.exercise_id) || row.exercise_id} — Sets: ${row.sets}, Tonnage: ${Math.round(row.tonnage_kg)} kg`
    )
  }

  doc.end()
  const pdfBytes = await done

  // ✅ Entregar como ArrayBuffer (evita el error de tipos)
  const arrayBuf = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  )

  return new Response(arrayBuf as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="weekly-${weekStart}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
