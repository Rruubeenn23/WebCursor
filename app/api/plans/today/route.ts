import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getCurrentDate } from '@/lib/utils'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = getCurrentDate()

    // Get today's plan
    const { data: dayPlan, error: planError } = await supabase
      .from('day_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (planError && planError.code !== 'PGRST116') {
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    // Get today's meal items if plan exists
    let mealItems: any[] = []
    if (dayPlan) {
      const { data: items, error: itemsError } = await supabase
        .from('day_plan_items')
        .select(`
          id,
          qty_units,
          time,
          done,
          food:foods(name, unit, kcal, protein_g, carbs_g, fat_g)
        `)
        .eq('day_plan_id', dayPlan.id)
        .order('time')

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }

      mealItems = items || []
    }

    // Get user goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      dayPlan,
      mealItems,
      goals,
    })

  } catch (error: any) {
    console.error('Error getting today plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
