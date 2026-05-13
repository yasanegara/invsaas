import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function isSuperAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  // Fallback: env var whitelist (bootstrap sebelum role ter-set di DB)
  const superadminEmails = (process.env.SUPERADMIN_EMAIL ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  if (session.user.email && superadminEmails.includes(session.user.email.toLowerCase())) {
    return true
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    return user?.role === 'SUPERADMIN'
  } catch {
    return false
  }
}

const DEFAULT_CONFIG: Record<string, string> = {
  model: 'gpt-4o',
  temperature: '0.8',
  max_tokens: '16000',
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

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await prisma.aiConfig.findMany()
  const config: Record<string, string> = { ...DEFAULT_CONFIG }
  for (const row of rows) {
    config[row.key] = row.value
  }

  return NextResponse.json({ config })
}

export async function PUT(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const session = await auth()
  const body = await request.json()
  const updates: Record<string, string> = body.config ?? {}

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.aiConfig.upsert({
        where: { key },
        update: { value: String(value), updatedBy: session?.user?.id },
        create: { key, value: String(value), updatedBy: session?.user?.id },
      })
    )
  )

  return NextResponse.json({ success: true })
}

export async function POST() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.aiConfig.deleteMany()

  return NextResponse.json({ success: true, message: 'Config reset to defaults' })
}
