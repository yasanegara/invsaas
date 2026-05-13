import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewInvitationClient from './NewInvitationClient'

export default async function NewInvitationPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return <NewInvitationClient />
}
