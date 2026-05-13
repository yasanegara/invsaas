import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'

function extractTitle(html: string, details: string, isWedding: boolean): string {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleTag?.[1]?.trim()) return titleTag[1].trim()
  const weddingMatch = details.match(/(?:pernikahan|nikah|wedding)\s+([A-Za-zÀ-ſ]+)\s+(?:dan|&|and)\s+([A-Za-zÀ-ſ]+)/i)
  if (weddingMatch) return `Pernikahan ${weddingMatch[1]} & ${weddingMatch[2]}`
  const bdayMatch = details.match(/(?:ulang tahun|birthday|ultah)\s+([A-Za-zÀ-ſ]+)/i)
  if (bdayMatch) return `Ulang Tahun ${bdayMatch[1]}`
  return isWedding ? 'Undangan Pernikahan' : 'Undangan Ulang Tahun'
}

const DEFAULTS = {
  model: process.env.OPENAI_MODEL ?? 'anthropic/claude-sonnet-4-6',
  temperature: 0.8,
  max_tokens: 8000,
  role: 'Kamu adalah front-end developer senior Indonesia, spesialis undangan digital mewah. Kamu hanya menghasilkan kode HTML — tidak pernah menjelaskan, tidak pernah berkomentar di luar HTML.',
  task: 'Buat satu halaman undangan digital lengkap dan sangat indah berdasarkan data acara yang diberikan. Halaman harus bisa langsung dibuka di browser tanpa dependensi eksternal selain Tailwind CDN dan Google Fonts.',
  constraint_data: `- GUNAKAN PERSIS data dari user — nama, tanggal, waktu, tempat, nomor — tidak boleh diubah satu karakter pun.
- Jika suatu data tidak disebutkan, tulis placeholder eksplisit: [Nama], [Tanggal], [Venue], [Alamat], [Nomor RSVP]. JANGAN isi dengan nilai karangan.
- NOMOR TELEPON/WHATSAPP: hanya tampilkan jika user memberikan nomor. Jika tidak ada, tulis "[Hubungi kami]".
- AYAT AL-QUR'AN: hanya pakai ayat yang sangat umum (QS Ar-Rum: 21, QS An-Nisa: 1). Jika ragu teks arabnya, pakai quote cinta umum berbahasa Indonesia — JANGAN mengarang teks arab atau terjemahan palsu.`,
  constraint_output: `- Output HANYA kode HTML: mulai tepat di \`<!DOCTYPE html\`, akhiri tepat di \`</html>\`. Tidak ada teks sebelum atau sesudah.
- Tidak boleh menyertakan blok markdown (\`\`\`html), penjelasan, atau komentar di luar tag HTML.`,
  constraint_technical: `- Semua background wajib inline style — Tailwind CDN bisa gagal load background utility.
- Ornamen SVG harus inline \`<svg>...\` — bukan URL eksternal.
- Semua section ID dan data-edit attribute yang diminta di bawah WAJIB ada persis seperti yang ditentukan.`,
  visual_standard: `- Background tiap section: gradient unik, BUKAN polos putih
- Setiap section punya ornamen SVG atau pattern dekoratif
- Cards: bg-white/10 backdrop-blur rounded-2xl shadow-2xl border border-white/20
- Nama mempelai: text-5xl md:text-7xl, font script, letter-spacing lebar
- Divider antar section: ornamen SVG cantik (bunga, garis berliku, bintang)
- Animasi scroll: class animate yang trigger saat tampil
- Tombol RSVP: py-4 px-10 rounded-full gradient shadow-lg text-lg font-semibold
- Color palette: gunakan tailwind.config extend.colors, konsisten seluruh halaman
- Mobile-first: semua section responsif, padding cukup`,
}

