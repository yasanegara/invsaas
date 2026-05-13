import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'
import { TEMPLATE_META } from '@/templates/types'
import type { TemplateId } from '@/templates/types'

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
  model: 'llama-3.3-70b-versatile',
  temperature: 0.8,
  max_tokens: 8192,
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
  prompt_head_rules: `━━━ HEAD WAJIB ━━━
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
Ornamen SVG: embed inline di HTML sebagai <svg>...</svg>, BUKAN src eksternal.`,
  prompt_page_structure: `━━━ STRUKTUR HALAMAN WAJIB ━━━
BAGIAN 1 — Cover (id="cover"):
- min-h-screen, flex center, background gradient berlapis KAYA (3+ warna)
- Ornamen SVG dekoratif di 4 sudut (bunga, geometri, atau sesuai tema)
- Nama dalam font script, text-5xl minimum, animate fadeInUp
- Tanggal elegan dengan divider ornamen
- Tombol "✉ Buka Undangan" besar, rounded-full, gradient hover, shadow glow

BAGIAN 2 — Konten (id="content" style="display:none;opacity:0"):
Berisi section-section dengan id tepat (lihat bawah).

JavaScript WAJIB (inline di <body>):
function openInvitation(){var c=document.getElementById('cover');c.style.transition='opacity 0.8s ease';c.style.opacity='0';setTimeout(function(){c.style.display='none';var i=document.getElementById('content');i.style.display='block';setTimeout(function(){i.style.transition='opacity 0.8s ease';i.style.opacity='1';},30);},800);}`,
  prompt_data_edit: `━━━ DATA-EDIT ATTRIBUTES — WAJIB KRITIS ━━━
⚠️ SETIAP teks konten yang ditampilkan ke tamu WAJIB punya atribut data-edit.
Jangan lewatkan satu pun. Sistem editor kami membaca atribut ini — jika tidak ada, undangan tidak bisa diedit.

CONTOH BENAR (wajib seperti ini):
<div id="section-hero" style="...">
  <h2 data-edit="hero-names" class="text-5xl font-script text-white">Ahmad & Siti</h2>
  <p data-edit="hero-tagline" class="text-lg text-amber-200">We're Getting Married</p>
</div>

CONTOH SALAH (JANGAN begini — tidak ada data-edit):
<div id="section-hero" style="...">
  <h2 class="text-5xl font-script text-white">Ahmad & Siti</h2>
</div>

Daftar data-edit yang WAJIB ada persis:

Cover (id="cover"):
  <h1 data-edit="cover-names">    — nama di cover
  <p  data-edit="cover-date">     — tanggal di cover
  <button data-edit="cover-button" onclick="openInvitation()"> — teks tombol

section-hero:
  <h2 data-edit="hero-names">     — nama utama (SATU elemen, tidak nested)
  <p  data-edit="hero-tagline">   — tagline/quote singkat (SATU elemen)

section-pesan:
  <p  data-edit="opening-message">— paragraf pesan pembuka (SATU elemen)
  <p  data-edit="quote">          — ayat/quote (SATU elemen)`,
  prompt_kamus_desain: `━━━ KAMUS DESAIN ━━━
Jika parameter gaya visual disebutkan, terapkan teknik CSS ini:
- "Glassmorphism": background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2)
- "Paper Quilling": box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.5); border untuk efek gulungan kertas 3D
- "Neumorphism": box-shadow kembar gelap + terang pada background solid warna sama dengan elemen
- "Royal Islamic": palette Navy Blue (#1e3a5f), Gold (#D4AF37), Cream (#FDFBF7)
- "Cyberpunk Neon": background hitam (#000), aksen Neon Biru (#00f3ff) dan Neon Pink (#ff003c), text-shadow glowing
- "Earth Tones": Terakota, Beige, Olive Green

Jika tipografi disebutkan, gunakan Google Fonts yang sesuai dan set di tailwind.config fontFamily.

Jika ornamen disebutkan:
- "Bunga & Daun": SVG inline bunga, daun, dan ranting di setiap divider
- "Geometri Islam": bintang 8 sudut, pola arabesk SVG
- "Garis Minimal": garis tipis dengan titik/diamond di ujungnya
- "Mandala": SVG lingkaran mandala di header/footer
- "Ribbon & Pita": SVG pita melengkung di section borders

Jika ada URL musik latar, embed: <audio id="bgm" src="URL" loop></audio> dan buat floating button play/pause kanan bawah layar.`,
}

