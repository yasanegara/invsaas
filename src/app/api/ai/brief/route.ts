import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'
import { TEMPLATE_META } from '@/templates/types'
import type { TemplateId } from '@/templates/types'

const EVENT_TYPE_LABEL: Record<string, string> = {
  wedding: 'Pernikahan', birthday: 'Ulang Tahun', ceremony: 'Khitanan/Aqiqah', graduation: 'Wisuda',
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const details: string = body.details ?? ''
  const theme: string = body.theme ?? ''
  const templateId: string = body.templateId ?? 'paper-quilling-islami'
  const refImage: string | null = body.refImage ?? null

  if (!details.trim()) {
    return NextResponse.json({ brief: '' })
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://ai.sumopod.com/v1',
  })

  const meta = TEMPLATE_META[templateId as TemplateId] ?? TEMPLATE_META['paper-quilling-islami']
  const eventType = meta.eventType
  const isWedding = eventType === 'wedding'
  const label = EVENT_TYPE_LABEL[eventType] ?? 'Acara'

  const systemPrompt = `Kamu adalah creative director kelas dunia, spesialis identitas visual undangan premium Indonesia. Portfolio-mu mencakup The Ritz-Carlton, brand fashion luxury, dan acara kenegaraan.

Tugasmu: ciptakan design brief visual yang SANGAT SPESIFIK dan ORISINAL untuk undangan ${label}. Berpikir seperti studio Pentagram merancang untuk brand luxury paling prestisius.

Output JSON valid — mulai langsung { tanpa markdown, tanpa penjelasan:
{
  "palette": {
    "background": "nilai CSS background lengkap untuk html/body (linear-gradient, radial-gradient, atau solid)",
    "section_bg": "CSS background untuk section-section isi — senada halaman, boleh sedikit berbeda",
    "primary": "#hex warna utama dominan",
    "secondary": "#hex warna pelengkap",
    "accent": "#hex warna aksen/highlight paling mencolok",
    "text_on_dark": "#hex untuk teks di atas latar gelap",
    "text_on_light": "#hex untuk teks di atas latar terang"
  },
  "fonts": {
    "display": "nama Google Font untuk nama/judul utama — ekspresif, berkarakter, memorable",
    "heading": "nama Google Font untuk sub-heading — elegan dan mudah dibaca",
    "body": "nama Google Font untuk paragraf — clean dan nyaman dibaca"
  },
  "cover_design": "deskripsi SANGAT DETAIL visual cover: warna latar, ornamen spesifik di 4 sudut, treatment nama (ukuran, warna, efek), posisi elemen, tombol design, mood keseluruhan",
  "section_designs": {
    "hero": "layout, treatment nama utama, ornamen pembingkai, tipografi khusus",
    "pesan": "cara memframe quote/pesan, ornamen dekoratif, tipografi italic atau script",
    "detail_acara": "card design, icon style (SVG), layout 2-kolom atau stacked, borders",
    "rsvp": "tombol design spesifik, warna CTA, hover effect, form style",
    "footer": "ornamen penutup, sign-off visual, closing ornamen"
  },
  "ornament_design": "deskripsi SANGAT SPESIFIK ornamen SVG yang WAJIB dibuat inline: motif (bunga, arabesk, geometri, dst), bentuk path, warna fill/stroke, ukuran relatif, di mana muncul, berapa kali",
  "animation_design": "nama @keyframes yang dibuat, trigger (onload/IntersectionObserver/hover), timing function, duration, elemen spesifik yang dianimasikan",
  "signature_look": "1-2 teknik CSS unik yang jadi ciri khas design ini — sesuatu yang membuatnya tak terlupakan",
  "design_story": "1 kalimat mengapa pilihan visual ini sempurna dan bermakna untuk acara ini"
}`

  const userMsg = `Rancang design brief untuk:

JENIS: ${label}
DATA ACARA: ${details.trim()}${theme.trim() ? `\nGAYA DIINGINKAN: ${theme.trim()}` : ''}${refImage ? '\nGambar referensi terlampir — serap mood, palet, dan estetikanya.' : ''}

${isWedding
    ? 'Ini adalah momen paling sakral dan tak terlupakan dalam kehidupan seseorang. Setiap pixel harus memancarkan keindahan, kebermaknaan, dan kemewahan sejati.'
    : 'Buat momen ini benar-benar tak terlupakan dan memukau.'}

Jadikan design ini LUAR BIASA INDAH — setara karya studio premium internasional. JSON saja.`

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } }

  const userContent: ContentPart[] = [{ type: 'text', text: userMsg }]
  if (refImage) userContent.push({ type: 'image_url', image_url: { url: refImage, detail: 'high' } })

  try {
    const model = process.env.OPENAI_MODEL ?? 'claude-sonnet-4-6'
    const completion = await openai.chat.completions.create({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent as any }],
      temperature: 0.9,
      max_tokens: 2000,
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    JSON.parse(cleaned) // validate
    console.log(`[ai/brief] ok length=${cleaned.length}`)
    return NextResponse.json({ brief: cleaned })
  } catch (err) {
    console.warn('[ai/brief] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ brief: '' })
  }
}
