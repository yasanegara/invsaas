export type TemplateId =
  | 'elegant-gold'
  | 'modern-clean'
  | 'romantic-pink'
  | 'islamic-green'
  | 'islamic-royal'
  | 'birthday'
  | 'sweet-seventeen'
  | 'khitanan-fun'
  | 'aqiqah-soft'
  | 'wisuda-formal'
  | 'wisuda-modern'

export type EventType = 'wedding' | 'birthday' | 'ceremony' | 'graduation'

export interface InvitationContent {
  // Identitas
  templateId: TemplateId
  slug: string

  // Header
  names: string[]          // ['Arinda', 'Baskara'] atau ['Galuh']
  tagline?: string         // "We're Getting Married" / "turns 25!"
  hashtag?: string

  // Event
  eventDate: string        // "Sabtu, 14 Juni 2025"
  eventDay?: string        // "Sabtu"
  akadTime?: string        // "08.00 WIB"
  resepsiTime?: string     // "11.00 – 14.00 WIB"
  venue: string
  venueAddress?: string
  mapsUrl?: string

  // Teks
  openingMessage: string
  quote?: string

  // RSVP
  rsvpDeadline?: string
  rsvpWhatsapp?: string
  rsvpFormUrl?: string

  // Visual
  heroImage?: string
  galleryImages?: string[]
  dressCode?: string

  // Tema
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
}

export const TEMPLATE_META: Record<TemplateId, {
  label: string
  category: string
  description: string
  accent: string
  eventType: EventType
  themeHint: string
}> = {
  'elegant-gold': {
    label: 'Elegant Gold',
    category: 'Pernikahan',
    description: 'Mewah dengan sentuhan emas, cocok untuk pernikahan formal',
    accent: '#b8963e',
    eventType: 'wedding',
    themeHint: 'Elegan dan mewah, romantis dengan sentuhan gold dan krem',
  },
  'modern-clean': {
    label: 'Modern Clean',
    category: 'Pernikahan',
    description: 'Minimalis modern dengan tipografi bersih',
    accent: '#1a1a1a',
    eventType: 'wedding',
    themeHint: 'Minimalis modern, hitam putih bersih, tipografi tegas',
  },
  'romantic-pink': {
    label: 'Romantic Pink',
    category: 'Pernikahan',
    description: 'Lembut dan romantis dengan aksen pink',
    accent: '#c05a8a',
    eventType: 'wedding',
    themeHint: 'Lembut romantis, pink dan rose gold, ornamen bunga halus',
  },
  'islamic-green': {
    label: 'Islamic Emerald',
    category: 'Pernikahan Islami',
    description: 'Nuansa islami dengan palet hijau emerald dan gold',
    accent: '#065f46',
    eventType: 'wedding',
    themeHint: 'Islami elegan, palet emerald green dan gold, ornamen geometri arabesque, ayat Al-Qur\'an QS Ar-Rum: 21',
  },
  'islamic-royal': {
    label: 'Royal Kaligrafi',
    category: 'Pernikahan Islami',
    description: 'Mewah dengan nuansa navy, gold, dan kaligrafi islami',
    accent: '#1e3a5f',
    eventType: 'wedding',
    themeHint: 'Royal Islamic, navy blue (#1e3a5f) dan gold (#D4AF37), kaligrafi SVG inline, bintang 8 sudut, pola arabesk',
  },
  'birthday': {
    label: 'Birthday Bash',
    category: 'Ulang Tahun',
    description: 'Meriah dan fun untuk perayaan ulang tahun',
    accent: '#5b4fcf',
    eventType: 'birthday',
    themeHint: 'Meriah dan modern, warna-warni cerah, confetti, balon SVG',
  },
  'sweet-seventeen': {
    label: 'Sweet Seventeen',
    category: 'Ulang Tahun',
    description: 'Elegan dan girly untuk ulang tahun ke-17',
    accent: '#be185d',
    eventType: 'birthday',
    themeHint: 'Sweet 17, pink fuchsia dan gold, glamour remaja, bunga mawar SVG, glitter efek',
  },
  'khitanan-fun': {
    label: 'Khitanan Fun',
    category: 'Khitanan',
    description: 'Ceria dan colorful untuk undangan khitanan',
    accent: '#0284c7',
    eventType: 'ceremony',
    themeHint: 'Khitanan ceria, biru langit dan putih, motif bintang dan bulan sabit, nuansa islami yang fun untuk anak',
  },
  'aqiqah-soft': {
    label: 'Aqiqah Soft',
    category: 'Aqiqah',
    description: 'Lembut pastel untuk syukuran kelahiran bayi',
    accent: '#7c3aed',
    eventType: 'ceremony',
    themeHint: 'Aqiqah lembut, warna pastel mint dan lavender, motif bayi (bintang, bulan, awan SVG), hangat dan menyentuh',
  },
  'wisuda-formal': {
    label: 'Wisuda Formal',
    category: 'Wisuda',
    description: 'Elegan dan profesional untuk perayaan kelulusan',
    accent: '#1e3a5f',
    eventType: 'graduation',
    themeHint: 'Wisuda formal, navy dan gold, toga dan topi wisuda SVG, tipografi serif tegas, kesan prestasi',
  },
  'wisuda-modern': {
    label: 'Wisuda Modern',
    category: 'Wisuda',
    description: 'Fresh dan modern untuk generasi muda',
    accent: '#0f766e',
    eventType: 'graduation',
    themeHint: 'Wisuda modern, teal dan putih bersih, tipografi bold sans-serif, nuansa energik dan optimis',
  },
}
