import DashboardClientWrapper from './DashboardClientWrapper'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  // Force fresh deployment - dashboard rendering fix applied
  return <DashboardClientWrapper />
}
