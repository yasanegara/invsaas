import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Groq from 'groq-sdk'

type TemplateStyle = { name: string; styleGuide: string }

function getTemplateStyle(templateId: string): TemplateStyle {
  switch (templateId) {
    case 'elegant-gold':
      return {
        name: 'Elegant Gold',
        styleGuide: `
- Background halaman: #fdf8f0 (krem muda)
- Hero section: background #3a2e1a (coklat gelap), teks putih, aksen emas #b8963e
- Font: Georgia, serif untuk semua teks
- Ornamen: garis gradien emas, simbol ✦ ✦ ✦ sebagai pemisah
- Kartu info: background #fdf8f0, border emas tipis
- Tombol RSVP: background #3a2e1a, teks emas
- Sertakan "Bismillahirrahmanirrahim" sebelum pesan pembuka
- Suasana: mewah, formal, elegan, bernuansa islami`,
      }
    case 'modern-clean':
      return {
        name: 'Modern Clean',
        styleGuide: `
- Background halaman: #f7f7f5 (abu sangat muda)
- Hero section: background #1a1a1a (hitam), teks putih, badge putih kecil
- Font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Detail dalam tabel/card bersih: background putih, border #eee
- Tombol RSVP: background #1a1a1a, teks putih, rounded 4px
- Banyak white space, tipografi kuat
- Suasana: minimalis, modern, kontemporer`,
      }
    case 'romantic-pink':
      return {
        name: 'Romantic Pink',
        styleGuide: `
- Background halaman: #fff5f8 (pink sangat pucat)
- Hero section: background #c05a8a (pink), teks putih
- Font: Georgia, serif
- Grid 2 kolom untuk info detail
- Simbol hati ♥ di beberapa tempat
- Tombol RSVP: background #c05a8a, rounded 24px (pill shape), teks putih
- Quote dalam card dengan border kiri pink
- Suasana: romantis, feminin, hangat, penuh cinta`,
      }
    case 'birthday':
      return {
        name: 'Birthday Bash',
        styleGuide: `
- Background halaman: #f0edff (ungu sangat pucat)
- Hero section: background #5b4fcf (ungu), badge pill putih di atas nama
- Font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Emoji pesta: 🎉 🎂 🎈 🎁 🥳 sebagai row dekoratif
- Info dalam chip cards: background putih, border ungu
- Tombol RSVP: background #5b4fcf, rounded 12px, teks putih
- Suasana: meriah, fun, festive, penuh semangat`,
      }
    default:
      return {
        name: 'Elegant Gold',
        styleGuide: '- Elegan dengan aksen emas, nuansa mewah dan formal',
      }
  }
}

function extractTitle(html: string, prompt: string, isWedding: boolean): string {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleTag?.[1]?.trim()) return titleTag[1].trim()

  const weddingMatch = prompt.match(
    /(?:pernikahan|nikah|wedding)\s+([A-Za-zÀ-ſ]+)\s+(?:dan|&|and)\s+([A-Za-zÀ-ſ]+)/i
  )
  if (weddingMatch) return `Pernikahan ${weddingMatch[1]} & ${weddingMatch[2]}`

  const bdayMatch = prompt.match(/(?:ulang tahun|birthday|ultah)\s+([A-Za-zÀ-ſ]+)/i)
  if (bdayMatch) return `Ulang Tahun ${bdayMatch[1]}`

  return isWedding ? 'Undangan Pernikahan' : 'Undangan Ulang Tahun'
}

export async function POST(request: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt, templateId } = await request.json()
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }

  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink'].includes(templateId)
  const style = getTemplateStyle(templateId)

  const systemPrompt = `Kamu adalah web designer Indonesia yang ahli membuat undangan digital.
Buat satu halaman HTML undangan yang LENGKAP, CANTIK, dan UNIK berdasarkan deskripsi user.

=== ATURAN WAJIB ===
- Kembalikan HANYA kode HTML dari <!DOCTYPE html> sampai </html>
- Semua CSS HANYA dalam <style> tag di dalam <head>
- TIDAK ADA external CSS, Google Fonts, Bootstrap, atau CDN apapun
- TIDAK ADA JavaScript
- Mobile-first: max-width 480px, margin 0 auto, padding 0
- Sertakan SEMUA informasi dari deskripsi user
- Buat <title> yang sesuai dengan nama/acara

=== GAYA VISUAL (template: ${style.name}) ===${style.styleGuide}

=== STRUKTUR HALAMAN (dari atas ke bawah) ===
${isWedding ? `1. Hero: background gelap/berwarna, nama kedua mempelai besar (dengan & di tengah), tanggal acara
2. Pesan pembuka: 2-3 kalimat hangat dan formal
3. Detail akad: ikon kalender, tanggal + waktu akad
4. Detail resepsi: ikon lokasi, waktu resepsi, nama venue, alamat
5. Quote cinta (jika ada dalam deskripsi)
6. Tombol RSVP konfirmasi kehadiran (jika ada nomor WA: href="https://wa.me/[nomor]")
7. Footer: hashtag (jika ada)` : `1. Hero: background berwarna, badge "BIRTHDAY PARTY", nama besar, tagline
2. Row emoji pesta: 🎉 🎂 🎈 🎁 🥳
3. Pesan undangan: 2-3 kalimat ceria
4. Info acara dalam chips: tanggal + waktu, tempat + alamat, dresscode (jika ada)
5. Tombol RSVP (jika ada nomor WA: href="https://wa.me/[nomor]")
6. Footer: hashtag (jika ada)`}

TIDAK ADA penjelasan. HANYA HTML valid.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt.trim() },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  })

  const raw = completion.choices[0]?.message?.content ?? ''

  const htmlMatch = raw.match(/<!DOCTYPE html[\s\S]*<\/html>/i)
  const customHtml = htmlMatch?.[0] ?? null

  if (!customHtml) {
    return NextResponse.json({ error: 'AI gagal generate, coba lagi.' }, { status: 500 })
  }

  const title = extractTitle(customHtml, prompt, isWedding)

  return NextResponse.json({ title, customHtml })
}
