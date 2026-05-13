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
  model: 'anthropic/claude-sonnet-4-6',
  temperature: '0.8',
  max_tokens: '8000',
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
