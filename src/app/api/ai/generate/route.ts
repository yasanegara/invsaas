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
  model: 'claude-sonnet-4-6',
  temperature: 0.8,
  max_tokens: 16000,
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
      max_tokens: db.max_tokens ? parseInt(db.max_tokens) : DEFAULTS.max_tokens,
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
  const meta = TEMPLATE_META[templateId as TemplateId] ?? TEMPLATE_META['elegant-gold']
  const eventType = meta.eventType
  const isWedding = eventType === 'wedding'

  const SECTION_IDS: Record<string, string> = {
    wedding: `<section id="section-hero">   — foto/nama besar mempelai, tanggal, quote romantis
<section id="section-pesan">  — pesan pembuka hangat, ayat Al-Qur'an/quote cinta
<section id="section-akad">   — detail lengkap akad (waktu, venue, alamat)
<section id="section-resepsi">— detail lengkap resepsi (waktu, venue, alamat)
<section id="section-rsvp">   — tombol WhatsApp konfirmasi kehadiran
<section id="section-footer"> — hashtag, ucapan terima kasih`,
    birthday: `<section id="section-hero">   — nama, usia/ke berapa, tanggal
<section id="section-pesan">  — pesan undangan hangat
<section id="section-detail"> — waktu, tempat, dresscode
<section id="section-rsvp">   — tombol konfirmasi
<section id="section-footer"> — footer`,
    ceremony: `<section id="section-hero">   — nama anak/bayi dan orang tua, tanggal
<section id="section-pesan">  — pesan syukur, doa, ayat Al-Qur'an
<section id="section-detail"> — waktu dan tempat acara
<section id="section-rsvp">   — tombol konfirmasi kehadiran
<section id="section-footer"> — footer dengan doa`,
    graduation: `<section id="section-hero">   — nama wisudawan, program studi, universitas
<section id="section-pesan">  — pesan syukur dan pencapaian
<section id="section-detail"> — waktu, tempat, dresscode
<section id="section-rsvp">   — tombol konfirmasi
<section id="section-footer"> — footer`,
  }

  const DATA_EDIT_EXTRA: Record<string, string> = {
    wedding: `section-akad:
  <p data-edit="akad-time">       — waktu akad
  <p data-edit="akad-venue">      — nama venue akad
  <p data-edit="akad-address">    — alamat akad

section-resepsi:
  <p data-edit="resepsi-time">    — waktu resepsi
  <p data-edit="resepsi-venue">   — nama venue resepsi
  <p data-edit="resepsi-address"> — alamat resepsi`,
    birthday: `section-detail:
  <p data-edit="event-time">      — waktu acara
  <p data-edit="event-venue">     — nama tempat
  <p data-edit="event-address">   — alamat
  <p data-edit="dresscode">       — dresscode`,
    ceremony: `section-detail:
  <p data-edit="event-time">      — waktu acara
  <p data-edit="event-venue">     — nama tempat
  <p data-edit="event-address">   — alamat`,
    graduation: `section-detail:
  <p data-edit="event-time">      — waktu acara
  <p data-edit="event-venue">     — nama tempat/gedung
  <p data-edit="event-address">   — alamat
  <p data-edit="dresscode">       — dresscode`,
  }

  const EVENT_TYPE_LABEL: Record<string, string> = {
    wedding: 'Pernikahan',
    birthday: 'Ulang Tahun',
    ceremony: 'Khitanan/Aqiqah',
    graduation: 'Wisuda',
  }

  const systemPrompt = `⚠️ INSTRUKSI KRITIKAL: Kamu TIDAK memiliki akses ke tools, fungsi, filesystem, atau MCP apapun. JANGAN memanggil function_calls, invoke, atau tools dalam bentuk apapun. Tugas kamu hanya SATU: langsung tulis kode HTML sebagai output. Mulai output dengan <!DOCTYPE html dan akhiri dengan </html>. Tidak ada teks lain.

## ROLE
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

${cfg.prompt_head_rules}

${cfg.prompt_page_structure}

━━━ SECTION IDs WAJIB ━━━
${SECTION_IDS[eventType]}

${cfg.prompt_data_edit}

${DATA_EDIT_EXTRA[eventType]}

section-rsvp:
  <p data-edit="rsvp-button">     — teks tombol RSVP

section-footer:
  <p data-edit="hashtag">         — hashtag / nama footer

ATURAN data-edit:
- Satu data-edit per elemen — tidak boleh ada data-edit di dalam elemen yang sudah ber-data-edit
- Nilai data-edit harus PERSIS seperti daftar di atas (lowercase, kebab-case)
- Isi elemen = teks saja, bukan HTML nested

${cfg.prompt_kamus_desain}

━━━ STANDAR VISUAL TINGGI ━━━
${cfg.visual_standard}

━━━ TEMA & GAYA — WAJIB DIIKUTI PERSIS ━━━
${theme.trim() || meta.themeHint}
${refImage ? '\n⚠️ User melampirkan GAMBAR REFERENSI. Tiru gaya visual, palet warna, nuansa, dan layout dari gambar tersebut. Jadikan sebagai inspirasi utama desain.' : ''}

━━━ DATA ACARA (GUNAKAN PERSIS INI) ━━━
Tipe: ${EVENT_TYPE_LABEL[eventType]}
${details.trim()}

OUTPUT: HANYA HTML. Mulai dari <!DOCTYPE html>, akhiri dengan </html>.`

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } }

  const userText = 'JANGAN gunakan tools, filesystem, function_calls, atau invoke apapun. Semua data sudah tersedia di system prompt. OUTPUT LANGSUNG kode HTML sekarang — mulai dari <!DOCTYPE html, akhiri dengan </html>. Tidak ada teks lain sebelum atau sesudah HTML.'
  const userContent: ContentPart[] = [
    { type: 'text', text: userText },
  ]
  if (refImage) {
    userContent.push({ type: 'image_url', image_url: { url: refImage, detail: 'high' } })
  }

  // Prompt ringkas untuk fallback model (gpt-4o tidak perlu instruksi panjang)
  const dataEditKeys = eventType === 'wedding'
    ? 'cover-names, cover-date, cover-button, hero-names, hero-tagline, opening-message, quote, akad-time, akad-venue, akad-address, resepsi-time, resepsi-venue, resepsi-address, rsvp-button, hashtag'
    : 'cover-names, cover-date, cover-button, hero-names, hero-tagline, opening-message, quote, event-time, event-venue, event-address, rsvp-button, hashtag'

  const fallbackSystemPrompt = `Kamu adalah developer front-end spesialis undangan digital. Buat satu halaman HTML undangan ${EVENT_TYPE_LABEL[eventType]} yang sangat indah, lengkap, dan profesional.

DATA ACARA (gunakan persis):
${details.trim()}

GAYA VISUAL:
${theme.trim() || meta.themeHint}

WAJIB TEKNIS:
- Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts: 2 font (script + sans-serif), load via <link>
- SEMUA background WAJIB pakai inline style="background:..." (bukan class Tailwind)
- Ornamen: SVG inline di HTML, bukan URL eksternal
- Mobile-first, responsif

STRUKTUR WAJIB:
1. <div id="cover"> — halaman pembuka dengan nama, tanggal, tombol "✉ Buka Undangan" onclick="openInvitation()"
2. <div id="content" style="display:none;opacity:0"> — konten utama
3. Section IDs di dalam content: ${SECTION_IDS[eventType].replace(/\n/g, ', ').replace(/<section id="([^"]+)">[^<]*/g, '$1')}
4. JavaScript wajib: function openInvitation(){var c=document.getElementById('cover');c.style.transition='opacity 0.8s ease';c.style.opacity='0';setTimeout(function(){c.style.display='none';var i=document.getElementById('content');i.style.display='block';setTimeout(function(){i.style.transition='opacity 0.8s ease';i.style.opacity='1';},30);},800);}

DATA-EDIT WAJIB (setiap teks konten harus ada atribut data-edit):
${dataEditKeys}
Contoh: <h1 data-edit="hero-names">Nama Mempelai</h1>

OUTPUT: HANYA kode HTML dari <!DOCTYPE html sampai </html>. Tanpa penjelasan, tanpa markdown.`

  const FALLBACK_MODEL = 'gpt-4o'

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

  const fallbackUserMsg = `Buat sekarang. Hasilkan undangan ${EVENT_TYPE_LABEL[eventType]} yang sangat indah dan lengkap sesuai instruksi di atas.`

  let raw = ''
  let usedModel = cfg.model
  try {
    raw = await callModel(cfg.model, systemPrompt, refImage ? userContent : userText)
    console.log(`[ai/generate] model=${cfg.model} raw length=${raw.length} | first 100: ${raw.slice(0, 100)}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[ai/generate] primary model ${cfg.model} failed: ${msg} — switching to ${FALLBACK_MODEL}`)
    try {
      usedModel = FALLBACK_MODEL
      raw = await callModel(FALLBACK_MODEL, fallbackSystemPrompt, fallbackUserMsg)
      console.log(`[ai/generate] fallback model=${FALLBACK_MODEL} raw length=${raw.length}`)
    } catch (err2: unknown) {
      const msg2 = err2 instanceof Error ? err2.message : String(err2)
      return NextResponse.json({ error: `API error: ${msg2}` }, { status: 502 })
    }
  }

  // Jika primary berhasil tapi output bukan HTML (misal: tool calls), coba fallback
  let customHtml = extractHtml(raw)
  if (!customHtml && usedModel === cfg.model && cfg.model !== FALLBACK_MODEL) {
    console.warn(`[ai/generate] primary returned non-HTML (${raw.length} chars), switching to ${FALLBACK_MODEL}`)
    try {
      usedModel = FALLBACK_MODEL
      raw = await callModel(FALLBACK_MODEL, fallbackSystemPrompt, fallbackUserMsg)
      customHtml = extractHtml(raw)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `Fallback API error: ${msg}` }, { status: 502 })
    }
  }

  if (!customHtml) {
    console.error(`[ai/generate] both models returned non-HTML. last raw: ${raw.slice(0, 300)}`)
    return NextResponse.json(
      { error: `AI tidak menghasilkan HTML. Response (${raw.length} chars): ${raw.slice(0, 200)}` },
      { status: 500 }
    )
  }

  console.log(`[ai/generate] success model=${usedModel} html length=${customHtml.length}`)

  return NextResponse.json({
    title: extractTitle(customHtml, details, isWedding),
    customHtml,
  })
}
