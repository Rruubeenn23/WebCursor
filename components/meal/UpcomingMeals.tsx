'use client';

import { useEffect, useState } from 'react';
import { MealReminder } from './MealReminder';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MealItem {
  id: string;
  food: {
    name: string;
    unit: string;
  };
  qty_units: number;
  time: string;
  done: boolean;
}

export function UpcomingMeals() {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingMeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/plans/today');
      
      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }
      
      const data = await response.json();
      
      // Filter out completed meals and sort by time
      const upcomingMeals = (data.items || [])
        .filter((meal: MealItem) => !meal.done)
        .sort((a: MealItem, b: MealItem) => {
          return a.time.localeCompare(b.time);
        });
      
      setMeals(upcomingMeals);
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load upcoming meals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingMeals();

    // Set up polling every 5 minutes to check for new meals
    const interval = setInterval(fetchUpcomingMeals, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchUpcomingMeals();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No upcoming meals scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upcoming Meals</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="text-gray-500 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {meals.map((meal) => (
          <MealReminder key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  );
}