async function getConfig(): Promise<typeof DEFAULTS> {
  try {
    const rows = await prisma.aiConfig.findMany()
    const db: Record<string, string> = {}
    for (const row of rows) db[row.key] = row.value
    return {
      model: db.model ?? DEFAULTS.model,
      temperature: db.temperature ? parseFloat(db.temperature) : DEFAULTS.temperature,
      max_tokens: db.max_tokens ? parseInt(db.max_tokens) : DEFAULTS.max_tokens,
      role: db.role ?? DEFAULTS.role,
      task: db.task ?? DEFAULTS.task,
      constraint_data: db.constraint_data ?? DEFAULTS.constraint_data,
      constraint_output: db.constraint_output ?? DEFAULTS.constraint_output,
      constraint_technical: db.constraint_technical ?? DEFAULTS.constraint_technical,
      visual_standard: db.visual_standard ?? DEFAULTS.visual_standard,
    }
  } catch {
    return DEFAULTS
  }
}

export async function POST(request: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://ai.sumopod.com/v1',
  })
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const theme: string = body.theme ?? ''
  const details: string = body.details ?? body.prompt ?? ''
  const templateId: string = body.templateId ?? 'elegant-gold'
  const refImage: string | null = body.refImage ?? null

  if (!details.trim()) {
    return NextResponse.json({ error: 'Detail acara wajib diisi' }, { status: 400 })
  }

  const cfg = await getConfig()
  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink'].includes(templateId)

  const systemPrompt = `## ROLE
${cfg.role}

## TASK
${cfg.task}

## CONSTRAINTS
### Data & Akurasi
${cfg.constraint_data}
### Output
${cfg.constraint_output}
### Teknis
${cfg.constraint_technical}

━━━ HEAD WAJIB ━━━
<head> harus berisi SEMUA ini:
1. <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
2. <script src="https://cdn.tailwindcss.com"></script>
3. <link> Google Fonts 2–3 font sesuai tema (pilih dari: Cormorant+Garamond, Great+Vibes, Amiri, Cinzel, Dancing+Script, Playfair+Display, Raleway, Montserrat, Nunito, Pacifico, Lato)
4. <script>tailwind.config={theme:{extend:{colors:{primary:"...",accent:"..."},fontFamily:{script:["..."],sans:["..."]}}}}</script>
5. <style> berisi @keyframes: fadeInUp, float, shimmer, pulse-glow DAN semua class background custom

━━━ ATURAN BACKGROUND — KRITIKAL ━━━
⚠️ Tailwind CDN bisa gagal load. SEMUA background WAJIB pakai inline style, BUKAN class Tailwind.
Gunakan style="..." langsung di setiap elemen:
- Cover:   style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); min-height:100vh"
- Section: style="background: linear-gradient(180deg, #f8f4f0 0%, #ede8e3 100%); padding: 64px 24px"
- Card:    style="background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3)"
Ornamen SVG: embed inline di HTML sebagai <svg>...</svg>, BUKAN src eksternal.

━━━ STRUKTUR HALAMAN WAJIB ━━━
BAGIAN 1 — Cover (id="cover"):
- min-h-screen, flex center, background gradient berlapis KAYA (3+ warna)
- Ornamen SVG dekoratif di 4 sudut (bunga, geometri, atau sesuai tema)
- Nama dalam font script, text-5xl minimum, animate fadeInUp
- Tanggal elegan dengan divider ornamen
- Tombol "✉ Buka Undangan" besar, rounded-full, gradient hover, shadow glow

BAGIAN 2 — Konten (id="content" style="display:none;opacity:0"):
Berisi section-section dengan id tepat (lihat bawah).

JavaScript WAJIB (inline di <body>):
function openInvitation(){var c=document.getElementById('cover');c.style.transition='opacity 0.8s ease';c.style.opacity='0';setTimeout(function(){c.style.display='none';var i=document.getElementById('content');i.style.display='block';setTimeout(function(){i.style.transition='opacity 0.8s ease';i.style.opacity='1';},30);},800);}

━━━ SECTION IDs WAJIB ━━━
${isWedding ? `<section id="section-hero">   — foto/nama besar mempelai, tanggal, quote romantis
<section id="section-pesan">  — pesan pembuka hangat, ayat Al-Qur'an/quote cinta
<section id="section-akad">   — detail lengkap akad (waktu, venue, alamat)
<section id="section-resepsi">— detail lengkap resepsi (waktu, venue, alamat)
<section id="section-rsvp">   — tombol WhatsApp konfirmasi kehadiran
<section id="section-footer"> — hashtag, ucapan terima kasih` : `<section id="section-hero">   — nama, usia/ke berapa, tanggal
<section id="section-pesan">  — pesan undangan hangat
<section id="section-detail"> — waktu, tempat, dresscode
<section id="section-rsvp">   — tombol konfirmasi
<section id="section-footer"> — footer`}

━━━ DATA-EDIT ATTRIBUTES — SEMUA WAJIB ADA ━━━
Setiap teks yang bisa diedit HARUS punya data-edit. Satu elemen = satu nilai saja (jangan nested).

Cover:
  <h1 data-edit="cover-names">    — nama di cover
  <p  data-edit="cover-date">     — tanggal di cover
  <button data-edit="cover-button" onclick="openInvitation()"> — teks tombol

section-hero:
  <h2 data-edit="hero-names">     — nama mempelai / ulang tahun
  <p  data-edit="hero-tagline">   — tagline/quote singkat

section-pesan:
  <p  data-edit="opening-message">— paragraf pesan pembuka
  <p  data-edit="quote">          — ayat/quote

${isWedding ? `section-akad:
  <p data-edit="akad-time">       — waktu akad
  <p data-edit="akad-venue">      — nama venue akad
  <p data-edit="akad-address">    — alamat akad

