'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Sidebar } from '@/components/layout/sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