async function getConfig(): Promise<typeof DEFAULTS> {
  try {
    const rows = await prisma.aiConfig.findMany()
    const db: Record<string, string> = {}
    for (const row of rows) db[row.key] = row.value
    return {
      model: db.model ?? DEFAULTS.model,
      temperature: db.temperature ? parseFloat(db.temperature) : DEFAULTS.temperature,
      max_tokens: Math.min(db.max_tokens ? parseInt(db.max_tokens) : DEFAULTS.max_tokens, 8192),
      role: db.role ?? DEFAULTS.role,
      task: db.task ?? DEFAULTS.task,
      constraint_data: db.constraint_data ?? DEFAULTS.constraint_data,
      constraint_output: db.constraint_output ?? DEFAULTS.constraint_output,
      constraint_technical: db.constraint_technical ?? DEFAULTS.constraint_technical,
      visual_standard: db.visual_standard ?? DEFAULTS.visual_standard,
      prompt_head_rules: db.prompt_head_rules ?? DEFAULTS.prompt_head_rules,
      prompt_page_structure: db.prompt_page_structure ?? DEFAULTS.prompt_page_structure,
      prompt_data_edit: db.prompt_data_edit ?? DEFAULTS.prompt_data_edit,
      prompt_kamus_desain: db.prompt_kamus_desain ?? DEFAULTS.prompt_kamus_desain,
    }
  } catch {
    return DEFAULTS
  }
}

