import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { Metadata } from 'next'
import type { InvitationContent } from '@/templates/types'
import ElegantGoldTemplate from '@/templates/ElegantGold'
import { ModernCleanTemplate, RomanticPinkTemplate, BirthdayTemplate } from '@/templates/OtherTemplates'

async function getInvitation(slug: string): Promise<InvitationContent | null> {
  const inv = await prisma.invitation.findUnique({
    where: { slug, status: 'published' },
  })
  if (!inv) return null

  const header = (inv.header ?? {}) as Record<string, any>
  const eventInfo = (inv.eventInfo ?? {}) as Record<string, any>
  const mainText = (inv.mainText ?? {}) as Record<string, any>
  const gallery = (inv.gallery ?? {}) as Record<string, any>
  const rsvp = (inv.rsvp ?? {}) as Record<string, any>
  const theme = (inv.theme ?? {}) as Record<string, any>

  return {
    templateId: inv.templateId as InvitationContent['templateId'],
    slug: inv.slug,
    names: header.names ?? [''],
    tagline: header.tagline,
    hashtag: header.hashtag,
    eventDate: eventInfo.eventDate ?? '',
    eventDay: eventInfo.eventDay,
    akadTime: eventInfo.akadTime,
    resepsiTime: eventInfo.resepsiTime,
    venue: eventInfo.venue ?? '',
    venueAddress: eventInfo.venueAddress,
    mapsUrl: eventInfo.mapsUrl,
    openingMessage: mainText.openingMessage ?? '',
    quote: mainText.quote,
    rsvpDeadline: rsvp.deadline,
    rsvpWhatsapp: rsvp.whatsapp,
    rsvpFormUrl: rsvp.formUrl,
    galleryImages: gallery.images,
    dressCode: gallery.dressCode,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    fontFamily: theme.fontFamily,
  }
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
    openGraph: { title, description: inv.openingMessage.slice(0, 120), type: 'website' },
  }
}

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const inv = await getInvitation(slug)
  if (!inv) notFound()

  // Increment view count (fire and forget)
  prisma.invitation.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

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
