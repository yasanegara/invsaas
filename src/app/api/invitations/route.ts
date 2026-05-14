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

  const { title, templateId, header, eventInfo, mainText, rsvp, customHtml } = await request.json()
  if (!title?.trim() || !templateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  console.log('[POST /api/invitations] data:', {
    userId: session.user.id,
    title: title?.trim(),
    slug: generateSlug(title.trim()),
    templateId,
    hasCustomHtml: !!customHtml,
    customHtmlLength: customHtml?.length,
  })

  let invitation
  try {
    invitation = await prisma.invitation.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        slug: generateSlug(title.trim()),
        templateId,
        ...(customHtml ? { customHtml } : {}),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Log full error object for debugging in Railway
    console.error('[POST /api/invitations] error:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ id: invitation.id })
}
