import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createPlanSchema } from '@/lib/validations'
import { adjustMacrosForDay } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPlanSchema.parse(body)
    
    const { date, training_day, template_id, notes } = validatedData

    // Get user goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!goals) {
      return NextResponse.json({ error: 'User goals not found' }, { status: 404 })
    }

    // Adjust macros for training/rest day
    const adjustedGoals = adjustMacrosForDay(goals, training_day)

    // Create or update day plan
    const { data: dayPlan, error: planError } = await supabase
      .from('day_plans')
      .upsert({
        user_id: user.id,
        date,
        template_id,
        training_day,
        notes,
      })
      .select()
      .single()

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    // If template is provided, create meal items
    if (template_id) {
      // Get template items
      const { data: templateItems } = await supabase
        .from('meal_template_items')
        .select(`
          food_id,
          qty_units,
          time_hint,
          food:foods(*)
        `)
        .eq('template_id', template_id)

      if (templateItems && templateItems.length > 0) {
        // Calculate adjusted quantities based on macro goals
        const totalTemplateKcal = templateItems.reduce((sum, item: any) => {
          return sum + ((item.food?.kcal || 0) * item.qty_units)
        }, 0)

        const adjustmentFactor = adjustedGoals.kcal / totalTemplateKcal

        // Create day plan items
        const mealItems = templateItems.map((item, index) => ({
          day_plan_id: dayPlan.id,
          food_id: item.food_id,
          qty_units: Math.round(item.qty_units * adjustmentFactor * 100) / 100,
          time: item.time_hint || `08:00`,
        }))

        const { error: itemsError } = await supabase
          .from('day_plan_items')
          .insert(mealItems)

        if (itemsError) {
          return NextResponse.json({ error: itemsError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      dayPlan,
      adjustedGoals,
    })

  } catch (error: any) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
