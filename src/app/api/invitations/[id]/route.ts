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

export async function DELETE(
  _request: Request,
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

  await prisma.invitation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let updated
  try {
    updated = await prisma.invitation.update({
      where: { id },
      data: {
        title: (body.title as string) ?? existing.title,
        header: (body.header as object) ?? existing.header,
        eventInfo: (body.eventInfo as object) ?? existing.eventInfo,
        mainText: (body.mainText as object) ?? existing.mainText,
        gallery: (body.gallery as object) ?? existing.gallery,
        rsvp: (body.rsvp as object) ?? existing.rsvp,
        footer: (body.footer as object) ?? existing.footer,
        theme: (body.theme as object) ?? existing.theme,
        status: (body.status as string) ?? existing.status,
        publishedUrl: (body.publishedUrl as string | null) ?? existing.publishedUrl,
        ...(body.customHtml !== undefined ? { customHtml: body.customHtml as string } : {}),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PUT /api/invitations/:id] prisma error:', msg)
    return NextResponse.json({ error: `Database error: ${msg}` }, { status: 500 })
  }

  return NextResponse.json(updated)
}
