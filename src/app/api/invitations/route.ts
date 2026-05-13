import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'undangan'}-${Date.now().toString(36)}`
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, templateId } = await request.json()
  if (!title?.trim() || !templateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const invitation = await prisma.invitation.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      slug: generateSlug(title.trim()),
      templateId,
      header: {},
      eventInfo: {},
      mainText: {},
      gallery: {},
      rsvp: {},
      footer: {},
      theme: {},
    },
  })

  return NextResponse.json({ id: invitation.id })
}