export async function POST(request: Request) {
  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
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
  const meta = TEMPLATE_META[templateId as TemplateId] ?? TEMPLATE_META['elegant-gold']
  const eventType = meta.eventType
  const isWedding = eventType === 'wedding'

  const SECTION_IDS: Record<string, string> = {
    wedding:    'section-hero, section-pesan, section-akad, section-resepsi, section-rsvp, section-footer',
    birthday:   'section-hero, section-pesan, section-detail, section-rsvp, section-footer',
    ceremony:   'section-hero, section-pesan, section-detail, section-rsvp, section-footer',
    graduation: 'section-hero, section-pesan, section-detail, section-rsvp, section-footer',
  }

  const EVENT_TYPE_LABEL: Record<string, string> = {
    wedding: 'Pernikahan', birthday: 'Ulang Tahun', ceremony: 'Khitanan/Aqiqah', graduation: 'Wisuda',
  }

  const dataEditList = eventType === 'wedding'
    ? 'cover-names, cover-date, cover-button, hero-names, hero-tagline, opening-message, quote, akad-time, akad-venue, akad-address, resepsi-time, resepsi-venue, resepsi-address, rsvp-button, hashtag'
    : 'cover-names, cover-date, cover-button, hero-names, hero-tagline, opening-message, quote, event-time, event-venue, event-address, rsvp-button, hashtag'

  const systemPrompt = `Kamu adalah front-end developer spesialis undangan digital Indonesia. Buat halaman HTML undangan yang lengkap, sangat indah, dan profesional.

JENIS: ${EVENT_TYPE_LABEL[eventType]}
DATA ACARA (gunakan PERSIS — jangan ubah nama, tanggal, tempat):
${details.trim()}

GAYA VISUAL: ${theme.trim() || meta.themeHint}${refImage ? '\nSesuaikan gaya, palet warna, dan mood dari gambar referensi.' : ''}

TEKNIS WAJIB:
- <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
- <script src="https://cdn.tailwindcss.com"></script> + tailwind.config dengan warna tema
- Google Fonts 2 font (script dekoratif + sans-serif) via <link>
- SEMUA background wajib inline style="background:linear-gradient(...)" — JANGAN class Tailwind bg-*
- Ornamen SVG: inline <svg>...</svg>, bukan URL eksternal
- Mobile-first, semua section responsif

STRUKTUR HALAMAN:
1. <div id="cover" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:...">
   Nama besar font script, tanggal, ornamen SVG, tombol:
   <button data-edit="cover-button" onclick="openInvitation()">✉ Buka Undangan</button>
2. <div id="content" style="display:none;opacity:0">
   Berisi section (gunakan id tepat): ${SECTION_IDS[eventType]}
3. Script wajib di body:
   <script>function openInvitation(){var c=document.getElementById('cover');c.style.transition='opacity 0.8s';c.style.opacity='0';setTimeout(function(){c.style.display='none';var i=document.getElementById('content');i.style.display='block';setTimeout(function(){i.style.transition='opacity 0.8s';i.style.opacity='1';},30);},800);}</script>

DATA-EDIT: SETIAP teks yang tampil ke tamu WAJIB punya atribut data-edit.
Keys wajib: ${dataEditList}
Contoh: <h2 data-edit="hero-names">Ahmad & Siti</h2>, <p data-edit="opening-message">Pesan...</p>

VISUAL: Tiap section punya gradient background unik, ornamen SVG dekoratif, card glassmorphism, animasi fadeInUp. Nama utama font script text-5xl+. Tombol RSVP rounded-full gradient shadow-lg.

OUTPUT: Mulai langsung <!DOCTYPE html hingga </html>. Tanpa markdown, tanpa penjelasan.`

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } }

  const userText = `Generate the ${EVENT_TYPE_LABEL[eventType]} invitation HTML now. Make it stunning, complete, and professional. Output only HTML starting with <!DOCTYPE html.`
  const userContent: ContentPart[] = [
    { type: 'text', text: userText },
  ]
  if (refImage) {
    userContent.push({ type: 'image_url', image_url: { url: refImage, detail: 'high' } })
  }

  async function callModel(model: string, sysprompt: string, usermsg: string | ContentPart[]): Promise<string> {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: sysprompt },
        { role: 'user', content: usermsg as string },
      ],
      temperature: cfg.temperature,
      max_tokens: cfg.max_tokens,
    })
    return completion.choices[0]?.message?.content ?? ''
  }

  function extractHtml(text: string): string | null {
    const s = text.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return (
      s.match(/<!DOCTYPE html[\s\S]*<\/html>/i)?.[0] ??
      s.match(/<html[\s\S]*<\/html>/i)?.[0] ??
      (s.match(/<!DOCTYPE html/i) ? s + '\n</body></html>' : null) ??
      (s.match(/<html/i) ? s + '\n</body></html>' : null) ??
      null
    )
  }

  let raw = ''
  try {
    raw = await callModel(cfg.model, systemPrompt, refImage ? userContent : userText)
    console.log(`[ai/generate] model=${cfg.model} raw length=${raw.length} | first 100: ${raw.slice(0, 100)}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `API error: ${msg}` }, { status: 502 })
  }

  const customHtml = extractHtml(raw)
  if (!customHtml) {
    console.error(`[ai/generate] non-HTML response. raw: ${raw.slice(0, 300)}`)
    return NextResponse.json(
      { error: `AI tidak menghasilkan HTML. Response (${raw.length} chars): ${raw.slice(0, 200)}` },
      { status: 500 }
    )
  }

  console.log(`[ai/generate] success model=${cfg.model} html length=${customHtml.length}`)

  return NextResponse.json({
    title: extractTitle(customHtml, details, isWedding),
    customHtml,
  })
}