section-resepsi:
  <p data-edit="resepsi-time">    — waktu resepsi
  <p data-edit="resepsi-venue">   — nama venue resepsi
  <p data-edit="resepsi-address"> — alamat resepsi` : `section-detail:
  <p data-edit="event-time">      — waktu acara
  <p data-edit="event-venue">     — nama tempat
  <p data-edit="event-address">   — alamat
  <p data-edit="dresscode">       — dresscode`}

section-footer:
  <p data-edit="hashtag">         — hashtag

━━━ STANDAR VISUAL TINGGI ━━━
${cfg.visual_standard}

━━━ TEMA & GAYA ━━━
${theme.trim() || `Elegan dan mewah, ${isWedding ? 'romantis dengan sentuhan gold dan krem' : 'meriah dan modern'}`}
${refImage ? '\n⚠️ User melampirkan GAMBAR REFERENSI. Tiru gaya visual, palet warna, nuansa, dan layout dari gambar tersebut. Jadikan sebagai inspirasi utama desain.' : ''}

━━━ DATA ACARA (GUNAKAN PERSIS INI) ━━━
Tipe: ${isWedding ? 'Pernikahan' : 'Ulang Tahun'}
${details.trim()}

OUTPUT: HANYA HTML. Mulai dari <!DOCTYPE html>, akhiri dengan </html>.`

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } }

  const userContent: ContentPart[] = [
    { type: 'text', text: 'Buat sekarang. Hasilkan undangan digital yang sangat indah, mewah, dan profesional. Pastikan semua data persis dari input, semua data-edit ada, semua section ID ada.' },
  ]
  if (refImage) {
    userContent.push({ type: 'image_url', image_url: { url: refImage, detail: 'high' } })
  }

  let raw = ''
  try {
    const completion = await openai.chat.completions.create({
      model: cfg.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: refImage ? userContent : 'Buat sekarang. Hasilkan undangan digital yang sangat indah, mewah, dan profesional. Pastikan semua data persis dari input, semua data-edit ada, semua section ID ada.' },
      ],
      temperature: cfg.temperature,
      max_tokens: cfg.max_tokens,
    })
    raw = completion.choices[0]?.message?.content ?? ''
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ai/generate] API error:', msg)
    return NextResponse.json({ error: `API error: ${msg}` }, { status: 502 })
  }

  console.log('[ai/generate] raw length:', raw.length, '| first 200:', raw.slice(0, 200))

  const htmlMatch = raw.match(/<!DOCTYPE html[\s\S]*<\/html>|<html[\s\S]*<\/html>/i)
  const customHtml = htmlMatch?.[0] ?? null

  if (!customHtml) {
    console.error('[ai/generate] no HTML in response. raw:', raw.slice(0, 500))
    return NextResponse.json(
      { error: 'AI tidak menghasilkan HTML. Coba generate ulang.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    title: extractTitle(customHtml, details, isWedding),
    customHtml,
  })
}
