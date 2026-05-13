import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Groq from 'groq-sdk'

function extractTitle(html: string, details: string, isWedding: boolean): string {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleTag?.[1]?.trim()) return titleTag[1].trim()

  const weddingMatch = details.match(
    /(?:pernikahan|nikah|wedding)\s+([A-Za-zÀ-ſ]+)\s+(?:dan|&|and)\s+([A-Za-zÀ-ſ]+)/i
  )
  if (weddingMatch) return `Pernikahan ${weddingMatch[1]} & ${weddingMatch[2]}`

  const bdayMatch = details.match(/(?:ulang tahun|birthday|ultah)\s+([A-Za-zÀ-ſ]+)/i)
  if (bdayMatch) return `Ulang Tahun ${bdayMatch[1]}`

  return isWedding ? 'Undangan Pernikahan' : 'Undangan Ulang Tahun'
}

export async function POST(request: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const theme: string = body.theme ?? ''
  const details: string = body.details ?? body.prompt ?? ''
  const templateId: string = body.templateId ?? 'elegant-gold'

  if (!details.trim()) {
    return NextResponse.json({ error: 'Detail acara wajib diisi' }, { status: 400 })
  }

  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink'].includes(templateId)

  const systemPrompt = `Kamu adalah web developer senior Indonesia yang ahli membuat undangan digital mewah dan interaktif.

OUTPUT: HANYA kode HTML dari <!DOCTYPE html> hingga </html>. Tidak ada penjelasan.

━━━ SETUP WAJIB (harus persis seperti ini) ━━━
<head> harus berisi:
1. <script src="https://cdn.tailwindcss.com"></script>
2. Google Fonts yang sesuai tema (pilih dari: Cormorant+Garamond, Great+Vibes, Amiri, Cinzel, Dancing+Script, Playfair+Display, Raleway, Montserrat, Nunito, Pacifico)
3. <script>tailwind.config = { theme: { extend: { colors: { ... }, fontFamily: { ... } } } }</script>
4. <style> untuk animasi CSS custom

━━━ POLA COVER + ISI (WAJIB) ━━━
Struktur HTML:
- <div id="cover"> : tampil pertama, FULL SCREEN, sangat cantik
  - Background: gradient berlapis atau pattern yang kaya
  - Ornamen dekoratif di sudut-sudut (SVG atau CSS)
  - Nama besar dalam font script/kaligrafi
  - Tombol "✉ Buka Undangan" yang elegan (rounded-full, gradient, hover effect)
  - TIDAK boleh ada scrollbar, harus min-h-screen flex items-center justify-center

- <div id="content" style="display:none; opacity:0"> : isi undangan
  - Muncul setelah tombol diklik dengan animasi fade-in

JavaScript wajib:
function openInvitation() {
  var c = document.getElementById('cover');
  c.style.transition = 'opacity 0.7s';
  c.style.opacity = '0';
  setTimeout(function(){
    c.style.display = 'none';
    var i = document.getElementById('content');
    i.style.display = 'block';
    setTimeout(function(){
      i.style.transition = 'opacity 0.7s';
      i.style.opacity = '1';
    }, 20);
  }, 700);
}

━━━ STANDAR DESAIN TINGGI (WAJIB IKUTI) ━━━
Komponen yang harus INDAH:
- Cards: rounded-2xl shadow-2xl dengan border transparan gold/warna aksen
- Sections: padding yang lega (py-16 atau lebih), tidak sesak
- Typography hierarchy: nama/judul SANGAT BESAR (text-5xl+), heading sedang (text-2xl), body kecil tapi terbaca
- Divider: ornamen SVG atau gradient line, bukan <hr> polos
- Tombol RSVP: besar, menonjol, rounded-full atau rounded-xl dengan gradient
- Footer: dark/colored dengan nama dalam font script
- Animasi: @keyframes float (naik-turun), fadeIn untuk sections
- Dekorasi: SVG inline untuk motif/ornamen sesuai tema (bulan sabit, bunga, bintang, dll)

━━━ TEMA & GAYA VISUAL ━━━
${theme.trim() || `Buat desain yang elegan dan mewah sesuai tipe acara: ${isWedding ? 'pernikahan romantis' : 'ulang tahun meriah'}`}

━━━ DETAIL ACARA ━━━
Tipe: ${isWedding ? 'Pernikahan' : 'Ulang Tahun'}
${details.trim()}

━━━ STRUKTUR KONTEN (dalam id="content") ━━━
${isWedding ? `
SECTION 1 — Hero:
- Bismillah dalam font Amiri (Arab): بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
- Nama kedua mempelai dalam font script, SANGAT BESAR
- Simbol "&" atau "dan" yang dekoratif di antara nama
- Tanggal dengan ornamen

SECTION 2 — Pesan:
- Ayat Quran tentang pernikahan (jika tema islami) atau quote romantis
- Kalimat undangan yang hangat dan formal

SECTION 3 — Detail Acara:
- 2 kartu (Akad + Resepsi) dengan ikon dan informasi lengkap
- Nama venue, waktu, alamat

SECTION 4 — RSVP:
- Tombol besar link WhatsApp (https://wa.me/[nomor]) jika ada nomor
- Atau tombol "Konfirmasi Kehadiran"

SECTION 5 — Footer:
- Background gelap
- Nama pasangan dalam font script
- Hashtag jika ada
` : `
SECTION 1 — Hero:
- Badge "BIRTHDAY PARTY" atau "YOU'RE INVITED"
- Nama yang berulang tahun, SANGAT BESAR, font bold/playful
- Usia (ke-X) dan tanggal
- Row emoji pesta: 🎉 🎂 🎈 🎁 🥳

SECTION 2 — Pesan:
- Kalimat undangan yang ceria dan mengundang

SECTION 3 — Detail Acara:
- Kartu info: tanggal+waktu, tempat+alamat, dresscode (jika ada)

SECTION 4 — RSVP:
- Tombol besar konfirmasi kehadiran

SECTION 5 — Footer dengan hashtag
`}

Buat seindah mungkin. HANYA HTML.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Buat undangan digitalnya sekarang, pastikan sangat indah dan profesional.' },
    ],
    temperature: 0.65,
    max_tokens: 6000,
  })

  const raw = completion.choices[0]?.message?.content ?? ''

  const htmlMatch = raw.match(/<!DOCTYPE html[\s\S]*<\/html>/i)
  const customHtml = htmlMatch?.[0] ?? null

  if (!customHtml) {
    return NextResponse.json({ error: 'AI gagal generate, coba lagi.' }, { status: 500 })
  }

  return NextResponse.json({
    title: extractTitle(customHtml, details, isWedding),
    customHtml,
  })
}
