import { NextRequest } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart') // yyyy-mm-dd
  const userId = searchParams.get('userId')
  if (!weekStart || !userId) {
    return new Response('Missing weekStart or userId', { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // usa service role SOLO en server route
  )

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
  const { data: exercises } = exIds.length ? await supabase
    .from('exercises').select('id, name').in('id', exIds) : { data: [] as any }

  const nameMap = new Map((exercises ?? []).map((e: any) => [e.id, e.name]))

  // PDF stream
  const doc = new PDFDocument({ margin: 40 })
  const chunks: Uint8Array[] = []
  doc.on('data', (c) => chunks.push(c))
  const done = new Promise<Uint8Array>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
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
  (perEx ?? []).forEach((row: any) => {
    doc.fontSize(12).text(
      `${nameMap.get(row.exercise_id) || row.exercise_id} — Sets: ${row.sets}, Tonnage: ${Math.round(row.tonnage_kg)} kg`
    )
  })

  doc.end()
  const pdf = await done

  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="weekly-${weekStart}.pdf"`,
      'Cache-Control': 'no-store'
    }
  })
}
