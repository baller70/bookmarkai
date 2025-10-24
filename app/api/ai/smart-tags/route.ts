import { NextResponse } from 'next/server';

export async function GET() {
  // Mock smart tags data
  const mockSmartTags = {
    tags: [
      {
        id: '1',
        name: 'frontend-frameworks',
        confidence: 0.92,
        category: 'Development',
        suggestedFor: ['React', 'Vue', 'Angular'],
        color: '#3B82F6'
      },
      {
        id: '2',
        name: 'design-systems',
        confidence: 0.87,
        category: 'Design',
        suggestedFor: ['Figma', 'Sketch', 'Adobe XD'],
        color: '#8B5CF6'
      },
      {
        id: '3',
        name: 'ai-tools',
        confidence: 0.95,
        category: 'AI',
        suggestedFor: ['ChatGPT', 'Midjourney', 'Copilot'],
        color: '#10B981'
      },
      {
        id: '4',
        name: 'productivity-apps',
        confidence: 0.89,
        category: 'Productivity',
        suggestedFor: ['Notion', 'Todoist', 'Slack'],
        color: '#F59E0B'
      }
    ]
  };

  return NextResponse.json(mockSmartTags);
}

export async function POST(request: Request) {
  const { query } = await request.json();
  
  // Simulate AI tag analysis
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const analyzedTags = {
    query,
    suggestedTags: [
      {
        id: 'analyzed-1',
        name: 'web-development',
        confidence: 0.91,
        category: 'Development',
        suggestedFor: [query],
        color: '#3B82F6'
      },
      {
        id: 'analyzed-2',
        name: 'modern-tools',
        confidence: 0.84,
        category: 'Tools',
        suggestedFor: [query],
        color: '#8B5CF6'
      }
    ]
  };

  return NextResponse.json(analyzedTags);
} 