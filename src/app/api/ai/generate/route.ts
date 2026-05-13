import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'

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
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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

OUTPUT: HANYA kode HTML dari <!DOCTYPE html> hingga </html>. Tidak ada penjelasan apapun.

━━━ SETUP WAJIB ━━━
<head> harus berisi:
1. <script src="https://cdn.tailwindcss.com"></script>
2. Google Fonts yang sesuai tema via <link> (pilih dari: Cormorant+Garamond, Great+Vibes, Amiri, Cinzel, Dancing+Script, Playfair+Display, Raleway, Montserrat, Nunito, Pacifico)
3. <script>tailwind.config = { theme: { extend: { colors: {...}, fontFamily: {...} } } }</script>
4. <style> untuk animasi @keyframes custom

━━━ POLA COVER + ISI (WAJIB) ━━━
- <div id="cover"> : full-screen (min-h-screen), tampil pertama, background gradient/pattern kaya, ornamen SVG dekoratif di sudut, nama besar font script, tombol "✉ Buka Undangan" elegan
- <div id="content" style="display:none;opacity:0"> : semua isi undangan

JavaScript wajib:
function openInvitation() {
  var c = document.getElementById('cover');
  c.style.transition = 'opacity 0.7s';
  c.style.opacity = '0';
  setTimeout(function(){
    c.style.display = 'none';
    var i = document.getElementById('content');
    i.style.display = 'block';
    setTimeout(function(){ i.style.transition='opacity 0.7s'; i.style.opacity='1'; }, 20);
  }, 700);
}

━━━ STANDAR KUALITAS DESAIN ━━━
- Cards: rounded-2xl shadow-2xl, border semi-transparan warna aksen
- Typography: nama/judul text-5xl atau lebih, hierarchy jelas
- Ornamen: SVG inline untuk motif (bulan sabit, bunga, bintang, dll) sesuai tema
- Warna: rich & harmonis, gunakan CSS custom properties
- Spacing: lega, min py-16 per section
- Tombol RSVP: besar, rounded-full, gradient, hover effect
- Animasi: @keyframes float dan fadeInUp untuk elemen-elemen

━━━ TEMA & GAYA VISUAL ━━━
${theme.trim() || `Desain elegan dan mewah untuk ${isWedding ? 'pernikahan romantis' : 'ulang tahun meriah'}`}

━━━ DETAIL ACARA ━━━
Tipe: ${isWedding ? 'Pernikahan' : 'Ulang Tahun'}
${details.trim()}

━━━ STRUKTUR KONTEN ━━━
${isWedding ? `Hero: Bismillah (font Amiri Arab), nama besar kedua mempelai dalam font script, tanggal
Pesan: ayat Quran/quote romantis, kalimat undangan hangat
Detail: 2 kartu (Akad + Resepsi) dengan waktu, venue, alamat
RSVP: tombol besar link WhatsApp (https://wa.me/[nomor tanpa +]) jika ada nomor
Footer: dark, nama dalam font script, hashtag` : `Hero: badge pesta, nama besar bold, usia ke-X, tanggal, emoji 🎉🎂🎈🎁🥳
Pesan: kalimat undangan ceria
Detail: kartu tanggal+waktu, tempat+alamat, dresscode jika ada
RSVP: tombol besar konfirmasi
Footer: dark, hashtag`}

TIDAK ADA penjelasan. HANYA HTML.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Buat undangan digitalnya sekarang, sangat indah dan profesional.' },
    ],
    temperature: 0.7,
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
