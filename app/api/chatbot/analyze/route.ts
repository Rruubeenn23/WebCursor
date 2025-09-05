import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { callN8NWebhook } from '@/lib/utils/n8n'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, userId } = body

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    // Call n8n webhook for food analysis
    const data = await callN8NWebhook('chatbotAnalyze', {
      message,
      userId: user.id
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in chatbot analyze:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Función para analizar mensajes de comida (simulación)
function analyzeFoodMessage(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // Patrones básicos para detectar alimentos
  const patterns = [
    {
      regex: /manzana.*?(\d+)\s*g/i,
      food: {
        name: 'Manzana',
        kcal: 52,
        protein_g: 0.3,
        carbs_g: 14,
        fat_g: 0.2,
        unit: '100g',
        grams_per_unit: 100
      }
    },
    {
      regex: /pollo.*?(\d+)\s*g/i,
      food: {
        name: 'Pollo pechuga',
        kcal: 165,
        protein_g: 31,
        carbs_g: 0,
        fat_g: 3.6,
        unit: '100g',
        grams_per_unit: 100
      }
    },
    {
      regex: /arroz.*?(\d+)\s*g/i,
      food: {
        name: 'Arroz blanco',
        kcal: 130,
        protein_g: 2.7,
        carbs_g: 28,
        fat_g: 0.3,
        unit: '100g',
        grams_per_unit: 100
      }
    },
    {
      regex: /café.*?leche/i,
      food: {
        name: 'Café con leche',
        kcal: 42,
        protein_g: 3.4,
        carbs_g: 4.8,
        fat_g: 1.2,
        unit: '250ml',
        grams_per_unit: 250
      }
    },
    {
      regex: /tostada.*?mantequilla/i,
      food: {
        name: 'Tostada con mantequilla',
        kcal: 120,
        protein_g: 3.5,
        carbs_g: 18,
        fat_g: 4.5,
        unit: '1 unidad',
        grams_per_unit: 50
      }
    },
    {
      regex: /batido.*?proteína/i,
      food: {
        name: 'Batido de proteínas',
        kcal: 120,
        protein_g: 25,
        carbs_g: 3,
        fat_g: 1.5,
        unit: '30g',
        grams_per_unit: 30
      }
    }
  ]

  for (const pattern of patterns) {
    const match = lowerMessage.match(pattern.regex)
    if (match) {
      const qty = parseInt(match[1]) || 100
      const food = pattern.food
      
      // Calcular macros para la cantidad específica
      const multiplier = qty / food.grams_per_unit
      const macros = {
        kcal: Math.round(food.kcal * multiplier),
        protein: Math.round(food.protein_g * multiplier * 10) / 10,
        carbs: Math.round(food.carbs_g * multiplier * 10) / 10,
        fat: Math.round(food.fat_g * multiplier * 10) / 10
      }

      return {
        response: `He analizado tu comida. ${food.name} (${qty}g) contiene aproximadamente ${macros.kcal} calorías, ${macros.protein}g de proteína, ${macros.carbs}g de carbohidratos y ${macros.fat}g de grasas.`,
        macros,
        foodName: food.name,
        qty,
        suggestedFood: {
          ...food,
          id: `suggested_${Date.now()}`
        }
      }
    }
  }

  // Si no encuentra un patrón específico, intentar extraer información general
  const generalFoods = ['manzana', 'pollo', 'arroz', 'café', 'tostada', 'batido']
  for (const food of generalFoods) {
    if (lowerMessage.includes(food)) {
      return {
        response: `Veo que mencionas "${food}". Para un análisis más preciso, por favor especifica la cantidad. Por ejemplo: "Comí ${food} de 150g"`,
        macros: null,
        foodName: food,
        qty: null,
        suggestedFood: null
      }
    }
  }

  return null
}
