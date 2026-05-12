export type TemplateId = 'elegant-gold' | 'modern-clean' | 'romantic-pink' | 'birthday'

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
}> = {
  'elegant-gold': {
    label: 'Elegant Gold',
    category: 'Pernikahan',
    description: 'Mewah dengan sentuhan emas, cocok untuk pernikahan formal',
    accent: '#b8963e',
  },
  'modern-clean': {
    label: 'Modern Clean',
    category: 'Pernikahan',
    description: 'Minimalis modern dengan tipografi bersih',
    accent: '#1a1a1a',
  },
  'romantic-pink': {
    label: 'Romantic Pink',
    category: 'Pernikahan',
    description: 'Lembut dan romantis dengan aksen pink',
    accent: '#c05a8a',
  },
  'birthday': {
    label: 'Birthday Bash',
    category: 'Ulang Tahun',
    description: 'Meriah dan fun untuk perayaan ulang tahun',
    accent: '#5b4fcf',
  },
}
