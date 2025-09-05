import { SupabaseClient } from '@supabase/supabase-js';
import { callN8NWebhook } from '@/lib/utils/n8n';
import { Database } from '@/types/database.types';


type MealPlan = Database['public']['Tables']['day_plans']['Row'] & {
  items?: MealPlanItem[];
};

type MealPlanItem = Database['public']['Tables']['day_plan_items']['Row'] & {
  food?: Database['public']['Tables']['foods']['Row'];
};

export class MealPlanService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Generate a meal plan for the upcoming week
   */
  async generateWeeklyPlan(userId: string, templateId: string): Promise<MealPlan[]> {
    try {
      // Call n8n webhook to generate the weekly plan
      const response = await callN8NWebhook('generateWeek', {
        userId,
        templateId,
      });

      if (!response || !response.success) {
        console.error('Failed to generate weekly plan:', response?.error || 'No response from n8n');
        throw new Error('Failed to generate weekly plan');
      }

      // The n8n workflow should return the created plans
      return (response.plans as MealPlan[]) || [];
    } catch (error) {
      console.error('Error generating weekly plan:', error);
      throw error;
    }
  }

  /**
   * Get today's meal plan with items
   */
  async getTodaysPlan(userId: string): Promise<{
    plan: MealPlan | null;
    items: MealPlanItem[];
    goals?: any;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's plan with proper typing
      const { data: plan, error: planError } = await (this.supabase as any)
        .from('day_plans')
        .select('*')
        .eq('date', today)
        .eq('user_id', userId)
        .single();

      if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw planError;
      }

      // Get meal items if plan exists
      let items: MealPlanItem[] = [];
      if (plan) {
        const { data: mealItems, error: itemsError } = await (this.supabase as any)
          .from('day_plan_items')
          .select('*')
          .eq('day_plan_id', plan.id)
          .order('time');

        if (itemsError) throw itemsError;
        items = (mealItems as MealPlanItem[]) || [];
      }

      // Get user goals with proper typing and error handling
      let goals = null;
      try {
        const { data: goalsData, error: goalsError } = await (this.supabase as any)
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (!goalsError) {
          goals = goalsData;
        } else if (goalsError.code !== 'PGRST116') { // Only log if it's not a "not found" error
          console.error('Error fetching goals:', goalsError);
        }
      } catch (error) {
        console.error('Unexpected error fetching goals:', error);
      }

      return {
        plan: plan || null,
        items,
        goals: goals || null,
      };
    } catch (error) {
      console.error('Error getting today\'s plan:', error);
      throw error;
    }
  }

  /**
   * Mark a meal as done
   */
  async markMealAsDone(mealId: string, userId: string): Promise<void> {
    try {
      // First verify the meal exists and belongs to the user
      const { data: meal, error: mealError } = await this.supabase
        .from('day_plan_items')
        .select('*, day_plans!inner(user_id)')
        .eq('id', mealId)
        .eq('day_plans.user_id', userId)
        .single<MealPlanItem & { day_plans: { user_id: string } }>();

      if (mealError || !meal) {
        throw new Error('Meal not found or access denied');
      }

      // Define a custom type for the update operation
      type DayPlanItemUpdate = {
        done: boolean;
        updated_at: string;
      };

      // Update the meal with type assertion
      const updateData: DayPlanItemUpdate = { 
        done: true, 
        updated_at: new Date().toISOString() 
      };
      
      const { error: updateError } = await (this.supabase as any)
        .from('day_plan_items')
        .update(updateData)
        .eq('id', mealId);

      if (updateError) {
        console.error('Error updating meal status:', updateError);
        throw updateError;
      }

      // Call n8n webhook to trigger any post-meal actions
      await callN8NWebhook('mealReminders', {
        action: 'mealCompleted',
        mealId,
        userId,
      }).catch(console.error); // Don't fail if n8n call fails

    } catch (error) {
      console.error('Error marking meal as done:', error);
      throw error;
    }
  }
}
