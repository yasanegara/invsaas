import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import EditClient from './EditClient'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!invitation) notFound()

  return <EditClient invitation={JSON.parse(JSON.stringify(invitation))} />
}
