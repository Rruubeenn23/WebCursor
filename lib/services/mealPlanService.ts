import { createClient } from '@supabase/supabase-js';
import { callN8NWebhook } from '@/lib/utils/n8n';
import { Database } from '@/types/database';

type MealPlan = Database['public']['Tables']['day_plans']['Row'];
type MealPlanItem = Database['public']['Tables']['day_plan_items']['Row'];

export class MealPlanService {
  private supabase;

  constructor(supabase: ReturnType<typeof createClient>) {
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

      if (!response.success) {
        throw new Error('Failed to generate weekly plan');
      }

      // The n8n workflow should return the created plans
      return response.plans || [];
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

      // Get today's plan
      const { data: plan, error: planError } = await this.supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw planError;
      }

      // Get meal items if plan exists
      let items: MealPlanItem[] = [];
      if (plan) {
        const { data: mealItems, error: itemsError } = await this.supabase
          .from('day_plan_items')
          .select('*')
          .eq('day_plan_id', plan.id)
          .order('time');

        if (itemsError) throw itemsError;
        items = mealItems || [];
      }

      // Get user goals
      const { data: goals } = await this.supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .single();

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
        .single();

      if (mealError || !meal) {
        throw new Error('Meal not found or access denied');
      }

      // Update the meal
      const { error: updateError } = await this.supabase
        .from('day_plan_items')
        .update({ done: true })
        .eq('id', mealId);

      if (updateError) throw updateError;

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
