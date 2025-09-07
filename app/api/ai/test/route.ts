import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'No API key found in environment' 
      });
    }

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Try a simple API call to verify the key works
    const models = await openai.models.list();
    
    return NextResponse.json({ 
      status: 'success',
      message: 'API key is valid',
      keyPrefix: apiKey.substring(0, 7) + '...',
      keyLength: apiKey.length,
      modelsAvailable: models.data.length > 0
    });
    
  } catch (error: any) {
    console.error('API key test error:', error);
    
    if (error.status === 401) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Invalid API key - Authentication failed',
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
        error: error.message
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to test API key',
      error: error.message 
    }, { status: 500 });
  }
}
