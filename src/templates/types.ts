export type TemplateId = 'paper-quilling-islami'

export type EventType = 'wedding' | 'birthday' | 'ceremony' | 'graduation'

export interface InvitationContent {
  templateId: TemplateId
  slug: string
  names: string[]
  tagline?: string
  hashtag?: string
  eventDate: string
  eventDay?: string
  akadTime?: string
  resepsiTime?: string
  venue: string
  venueAddress?: string
  mapsUrl?: string
  openingMessage: string
  quote?: string
  rsvpDeadline?: string
  rsvpWhatsapp?: string
  rsvpFormUrl?: string
  heroImage?: string
  galleryImages?: string[]
  dressCode?: string
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
  'paper-quilling-islami': {
    label: 'Paper Quilling Islami',
    category: 'Pernikahan Islami',
    description: 'Mewah dengan ornamen gulungan kertas 3D, emerald & emas, nuansa islami sakral',
    accent: '#D4AF37',
    eventType: 'wedding',
    themeHint: `Paper Quilling Islami mewah: latar putih/krem bersih (#FDFBF7), ornamen gulungan kertas spiral 3D berwarna emerald (#065f46) dan emas (#D4AF37) di setiap sudut halaman dan sebagai divider antar section. Elemen islami: bulan sabit emas, kubah masjid, lentera, bintang SVG inline. Pola arabesk geometri Islam sebagai border section. Font Amiri untuk heading/teks Arab, Playfair Display untuk sub-heading Latin, Great Vibes untuk nama mempelai. Animasi float 4s infinite pada ornamen sudut, shimmer pada nama mempelai, fadeInUp pada tiap section. Background setiap section: gradient krem-putih halus. Kesan sakral, elegan, dan mewah.`,
  },
}
