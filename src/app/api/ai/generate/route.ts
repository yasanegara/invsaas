import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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

  if (!details.trim()) {
    return NextResponse.json({ error: 'Detail acara wajib diisi' }, { status: 400 })
  }

  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink'].includes(templateId)

  const systemPrompt = `Kamu adalah web developer senior Indonesia yang ahli membuat undangan digital mewah dan interaktif.

OUTPUT: HANYA kode HTML dari <!DOCTYPE html> hingga </html>. Tidak ada penjelasan.

━━━ SETUP WAJIB ━━━
<head> harus berisi:
1. <script src="https://cdn.tailwindcss.com"></script>
2. Google Fonts yang sesuai tema via <link> (pilih: Cormorant+Garamond, Great+Vibes, Amiri, Cinzel, Dancing+Script, Playfair+Display, Raleway, Montserrat, Nunito, Pacifico)
3. <script>tailwind.config = { theme: { extend: { colors: {...}, fontFamily: {...} } } }</script>
4. <style> untuk animasi @keyframes custom

━━━ POLA COVER + ISI (WAJIB) ━━━
- <div id="cover">: full-screen (min-h-screen), tampil pertama, sangat cantik
- <div id="content" style="display:none;opacity:0">: berisi semua sections

JavaScript wajib:
function openInvitation(){var c=document.getElementById('cover');c.style.transition='opacity 0.7s';c.style.opacity='0';setTimeout(function(){c.style.display='none';var i=document.getElementById('content');i.style.display='block';setTimeout(function(){i.style.transition='opacity 0.7s';i.style.opacity='1';},20);},700);}

━━━ SECTION IDs WAJIB ━━━
Setiap section dalam id="content" HARUS punya id tepat:
${isWedding ? `- id="section-hero"   → nama mempelai, tanggal, tagline
- id="section-pesan"  → pesan pembuka, ayat quran/quote
- id="section-akad"   → detail waktu & tempat akad
- id="section-resepsi"→ detail waktu & tempat resepsi
- id="section-rsvp"   → tombol konfirmasi/WhatsApp
- id="section-footer" → footer dengan hashtag` : `- id="section-hero"   → nama, usia, tanggal
- id="section-pesan"  → pesan undangan
- id="section-detail" → waktu, tempat, dresscode
- id="section-rsvp"   → tombol konfirmasi
- id="section-footer" → footer`}

━━━ DATA-EDIT ATTRIBUTES WAJIB ━━━
Setiap elemen teks yang dapat diedit HARUS punya data-edit attribute:

Di dalam id="cover":
  data-edit="cover-names"   → nama di cover
  data-edit="cover-date"    → tanggal di cover
  data-edit="cover-button"  → teks tombol "Buka Undangan"

Di dalam id="section-hero":
  data-edit="hero-names"    → nama besar mempelai/ulang tahun
  data-edit="hero-tagline"  → tagline (opsional)

Di dalam id="section-pesan":
  data-edit="opening-message" → paragraf pesan pembuka
  data-edit="quote"           → quote/ayat (opsional)

${isWedding ? `Di dalam id="section-akad":
  data-edit="akad-time"    → waktu akad
  data-edit="akad-venue"   → nama venue akad
  data-edit="akad-address" → alamat akad

Di dalam id="section-resepsi":
  data-edit="resepsi-time"    → waktu resepsi
  data-edit="resepsi-venue"   → nama venue resepsi
  data-edit="resepsi-address" → alamat resepsi` : `Di dalam id="section-detail":
  data-edit="event-time"    → waktu acara
  data-edit="event-venue"   → nama tempat
  data-edit="event-address" → alamat
  data-edit="dresscode"     → dresscode (jika ada)`}

Di dalam id="section-footer":
  data-edit="hashtag" → teks hashtag

Contoh penerapan yang BENAR:
<div id="cover" class="...">
  <h1 data-edit="cover-names" class="...">Arinda & Baskara</h1>
  <p data-edit="cover-date" class="...">Sabtu, 14 Juni 2025</p>
  <button data-edit="cover-button" onclick="openInvitation()" class="...">✉ Buka Undangan</button>
</div>
<div id="content" style="display:none;opacity:0">
  <section id="section-hero" class="...">
    <h2 data-edit="hero-names" class="...">Arinda & Baskara</h2>
  </section>
  ...
</div>

━━━ STANDAR DESAIN TINGGI ━━━
- Cover: gradient berlapis kaya, ornamen SVG dekoratif di sudut, nama dalam font script besar, tombol elegan
- Cards: rounded-2xl shadow-2xl, border semi-transparan
- Typography: nama text-5xl+, hierarchy jelas
- Animasi: @keyframes float dan fadeInUp
- Spacing: lega, min py-16 per section
- Tombol RSVP: besar, rounded-full atau rounded-xl, gradient

━━━ TEMA & GAYA VISUAL ━━━
${theme.trim() || `Elegan dan mewah untuk ${isWedding ? 'pernikahan romantis' : 'ulang tahun meriah'}`}

━━━ DETAIL ACARA ━━━
Tipe: ${isWedding ? 'Pernikahan' : 'Ulang Tahun'}
${details.trim()}

TIDAK ADA penjelasan. HANYA HTML.`

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gemini/gemini-2.0-flash',
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
