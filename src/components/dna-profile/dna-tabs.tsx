"use client"

import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { usePathname, useRouter } from 'next/navigation'

interface TabDef {
  value: string
  label: string
  href: string
}

const tabs: TabDef[] = [
  { value: 'about-you', label: 'About You', href: '/about-you' },
  { value: 'favorites', label: 'Favorites', href: '/favorites' },
  { value: 'playbooks', label: 'Playbooks', href: '/playbooks' },
  { value: 'search', label: 'Search', href: '/search' },
  { value: 'analytics', label: 'Analytics', href: '/analytics' },
  { value: 'timecapsule', label: 'Time Capsule', href: '/time-capsule' },
]

export default function DnaTabs() {
  const pathname = usePathname()
  const router = useRouter()

  const active =
    tabs.find((t) => pathname === t.href || pathname.startsWith(t.href + '/'))?.value ?? 'about-you'

  const handleChange = (value: string) => {
    const target = tabs.find((t) => t.value === value)
    if (target) router.push(target.href as any)
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <Tabs value={active} onValueChange={handleChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
              {tabs.map((t) => (
                <TabsTrigger 
                  key={t.value} 
                  value={t.value} 
                  className="text-xs lg:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 