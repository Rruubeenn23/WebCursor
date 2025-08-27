import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { mealDoneSchema } from '@/lib/validations'
import { calculateRemainingMacros } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { day_plan_item_id } = mealDoneSchema.parse(body)

    // Get the meal item and verify it belongs to the user
    const { data: mealItem, error: mealError } = await supabase
      .from('day_plan_items')
      .select(`
        id,
        done,
        day_plan_id,
        food:foods(name, kcal, protein_g, carbs_g, fat_g)
      `)
      .eq('id', day_plan_item_id)
      .single()

    if (mealError) {
      return NextResponse.json({ error: 'Meal item not found' }, { status: 404 })
    }

    // Verify the day plan belongs to the user
    const { data: dayPlan, error: planError } = await supabase
      .from('day_plans')
      .select('user_id')
      .eq('id', mealItem.day_plan_id)
      .single()

    if (planError || dayPlan.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Toggle the done status
    const newDoneStatus = !mealItem.done

    const { error: updateError } = await supabase
      .from('day_plan_items')
      .update({ done: newDoneStatus })
      .eq('id', day_plan_item_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get user goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!goals) {
      return NextResponse.json({ error: 'User goals not found' }, { status: 404 })
    }

    // Calculate consumed macros for the day
    const { data: allMeals } = await supabase
      .from('day_plan_items')
      .select(`
        done,
        qty_units,
        food:foods(kcal, protein_g, carbs_g, fat_g)
      `)
      .eq('day_plan_id', mealItem.day_plan_id)

    const consumed = {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }

    allMeals?.forEach((meal: any) => {
      if (meal.done && meal.food) {
        consumed.kcal += Math.round((meal.food.kcal || 0) * meal.qty_units)
        consumed.protein += Math.round(((meal.food.protein_g || 0) * meal.qty_units * 10)) / 10
        consumed.carbs += Math.round(((meal.food.carbs_g || 0) * meal.qty_units * 10)) / 10
        consumed.fat += Math.round(((meal.food.fat_g || 0) * meal.qty_units * 10)) / 10
      }
    })

    const remaining = calculateRemainingMacros(goals, consumed)

    return NextResponse.json({
      success: true,
      done: newDoneStatus,
      meal: (mealItem.food as any)?.name || 'Unknown',
      consumed,
      remaining,
    })

  } catch (error: any) {
    console.error('Error marking meal done:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
