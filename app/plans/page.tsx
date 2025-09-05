import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Utensils } from 'lucide-react';
import Link from 'next/link';
import { UpcomingMeals } from '@/components/meal/UpcomingMeals';
import { generateWeeklyPlan } from '@/app/actions/meal-plans';

export default async function PlansPage() {
  const supabase = createClient();
  
  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Get today's plan with items
  const { data: todayPlan } = await supabase
    .from('day_plans')
    .select('*, day_plan_items(*, foods(*))')
    .eq('date', new Date().toISOString().split('T')[0])
    .eq('user_id', user.id)
    .single();

  // Get user's default template ID
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('default_meal_template_id')
    .eq('user_id', user.id)
    .single();

  const handleGenerateWeeklyPlan = async (formData: FormData) => {
    'use server';
    await generateWeeklyPlan();
    // The form will handle the redirection and revalidation
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Meal Plans</h1>
          <p className="text-muted-foreground">
            Manage your daily meals and nutrition plans
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <form action={handleGenerateWeeklyPlan}>
            <Button type="submit" className="gap-2">
              <Calendar className="h-4 w-4" />
              Generate Weekly Plan
            </Button>
          </form>
          
          <Button asChild variant="outline" className="gap-2">
            <Link href="/plans/new">
              <PlusCircle className="h-4 w-4" />
              Create Custom Plan
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="gap-2">
            <Link href="/foods">
              <Utensils className="h-4 w-4" />
              Manage Foods
            </Link>
          </Button>
        </div>

        {/* Today's Meals */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Today's Meals</h2>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {todayPlan ? (
              <UpcomingMeals />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No meal plan for today. Generate a weekly plan or create a custom plan.
                </p>
                <form action={handleGenerateWeeklyPlan}>
                  <Button type="submit" variant="default">
                    Generate Weekly Plan
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
