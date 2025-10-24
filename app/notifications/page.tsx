export const dynamic = 'force-dynamic'



import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import NotificationsPage from '@/components/notifications/notifications-page'

export default async function Notifications() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return <NotificationsPage />
}
