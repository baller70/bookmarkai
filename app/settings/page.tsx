export const dynamic = 'force-dynamic'


import { redirect } from 'next/navigation'

export default function SettingsRedirect() {
  redirect('/dashboard/settings-main')
}
