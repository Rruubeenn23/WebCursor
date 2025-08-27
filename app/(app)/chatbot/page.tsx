'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Plus, Save } from 'lucide-react'
import { MacroGoals } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  macros?: MacroGoals
  foodName?: string
  qty?: number
}

interface FoodItem {
  id: string
  name: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  unit: string
  grams_per_unit: number
}

export default function ChatbotPage() {
  const { user, supabase } = useSupabase()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedFood, setSuggestedFood] = useState<FoodItem | null>(null)

  useEffect(() => {
    if (user) {
      // Mensaje de bienvenida
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de nutrición. Puedes describirme cualquier comida y te ayudaré a calcular sus macros. Por ejemplo: "Comí una manzana de 150g" o "Tomé un café con leche"',
        timestamp: new Date()
      }])
    }
  }, [user])

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Llamar al webhook de n8n para análisis de macros
      const response = await fetch('/api/chatbot/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user.id
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          macros: data.macros,
          foodName: data.foodName,
          qty: data.qty
        }

        setMessages(prev => [...prev, assistantMessage])
        
        if (data.suggestedFood) {
          setSuggestedFood(data.suggestedFood)
        }
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Lo siento, no pude analizar esa comida. ¿Podrías ser más específico? Por ejemplo: "Comí una manzana de 150g"',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const saveFoodToDatabase = async (food: FoodItem) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('foods')
        .insert({
          name: food.name,
          kcal: food.kcal,
          protein_g: food.protein_g,
          carbs_g: food.carbs_g,
          fat_g: food.fat_g,
          unit: food.unit,
          grams_per_unit: food.grams_per_unit
        })

      if (error) throw error

      setSuggestedFood(null)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ "${food.name}" ha sido guardado en la base de datos. Ahora podrás usarlo en tus templates de comidas.`,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error saving food:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Error al guardar el alimento en la base de datos.',
        timestamp: new Date()
      }])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Asistente de Nutrición</h1>
        <p className="text-muted-foreground">
          Describe tus comidas y te ayudo a calcular los macros
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5" />}
                        {message.role === 'user' && <User className="h-4 w-4 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          
                          {/* Mostrar macros si están disponibles */}
                          {message.macros && (
                            <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-xs">
                              <p><strong>Macros calculados:</strong></p>
                              <p>Calorías: {message.macros.kcal} kcal</p>
                              <p>Proteína: {message.macros.protein}g</p>
                              <p>Carbohidratos: {message.macros.carbs}g</p>
                              <p>Grasas: {message.macros.fat}g</p>
                              {message.foodName && message.qty && (
                                <p className="mt-1">
                                  <strong>Alimento:</strong> {message.foodName} ({message.qty}g)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Describe tu comida..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sugerencia de alimento */}
        <div className="lg:col-span-1">
          {suggestedFood && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Sugerencia de Alimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{suggestedFood.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {suggestedFood.kcal} kcal por {suggestedFood.unit}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Proteína:</span>
                    <span>{suggestedFood.protein_g}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Carbohidratos:</span>
                    <span>{suggestedFood.carbs_g}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Grasas:</span>
                    <span>{suggestedFood.fat_g}g</span>
                  </div>
                </div>

                <Button 
                  onClick={() => saveFoodToDatabase(suggestedFood)}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar en Base de Datos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instrucciones */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Ejemplos de uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• "Comí una manzana de 150g"</p>
              <p>• "Tomé un café con leche"</p>
              <p>• "Cené pollo a la plancha con arroz"</p>
              <p>• "Desayuné tostadas con mantequilla"</p>
              <p>• "Bebí un batido de proteínas"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
