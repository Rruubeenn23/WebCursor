import { NextRequest, NextResponse } from 'next/server';
import { getMealPlanService } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { service, userId } = await getMealPlanService();
    
    // Get template ID from request body or use default
    const { templateId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Generate the weekly plan
    const plans = await service.generateWeeklyPlan(userId, templateId);
    
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error('Error generating weekly plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate weekly plan' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
