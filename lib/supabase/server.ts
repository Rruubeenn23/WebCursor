import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { MealPlanService } from '@/lib/services/mealPlanService';

export function createClient() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

export function createMealPlanService() {
  const supabase = createClient();
  return new MealPlanService(supabase);
}

export async function getMealPlanService() {
  const service = createMealPlanService();
  
  // Verify user is authenticated
  const { data: { user }, error } = await service.supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return {
    service,
    userId: user.id,
  };
}
