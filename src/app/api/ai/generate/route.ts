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

  // Support both old format (prompt) and new format (theme + details)
  const theme: string = body.theme ?? ''
  const details: string = body.details ?? body.prompt ?? ''
  const templateId: string = body.templateId ?? 'elegant-gold'

  if (!details.trim()) {
    return NextResponse.json({ error: 'Detail acara wajib diisi' }, { status: 400 })
  }

  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink'].includes(templateId)

  const themeSection = theme.trim()
    ? `=== TEMA & GAYA VISUAL (PRIORITAS UTAMA — ikuti sepenuhnya) ===
${theme.trim()}

`
    : ''

  const systemPrompt = `Kamu adalah web designer Indonesia ahli undangan digital. Buat satu halaman HTML undangan yang LENGKAP, CANTIK, dan UNIK.

=== ATURAN WAJIB ===
- Output: HANYA kode HTML dari <!DOCTYPE html> hingga </html>, TIDAK ADA teks lain
- CSS: semua dalam <style> di <head>, TIDAK ADA external CSS/fonts/CDN
- JavaScript: TIDAK ADA
- Layout: mobile-first, max-width 480px, margin 0 auto, min-height 100vh
- Konten: masukkan SEMUA detail acara dari input user
- Jika ada nomor WhatsApp: buat tombol RSVP dengan href="https://wa.me/[nomor]"

${themeSection}=== DETAIL ACARA YANG HARUS DITAMPILKAN ===
Tipe: ${isWedding ? 'Pernikahan' : 'Ulang Tahun'}
${details.trim()}

=== PANDUAN DESAIN ===
${theme.trim() ? `Wujudkan tema visual yang diminta user dengan CSS yang kreatif. Gunakan:
- Gradien, pola, dan dekorasi CSS murni untuk efek visual
- Box-shadow bertingkat untuk kesan kedalaman/3D
- Border-radius dan clip-path untuk bentuk dekoratif
- Pseudo-element ::before/::after untuk ornamen
- CSS pattern untuk tekstur (repeating-linear-gradient, radial-gradient)
- Animasi CSS @keyframes yang halus (opsional, maks 1-2 animasi)` : `Buat desain elegan yang sesuai tipe acara (${isWedding ? 'pernikahan' : 'ulang tahun'}):
- Pilih palet warna yang harmonis dan mewah
- Tipografi yang terbaca dengan baik di mobile
- Hierarki visual yang jelas: hero → pesan → detail → RSVP`}

=== STRUKTUR HALAMAN ===
${isWedding ? `1. Hero: nama kedua mempelai (besar, menonjol), tanggal, tagline romantis
2. Pesan pembuka 2-3 kalimat (formal, hangat, sertakan Bismillah jika temanya islami)
3. Detail akad: ikon/dekorasi, waktu akad
4. Detail resepsi: waktu resepsi, nama venue, alamat
5. Quote cinta (jika ada dalam detail)
6. Tombol RSVP besar dan menonjol
7. Footer: hashtag (jika ada)` : `1. Hero: nama, tagline ulang tahun, tanggal
2. Row dekorasi pesta
3. Pesan undangan 2-3 kalimat (ceria, hangat)
4. Detail: tanggal+waktu, tempat+alamat, dresscode (jika ada)
5. Tombol RSVP besar
6. Footer: hashtag (jika ada)`}

TIDAK ADA penjelasan. HANYA HTML.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Buat undangan digitalnya sekarang.` },
    ],
    temperature: 0.75,
    max_tokens: 4096,
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
