import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(invitation)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()

  const updated = await prisma.invitation.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      header: body.header ?? existing.header,
      eventInfo: body.eventInfo ?? existing.eventInfo,
      mainText: body.mainText ?? existing.mainText,
      gallery: body.gallery ?? existing.gallery,
      rsvp: body.rsvp ?? existing.rsvp,
      footer: body.footer ?? existing.footer,
      theme: body.theme ?? existing.theme,
      status: body.status ?? existing.status,
      publishedUrl: body.publishedUrl ?? existing.publishedUrl,
      ...(body.customHtml !== undefined ? { customHtml: body.customHtml } : {}),
    },
  })

  return NextResponse.json(updated)
}
