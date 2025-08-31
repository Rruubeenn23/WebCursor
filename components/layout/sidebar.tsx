'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Home,
  Settings,
  Utensils,
  Dumbbell,
  Menu,
  X,
  LogOut,
  Bot,
  ClipboardCheck,
  CalendarCheck,
  Activity,
  Flame,
} from 'lucide-react'
import { useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'

const navigation = [
  { name: 'Hoy', href: '/today', icon: Home },
  { name: 'Plan', href: '/plan', icon: Calendar },
  { name: 'Comidas', href: '/comidas', icon: Utensils },
  { name: 'Entrenos', href: '/entrenos', icon: Dumbbell },
  { name: 'Check-ins', href: '/check-ins', icon: ClipboardCheck },
  { name: 'Historial', href: '/historial', icon: CalendarCheck },
  { name: 'IMC', href: '/imc', icon: Activity },
  { name: 'BMR', href: '/bmr', icon: Flame },
  { name: 'Chatbot', href: '/chatbot', icon: Bot },
  { name: 'Ajustes', href: '/ajustes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { supabase } = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b px-6">
            <h1 className="text-xl font-bold">Fitness Hub</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className="border-t p-4">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
