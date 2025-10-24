
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import ProfilePage from '@/components/profile/profile-page'

export default async function Profile() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return <ProfilePage />
}
