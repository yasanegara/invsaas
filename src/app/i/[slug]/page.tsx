import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { InvitationContent } from '@/templates/types'
import ElegantGoldTemplate from '@/templates/ElegantGold'
import { ModernCleanTemplate, RomanticPinkTemplate, BirthdayTemplate } from '@/templates/OtherTemplates'

async function getInvitation(slug: string): Promise<InvitationContent | null> {
  const mock: Record<string, InvitationContent> = {
    'arinda-baskara-2025': {
      templateId: 'elegant-gold',
      slug: 'arinda-baskara-2025',
      names: ['Arinda', 'Baskara'],
      eventDate: 'Sabtu, 14 Juni 2025',
      eventDay: 'Sabtu',
      akadTime: '08.00 WIB',
      resepsiTime: '11.00 – 14.00 WIB',
      venue: 'The Sultan Hotel',
      venueAddress: 'Jl. Lingkar Utara No. 1, Yogyakarta',
      mapsUrl: 'https://maps.google.com',
      openingMessage: 'Dengan penuh rasa syukur dan kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam momen sakral pernikahan kami.',
      hashtag: 'ArindaBaskara2025',
      rsvpWhatsapp: '6281234567890',
    },
    'citra-dhimas-2025': {
      templateId: 'modern-clean',
      slug: 'citra-dhimas-2025',
      names: ['Citra', 'Dhimas'],
      eventDate: 'Sabtu, 14 Juni 2025',
      akadTime: '08:00 WIB',
      resepsiTime: '11:00 – 14:00 WIB',
      venue: 'Ritz Carlton Jakarta',
      venueAddress: 'Jl. DR. Ide Anak Agung Gde Agung No.1, Jakarta',
      openingMessage: 'Kami dengan penuh sukacita mengundang Anda untuk menjadi bagian dari hari istimewa kami.',
      hashtag: 'CitraDhimas2025',
      rsvpFormUrl: 'https://forms.google.com',
    },
    'ervina-fadhil-2025': {
      templateId: 'romantic-pink',
      slug: 'ervina-fadhil-2025',
      names: ['Ervina', 'Fadhil'],
      tagline: "We're Getting Married",
      eventDate: '14 Juni 2025',
      eventDay: 'Sabtu',
      resepsiTime: '10:00 WIB',
      venue: 'Grand Ballroom',
      venueAddress: 'Jl. Asia Afrika No. 112, Bandung',
      openingMessage: 'Bersama keluarga tercinta, kami mengundang Anda untuk berbagi kebahagiaan di hari pernikahan kami yang penuh kasih.',
      quote: 'Cinta bukan soal menatap satu sama lain, tapi bersama-sama menatap ke arah yang sama.',
      rsvpDeadline: '1 Juni',
      hashtag: 'ErvinaFadhil2025',
      rsvpWhatsapp: '6281234567891',
    },
    'galuh-25': {
      templateId: 'birthday',
      slug: 'galuh-25',
      names: ['Galuh'],
      tagline: 'turns 25!',
      eventDate: 'Sabtu, 14 Juni 2025',
      resepsiTime: '19:00 WIB',
      venue: 'Rooftop Venue',
      venueAddress: 'Jl. Kemang Raya No. 25, Jakarta Selatan',
      openingMessage: 'Kamu diundang untuk merayakan ulang tahun Galuh yang ke-25! Ayo datang dan rayakan bersama kami!',
      dressCode: 'Purple',
      hashtag: 'Galuh25',
      rsvpWhatsapp: '6281234567892',
    },
  }

  return mock[slug] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const inv = await getInvitation(slug)
  if (!inv) return { title: 'Undangan tidak ditemukan' }

  const title = inv.names.length > 1
    ? `Undangan ${inv.names.join(' & ')}`
    : `Undangan ${inv.names[0]}`

  return {
    title,
    description: inv.openingMessage.slice(0, 120),
    openGraph: {
      title,
      description: inv.openingMessage.slice(0, 120),
      type: 'website',
    },
  }
}

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const inv = await getInvitation(slug)
  if (!inv) notFound()

  return (
    <main style={{ maxWidth: 480, margin: '0 auto' }}>
      <TemplateRenderer inv={inv} />
    </main>
  )
}

function TemplateRenderer({ inv }: { inv: InvitationContent }) {
  switch (inv.templateId) {
    case 'elegant-gold':  return <ElegantGoldTemplate inv={inv} />
    case 'modern-clean':  return <ModernCleanTemplate inv={inv} />
    case 'romantic-pink': return <RomanticPinkTemplate inv={inv} />
    case 'birthday':      return <BirthdayTemplate inv={inv} />
    default:              return <ElegantGoldTemplate inv={inv} />
  }
}
