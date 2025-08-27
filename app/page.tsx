'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Dumbbell, Utensils, Calendar, Target } from 'lucide-react'

export default function HomePage() {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      router.push('/today')
    }
  }, [user, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Revisa tu email para confirmar tu cuenta')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/today`
        }
      })
      if (error) throw error
    } catch (error: any) {
      setMessage(error.message)
    }
  }

  if (user) {
    return null // Will redirect to /today
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Fitness & Nutrition Hub
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Tu hub personal para entrenamiento, nutrición y automatizaciones
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="flex flex-col items-center p-4">
                <Target className="h-12 w-12 text-blue-600 mb-2" />
                <h3 className="font-semibold">Seguimiento de Macros</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Controla tu nutrición</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <Dumbbell className="h-12 w-12 text-green-600 mb-2" />
                <h3 className="font-semibold">Rutinas Personalizadas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Entrenos adaptados</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <Calendar className="h-12 w-12 text-purple-600 mb-2" />
                <h3 className="font-semibold">Planificación Semanal</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organiza tu semana</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <Utensils className="h-12 w-12 text-orange-600 mb-2" />
                <h3 className="font-semibold">Plantillas de Comidas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recetas reutilizables</p>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</CardTitle>
                <CardDescription>
                  {isSignUp 
                    ? 'Crea tu cuenta para empezar a usar Fitness Hub'
                    : 'Accede a tu cuenta para continuar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Cargando...' : (isSignUp ? 'Crear cuenta' : 'Iniciar sesión')}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  Google
                </Button>

                {message && (
                  <p className={`text-sm ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                    {message}
                  </p>
                )}

                <p className="text-sm text-center text-muted-foreground">
                  {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline"
                  >
                    {isSignUp ? 'Inicia sesión' : 'Crea una cuenta'}
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
