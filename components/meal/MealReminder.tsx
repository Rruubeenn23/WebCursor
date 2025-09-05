'use client';

import { useState, useEffect } from 'react';
import { markMealAsDone } from '@/app/actions/meal-plans';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface MealReminderProps {
  meal: {
    id: string;
    food: {
      name: string;
      unit: string;
    };
    qty_units: number;
    time: string;
    done: boolean;
  };
}

export function MealReminder({ meal }: MealReminderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(meal.done);

  const handleMarkAsDone = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await markMealAsDone(meal.id);
      
      if (success) {
        setIsDone(true);
        toast.success('Meal marked as done!');
      } else {
        toast.error(error || 'Failed to mark meal as done');
      }
    } catch (error) {
      console.error('Error marking meal as done:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const time = new Date(`1970-01-01T${meal.time}`).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-blue-50">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">
            {meal.qty_units} {meal.food.unit} of {meal.food.name}
          </h3>
          <p className="text-sm text-gray-500">
            {time} • {isDone ? 'Completed' : 'Upcoming'}
          </p>
        </div>
      </div>
      {!isDone && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleMarkAsDone}
          disabled={isLoading}
        >
          {isLoading ? 'Marking...' : 'Mark as Done'}
        </Button>
      )}
      {isDone && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Done
        </span>
      )}
    </div>
  );
}
