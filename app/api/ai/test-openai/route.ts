import { NextRequest, NextResponse } from 'next/server';
import { enhancedOpenAI } from '@/lib/ai/openai-client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Testing OpenAI API key...');
    console.log('Environment variable exists:', !!process.env.OPENAI_API_KEY);
    console.log('API key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7) || 'MISSING');
    
    // Test with a simple completion
    const completion = await enhancedOpenAI.chatCompletion([
      {
        role: 'user',
        content: 'Say "OpenAI is working" if you can read this.'
      }
    ], {
      model: 'gpt-3.5-turbo',
      max_tokens: 10,
      temperature: 0
    }, 'test-openai');

    const response = completion.choices[0]?.message?.content;
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API key is working!',
      response: response,
      keyExists: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'MISSING'
    });
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      keyExists: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'MISSING'
    }, { status: 500 });
  }
}
