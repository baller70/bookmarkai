import CategoriesClient from './CategoriesClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'



export default function Page() {
  return <CategoriesClient />
}

