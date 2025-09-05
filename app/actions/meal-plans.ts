'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generateWeeklyPlan() {
  try {
    const supabase = createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's default template ID
    const { data: userData } = await supabase
      .from('user_settings')
      .select('default_meal_template_id')
      .eq('user_id', user.id)
      .single();

    const templateId = userData?.default_meal_template_id || process.env.DEFAULT_TEMPLATE_ID;
    
    if (!templateId) {
      throw new Error('No meal template found');
    }

    // Call the API to generate the weekly plan
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/plans/generate-weekly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate weekly plan');
    }

    // Revalidate the plans page
    revalidatePath('/plans');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in generateWeeklyPlan:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate weekly plan' 
    };
  }
}

export async function markMealAsDone(mealId: string) {
  try {
    const supabase = createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Call the meal plan service
    const mealPlanService = new (await import('@/lib/services/mealPlanService')).default(supabase);
    await mealPlanService.markMealAsDone(mealId, user.id);
    
    // Revalidate the plans and dashboard pages
    revalidatePath('/plans');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in markMealAsDone:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to mark meal as done' 
    };
  }
}
