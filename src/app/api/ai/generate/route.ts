import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Groq from 'groq-sdk'

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

  const systemPrompt = isWedding
    ? `Kamu adalah generator konten undangan pernikahan digital berbahasa Indonesia.
Berdasarkan deskripsi user, hasilkan JSON dengan field berikut (semua string, kosongkan jika tidak ada info):
{
  "title": "judul undangan untuk dashboard, contoh: Pernikahan Arinda & Baskara",
  "names": ["Nama Mempelai 1", "Nama Mempelai 2"],
  "tagline": "tagline singkat, contoh: We're Getting Married",
  "hashtag": "hashtag tanpa #, contoh: ArindaBaskara2025",
  "eventDate": "tanggal lengkap, contoh: Sabtu, 14 Juni 2025",
  "akadTime": "waktu akad, contoh: 08.00 WIB",
  "resepsiTime": "waktu resepsi, contoh: 11.00 – 14.00 WIB",
  "venue": "nama gedung/venue",
  "venueAddress": "alamat lengkap venue",
  "mapsUrl": "",
  "openingMessage": "pesan pembuka undangan 2-3 kalimat, formal dan hangat",
  "quote": "kutipan cinta pendek (opsional)",
  "rsvpWhatsapp": "nomor WA tanpa + jika disebutkan",
  "rsvpDeadline": "batas RSVP jika disebutkan"
}
Kembalikan HANYA JSON valid, tanpa penjelasan apapun.`
    : `Kamu adalah generator konten undangan ulang tahun digital berbahasa Indonesia.
Berdasarkan deskripsi user, hasilkan JSON dengan field berikut (semua string, kosongkan jika tidak ada info):
{
  "title": "judul undangan untuk dashboard, contoh: Ulang Tahun Galuh ke-25",
  "names": ["Nama"],
  "tagline": "tagline, contoh: turns 25!",
  "hashtag": "hashtag tanpa #",
  "eventDate": "tanggal lengkap",
  "resepsiTime": "waktu acara, contoh: 19.00 WIB",
  "venue": "nama tempat",
  "venueAddress": "alamat lengkap",
  "mapsUrl": "",
  "openingMessage": "pesan undangan 2-3 kalimat, ceria dan hangat",
  "quote": "",
  "rsvpWhatsapp": "nomor WA tanpa + jika disebutkan",
  "rsvpDeadline": ""
}
Kembalikan HANYA JSON valid, tanpa penjelasan apapun.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt.trim() },
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'

  let parsed: Record<string, any>
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
  } catch {
    return NextResponse.json({ error: 'AI gagal generate, coba lagi.' }, { status: 500 })
  }

  return NextResponse.json({
    title: parsed.title ?? '',
    header: {
      names: parsed.names ?? (isWedding ? ['', ''] : ['']),
      tagline: parsed.tagline ?? '',
      hashtag: parsed.hashtag ?? '',
    },
    eventInfo: {
      eventDate: parsed.eventDate ?? '',
      akadTime: parsed.akadTime ?? '',
      resepsiTime: parsed.resepsiTime ?? '',
      venue: parsed.venue ?? '',
      venueAddress: parsed.venueAddress ?? '',
      mapsUrl: parsed.mapsUrl ?? '',
    },
    mainText: {
      openingMessage: parsed.openingMessage ?? '',
      quote: parsed.quote ?? '',
    },
    rsvp: {
      whatsapp: parsed.rsvpWhatsapp ?? '',
      deadline: parsed.rsvpDeadline ?? '',
    },
  })
}
