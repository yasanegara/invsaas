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

  const themeBlock = theme.trim()
    ? `=== TEMA & GAYA VISUAL (WAJIB DIWUJUDKAN SEPENUHNYA) ===
${theme.trim()}

`
    : ''

  const systemPrompt = `Kamu adalah web developer Indonesia senior yang ahli membuat undangan digital interaktif berkualitas tinggi.

=== ATURAN TEKNIS ===
- Output: HANYA HTML lengkap dari <!DOCTYPE html> hingga </html>, tidak ada teks lain
- Google Fonts: BOLEH pakai via <link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">
- JavaScript: BOLEH dan DIANJURKAN untuk animasi dan interaktivitas
- CSS: dalam <style> tag
- Layout: mobile-first, max-width 480px, margin 0 auto, body tidak boleh overflow horizontal

=== POLA WAJIB: COVER PAGE + ISI UNDANGAN ===
Halaman HARUS memiliki dua bagian:

BAGIAN 1 — Cover (id="cover"):
- Tampil pertama kali saat halaman dibuka
- Tampilkan nama, tanggal, dan dekorasi visual sesuai tema
- Ada tombol "Buka Undangan" yang mengeksekusi fungsi openInvitation()
- Desain yang SANGAT CANTIK dan berkesan

BAGIAN 2 — Isi (id="content", style="display:none; opacity:0"):
- Tersembunyi di awal, muncul dengan animasi setelah tombol diklik
- Berisi SEMUA informasi acara

JavaScript yang WAJIB ada (minimal ini, boleh tambahkan lebih):
<script>
function openInvitation() {
  var cover = document.getElementById('cover');
  cover.style.transition = 'opacity 0.8s ease';
  cover.style.opacity = '0';
  setTimeout(function() {
    cover.style.display = 'none';
    var content = document.getElementById('content');
    content.style.display = 'block';
    setTimeout(function() {
      content.style.transition = 'opacity 0.8s ease';
      content.style.opacity = '1';
    }, 30);
  }, 800);
}
</script>

${themeBlock}=== DETAIL ACARA (WAJIB DITAMPILKAN SEMUA) ===
Tipe acara: ${isWedding ? 'Pernikahan' : 'Ulang Tahun'}
${details.trim()}

=== STRUKTUR BAGIAN ISI (dalam id="content") ===
${isWedding ? `1. Hero: Bismillah (Arab), nama kedua mempelai dalam font kaligrafi/script, tanggal
2. Pesan pembuka: 2-3 kalimat formal dan hangat, ayat Al-Quran tentang pernikahan (jika tema islami)
3. Detail Akad: waktu, tempat
4. Detail Resepsi: waktu, tempat, alamat lengkap
5. Tombol RSVP (link WhatsApp jika ada nomor: https://wa.me/[nomor tanpa +])
6. Footer: hashtag (jika ada), nama pasangan dalam font script` : `1. Hero: nama dalam font besar/bold, usia, tanggal, tagline
2. Row dekorasi pesta
3. Pesan undangan: ceria dan hangat
4. Info acara: tanggal + waktu, tempat + alamat, dresscode (jika ada)
5. Tombol RSVP / konfirmasi kehadiran
6. Footer: hashtag (jika ada)`}

=== PANDUAN KUALITAS VISUAL ===
${theme.trim()
  ? `Wujudkan tema visual sepenuhnya menggunakan CSS yang kreatif:
- Gunakan CSS gradient, pattern, box-shadow berlapis untuk efek tema
- Pseudo-element ::before/::after untuk ornamen dekoratif
- SVG inline untuk elemen artistik (bulan sabit, lentera, bunga, dll)
- @keyframes untuk animasi yang halus dan elegan
- Pilih Google Fonts yang sesuai tema (islami: Amiri, Cinzel; romantis: Cormorant Garamond, Great Vibes; modern: Playfair Display)`
  : `Buat desain yang elegan dan profesional:
- Palet warna yang harmonis dan sesuai tipe acara
- Tipografi yang bersih dan mudah dibaca
- Hierarki visual yang jelas
- Animasi CSS yang halus`}

TIDAK ADA penjelasan. HANYA HTML.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Buat undangan digitalnya sekarang.' },
    ],
    temperature: 0.72,
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
